import fs from 'node:fs/promises';
import {
  FINAL_REPORT_FILE,
  VALIDATION_REPORT_FILE,
  loadDictionary,
  parseDictionaryKey,
  writeJson,
} from './utils.ts';
import type { DictionaryData } from './utils.ts';

interface BookReport {
  total: number;
  withContext: number;
  withoutContext: number;
}

const hasContext = (entry: DictionaryData[string]): boolean =>
  Boolean(
    entry.significado_contextual.trim() &&
      entry.explicacao_detalhada.trim() &&
      entry.por_que_esta_palavra.trim() &&
      entry.conexao_teologica.trim() &&
      Array.isArray(entry.referencias_relacionadas) &&
      entry.referencias_relacionadas.length >= 2
  );

const run = async (): Promise<void> => {
  const dictionary = await loadDictionary();
  const byBook: Record<string, BookReport> = {};

  let withContext = 0;
  let withoutContext = 0;
  let invalidStrong = 0;

  for (const [key, entry] of Object.entries(dictionary as DictionaryData)) {
    const parsed = parseDictionaryKey(key);
    if (!parsed) continue;

    if (!byBook[parsed.bookKey]) {
      byBook[parsed.bookKey] = { total: 0, withContext: 0, withoutContext: 0 };
    }

    byBook[parsed.bookKey].total += 1;

    if (!/^[HG]\d+$/.test(entry.strong || '')) {
      invalidStrong += 1;
    }

    if (hasContext(entry)) {
      withContext += 1;
      byBook[parsed.bookKey].withContext += 1;
    } else {
      withoutContext += 1;
      byBook[parsed.bookKey].withoutContext += 1;
    }
  }

  let validationStats: unknown = null;
  try {
    const validationRaw = await fs.readFile(VALIDATION_REPORT_FILE, 'utf8');
    validationStats = JSON.parse(validationRaw).stats;
  } catch {
    validationStats = null;
  }

  const report = {
    generatedAt: new Date().toISOString(),
    totalEntries: Object.keys(dictionary).length,
    withContext,
    withoutContext,
    invalidStrong,
    coveragePercentage:
      Object.keys(dictionary).length === 0
        ? 0
        : Number(((withContext / Object.keys(dictionary).length) * 100).toFixed(2)),
    byBook,
    validationStats,
  };

  await writeJson(FINAL_REPORT_FILE, report, true);

  console.log('[report] totalEntries:', report.totalEntries);
  console.log('[report] withContext:', report.withContext);
  console.log('[report] withoutContext:', report.withoutContext);
  console.log('[report] coveragePercentage:', report.coveragePercentage);
  console.log('[report] file:', FINAL_REPORT_FILE);
};

void run();
