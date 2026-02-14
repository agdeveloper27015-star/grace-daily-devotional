import { BibleBook, BibleChapter, BibleReference, BibleVerse, ChapterReadRecord, Scripture } from '../types';
import { DAILY_VERSES } from '../data/dailyVerses';
import { syncDomain } from './cloudSyncService';
import { dispatchDataUpdated } from './localStateService';
import { touchSyncDomain } from './syncMetaService';
import { STORAGE_KEYS } from './storageKeys';

const BIBLE_JSON_URL = '/data/pt_acf.json';

let bibleCache: BibleBook[] | null = null;

const normalize = (value: string): string => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const parseStorageJSON = <T>(stored: string | null, fallback: T): T => {
  if (!stored) return fallback;
  try {
    return JSON.parse(stored) as T;
  } catch {
    return fallback;
  }
};

export const fetchBibleData = async (): Promise<BibleBook[]> => {
  if (bibleCache) return bibleCache;

  try {
    const response = await fetch(BIBLE_JSON_URL);
    if (!response.ok) throw new Error('Failed to fetch local Bible data');

    const text = (await response.text()).replace(/^\uFEFF/, '');
    const data = JSON.parse(text) as BibleBook[];
    bibleCache = data;
    return data;
  } catch (error) {
    console.error('Error fetching local Bible data:', error);
    return [
      {
        abbrev: 'gn',
        name: 'Genesis',
        chapters: [[
          'No principio criou Deus os ceus e a terra.',
          'E a terra era sem forma e vazia; e havia trevas sobre a face do abismo; e o Espirito de Deus se movia sobre a face das aguas.',
          'E disse Deus: Haja luz; e houve luz.',
        ]],
      },
    ];
  }
};

export const getBooks = async (): Promise<BibleBook[]> => fetchBibleData();

export const getBook = async (abbrev: string): Promise<BibleBook | null> => {
  const bible = await fetchBibleData();
  return bible.find((book) => book.abbrev === abbrev) ?? null;
};

export const getChapter = async (abbrev: string, chapterNumber: number): Promise<BibleChapter | null> => {
  const book = await getBook(abbrev);
  if (!book || chapterNumber < 1 || chapterNumber > book.chapters.length) return null;

  const verses = book.chapters[chapterNumber - 1];
  return {
    bookAbbrev: abbrev,
    bookName: book.name,
    chapterNumber,
    verses: verses.map((text, index) => ({
      number: index + 1,
      text,
    })),
  };
};

export const getVerse = async (
  abbrev: string,
  chapterNumber: number,
  verseNumber: number
): Promise<BibleVerse | null> => {
  const chapter = await getChapter(abbrev, chapterNumber);
  if (!chapter || verseNumber < 1 || verseNumber > chapter.verses.length) return null;

  const verse = chapter.verses[verseNumber - 1];
  return {
    ...verse,
    bookAbbrev: abbrev,
    bookName: chapter.bookName,
    chapterNumber,
  };
};

export const formatReference = (reference: BibleReference): string => {
  return `${reference.bookName} ${reference.chapter}:${reference.verse}`;
};

const PROGRESS_KEY = STORAGE_KEYS.progress;
const CHAPTERS_READ_KEY = STORAGE_KEYS.chaptersRead;

export interface ReadingProgress {
  bookAbbrev: string;
  bookName: string;
  chapter: number;
  timestamp: number;
}

export const saveReadingProgress = (progress: ReadingProgress): void => {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  touchSyncDomain('progress', progress.timestamp || Date.now());
  dispatchDataUpdated('progress');
  void syncDomain('progress');
};

export const getReadingProgress = (): ReadingProgress | null => {
  return parseStorageJSON<ReadingProgress | null>(localStorage.getItem(PROGRESS_KEY), null);
};

const chapterKey = (bookAbbrev: string, chapter: number): string => `${bookAbbrev}:${chapter}`;

export const getChaptersRead = (): ChapterReadRecord[] => {
  const parsed = parseStorageJSON<unknown>(localStorage.getItem(CHAPTERS_READ_KEY), []);
  return Array.isArray(parsed) ? (parsed as ChapterReadRecord[]) : [];
};

export const markChapterRead = (bookAbbrev: string, chapter: number): ChapterReadRecord[] => {
  const chapters = getChaptersRead();
  const next = chapters.filter((item) => chapterKey(item.bookAbbrev, item.chapter) !== chapterKey(bookAbbrev, chapter));

  next.push({
    bookAbbrev,
    chapter,
    readAt: Date.now(),
  });

  localStorage.setItem(CHAPTERS_READ_KEY, JSON.stringify(next));
  touchSyncDomain('chapters');
  dispatchDataUpdated('chapters');
  void syncDomain('chapters');

  return next;
};

export const getTotalReadVerses = async (): Promise<number> => {
  const bible = await fetchBibleData();
  const byBook = new Map<string, Set<number>>();

  for (const item of getChaptersRead()) {
    if (!byBook.has(item.bookAbbrev)) {
      byBook.set(item.bookAbbrev, new Set<number>());
    }
    byBook.get(item.bookAbbrev)!.add(item.chapter);
  }

  let total = 0;
  for (const book of bible) {
    const readChapters = byBook.get(book.abbrev);
    if (!readChapters) continue;

    for (const chapterNumber of readChapters) {
      const verses = book.chapters[chapterNumber - 1];
      if (verses) total += verses.length;
    }
  }

  return total;
};

export interface BibleSearchResult {
  bookName: string;
  bookAbbrev: string;
  chapter: number;
  verse: number;
  text: string;
}

export const searchBible = async (query: string, maxResults: number = 30): Promise<BibleSearchResult[]> => {
  const bible = await fetchBibleData();
  const results: BibleSearchResult[] = [];

  const normalizedQuery = normalize(query);
  const queryWords = normalizedQuery.split(/\s+/).filter((word) => word.length > 2);
  if (queryWords.length === 0) return [];

  for (const book of bible) {
    const normalizedBook = normalize(book.name);
    const isBookSearch = normalizedQuery.includes(normalizedBook) || normalizedBook.includes(normalizedQuery);

    for (let chIdx = 0; chIdx < book.chapters.length; chIdx += 1) {
      const verses = book.chapters[chIdx];
      for (let vIdx = 0; vIdx < verses.length; vIdx += 1) {
        const verseText = verses[vIdx];
        const normalizedVerse = normalize(verseText);

        const matchCount = queryWords.filter((word) => normalizedVerse.includes(word)).length;
        if (matchCount === queryWords.length || (isBookSearch && matchCount > 0)) {
          results.push({
            bookName: book.name,
            bookAbbrev: book.abbrev,
            chapter: chIdx + 1,
            verse: vIdx + 1,
            text: verseText,
          });

          if (results.length >= maxResults) return results;
        }
      }
    }
  }

  if (results.length >= 5) return results;

  for (const book of bible) {
    for (let chIdx = 0; chIdx < book.chapters.length; chIdx += 1) {
      const verses = book.chapters[chIdx];
      for (let vIdx = 0; vIdx < verses.length; vIdx += 1) {
        const verseText = verses[vIdx];
        const normalizedVerse = normalize(verseText);

        const matchCount = queryWords.filter((word) => normalizedVerse.includes(word)).length;
        const alreadyIncluded = results.some(
          (item) => item.bookAbbrev === book.abbrev && item.chapter === chIdx + 1 && item.verse === vIdx + 1
        );

        if (matchCount > 0 && !alreadyIncluded) {
          results.push({
            bookName: book.name,
            bookAbbrev: book.abbrev,
            chapter: chIdx + 1,
            verse: vIdx + 1,
            text: verseText,
          });

          if (results.length >= maxResults) return results;
        }
      }
    }
  }

  return results;
};

export const getReadingPercentage = async (bookAbbrev: string, currentChapter: number): Promise<number> => {
  const book = await getBook(bookAbbrev);
  if (!book) return 0;
  return Math.round((currentChapter / book.chapters.length) * 100);
};

export const DAILY_VERSE_COUNT = DAILY_VERSES.length;

const getDayOfYear = (value: Date): number => {
  const year = value.getFullYear();
  const start = new Date(year, 0, 1);
  const today = new Date(year, value.getMonth(), value.getDate());
  const diff = today.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
};

export const getDailyVerse = (date: Date = new Date()): Scripture => {
  const dayOfYear = getDayOfYear(date);
  const index = Math.max(0, (dayOfYear - 1) % DAILY_VERSES.length);
  return DAILY_VERSES[index];
};

export const parseReference = async (
  reference: string
): Promise<{ bookAbbrev: string; chapter: number; verse: number } | null> => {
  const bible = await fetchBibleData();
  const match = reference.match(/^(.+?)\s+(\d+):(\d+)/);
  if (!match) return null;

  const [, bookName, chapterStr, verseStr] = match;
  const normalizedName = normalize(bookName);

  const book = bible.find((item) => {
    const candidate = normalize(item.name);
    return candidate === normalizedName || candidate.startsWith(normalizedName) || normalizedName.startsWith(candidate);
  });

  if (!book) return null;

  return {
    bookAbbrev: book.abbrev,
    chapter: Number.parseInt(chapterStr, 10),
    verse: Number.parseInt(verseStr, 10),
  };
};

export const getNextChapter = async (
  currentAbbrev: string,
  currentChapter: number
): Promise<{ abbrev: string; chapter: number } | null> => {
  const bible = await fetchBibleData();
  const index = bible.findIndex((book) => book.abbrev === currentAbbrev);
  if (index === -1) return null;

  const currentBook = bible[index];
  if (currentChapter < currentBook.chapters.length) {
    return { abbrev: currentAbbrev, chapter: currentChapter + 1 };
  }

  if (index < bible.length - 1) {
    return { abbrev: bible[index + 1].abbrev, chapter: 1 };
  }

  return null;
};

export const getPreviousChapter = async (
  currentAbbrev: string,
  currentChapter: number
): Promise<{ abbrev: string; chapter: number } | null> => {
  const bible = await fetchBibleData();
  const index = bible.findIndex((book) => book.abbrev === currentAbbrev);
  if (index === -1) return null;

  if (currentChapter > 1) {
    return { abbrev: currentAbbrev, chapter: currentChapter - 1 };
  }

  if (index > 0) {
    const previousBook = bible[index - 1];
    return { abbrev: previousBook.abbrev, chapter: previousBook.chapters.length };
  }

  return null;
};
