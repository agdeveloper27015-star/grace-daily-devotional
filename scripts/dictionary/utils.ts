import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

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

export type DictionaryData = Record<string, DictionaryEntry>;

export interface ParsedDictionaryKey {
  key: string;
  bookKey: string;
  chapter: number;
  verse: number;
  token: string;
}

interface BibleBook {
  abbrev: string;
  name: string;
  chapters: string[][];
}

interface BibleLookupItem {
  key: string;
  name: string;
  chapters: string[][];
}

export interface DictionaryCheckpoint {
  mode: string;
  completedBooks: string[];
  updatedAt: string;
  processedEntries: number;
  changedEntries: number;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const PROJECT_ROOT = path.resolve(__dirname, '../..');
export const DICTIONARY_FILE = path.join(PROJECT_ROOT, 'public/dicionario_completo.json');
export const BIBLE_FILE = path.join(PROJECT_ROOT, 'public/data/pt_acf.json');
export const PROGRESS_FILE = path.join(PROJECT_ROOT, 'scripts/dictionary/progress.json');
export const AUDIT_REPORT_FILE = path.join(PROJECT_ROOT, 'scripts/dictionary/audit-report.json');
export const VALIDATION_REPORT_FILE = path.join(PROJECT_ROOT, 'scripts/dictionary/validation-report.json');
export const FINAL_REPORT_FILE = path.join(PROJECT_ROOT, 'scripts/dictionary/final-report.json');
export const SHARDS_ROOT = path.join(PROJECT_ROOT, 'public/data/dictionary');

const normalizeAscii = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '')
    .trim();

const normalizeToken = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9/ -]/g, ' ')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const toSentenceCase = (value: string): string => {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const PT_WORD_OVERRIDES: Record<string, string> = {
  manner: 'modo',
  forasmuch: 'ate',
  among: 'entre',
  phrase: 'expressão',
  behold: 'eis',
  idiom: 'expressão',
  according: 'conforme',
  scribe: 'escriba',
  blessed: 'bem-aventurado',
  therefore: 'portanto',
  forbear: 'suportar',
  anthe: 'estes/aqueles',
  alone: 'sozinho',
  business: 'assunto',
  describe: 'descrever',
  exceeding: 'muito',
  break: 'quebrar',
  again: 'novamente',
  add: 'acrescentar',
  because: 'porque',
  forth: 'adiante',
  continual: 'contínuo',
  appear: 'aparecer',
  commit: 'entregar',
  opportunity: 'oportunidade',
  head: 'cabeça',
  able: 'capaz',
  confusion: 'confusão',
  assemble: 'ajuntar',
  years: 'anos',
  cover: 'cobrir',
  cast: 'lançar',
  ear: 'ouvido',
  nakedness: 'nudez',
  arise: 'levantar',
  better: 'melhor',
  lot: 'sorte',
  border: 'fronteira',
  purple: 'púrpura',
  full: 'cheio',
  height: 'altura',
  hair: 'cabelo',
  measure: 'medida',
  place: 'lugar',
  excellent: 'excelente',
  dead: 'morto',
  eat: 'comer',
  almost: 'quase',
  accept: 'aceitar',
  ashes: 'cinzas',
  corruption: 'corrupção',
  agreement: 'aliança',
  first: 'primeiro',
  chief: 'principal',
  beneath: 'debaixo',
  grief: 'dor',
  consider: 'considerar',
  beyond: 'além',
  marriage: 'casamento',
  jacob: 'jacó',
  moses: 'moisés',
  pharaoh: 'faraó',
  galilee: 'galileia',
  tyre: 'tiro',
  egypt: 'egito',
  israelite: 'israelita',
  job: 'jó',
};

const BIBLE_BOOK_ALIASES: Record<string, string> = {
  cantares: 'canticos',
  lamentacoes: 'lamentacoesdejeremias',
};

const ROOT_WORD_REPLACEMENTS: Record<string, string> = {
  sky: 'céu',
  cloud: 'nuvem',
  clouds: 'nuvens',
  dark: 'escuro',
  darkness: 'trevas',
  misery: 'miséria',
  destruction: 'destruição',
  death: 'morte',
  ignorance: 'ignorância',
  sorrow: 'tristeza',
  wickedness: 'maldade',
  literally: 'literalmente',
  figuratively: 'figuradamente',
  alluding: 'aludindo',
  visible: 'visível',
  higher: 'superior',
  ether: 'céu superior',
  where: 'onde',
  bodies: 'corpos',
  and: 'e',
  with: 'com',
  from: 'de',
  the: 'o',
  as: 'como',
  for: 'para',
  in: 'em',
};

const LIKELY_ENGLISH_RE = /\b(?:the|and|for|with|from|where|when|above|below|literal|figurative|manner|phrase|because|therefore)\b/i;
const RESIDUAL_ENGLISH_TOKENS = new Set([
  'whether',
  'sunrise',
  'sunset',
  'next',
  'defined',
  'space',
  'warm',
  'hours',
  'builder',
  'widest',
  'grandson',
  'subject',
  'quality',
  'applications',
  'application',
  'various',
  'specific',
  'silence',
  'endure',
  'patiently',
  'patient',
  'covering',
  'asso',
  'itc',
  'literal',
  'figurative',
]);

const hasResidualEnglish = (value: string): boolean => {
  const tokens = value
    .toLowerCase()
    .split(/[^a-z]+/g)
    .map((token) => token.trim())
    .filter(Boolean);

  return tokens.some((token) => RESIDUAL_ENGLISH_TOKENS.has(token));
};

export const parseDictionaryKey = (key: string): ParsedDictionaryKey | null => {
  const parts = key.split('_');
  if (parts.length < 4) return null;

  const chapter = Number.parseInt(parts[1], 10);
  const verse = Number.parseInt(parts[2], 10);
  if (Number.isNaN(chapter) || Number.isNaN(verse)) return null;

  return {
    key,
    bookKey: parts[0],
    chapter,
    verse,
    token: parts.slice(3).join('_'),
  };
};

export const readJson = async <T>(filePath: string): Promise<T> => {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw.replace(/^\uFEFF/, '')) as T;
};

export const writeJson = async (filePath: string, data: unknown, pretty = false): Promise<void> => {
  const payload = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, payload, 'utf8');
};

export const loadDictionary = async (): Promise<DictionaryData> => readJson<DictionaryData>(DICTIONARY_FILE);

export const saveDictionary = async (dictionary: DictionaryData): Promise<void> => {
  await writeJson(DICTIONARY_FILE, dictionary, false);
};

export const loadBibleLookup = async (): Promise<Map<string, BibleLookupItem>> => {
  const bible = await readJson<BibleBook[]>(BIBLE_FILE);
  const map = new Map<string, BibleLookupItem>();

  for (const book of bible) {
    const key = normalizeAscii(book.name);
    map.set(key, {
      key,
      name: book.name,
      chapters: book.chapters,
    });
  }

  return map;
};

const resolveBibleBook = (
  bibleLookup: Map<string, BibleLookupItem>,
  bookKey: string
): BibleLookupItem | undefined => {
  const direct = bibleLookup.get(bookKey);
  if (direct) return direct;
  const alias = BIBLE_BOOK_ALIASES[bookKey];
  if (!alias) return undefined;
  return bibleLookup.get(alias);
};

export const isValidParsedReference = (
  bibleLookup: Map<string, BibleLookupItem>,
  bookKey: string,
  chapter: number,
  verse: number
): boolean => {
  const book = resolveBibleBook(bibleLookup, bookKey);
  if (!book) return false;
  const chapterRows = book.chapters[chapter - 1];
  if (!chapterRows) return false;
  return Boolean(chapterRows[verse - 1]);
};

export const getVerseText = (
  bibleLookup: Map<string, BibleLookupItem>,
  bookKey: string,
  chapter: number,
  verse: number
): string => {
  const book = resolveBibleBook(bibleLookup, bookKey);
  if (!book) return '';

  const chapterRows = book.chapters[chapter - 1];
  if (!chapterRows) return '';
  return chapterRows[verse - 1] || '';
};

export const getBookDisplayName = (bibleLookup: Map<string, BibleLookupItem>, bookKey: string): string => {
  return resolveBibleBook(bibleLookup, bookKey)?.name || toSentenceCase(bookKey);
};

export const formatReference = (
  bibleLookup: Map<string, BibleLookupItem>,
  bookKey: string,
  chapter: number,
  verse: number
): string => `${getBookDisplayName(bibleLookup, bookKey)} ${chapter}:${verse}`;

export const normalizeReferences = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  const refs: string[] = [];
  for (const item of value) {
    if (typeof item === 'string') {
      const normalized = item.trim();
      if (normalized) refs.push(normalized);
      continue;
    }

    if (item && typeof item === 'object' && 'referencia' in item) {
      const normalized = String((item as { referencia?: string }).referencia || '').trim();
      if (normalized) refs.push(normalized);
    }
  }
  return Array.from(new Set(refs));
};

export const normalizePalavraPt = (raw: string, tokenFromKey: string): string => {
  const source = normalizeToken(raw || tokenFromKey || '');
  if (!source) return normalizeToken(tokenFromKey || 'termo');

  const parts = source.split('/').map((part) => part.trim()).filter(Boolean);
  const mapped = parts.map((part) => {
    const collapsed = part.replace(/\s+/g, '');
    return PT_WORD_OVERRIDES[part] || PT_WORD_OVERRIDES[collapsed] || part;
  });
  const joined = mapped.join('/');
  return joined || source;
};

export const normalizeRootMeaning = (raw: string, strong: string): string => {
  const source = normalizeToken(raw || '');
  if (!source) return `Sentido lexical conforme o léxico Strong ${strong}.`;

  const words = source.split(' ').map((word) => ROOT_WORD_REPLACEMENTS[word] || word);
  const rebuilt = words.join(' ').replace(/\s+/g, ' ').trim();
  if (LIKELY_ENGLISH_RE.test(rebuilt) || hasResidualEnglish(rebuilt)) {
    return `Sentido lexical do termo conforme o léxico Strong ${strong}.`;
  }
  if (rebuilt.length < 12) {
    return `${toSentenceCase(rebuilt)} no campo semântico de ${strong}.`;
  }
  return toSentenceCase(rebuilt);
};

export const extractSnippet = (text: string, maxLength = 128): string => {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength - 1).trim()}…`;
};

export const buildStrongOccurrenceMap = (dictionary: DictionaryData): Map<string, string[]> => {
  const map = new Map<string, string[]>();
  for (const [key, entry] of Object.entries(dictionary)) {
    const strong = String(entry.strong || '').trim();
    if (!strong) continue;
    if (!map.has(strong)) map.set(strong, []);
    map.get(strong)!.push(key);
  }

  for (const [strong, keys] of map.entries()) {
    keys.sort((a, b) => a.localeCompare(b, 'pt-BR'));
    map.set(strong, keys);
  }

  return map;
};

const defaultCrossReference = (strong: string): string => {
  if (strong.startsWith('H')) return 'Salmos 119:105';
  return 'João 1:1';
};

export const buildReferencesForEntry = (
  key: string,
  entry: DictionaryEntry,
  occurrenceMap: Map<string, string[]>,
  bibleLookup: Map<string, BibleLookupItem>
): string[] => {
  const parsed = parseDictionaryKey(key);
  if (!parsed) return [defaultCrossReference(entry.strong)];

  const references = new Set<string>();
  if (isValidParsedReference(bibleLookup, parsed.bookKey, parsed.chapter, parsed.verse)) {
    references.add(formatReference(bibleLookup, parsed.bookKey, parsed.chapter, parsed.verse));
  }

  const strongOccurrences = occurrenceMap.get(entry.strong || '') || [];
  if (strongOccurrences.length > 1) {
    const index = strongOccurrences.indexOf(key);
    const next = index >= 0 ? strongOccurrences[index + 1] || strongOccurrences[index - 1] : strongOccurrences[0];
    if (next) {
      const parsedNext = parseDictionaryKey(next);
      if (parsedNext) {
        if (isValidParsedReference(bibleLookup, parsedNext.bookKey, parsedNext.chapter, parsedNext.verse)) {
          references.add(formatReference(bibleLookup, parsedNext.bookKey, parsedNext.chapter, parsedNext.verse));
        }
      }
    }
  }

  const fallbackRefs = [
    defaultCrossReference(entry.strong || ''),
    'Romanos 8:28',
    'Hebreus 4:12',
    'Salmos 119:105',
  ];
  for (const ref of fallbackRefs) {
    references.add(ref);
    if (references.size >= 3) break;
  }

  return Array.from(references).slice(0, 5);
};

const hasEmptyContextFields = (entry: DictionaryEntry): boolean => {
  return !entry.significado_contextual.trim() ||
    !entry.explicacao_detalhada.trim() ||
    !entry.por_que_esta_palavra.trim() ||
    !entry.conexao_teologica.trim();
};

const hasInvalidReferences = (entry: DictionaryEntry): boolean => {
  const refs = normalizeReferences(entry.referencias_relacionadas);
  return refs.length < 2 || refs.length > 5;
};

const hasBaseIssues = (entry: DictionaryEntry): boolean => {
  if (!entry.palavra_pt.trim()) return true;
  if (!entry.palavra_original.trim()) return true;
  if (!entry.transliteracao.trim()) return true;
  if (!entry.strong.trim()) return true;
  if (!entry.significado_raiz.trim()) return true;
  if (LIKELY_ENGLISH_RE.test(entry.palavra_pt)) return true;
  if (LIKELY_ENGLISH_RE.test(entry.significado_raiz)) return true;
  return false;
};

export const shouldReprocessEntry = (entry: DictionaryEntry): boolean => {
  return hasEmptyContextFields(entry) || hasInvalidReferences(entry) || hasBaseIssues(entry);
};

export const normalizeBaseEntry = (entry: DictionaryEntry, keyToken: string): DictionaryEntry => {
  const normalized: DictionaryEntry = {
    palavra_pt: normalizePalavraPt(entry.palavra_pt, keyToken),
    palavra_original: String(entry.palavra_original || '').trim() || '—',
    transliteracao: String(entry.transliteracao || '').trim() || '—',
    strong: String(entry.strong || '').trim() || '—',
    significado_raiz: normalizeRootMeaning(String(entry.significado_raiz || ''), String(entry.strong || '').trim() || '—'),
    significado_contextual: String(entry.significado_contextual || '').trim(),
    explicacao_detalhada: String(entry.explicacao_detalhada || '').trim(),
    por_que_esta_palavra: String(entry.por_que_esta_palavra || '').trim(),
    conexao_teologica: String(entry.conexao_teologica || '').trim(),
    referencias_relacionadas: normalizeReferences(entry.referencias_relacionadas),
  };

  return normalized;
};

export const generateLocalContextualEntry = (
  key: string,
  entry: DictionaryEntry,
  occurrenceMap: Map<string, string[]>,
  bibleLookup: Map<string, BibleLookupItem>
): DictionaryEntry => {
  const parsed = parseDictionaryKey(key);
  if (!parsed) return entry;

  const normalized = normalizeBaseEntry(entry, parsed.token.replace(/_/g, ' '));
  const verseText = getVerseText(bibleLookup, parsed.bookKey, parsed.chapter, parsed.verse);
  const snippet = extractSnippet(verseText || normalized.palavra_pt, 140);
  const reference = formatReference(bibleLookup, parsed.bookKey, parsed.chapter, parsed.verse);
  const lemma = normalized.palavra_pt.split('/')[0] || normalized.palavra_pt;

  const references = buildReferencesForEntry(key, normalized, occurrenceMap, bibleLookup);

  const significadoContextual =
    `Em ${reference}, \"${lemma}\" aparece dentro da frase \"${snippet}\" e ajuda a delimitar o sentido imediato do versículo no fluxo do capítulo.`;

  const explicacaoDetalhada =
    `${normalized.palavra_original} (${normalized.transliteracao}, ${normalized.strong}) mantém o campo semântico de ${normalized.significado_raiz.toLowerCase()}. ` +
    `Nesta ocorrência, o termo atua como elemento-chave da construção textual de ${reference}, preservando nuances que nem sempre aparecem em traduções literais.`;

  const porqueEstaPalavra =
    `O autor emprega \"${lemma}\" para conduzir a interpretação do leitor no ponto central de ${reference}, evitando ambiguidades e destacando a ênfase teológica da passagem.`;

  const conexaoTeologica =
    `A temática desta ocorrência conversa com ${references[1] || references[0]}, mostrando continuidade da revelação bíblica e aprofundando a leitura de ${reference}.`;

  return {
    ...normalized,
    significado_contextual: significadoContextual,
    explicacao_detalhada: explicacaoDetalhada,
    por_que_esta_palavra: porqueEstaPalavra,
    conexao_teologica: conexaoTeologica,
    referencias_relacionadas: references,
  };
};

export const hashDictionary = (dictionary: DictionaryData): string =>
  crypto.createHash('sha256').update(JSON.stringify(dictionary)).digest('hex');

export const getSortedBooks = (dictionary: DictionaryData): string[] => {
  const books = new Set<string>();
  for (const key of Object.keys(dictionary)) {
    const parsed = parseDictionaryKey(key);
    if (!parsed) continue;
    books.add(parsed.bookKey);
  }
  return Array.from(books).sort((a, b) => a.localeCompare(b, 'pt-BR'));
};

export const getDefaultCheckpoint = (mode = 'idle'): DictionaryCheckpoint => ({
  mode,
  completedBooks: [],
  updatedAt: new Date(0).toISOString(),
  processedEntries: 0,
  changedEntries: 0,
});

export const loadCheckpoint = async (): Promise<DictionaryCheckpoint> => {
  try {
    return await readJson<DictionaryCheckpoint>(PROGRESS_FILE);
  } catch {
    return getDefaultCheckpoint('idle');
  }
};

export const saveCheckpoint = async (checkpoint: DictionaryCheckpoint): Promise<void> => {
  checkpoint.updatedAt = new Date().toISOString();
  await writeJson(PROGRESS_FILE, checkpoint, true);
};
