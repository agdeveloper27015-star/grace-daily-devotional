import { VerseHighlight, HighlightColor } from '../types';

const HIGHLIGHTS_KEY = 'grace_highlights';

export const getHighlights = (): VerseHighlight[] => {
  const stored = localStorage.getItem(HIGHLIGHTS_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveHighlights = (highlights: VerseHighlight[]): void => {
  localStorage.setItem(HIGHLIGHTS_KEY, JSON.stringify(highlights));
};

export const addHighlight = (
  bookAbbrev: string,
  chapter: number,
  verse: number,
  color: HighlightColor
): VerseHighlight => {
  const highlights = getHighlights();

  // Remove existing highlight for this verse if any
  const filtered = highlights.filter(
    h => !(h.bookAbbrev === bookAbbrev && h.chapter === chapter && h.verse === verse)
  );

  const newHighlight: VerseHighlight = {
    id: `${bookAbbrev}_${chapter}_${verse}_${Date.now()}`,
    bookAbbrev,
    chapter,
    verse,
    color,
    timestamp: Date.now()
  };

  filtered.push(newHighlight);
  saveHighlights(filtered);
  return newHighlight;
};

export const removeHighlight = (bookAbbrev: string, chapter: number, verse: number): void => {
  const highlights = getHighlights();
  const filtered = highlights.filter(
    h => !(h.bookAbbrev === bookAbbrev && h.chapter === chapter && h.verse === verse)
  );
  saveHighlights(filtered);
};

export const getHighlightByReference = (
  bookAbbrev: string,
  chapter: number,
  verse: number
): VerseHighlight | null => {
  const highlights = getHighlights();
  return highlights.find(
    h => h.bookAbbrev === bookAbbrev && h.chapter === chapter && h.verse === verse
  ) || null;
};

export const hasHighlight = (bookAbbrev: string, chapter: number, verse: number): boolean => {
  const highlights = getHighlights();
  return highlights.some(
    h => h.bookAbbrev === bookAbbrev && h.chapter === chapter && h.verse === verse
  );
};

export const getHighlightsByChapter = (
  bookAbbrev: string,
  chapter: number
): VerseHighlight[] => {
  const highlights = getHighlights();
  return highlights.filter(h => h.bookAbbrev === bookAbbrev && h.chapter === chapter);
};
