#!/usr/bin/env npx tsx
/**
 * Expand dictionary using Gemini CLI (OAuth auth - separate quota from API key).
 * Processes book by book, streams entries to avoid loading 91MB at once.
 * Uses gemini CLI subprocess with retry/backoff for 429s.
 */

import fs from 'node:fs/promises';
import { execFile } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const DICTIONARY_FILE = path.join(PROJECT_ROOT, 'public/dicionario_completo.json');
const PROGRESS_FILE = path.join(PROJECT_ROOT, 'scripts/dictionary/cli-progress.json');

const PROVIDER = process.env.PROVIDER || 'openai';
const OPENAI_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const BATCH_SIZE = Number(process.env.BATCH_SIZE) || 10;
const MAX_RETRIES = 6;
const SAVE_EVERY = 5; // save after every N batches

interface ProgressData {
  completedBooks: string[];
  currentBook?: string;
  currentOffset?: number;
  stats: { processed: number; errors: number; skipped: number };
  updatedAt: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const log = (msg: string) => {
  const ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
  console.log(`[${ts}] ${msg}`);
};

const loadProgress = async (): Promise<ProgressData> => {
  try {
    const raw = await fs.readFile(PROGRESS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {
      completedBooks: [],
      stats: { processed: 0, errors: 0, skipped: 0 },
      updatedAt: new Date().toISOString(),
    };
  }
};

const saveProgress = async (p: ProgressData) => {
  p.updatedAt = new Date().toISOString();
  await fs.writeFile(PROGRESS_FILE, JSON.stringify(p, null, 2));
};

const callOpenAI = async (prompt: string): Promise<string> => {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'Você gera JSON válido para um dicionário bíblico em português do Brasil. Responda somente JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json() as any;
  return data.choices?.[0]?.message?.content || '{}';
};

const callGeminiCli = (prompt: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    execFile(
      'gemini',
      ['-p', prompt, '--model', GEMINI_MODEL],
      { maxBuffer: 1024 * 1024, timeout: 120_000, cwd: PROJECT_ROOT },
      (err, stdout, stderr) => {
        if (err) {
          reject(new Error(`CLI error: ${stderr?.slice(0, 300) || err.message}`));
        } else {
          resolve(stdout.trim());
        }
      }
    );
  });
};

const callWithRetry = async (prompt: string): Promise<string> => {
  const caller = PROVIDER === 'openai' ? callOpenAI : callGeminiCli;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await caller(prompt);
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('rate') || msg.includes('Rate')) {
        const wait = Math.min(120, 2 ** attempt * 3);
        log(`  ⏳ Rate limited, retry in ${wait}s (attempt ${attempt + 1}/${MAX_RETRIES})`);
        await sleep(wait * 1000);
        continue;
      }
      throw err;
    }
  }
  throw new Error('Max retries exceeded');
};

const extractJson = (text: string): Record<string, any> | null => {
  let json = text;
  if (json.includes('```json')) {
    json = json.split('```json')[1];
    if (json.includes('```')) json = json.split('```')[0];
  } else if (json.includes('```')) {
    const parts = json.split('```');
    json = parts.length >= 3 ? parts[1] : parts[1] || json;
  }
  json = json.trim();
  try {
    return JSON.parse(json);
  } catch {
    try {
      const last = json.lastIndexOf('}');
      if (last > 0) return JSON.parse(json.slice(0, last + 1));
    } catch {}
    return null;
  }
};

const FIELDS = [
  'significado_contextual',
  'explicacao_detalhada',
  'por_que_esta_palavra',
  'conexao_teologica',
  'referencias_relacionadas',
] as const;

const buildPrompt = (entries: [string, any][]): string => {
  const payload: Record<string, any> = {};
  for (const [key, entry] of entries) {
    payload[key] = {
      palavra_pt: entry.palavra_pt || '',
      palavra_original: entry.palavra_original || '',
      transliteracao: entry.transliteracao || '',
      strong: entry.strong || '',
      significado_raiz: entry.significado_raiz || '',
    };
  }
  return [
    'Retorne somente JSON válido.',
    'Para cada chave, preencha:',
    'significado_contextual, explicacao_detalhada, por_que_esta_palavra, conexao_teologica, referencias_relacionadas.',
    'referencias_relacionadas deve ser string[] com 2-5 referências bíblicas reais em português.',
    'Seja específico ao contexto do versículo. Escreva em português brasileiro.',
    'Dados:',
    JSON.stringify(payload),
  ].join('\n');
};

const getBookKey = (entryKey: string): string => {
  const parts = entryKey.split('_');
  for (let i = 0; i < parts.length; i++) {
    if (/^\d+$/.test(parts[i])) {
      return parts.slice(0, i).join('_');
    }
  }
  return parts[0];
};

const run = async () => {
  log('=== Expand Dictionary via Gemini CLI ===');
  log(`Provider: ${PROVIDER} | Model: ${PROVIDER === 'openai' ? OPENAI_MODEL : GEMINI_MODEL} | Batch size: ${BATCH_SIZE}`);

  // Load dictionary
  log('Loading dictionary...');
  const raw = await fs.readFile(DICTIONARY_FILE, 'utf-8');
  const dictionary: Record<string, any> = JSON.parse(raw);
  const allKeys = Object.keys(dictionary);
  log(`Loaded ${allKeys.length} entries`);

  // Group by book
  const bookMap = new Map<string, string[]>();
  for (const key of allKeys) {
    const book = getBookKey(key);
    if (!bookMap.has(book)) bookMap.set(book, []);
    bookMap.get(book)!.push(key);
  }
  const books = Array.from(bookMap.keys()).sort();
  log(`${books.length} books found`);

  // Load progress
  const progress = await loadProgress();
  const forceAll = process.argv.includes('--force-all');
  if (process.argv.includes('--reset')) {
    progress.completedBooks = [];
    progress.currentBook = undefined;
    progress.currentOffset = undefined;
    progress.stats = { processed: 0, errors: 0, skipped: 0 };
  }

  let totalChanged = 0;
  let batchesSinceSave = 0;

  for (const book of books) {
    if (!forceAll && progress.completedBooks.includes(book)) {
      log(`⏭ ${book}: already done`);
      continue;
    }

    const keys = bookMap.get(book)!;
    const startOffset = (progress.currentBook === book && progress.currentOffset) || 0;

    log(`📖 ${book}: ${keys.length} entries (starting at ${startOffset})`);

    for (let i = startOffset; i < keys.length; i += BATCH_SIZE) {
      const batchKeys = keys.slice(i, i + BATCH_SIZE);
      const entries: [string, any][] = batchKeys.map((k) => [k, dictionary[k]]);

      const prompt = buildPrompt(entries);

      try {
        const response = await callWithRetry(prompt);
        const parsed = extractJson(response);

        if (parsed) {
          let batchChanged = 0;
          for (const [key] of entries) {
            if (parsed[key]) {
              for (const field of FIELDS) {
                if (parsed[key][field]) {
                  dictionary[key][field] = parsed[key][field];
                }
              }
              batchChanged++;
              progress.stats.processed++;
            } else {
              progress.stats.skipped++;
            }
          }
          totalChanged += batchChanged;
        } else {
          log(`  ❌ Failed to parse response for batch at ${i}`);
          progress.stats.errors++;
        }
      } catch (err: any) {
        log(`  ❌ Error: ${err.message?.slice(0, 100)}`);
        progress.stats.errors++;
      }

      batchesSinceSave++;
      progress.currentBook = book;
      progress.currentOffset = i + BATCH_SIZE;

      if (batchesSinceSave >= SAVE_EVERY) {
        log(`  💾 Saving... (${progress.stats.processed} processed, ${progress.stats.errors} errors, ${totalChanged} changed)`);
        await fs.writeFile(DICTIONARY_FILE + '.tmp', JSON.stringify(dictionary, null, 2));
        await fs.rename(DICTIONARY_FILE + '.tmp', DICTIONARY_FILE);
        await saveProgress(progress);
        batchesSinceSave = 0;
      }

      // Small delay between requests
      await sleep(500);
    }

    progress.completedBooks.push(book);
    progress.currentBook = undefined;
    progress.currentOffset = undefined;

    // Save after each book
    log(`  ✅ ${book} done. Saving...`);
    await fs.writeFile(DICTIONARY_FILE + '.tmp', JSON.stringify(dictionary, null, 2));
    await fs.rename(DICTIONARY_FILE + '.tmp', DICTIONARY_FILE);
    await saveProgress(progress);
    batchesSinceSave = 0;
  }

  log('=== COMPLETE ===');
  log(`Processed: ${progress.stats.processed}`);
  log(`Errors: ${progress.stats.errors}`);
  log(`Skipped: ${progress.stats.skipped}`);
  log(`Changed: ${totalChanged}`);
};

run().catch((err) => {
  log(`FATAL: ${err.message}`);
  process.exit(1);
});
