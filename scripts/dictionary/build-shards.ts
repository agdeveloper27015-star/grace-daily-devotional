import fs from 'node:fs/promises';
import path from 'node:path';
import {
  SHARDS_ROOT,
  hashDictionary,
  loadDictionary,
  parseDictionaryKey,
  writeJson,
} from './utils.ts';
import type { DictionaryData } from './utils.ts';

interface ChapterMeta {
  path: string;
  entryCount: number;
  size: number;
}

interface BookMeta {
  chapters: number[];
  entryCount: number;
}

const run = async (): Promise<void> => {
  const dictionary = await loadDictionary();
  const hash = hashDictionary(dictionary);
  const generatedAt = new Date().toISOString();

  const chapters = new Map<string, DictionaryData>();
  const books: Record<string, BookMeta> = {};

  for (const [key, entry] of Object.entries(dictionary as DictionaryData)) {
    const parsed = parseDictionaryKey(key);
    if (!parsed) continue;

    const chapterKey = `${parsed.bookKey}_${parsed.chapter}`;
    if (!chapters.has(chapterKey)) {
      chapters.set(chapterKey, {});
    }
    chapters.get(chapterKey)![key] = entry;

    if (!books[parsed.bookKey]) {
      books[parsed.bookKey] = { chapters: [], entryCount: 0 };
    }
    if (!books[parsed.bookKey].chapters.includes(parsed.chapter)) {
      books[parsed.bookKey].chapters.push(parsed.chapter);
    }
    books[parsed.bookKey].entryCount += 1;
  }

  await fs.rm(SHARDS_ROOT, { recursive: true, force: true });
  await fs.mkdir(path.join(SHARDS_ROOT, 'chapters'), { recursive: true });

  const chapterMeta: Record<string, ChapterMeta> = {};

  for (const [chapterKey, chapterEntries] of chapters.entries()) {
    const [bookKey, chapterRaw] = chapterKey.split('_');
    const chapter = Number.parseInt(chapterRaw, 10);

    const relativePath = `chapters/${bookKey}/${chapter}.json`;
    const absolutePath = path.join(SHARDS_ROOT, relativePath);

    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await writeJson(absolutePath, chapterEntries, false);

    const stat = await fs.stat(absolutePath);
    chapterMeta[chapterKey] = {
      path: `/data/dictionary/${relativePath}`,
      entryCount: Object.keys(chapterEntries).length,
      size: stat.size,
    };
  }

  for (const book of Object.keys(books)) {
    books[book].chapters.sort((a, b) => a - b);
  }

  const index = {
    version: `dict-${hash.slice(0, 12)}`,
    generatedAt,
    totalEntries: Object.keys(dictionary).length,
    totalBooks: Object.keys(books).length,
    totalChapters: Object.keys(chapterMeta).length,
    dictionaryHash: hash,
    books,
    chapters: chapterMeta,
  };

  await writeJson(path.join(SHARDS_ROOT, 'index.json'), index, true);

  console.log('[build-shards] shards:', Object.keys(chapterMeta).length);
  console.log('[build-shards] entries:', index.totalEntries);
  console.log('[build-shards] index:', path.join(SHARDS_ROOT, 'index.json'));
};

void run();
