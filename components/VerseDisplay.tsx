import React from 'react';
import { BibleVerse, BibleChapter, HighlightColor } from '../types';
import { DictionaryEntry } from '../services/dictionaryService';
import { PORTUGUESE_STOP_WORDS } from '../services/stopWords';
import VerseActionBar from './VerseActionBar';

interface VerseDictionaryWords {
  words: Array<{ word: string; entry: DictionaryEntry; index: number }>;
  loaded: boolean;
}

interface VerseDisplayProps {
  chapter: BibleChapter;
  studyMode: boolean;
  loadingDictionary: boolean;
  dictionaryWords: Map<number, VerseDictionaryWords>;
  favoritedVerses: Set<string>;
  versesWithNotes: Set<string>;
  verseHighlights: Map<number, HighlightColor>;
  highlightedVerse: number | null;
  selectedVerse: number | null;
  onSelectVerse: (verseNumber: number | null) => void;
  onToggleFavorite: (verse: BibleVerse) => void;
  onOpenNote: (verse: BibleVerse) => void;
  onHighlight: (verseNumber: number, color: HighlightColor) => void;
  onRemoveHighlight: (verseNumber: number) => void;
  onWordClick: (word: string, verseNumber: number, localEntry?: DictionaryEntry) => void;
  onPreviousChapter: () => void;
  onNextChapter: () => void;
  onGoToChapters: () => void;
  onEnterFocusMode: () => void;
  onToggleStudyMode: () => void;
}

const getHighlightClass = (verseHighlights: Map<number, HighlightColor>, verseNumber: number): string => {
  const color = verseHighlights.get(verseNumber);
  if (!color) return '';
  return `verse-hl-${color}`;
};

const VerseDisplay: React.FC<VerseDisplayProps> = ({
  chapter,
  studyMode,
  loadingDictionary,
  dictionaryWords,
  favoritedVerses,
  versesWithNotes,
  verseHighlights,
  highlightedVerse,
  selectedVerse,
  onSelectVerse,
  onToggleFavorite,
  onOpenNote,
  onHighlight,
  onRemoveHighlight,
  onWordClick,
  onPreviousChapter,
  onNextChapter,
  onGoToChapters,
  onEnterFocusMode,
  onToggleStudyMode,
}) => {
  const renderVerseText = (verse: BibleVerse) => {
    const text = verse.text;
    const tokens = text.match(/[\wÀ-ÿ]+|[^\wÀ-ÿ]+/g) || [text];

    const verseData = dictionaryWords.get(verse.number);
    const dictMap = new Map<string, DictionaryEntry>();
    if (verseData?.words) {
      for (const { word, entry } of verseData.words) {
        dictMap.set(word.toLowerCase(), entry);
      }
    }

    return (
      <>
        {tokens.map((token, i) => {
          const isWord = /^[\wÀ-ÿ]+$/.test(token);
          const isStopWord = PORTUGUESE_STOP_WORDS.has(token.toLowerCase());

          if (!isWord || isStopWord || token.length <= 1) {
            return <span key={i}>{token}</span>;
          }

          const localEntry = dictMap.get(token.toLowerCase());
          const hasEntry = !!localEntry;

          return (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); onWordClick(token, verse.number, localEntry || undefined); }}
              className={`inline underline-offset-2 transition-all cursor-pointer font-reading ${
                hasEntry
                  ? 'text-cream underline decoration-cream-muted/30 hover:decoration-cream-muted'
                  : 'text-cream-dark hover:text-cream hover:underline hover:decoration-cream-muted/30'
              }`}
            >
              {token}
            </button>
          );
        })}
      </>
    );
  };

  // Group verses into paragraphs
  const paragraphs: BibleVerse[][] = [];
  let currentParagraph: BibleVerse[] = [];
  for (const verse of chapter.verses) {
    currentParagraph.push(verse);
    const trimmed = verse.text.trim();
    const lastChar = trimmed[trimmed.length - 1];
    if (lastChar === '.' || lastChar === '!' || lastChar === '?') {
      paragraphs.push([...currentParagraph]);
      currentParagraph = [];
    }
  }
  if (currentParagraph.length > 0) paragraphs.push(currentParagraph);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center mb-6">
        <button onClick={onGoToChapters} className="text-cream-muted hover:text-cream transition-colors mr-4">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="flex-1">
          <h2 className="text-xs font-semibold text-cream-muted tracking-[0.15em] uppercase">{chapter.bookName}</h2>
          <p className="text-lg font-serif text-cream">Capítulo {chapter.chapterNumber}</p>
        </div>

        <button
          onClick={onEnterFocusMode}
          className="p-2 mr-2 rounded-full text-cream-muted hover:text-terra hover:bg-terra/10 transition-all"
          title="Modo Foco"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
          </svg>
        </button>

        <button
          onClick={onToggleStudyMode}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium uppercase tracking-wider transition-all ${
            studyMode ? 'bg-terra text-cream shadow-md' : 'bg-grace-surface text-cream-muted hover:bg-grace-surface-2'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          {studyMode ? 'Estudo' : 'Ler'}
        </button>
      </div>

      {studyMode && loadingDictionary && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-terra/10 rounded-xl">
          <div className="w-4 h-4 border-2 border-terra border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-terra">Carregando dicionário...</p>
        </div>
      )}

      <div className="mb-8" onClick={() => { onSelectVerse(null); }}>
        {paragraphs.map((paragraph, pi) => {
          const paragraphHasSelected = selectedVerse !== null && paragraph.some(v => v.number === selectedVerse);
          const selectedVerseObj = paragraphHasSelected ? paragraph.find(v => v.number === selectedVerse) : null;

          return (
            <React.Fragment key={pi}>
              <p className="mb-1 text-[18px] leading-[1.8] text-cream-dark font-reading font-light">
                {paragraph.map((verse) => (
                  <span
                    key={verse.number}
                    id={`verse-${verse.number}`}
                    className={`inline verse-span rounded-sm transition-colors cursor-pointer ${getHighlightClass(verseHighlights, verse.number)} ${
                      highlightedVerse === verse.number
                        ? 'bg-terra/20'
                        : selectedVerse === verse.number
                        ? 'bg-cream/10'
                        : ''
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectVerse(selectedVerse === verse.number ? null : verse.number);
                    }}
                  >
                    <sup className="text-[11px] font-semibold text-terra/70 mr-[2px] ml-[2px] select-none">{verse.number}</sup>
                    {studyMode ? renderVerseText(verse) : <span>{verse.text}</span>}
                    {' '}
                  </span>
                ))}
              </p>
              {paragraphHasSelected && selectedVerseObj && (
                <VerseActionBar
                  verse={selectedVerseObj}
                  bookName={chapter.bookName}
                  chapterNumber={chapter.chapterNumber}
                  isFavorited={favoritedVerses.has(`${selectedVerseObj.number}`)}
                  hasNote={versesWithNotes.has(`${selectedVerseObj.number}`)}
                  highlightColor={verseHighlights.get(selectedVerseObj.number)}
                  onToggleFavorite={onToggleFavorite}
                  onOpenNote={onOpenNote}
                  onHighlight={onHighlight}
                  onRemoveHighlight={onRemoveHighlight}
                />
              )}
              {!paragraphHasSelected && <div className="mb-4"></div>}
            </React.Fragment>
          );
        })}
      </div>

      <div className="flex justify-between items-center pt-6 border-t border-grace-border">
        <button onClick={onPreviousChapter} className="flex items-center gap-2 text-xs font-medium text-cream-muted hover:text-terra transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Anterior
        </button>
        <span className="text-[10px] text-cream-muted uppercase tracking-widest">{chapter.bookName} {chapter.chapterNumber}</span>
        <button onClick={onNextChapter} className="flex items-center gap-2 text-xs font-medium text-cream-muted hover:text-terra transition-colors">
          Próximo
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
    </div>
  );
};

export default VerseDisplay;
