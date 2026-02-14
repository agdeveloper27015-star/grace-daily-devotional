import React from 'react';
import { BibleChapter, BibleVerse, HighlightColor } from '../types';
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
  onShare: (verse: BibleVerse) => void;
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
  onShare,
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
        {tokens.map((token, index) => {
          const isWord = /^[\wÀ-ÿ]+$/.test(token);
          const isStopWord = PORTUGUESE_STOP_WORDS.has(token.toLowerCase());
          if (!isWord || isStopWord || token.length <= 1) {
            return <span key={index}>{token}</span>;
          }

          const localEntry = dictMap.get(token.toLowerCase());
          const hasEntry = Boolean(localEntry);

          return (
            <button
              key={index}
              onClick={(event) => {
                event.stopPropagation();
                onWordClick(token, verse.number, localEntry || undefined);
              }}
              className={`inline rounded-[4px] px-[1px] transition ${
                hasEntry
                  ? 'text-terra underline decoration-terra/35 underline-offset-2 hover:decoration-terra'
                  : 'text-cream-dark hover:text-cream hover:underline hover:decoration-cream-muted/40'
              }`}
            >
              {token}
            </button>
          );
        })}
      </>
    );
  };

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
    <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-5">
      <header className="paper-panel p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={onGoToChapters} className="icon-button inline-flex h-9 w-9 items-center justify-center" aria-label="Voltar">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="min-w-0 flex-1">
            <p className="section-kicker">Leitura ativa</p>
            <h2 className="editorial-title truncate text-4xl leading-none sm:text-5xl">{chapter.bookName}</h2>
            <p className="mt-1 text-sm text-cream-muted">Capítulo {chapter.chapterNumber}</p>
          </div>

          <button onClick={onEnterFocusMode} className="pill-button px-4 py-2 text-xs font-semibold uppercase tracking-wider">
            Foco
          </button>
          <button
            onClick={onToggleStudyMode}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider ${
              studyMode ? 'pill-button-accent' : 'pill-button'
            }`}
          >
            {studyMode ? 'Modo Estudo' : 'Modo Leitura'}
          </button>
        </div>

        {studyMode && loadingDictionary && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-grace-border bg-grace-surface-2 px-3 py-1.5 text-xs text-cream-muted">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-terra border-t-transparent" />
            Carregando dicionário local...
          </div>
        )}
      </header>

      <article className="paper-panel p-5 sm:p-7" onClick={() => onSelectVerse(null)}>
        {paragraphs.map((paragraph, paragraphIndex) => {
          const paragraphHasSelected = selectedVerse !== null && paragraph.some((verse) => verse.number === selectedVerse);
          const selectedVerseObj = paragraphHasSelected ? paragraph.find((verse) => verse.number === selectedVerse) : null;

          return (
            <React.Fragment key={paragraphIndex}>
              <p className="reading-body mb-2 text-[1.16rem] text-cream-dark">
                {paragraph.map((verse) => (
                  <span
                    key={verse.number}
                    id={`verse-${verse.number}`}
                    className={`inline cursor-pointer rounded-[4px] px-[2px] transition ${getHighlightClass(verseHighlights, verse.number)} ${
                      highlightedVerse === verse.number
                        ? 'bg-[rgba(47,59,82,0.14)]'
                        : selectedVerse === verse.number
                        ? 'bg-[rgba(47,59,82,0.09)]'
                        : ''
                    }`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelectVerse(selectedVerse === verse.number ? null : verse.number);
                    }}
                  >
                    <sup className="verse-chip mr-[2px] ml-[2px] select-none">{verse.number}</sup>
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
                  onShare={onShare}
                  onHighlight={onHighlight}
                  onRemoveHighlight={onRemoveHighlight}
                />
              )}

              {!paragraphHasSelected && <div className="mb-4" />}
            </React.Fragment>
          );
        })}
      </article>

      <footer className="paper-panel flex items-center justify-between gap-3 p-4 sm:p-5">
        <button onClick={onPreviousChapter} className="pill-button px-4 py-2 text-xs font-semibold uppercase tracking-wider">
          Anterior
        </button>
        <span className="meta-label">{chapter.bookName} {chapter.chapterNumber}</span>
        <button onClick={onNextChapter} className="pill-button px-4 py-2 text-xs font-semibold uppercase tracking-wider">
          Próximo
        </button>
      </footer>
    </section>
  );
};

export default VerseDisplay;
