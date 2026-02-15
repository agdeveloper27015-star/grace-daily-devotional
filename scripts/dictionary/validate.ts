import {
  VALIDATION_REPORT_FILE,
  loadBibleLookup,
  loadDictionary,
  parseDictionaryKey,
  writeJson,
} from './utils.ts';
import type { DictionaryData } from './utils.ts';

interface ValidationIssue {
  key: string;
  issue: string;
}

const STRONG_RE = /^[HG]\d+$/;
const REFERENCE_RE = /^(.+)\s+(\d+):(\d+)$/;

const run = async (): Promise<void> => {
  const dictionary = await loadDictionary();
  const bibleLookup = await loadBibleLookup();

  const issues: ValidationIssue[] = [];
  const stats = {
    totalEntries: Object.keys(dictionary).length,
    invalidKey: 0,
    invalidStrong: 0,
    emptyBase: 0,
    emptyContext: 0,
    invalidReferences: 0,
  };

  const bookByDisplay = new Map<string, { key: string; chapters: string[][] }>();
  for (const [bookKey, book] of bibleLookup.entries()) {
    bookByDisplay.set(book.name, { key: bookKey, chapters: book.chapters });
  }

  for (const [key, entry] of Object.entries(dictionary as DictionaryData)) {
    const parsed = parseDictionaryKey(key);
    if (!parsed) {
      stats.invalidKey += 1;
      issues.push({ key, issue: 'Chave fora do formato livro_capitulo_versiculo_palavra' });
      continue;
    }

    if (!STRONG_RE.test(entry.strong || '')) {
      stats.invalidStrong += 1;
      issues.push({ key, issue: 'Strong inválido' });
    }

    const missingBase =
      !entry.palavra_pt.trim() ||
      !entry.palavra_original.trim() ||
      !entry.transliteracao.trim() ||
      !entry.strong.trim() ||
      !entry.significado_raiz.trim();
    if (missingBase) {
      stats.emptyBase += 1;
      issues.push({ key, issue: 'Campo base obrigatório vazio' });
    }

    const missingContext =
      !entry.significado_contextual.trim() ||
      !entry.explicacao_detalhada.trim() ||
      !entry.por_que_esta_palavra.trim() ||
      !entry.conexao_teologica.trim();
    if (missingContext) {
      stats.emptyContext += 1;
      issues.push({ key, issue: 'Campo contextual obrigatório vazio' });
    }

    const refs = entry.referencias_relacionadas;
    if (!Array.isArray(refs) || refs.length < 2 || refs.length > 5 || refs.some((ref) => typeof ref !== 'string' || !ref.trim())) {
      stats.invalidReferences += 1;
      issues.push({ key, issue: 'referencias_relacionadas deve ser string[] com 2-5 itens' });
      continue;
    }

    for (const reference of refs) {
      const match = reference.match(REFERENCE_RE);
      if (!match) {
        stats.invalidReferences += 1;
        issues.push({ key, issue: `Referência inválida: ${reference}` });
        continue;
      }

      const [, bookName, chapterStr, verseStr] = match;
      const chapter = Number.parseInt(chapterStr, 10);
      const verse = Number.parseInt(verseStr, 10);

      const book = bookByDisplay.get(bookName.trim());
      if (!book) {
        stats.invalidReferences += 1;
        issues.push({ key, issue: `Livro não encontrado na referência: ${reference}` });
        continue;
      }

      const chapterRows = book.chapters[chapter - 1];
      if (!chapterRows || !chapterRows[verse - 1]) {
        stats.invalidReferences += 1;
        issues.push({ key, issue: `Capítulo/versículo inválido na referência: ${reference}` });
      }
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    stats,
    issuesPreview: issues.slice(0, 500),
    totalIssues: issues.length,
  };

  await writeJson(VALIDATION_REPORT_FILE, report, true);

  const critical = stats.invalidKey + stats.invalidStrong + stats.emptyBase + stats.emptyContext + stats.invalidReferences;
  console.log('[validate] report:', VALIDATION_REPORT_FILE);
  console.log('[validate] critical:', critical);
  console.log('[validate] stats:', stats);

  if (critical > 0) {
    process.exitCode = 1;
  }
};

void run();
