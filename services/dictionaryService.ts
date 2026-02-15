export interface DictionaryEntry {
  palavra_pt: string;
  palavra_original: string;
  transliteracao: string;
  strong: string;
  significado_raiz: string;
  significado_contextual: string;
  explicacao_detalhada: string;
  por_que_esta_palavra: string;
  conexao_teologica: string;
  referencias_relacionadas: string[];
}

export interface DictionaryIndexChapter {
  path: string;
  entryCount: number;
  size: number;
}

export interface DictionaryIndexBook {
  chapters: number[];
  entryCount: number;
}

export interface DictionaryIndex {
  version: string;
  generatedAt: string;
  totalEntries: number;
  totalBooks: number;
  totalChapters: number;
  dictionaryHash: string;
  books: Record<string, DictionaryIndexBook>;
  chapters: Record<string, DictionaryIndexChapter>;
}

interface DictionaryData {
  [key: string]: DictionaryEntry;
}

const DICTIONARY_INDEX_URL = '/data/dictionary/index.json';
const LEGACY_DICTIONARY_URL = '/dicionario_completo.json';

let indexCache: DictionaryIndex | null = null;
let indexLoadPromise: Promise<DictionaryIndex> | null = null;

let legacyCache: DictionaryData | null = null;
let legacyLoadPromise: Promise<DictionaryData> | null = null;

const chapterCache = new Map<string, DictionaryData>();
const chapterLoadPromises = new Map<string, Promise<DictionaryData>>();
const prefixCache = new Map<string, string[]>();

// Mapeamento de abreviações para nomes de livros no dicionário
const BOOK_ABBREV_TO_DICT: Record<string, string> = {
  gn: 'genesis',
  ex: 'exodo',
  lv: 'levitico',
  nm: 'numeros',
  dt: 'deuteronomio',
  js: 'josue',
  jz: 'juizes',
  rt: 'rute',
  '1sm': '1samuel',
  '2sm': '2samuel',
  '1rs': '1reis',
  '2rs': '2reis',
  '1cr': '1cronicas',
  '2cr': '2cronicas',
  ed: 'esdras',
  ne: 'neemias',
  et: 'ester',
  job: 'jo',
  sl: 'salmos',
  pv: 'proverbios',
  ec: 'eclesiastes',
  ct: 'cantares',
  is: 'isaias',
  jr: 'jeremias',
  lm: 'lamentacoes',
  ez: 'ezequiel',
  dn: 'daniel',
  os: 'oseias',
  jl: 'joel',
  am: 'amos',
  ob: 'obadias',
  jn: 'jonas',
  mq: 'miqueias',
  na: 'naum',
  hc: 'habacuque',
  sf: 'sofonias',
  ag: 'ageu',
  zc: 'zacarias',
  ml: 'malaquias',
  mt: 'mateus',
  mc: 'marcos',
  lc: 'lucas',
  jo: 'joao',
  at: 'atos',
  rm: 'romanos',
  '1co': '1corintios',
  '2co': '2corintios',
  gl: 'galatas',
  ef: 'efesios',
  fp: 'filipenses',
  cl: 'colossenses',
  '1ts': '1tessalonicenses',
  '2ts': '2tessalonicenses',
  '1tm': '1timoteo',
  '2tm': '2timoteo',
  tt: 'tito',
  fm: 'filemom',
  hb: 'hebreus',
  tg: 'tiago',
  '1pe': '1pedro',
  '2pe': '2pedro',
  '1jo': '1joao',
  '2jo': '2joao',
  '3jo': '3joao',
  jd: 'judas',
  ap: 'apocalipse',
};

const normalizeReferences = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];

  const refs: string[] = [];
  for (const item of value) {
    if (typeof item === 'string') {
      const ref = item.trim();
      if (ref) refs.push(ref);
      continue;
    }

    if (item && typeof item === 'object' && 'referencia' in item) {
      const ref = String((item as { referencia?: string }).referencia || '').trim();
      if (ref) refs.push(ref);
    }
  }

  return refs;
};

const sanitizeEntry = (entry: unknown): DictionaryEntry | null => {
  if (!entry || typeof entry !== 'object') return null;

  const source = entry as Record<string, unknown>;

  return {
    palavra_pt: String(source.palavra_pt || '').trim(),
    palavra_original: String(source.palavra_original || '').trim(),
    transliteracao: String(source.transliteracao || '').trim(),
    strong: String(source.strong || '').trim(),
    significado_raiz: String(source.significado_raiz || '').trim(),
    significado_contextual: String(source.significado_contextual || '').trim(),
    explicacao_detalhada: String(source.explicacao_detalhada || '').trim(),
    por_que_esta_palavra: String(source.por_que_esta_palavra || '').trim(),
    conexao_teologica: String(source.conexao_teologica || '').trim(),
    referencias_relacionadas: normalizeReferences(source.referencias_relacionadas),
  };
};

const sanitizeDictionaryData = (data: unknown): DictionaryData => {
  if (!data || typeof data !== 'object') return {};

  const output: DictionaryData = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    const entry = sanitizeEntry(value);
    if (entry) output[key] = entry;
  }
  return output;
};

const buildIndexFromLegacy = (dictionary: DictionaryData): DictionaryIndex => {
  const books: Record<string, DictionaryIndexBook> = {};
  const chapters: Record<string, DictionaryIndexChapter> = {};

  for (const key of Object.keys(dictionary)) {
    const parts = key.split('_');
    if (parts.length < 4) continue;

    const book = parts[0];
    const chapter = Number.parseInt(parts[1], 10);
    if (Number.isNaN(chapter)) continue;

    const chapterKey = `${book}_${chapter}`;
    if (!books[book]) books[book] = { chapters: [], entryCount: 0 };

    if (!books[book].chapters.includes(chapter)) {
      books[book].chapters.push(chapter);
    }

    books[book].entryCount += 1;

    if (!chapters[chapterKey]) {
      chapters[chapterKey] = {
        path: `/data/dictionary/chapters/${book}/${chapter}.json`,
        entryCount: 0,
        size: 0,
      };
    }

    chapters[chapterKey].entryCount += 1;
  }

  for (const book of Object.keys(books)) {
    books[book].chapters.sort((a, b) => a - b);
  }

  const now = new Date().toISOString();
  return {
    version: `legacy-${now}`,
    generatedAt: now,
    totalEntries: Object.keys(dictionary).length,
    totalBooks: Object.keys(books).length,
    totalChapters: Object.keys(chapters).length,
    dictionaryHash: 'legacy-fallback',
    books,
    chapters,
  };
};

const loadLegacyDictionary = async (): Promise<DictionaryData> => {
  if (legacyCache) return legacyCache;
  if (legacyLoadPromise) return legacyLoadPromise;

  legacyLoadPromise = (async () => {
    try {
      const response = await fetch(LEGACY_DICTIONARY_URL);
      if (!response.ok) {
        throw new Error('Failed to load legacy dictionary: ' + response.status);
      }

      const data = sanitizeDictionaryData(await response.json());
      legacyCache = data;
      return data;
    } catch (error) {
      console.error('[Dictionary] Erro ao carregar legado:', error);
      return {};
    }
  })();

  return legacyLoadPromise;
};

export const loadDictionaryIndex = async (): Promise<DictionaryIndex> => {
  if (indexCache) return indexCache;
  if (indexLoadPromise) return indexLoadPromise;

  indexLoadPromise = (async () => {
    try {
      const response = await fetch(DICTIONARY_INDEX_URL, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Failed to load dictionary index: ' + response.status);
      }

      const index = (await response.json()) as DictionaryIndex;
      indexCache = index;
      return index;
    } catch (error) {
      console.warn('[Dictionary] Indice nao encontrado, usando fallback legado:', error);
      const legacy = await loadLegacyDictionary();
      const fallback = buildIndexFromLegacy(legacy);
      indexCache = fallback;
      return fallback;
    }
  })();

  return indexLoadPromise;
};

export const dictionaryBookAbbrevToDictFormat = (abbrev: string): string => {
  const normalized = abbrev.toLowerCase();
  return BOOK_ABBREV_TO_DICT[normalized] || normalized;
};

export const getDictionaryShardPath = (bookAbbrev: string, chapter: number): string => {
  const bookName = dictionaryBookAbbrevToDictFormat(bookAbbrev);
  return `/data/dictionary/chapters/${bookName}/${chapter}.json`;
};

export const loadDictionaryChapter = async (bookAbbrev: string, chapter: number): Promise<DictionaryData> => {
  const bookName = dictionaryBookAbbrevToDictFormat(bookAbbrev);
  const chapterKey = `${bookName}_${chapter}`;

  if (chapterCache.has(chapterKey)) {
    return chapterCache.get(chapterKey)!;
  }

  const existingPromise = chapterLoadPromises.get(chapterKey);
  if (existingPromise) return existingPromise;

  const loadPromise = (async () => {
    const index = await loadDictionaryIndex();
    const chapterMeta = index.chapters[chapterKey];

    if (chapterMeta?.path) {
      try {
        const response = await fetch(chapterMeta.path);
        if (response.ok) {
          const data = sanitizeDictionaryData(await response.json());
          chapterCache.set(chapterKey, data);
          return data;
        }
      } catch (error) {
        console.warn(`[Dictionary] Falha ao carregar shard ${chapterKey}, usando fallback legado.`, error);
      }
    }

    const legacy = await loadLegacyDictionary();
    const prefix = `${bookName}_${chapter}_`;
    const filtered: DictionaryData = {};

    for (const [key, value] of Object.entries(legacy)) {
      if (key.startsWith(prefix)) {
        filtered[key] = value;
      }
    }

    chapterCache.set(chapterKey, filtered);
    return filtered;
  })();

  chapterLoadPromises.set(chapterKey, loadPromise);
  return loadPromise;
};

const getCachedVerseEntries = (dictionary: DictionaryData, cacheKey: string, prefix: string): string[] => {
  const key = `${cacheKey}:${prefix}`;
  if (prefixCache.has(key)) {
    return prefixCache.get(key)!;
  }

  const entries = Object.keys(dictionary).filter((entryKey) => entryKey.startsWith(prefix));
  prefixCache.set(key, entries);
  return entries;
};

const generateDictionaryKey = (
  bookAbbrev: string,
  chapter: number,
  verse: number,
  word: string
): string => {
  const bookName = dictionaryBookAbbrevToDictFormat(bookAbbrev);
  const normalizedWord = word
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

  return `${bookName}_${chapter}_${verse}_${normalizedWord}`;
};

export const getDictionaryEntry = async (
  bookAbbrev: string,
  chapter: number,
  verse: number,
  word: string
): Promise<DictionaryEntry | null> => {
  const dictionary = await loadDictionaryChapter(bookAbbrev, chapter);

  const key = generateDictionaryKey(bookAbbrev, chapter, verse, word);
  if (dictionary[key]) {
    return dictionary[key];
  }

  const variations = [
    word.toLowerCase().trim(),
    word.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim(),
    word.toLowerCase().replace(/s$/, '').trim(),
    word.toLowerCase().replace(/[^a-zà-ÿ]/gi, '').trim(),
  ];

  for (const variation of variations) {
    const varKey = generateDictionaryKey(bookAbbrev, chapter, verse, variation);
    if (dictionary[varKey]) {
      return dictionary[varKey];
    }
  }

  const bookName = dictionaryBookAbbrevToDictFormat(bookAbbrev);
  const prefix = `${bookName}_${chapter}_${verse}_`;

  for (const dictKey of Object.keys(dictionary)) {
    if (dictKey.startsWith(prefix)) {
      const dictWord = dictKey.replace(prefix, '').replace(/_/g, ' ');
      const searchWord = word.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

      if (
        dictWord.includes(searchWord) ||
        searchWord.includes(dictWord) ||
        levenshteinDistance(dictWord, searchWord) <= 2
      ) {
        return dictionary[dictKey];
      }
    }
  }

  return null;
};

const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i += 1) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j += 1) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i += 1) {
    for (let j = 1; j <= str1.length; j += 1) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
};

export const findWordsInVerse = async (
  bookAbbrev: string,
  chapter: number,
  verse: number,
  verseText: string
): Promise<Array<{ word: string; entry: DictionaryEntry; index: number }>> => {
  const dictionary = await loadDictionaryChapter(bookAbbrev, chapter);
  const found: Array<{ word: string; entry: DictionaryEntry; index: number }> = [];

  const bookName = dictionaryBookAbbrevToDictFormat(bookAbbrev);
  const prefix = `${bookName}_${chapter}_${verse}_`;
  const cacheKey = `${bookName}_${chapter}`;

  const verseEntries = getCachedVerseEntries(dictionary, cacheKey, prefix);
  if (verseEntries.length === 0) {
    return [];
  }

  const verseNormalized = verseText
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ');
  const seenMatches = new Set<string>();

  for (const dictKey of verseEntries) {
    const entry = dictionary[dictKey];
    const keyWord = dictKey.replace(prefix, '').replace(/_/g, ' ');
    const rawTerms = [entry.palavra_pt, keyWord]
      .flatMap((value) => value.split('/'))
      .map((value) =>
        value
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9\s]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
      )
      .filter((value) => value.length >= 2);
    const terms = Array.from(new Set(rawTerms)).sort((a, b) => b.length - a.length);

    for (const term of terms) {
      const regex = new RegExp(`\\b${escapeRegExp(term)}(?:s|es|ns|m|ens)?\\b`, 'gi');
      let match: RegExpExecArray | null = regex.exec(verseNormalized);

      while (match) {
        const startIndex = match.index;
        const endIndex = startIndex + match[0].length;
        const dedupeKey = `${dictKey}:${startIndex}`;

        if (!seenMatches.has(dedupeKey)) {
          seenMatches.add(dedupeKey);
          found.push({
            word: verseText.slice(startIndex, endIndex),
            entry,
            index: startIndex,
          });
        }

        match = regex.exec(verseNormalized);
      }
    }
  }

  return found.sort((a, b) => a.index - b.index);
};

const escapeRegExp = (string: string): string => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const hasDictionaryEntry = async (
  bookAbbrev: string,
  chapter: number,
  verse: number,
  word: string
): Promise<boolean> => {
  const entry = await getDictionaryEntry(bookAbbrev, chapter, verse, word);
  return entry !== null;
};

export const getAvailableWordsForVerse = async (
  bookAbbrev: string,
  chapter: number,
  verse: number
): Promise<string[]> => {
  const dictionary = await loadDictionaryChapter(bookAbbrev, chapter);
  const bookName = dictionaryBookAbbrevToDictFormat(bookAbbrev);
  const prefix = `${bookName}_${chapter}_${verse}_`;

  return Object.keys(dictionary)
    .filter((key) => key.startsWith(prefix))
    .map((key) => {
      const wordPart = key.replace(prefix, '');
      return wordPart.replace(/_/g, ' ');
    });
};

export const resetDictionaryCache = (): void => {
  indexCache = null;
  indexLoadPromise = null;
  legacyCache = null;
  legacyLoadPromise = null;
  chapterCache.clear();
  chapterLoadPromises.clear();
  prefixCache.clear();
};
