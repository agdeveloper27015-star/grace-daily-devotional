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
  referencias_relacionadas: Array<{
    referencia: string;
    relevancia: string;
  }>;
}

interface DictionaryData {
  [key: string]: DictionaryEntry;
}

// Cache do dicionário carregado
let dictionaryCache: DictionaryData | null = null;
let dictionaryLoadPromise: Promise<DictionaryData> | null = null;
const prefixCache = new Map<string, string[]>();

// Mapeamento de abreviações para nomes de livros no dicionário
const BOOK_ABBREV_TO_DICT: Record<string, string> = {
  'gn': 'genesis',
  'ex': 'exodo',
  'lv': 'levitico',
  'nm': 'numeros',
  'dt': 'deuteronomio',
  'js': 'josue',
  'jz': 'juizes',
  'rt': 'rute',
  '1sm': '1samuel',
  '2sm': '2samuel',
  '1rs': '1reis',
  '2rs': '2reis',
  '1cr': '1cronicas',
  '2cr': '2cronicas',
  'ed': 'esdras',
  'ne': 'neemias',
  'et': 'ester',
  'job': 'jo',
  'sl': 'salmos',
  'pv': 'proverbios',
  'ec': 'eclesiastes',
  'ct': 'cantares',
  'is': 'isaias',
  'jr': 'jeremias',
  'lm': 'lamentacoes',
  'ez': 'ezequiel',
  'dn': 'daniel',
  'os': 'oseias',
  'jl': 'joel',
  'am': 'amos',
  'ob': 'obadias',
  'jn': 'jonas',
  'mq': 'miqueias',
  'na': 'naum',
  'hc': 'habacuque',
  'sf': 'sofonias',
  'ag': 'ageu',
  'zc': 'zacarias',
  'ml': 'malaquias',
  'mt': 'mateus',
  'mc': 'marcos',
  'lc': 'lucas',
  'jo': 'joao',
  'at': 'atos',
  'rm': 'romanos',
  '1co': '1corintios',
  '2co': '2corintios',
  'gl': 'galatas',
  'ef': 'efesios',
  'fp': 'filipenses',
  'cl': 'colossenses',
  '1ts': '1tessalonicenses',
  '2ts': '2tessalonicenses',
  '1tm': '1timoteo',
  '2tm': '2timoteo',
  'tt': 'tito',
  'fm': 'filemom',
  'hb': 'hebreus',
  'tg': 'tiago',
  '1pe': '1pedro',
  '2pe': '2pedro',
  '1jo': '1joao',
  '2jo': '2joao',
  '3jo': '3joao',
  'jd': 'judas',
  'ap': 'apocalipse'
};

/**
 * Carrega o dicionário bíblico do arquivo JSON
 */
export const loadDictionary = async (): Promise<DictionaryData> => {
  if (dictionaryCache) {
    return dictionaryCache;
  }

  if (dictionaryLoadPromise) {
    return dictionaryLoadPromise;
  }

  dictionaryLoadPromise = (async () => {
    try {
      // Tenta carregar do arquivo local na pasta public
      const response = await fetch('/dicionario_completo.json');
      if (!response.ok) {
        throw new Error('Failed to load dictionary: ' + response.status);
      }
      const data = await response.json();
      dictionaryCache = data;
      prefixCache.clear();
      return data;
    } catch (error) {
      console.error('[Dictionary] Erro ao carregar:', error);
      // Retorna objeto vazio se falhar
      return {};
    }
  })();

  return dictionaryLoadPromise;
};

const getCachedVerseEntries = (dictionary: DictionaryData, prefix: string): string[] => {
  if (prefixCache.has(prefix)) {
    return prefixCache.get(prefix)!;
  }

  const entries = Object.keys(dictionary).filter((key) => key.startsWith(prefix));
  prefixCache.set(prefix, entries);
  return entries;
};

/**
 * Converte abreviação do livro para formato do dicionário
 */
const bookAbbrevToDictFormat = (abbrev: string): string => {
  const normalized = abbrev.toLowerCase();
  return BOOK_ABBREV_TO_DICT[normalized] || normalized;
};

/**
 * Gera a chave de busca no formato do dicionário
 */
const generateDictionaryKey = (
  bookAbbrev: string,
  chapter: number,
  verse: number,
  word: string
): string => {
  const bookName = bookAbbrevToDictFormat(bookAbbrev);
  const normalizedWord = word
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  
  return `${bookName}_${chapter}_${verse}_${normalizedWord}`;
};

/**
 * Busca uma entrada específica no dicionário
 */
export const getDictionaryEntry = async (
  bookAbbrev: string,
  chapter: number,
  verse: number,
  word: string
): Promise<DictionaryEntry | null> => {
  const dictionary = await loadDictionary();
  
  // Tenta busca exata primeiro
  const key = generateDictionaryKey(bookAbbrev, chapter, verse, word);
  if (dictionary[key]) {
    return dictionary[key];
  }

  // Tenta variações da palavra (sem acentos, minúscula, etc)
  const variations = [
    word.toLowerCase().trim(),
    word.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim(),
    word.toLowerCase().replace(/s$/, '').trim(), // singular/plural
    word.toLowerCase().replace(/[^a-zà-ÿ]/gi, '').trim()
  ];

  for (const variation of variations) {
    const varKey = generateDictionaryKey(bookAbbrev, chapter, verse, variation);
    if (dictionary[varKey]) {
      return dictionary[varKey];
    }
  }

  // Busca fuzzy: procura por palavras que contenham o termo ou vice-versa
  const bookName = bookAbbrevToDictFormat(bookAbbrev);
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

/**
 * Calcula a distância de Levenshtein entre duas strings
 * (útil para busca aproximada)
 */
const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
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

/**
 * Extrai palavras de um texto de versículo e verifica quais têm entrada no dicionário
 * Retorna array de palavras encontradas com suas posições e entradas
 */
export const findWordsInVerse = async (
  bookAbbrev: string,
  chapter: number,
  verse: number,
  verseText: string
): Promise<Array<{ word: string; entry: DictionaryEntry; index: number }>> => {
  const dictionary = await loadDictionary();
  const found: Array<{ word: string; entry: DictionaryEntry; index: number }> = [];
  
  // Primeiro, busca todas as entradas do dicionário para este versículo específico
  const bookName = bookAbbrevToDictFormat(bookAbbrev);
  const prefix = `${bookName}_${chapter}_${verse}_`;
  
  const verseEntries = getCachedVerseEntries(dictionary, prefix);
  
  if (verseEntries.length === 0) {
    return [];
  }

  // Para cada entrada no dicionário para este versículo, verifica se a palavra existe no texto
  for (const dictKey of verseEntries) {
    const entry = dictionary[dictKey];
    const searchWord = entry.palavra_pt.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    // Procura a palavra no texto do versículo
    const verseNormalized = verseText.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    // Usa regex para encontrar palavras completas
    const regex = new RegExp(`\\b${escapeRegExp(searchWord)}(s|es|ns|m|ns)?\\b`, 'gi');
    const match = regex.exec(verseNormalized);
    
    if (match) {
      // Encontra a palavra original no texto (com acentos e capitalização)
      const startIndex = match.index;
      const endIndex = startIndex + match[0].length;
      const originalWord = verseText.slice(startIndex, endIndex);
      
      // Evita duplicatas
      if (!found.some(f => f.entry.strong === entry.strong)) {
        found.push({
          word: originalWord,
          entry,
          index: startIndex
        });
      }
    }
  }

  // Ordena por posição no texto
  return found.sort((a, b) => a.index - b.index);
};

/**
 * Escapa caracteres especiais para regex
 */
const escapeRegExp = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Verifica se uma palavra específica tem entrada no dicionário
 */
export const hasDictionaryEntry = async (
  bookAbbrev: string,
  chapter: number,
  verse: number,
  word: string
): Promise<boolean> => {
  const entry = await getDictionaryEntry(bookAbbrev, chapter, verse, word);
  return entry !== null;
};

/**
 * Obtém todas as palavras disponíveis no dicionário para um versículo específico
 * (útil para debugging e pré-carregamento)
 */
export const getAvailableWordsForVerse = async (
  bookAbbrev: string,
  chapter: number,
  verse: number
): Promise<string[]> => {
  const dictionary = await loadDictionary();
  const bookName = bookAbbrevToDictFormat(bookAbbrev);
  const prefix = `${bookName}_${chapter}_${verse}_`;
  
  return Object.keys(dictionary)
    .filter(key => key.startsWith(prefix))
    .map(key => {
      const wordPart = key.replace(prefix, '');
      return wordPart.replace(/_/g, ' ');
    });
};
