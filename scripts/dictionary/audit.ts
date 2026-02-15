import {
  AUDIT_REPORT_FILE,
  loadDictionary,
  parseDictionaryKey,
  shouldReprocessEntry,
  writeJson,
} from './utils.ts';
import type { DictionaryData } from './utils.ts';

interface BookAudit {
  total: number;
  reprocess: number;
  complete: number;
}

const run = async (): Promise<void> => {
  const dictionary = await loadDictionary();
  const byBook: Record<string, BookAudit> = {};
  let invalidKeys = 0;
  let reprocess = 0;

  for (const [key, entry] of Object.entries(dictionary as DictionaryData)) {
    const parsed = parseDictionaryKey(key);
    if (!parsed) {
      invalidKeys += 1;
      continue;
    }

    if (!byBook[parsed.bookKey]) {
      byBook[parsed.bookKey] = { total: 0, reprocess: 0, complete: 0 };
    }

    const item = byBook[parsed.bookKey];
    item.total += 1;

    if (shouldReprocessEntry(entry)) {
      item.reprocess += 1;
      reprocess += 1;
    } else {
      item.complete += 1;
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    totalEntries: Object.keys(dictionary).length,
    invalidKeys,
    reprocess,
    complete: Object.keys(dictionary).length - reprocess,
    byBook,
  };

  await writeJson(AUDIT_REPORT_FILE, report, true);

  console.log('[audit] totalEntries:', report.totalEntries);
  console.log('[audit] invalidKeys:', report.invalidKeys);
  console.log('[audit] reprocess:', report.reprocess);
  console.log('[audit] report:', AUDIT_REPORT_FILE);
};

void run();
