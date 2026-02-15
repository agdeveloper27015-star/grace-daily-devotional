import {
  PROGRESS_FILE,
  buildStrongOccurrenceMap,
  formatReference,
  generateLocalContextualEntry,
  getDefaultCheckpoint,
  getSortedBooks,
  loadBibleLookup,
  loadCheckpoint,
  loadDictionary,
  normalizeBaseEntry,
  parseDictionaryKey,
  saveCheckpoint,
  saveDictionary,
  shouldReprocessEntry,
} from './utils.ts';
import type { DictionaryData, DictionaryEntry } from './utils.ts';

type Provider = 'auto' | 'openai' | 'gemini' | 'local';

interface ExpandOptions {
  provider: Provider;
  books: Set<string> | null;
  forceAll: boolean;
  allowLocalFallback: boolean;
  dryRun: boolean;
  resetCheckpoint: boolean;
  batchSize: number;
}

const parseArgs = (): ExpandOptions => {
  const args = process.argv.slice(2);
  const options: ExpandOptions = {
    provider: 'auto',
    books: null,
    forceAll: false,
    allowLocalFallback: false,
    dryRun: false,
    resetCheckpoint: false,
    batchSize: 20,
  };

  for (const arg of args) {
    if (arg.startsWith('--provider=')) {
      options.provider = arg.split('=')[1] as Provider;
    } else if (arg.startsWith('--books=')) {
      const books = arg
        .split('=')[1]
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
      options.books = new Set(books);
    } else if (arg === '--force-all') {
      options.forceAll = true;
    } else if (arg === '--allow-local-fallback') {
      options.allowLocalFallback = true;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--reset-checkpoint') {
      options.resetCheckpoint = true;
    } else if (arg.startsWith('--batch-size=')) {
      options.batchSize = Math.max(1, Number.parseInt(arg.split('=')[1], 10) || 20);
    }
  }

  return options;
};

const extractJsonObject = (text: string): Record<string, unknown> => {
  const trimmed = text.trim();
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start < 0 || end < 0 || end <= start) return {};
  const candidate = trimmed.slice(start, end + 1);
  return JSON.parse(candidate) as Record<string, unknown>;
};

const getOpenAIKey = (): string | undefined =>
  process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || process.env.VITE_OPENAI_API_KEY;

const getGeminiKey = (): string | undefined =>
  process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.VITE_GEMINI_API_KEY;

const resolveProvider = (provider: Provider, allowLocalFallback: boolean): Exclude<Provider, 'auto'> => {
  const openaiKey = getOpenAIKey();
  const geminiKey = getGeminiKey();

  if (provider === 'auto') {
    if (openaiKey) return 'openai';
    if (geminiKey) return 'gemini';
    if (allowLocalFallback) return 'local';
    throw new Error(
      'Nenhuma chave de OpenAI/Gemini encontrada. Configure OPENAI_API_KEY ou GEMINI_API_KEY, ou use --allow-local-fallback.'
    );
  }

  if (provider === 'openai' && !openaiKey) {
    if (allowLocalFallback) return 'local';
    throw new Error('Provider OpenAI selecionado, mas OPENAI_API_KEY não está configurada.');
  }

  if (provider === 'gemini' && !geminiKey) {
    if (allowLocalFallback) return 'local';
    throw new Error('Provider Gemini selecionado, mas GEMINI_API_KEY não está configurada.');
  }

  return provider;
};

const callOpenAI = async (payload: unknown): Promise<Record<string, unknown>> => {
  const key = getOpenAIKey();
  if (!key) throw new Error('OPENAI_API_KEY ausente');

  const model = process.env.OPENAI_MODEL || 'gpt-5-mini';
  const systemPrompt =
    'Você gera JSON válido para um dicionário bíblico em português do Brasil. Responda somente JSON.';

  const userPrompt = [
    'Preencha cada chave com estes campos não vazios:',
    'significado_contextual, explicacao_detalhada, por_que_esta_palavra, conexao_teologica, referencias_relacionadas.',
    'referencias_relacionadas deve ser string[] com 2 a 5 referências bíblicas reais em português.',
    'Mantenha especificidade por versículo.',
    'Entrada:',
    JSON.stringify(payload),
  ].join('\n');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed (${response.status})`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content || '{}';
  return extractJsonObject(content);
};

const callGemini = async (payload: unknown): Promise<Record<string, unknown>> => {
  const key = getGeminiKey();
  if (!key) throw new Error('GEMINI_API_KEY ausente');

  const model = process.env.GEMINI_MODEL || 'gemini-1.5-pro';
  const prompt = [
    'Retorne somente JSON válido.',
    'Para cada chave, preencha os campos não vazios:',
    'significado_contextual, explicacao_detalhada, por_que_esta_palavra, conexao_teologica, referencias_relacionadas.',
    'referencias_relacionadas deve ser string[] com 2 a 5 referências bíblicas reais em português.',
    'Dados:',
    JSON.stringify(payload),
  ].join('\n');

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini request failed (${response.status})`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const content = data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('\n') || '{}';
  return extractJsonObject(content);
};

const sanitizeGeneratedEntry = (
  base: DictionaryEntry,
  generated: unknown
): Pick<
  DictionaryEntry,
  'significado_contextual' | 'explicacao_detalhada' | 'por_que_esta_palavra' | 'conexao_teologica' | 'referencias_relacionadas'
> | null => {
  if (!generated || typeof generated !== 'object') return null;
  const source = generated as Record<string, unknown>;

  const contexto = String(source.significado_contextual || '').trim();
  const explicacao = String(source.explicacao_detalhada || '').trim();
  const motivo = String(source.por_que_esta_palavra || '').trim();
  const conexao = String(source.conexao_teologica || '').trim();
  const refs = Array.isArray(source.referencias_relacionadas)
    ? source.referencias_relacionadas.map((item) => String(item || '').trim()).filter(Boolean)
    : [];

  if (!contexto || !explicacao || !motivo || !conexao || refs.length < 2 || refs.length > 5) {
    return null;
  }

  return {
    significado_contextual: contexto,
    explicacao_detalhada: explicacao,
    por_que_esta_palavra: motivo,
    conexao_teologica: conexao,
    referencias_relacionadas: refs,
  };
};

const run = async (): Promise<void> => {
  const options = parseArgs();
  const provider = resolveProvider(options.provider, options.allowLocalFallback);

  const dictionary = await loadDictionary();
  const bibleLookup = await loadBibleLookup();

  const checkpoint = options.resetCheckpoint ? getDefaultCheckpoint(provider) : await loadCheckpoint();
  if (options.resetCheckpoint) {
    checkpoint.completedBooks = [];
    checkpoint.processedEntries = 0;
    checkpoint.changedEntries = 0;
    checkpoint.mode = provider;
    await saveCheckpoint(checkpoint);
  }

  const allBooks = getSortedBooks(dictionary);
  const targetBooks = options.books ? allBooks.filter((book) => options.books!.has(book)) : allBooks;
  const strongOccurrences = buildStrongOccurrenceMap(dictionary);

  let changedEntries = 0;
  let processedEntries = 0;

  for (const book of targetBooks) {
    if (!options.forceAll && checkpoint.completedBooks.includes(book)) {
      console.log(`[expand] pulando ${book}: já concluído no checkpoint.`);
      continue;
    }

    const keys = Object.keys(dictionary)
      .filter((key) => key.startsWith(`${book}_`))
      .sort((a, b) => a.localeCompare(b, 'pt-BR'));

    const targetKeys = keys.filter((key) => options.forceAll || shouldReprocessEntry(dictionary[key]));
    const localFallback = (key: string): DictionaryEntry => {
      const parsed = parseDictionaryKey(key)!;
      const base = normalizeBaseEntry(dictionary[key], parsed.token.replace(/_/g, ' '));
      return generateLocalContextualEntry(key, base, strongOccurrences, bibleLookup);
    };

    if (provider === 'local' || targetKeys.length === 0) {
      for (const key of keys) {
        processedEntries += 1;
        if (options.forceAll || shouldReprocessEntry(dictionary[key])) {
          dictionary[key] = localFallback(key);
          changedEntries += 1;
        } else {
          const parsed = parseDictionaryKey(key)!;
          dictionary[key] = normalizeBaseEntry(dictionary[key], parsed.token.replace(/_/g, ' '));
        }
      }
    } else {
      for (let i = 0; i < targetKeys.length; i += options.batchSize) {
        const batchKeys = targetKeys.slice(i, i + options.batchSize);
        const payload: Record<string, Record<string, unknown>> = {};

        for (const key of batchKeys) {
          const parsed = parseDictionaryKey(key);
          if (!parsed) continue;
          const base = normalizeBaseEntry(dictionary[key], parsed.token.replace(/_/g, ' '));
          payload[key] = {
            palavra_pt: base.palavra_pt,
            palavra_original: base.palavra_original,
            transliteracao: base.transliteracao,
            strong: base.strong,
            significado_raiz: base.significado_raiz,
            referencia: formatReference(bibleLookup, parsed.bookKey, parsed.chapter, parsed.verse),
          };
        }

        let generatedBatch: Record<string, unknown> = {};
        try {
          generatedBatch = provider === 'openai' ? await callOpenAI(payload) : await callGemini(payload);
        } catch (error) {
          if (!options.allowLocalFallback) {
            throw error;
          }
          console.warn('[expand] LLM indisponível neste lote, aplicando fallback local.', error);
        }

        for (const key of batchKeys) {
          processedEntries += 1;
          const parsed = parseDictionaryKey(key);
          if (!parsed) continue;

          const base = normalizeBaseEntry(dictionary[key], parsed.token.replace(/_/g, ' '));
          const generated = sanitizeGeneratedEntry(base, generatedBatch[key]);

          if (generated) {
            dictionary[key] = {
              ...base,
              ...generated,
            };
          } else {
            dictionary[key] = generateLocalContextualEntry(key, base, strongOccurrences, bibleLookup);
          }
          changedEntries += 1;
        }
      }

      const untouched = keys.filter((key) => !targetKeys.includes(key));
      for (const key of untouched) {
        processedEntries += 1;
        const parsed = parseDictionaryKey(key)!;
        dictionary[key] = normalizeBaseEntry(dictionary[key], parsed.token.replace(/_/g, ' '));
      }
    }

    checkpoint.completedBooks = Array.from(new Set([...checkpoint.completedBooks, book]));
    checkpoint.processedEntries = processedEntries;
    checkpoint.changedEntries = changedEntries;
    checkpoint.mode = provider;
    await saveCheckpoint(checkpoint);

    if (!options.dryRun) {
      await saveDictionary(dictionary);
    }

    console.log(
      `[expand] ${book}: ${targetKeys.length} entradas alvo / ${keys.length} total. Processadas: ${processedEntries}.`
    );
  }

  console.log('[expand] concluído');
  console.log('[expand] provider:', provider);
  console.log('[expand] processedEntries:', processedEntries);
  console.log('[expand] changedEntries:', changedEntries);
  console.log('[expand] checkpoint:', PROGRESS_FILE);
};

void run();
