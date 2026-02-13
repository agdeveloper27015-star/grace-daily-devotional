import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { BibleChapter, HighlightColor } from '../types';

interface FocusModeProps {
  chapter: BibleChapter;
  verseHighlights: Map<number, HighlightColor>;
  onClose: () => void;
  onPreviousChapter: () => void;
  onNextChapter: () => void;
}

const getHighlightClass = (verseHighlights: Map<number, HighlightColor>, verseNumber: number): string => {
  const color = verseHighlights.get(verseNumber);
  if (!color) return '';
  return `verse-hl-${color}`;
};

const FocusMode: React.FC<FocusModeProps> = ({ chapter, verseHighlights, onClose, onPreviousChapter, onNextChapter }) => {
  const [fontSize, setFontSize] = useState(1.2);
  const [showControls, setShowControls] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setShowControls(true);
    timerRef.current = setTimeout(() => setShowControls(false), 2600);
  };

  useEffect(() => {
    resetTimer();
    document.body.style.overflow = 'hidden';
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      document.body.style.overflow = '';
    };
  }, []);

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[110] overflow-y-auto bg-[rgba(246,246,244,0.98)]"
      onClick={resetTimer}
      onScroll={resetTimer}
    >
      <header
        className={`fixed left-0 right-0 top-0 z-10 border-b border-grace-border bg-[rgba(255,255,255,0.92)] px-4 py-3 backdrop-blur-sm transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3">
          <button onClick={onClose} className="icon-button inline-flex h-9 w-9 items-center justify-center" aria-label="Fechar">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <p className="meta-label">{chapter.bookName} {chapter.chapterNumber}</p>

          <div className="inline-flex items-center gap-2">
            <button onClick={() => setFontSize((size) => Math.max(0.95, size - 0.1))} className="pill-button px-3 py-1.5 text-xs font-semibold">
              A-
            </button>
            <button onClick={() => setFontSize((size) => Math.min(2, size + 0.1))} className="pill-button px-3 py-1.5 text-xs font-semibold">
              A+
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-6 pb-28 pt-24">
        <h2 className="editorial-title mb-8 text-center text-5xl">{chapter.bookName} {chapter.chapterNumber}</h2>

        <div className="space-y-5">
          {chapter.verses.map((verse) => (
            <div key={verse.number} className={`rounded-xl px-3 py-2 ${getHighlightClass(verseHighlights, verse.number)}`}>
              <span className="meta-label mr-3 align-top">{verse.number}</span>
              <p
                className="reading-body inline text-cream-dark"
                style={{ fontSize: `${fontSize}rem` }}
              >
                {verse.text}
              </p>
            </div>
          ))}
        </div>
      </main>

      <footer
        className={`fixed bottom-0 left-0 right-0 border-t border-grace-border bg-[rgba(255,255,255,0.92)] px-4 py-3 backdrop-blur-sm transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3">
          <button onClick={onPreviousChapter} className="pill-button px-4 py-2 text-xs font-semibold uppercase tracking-wider">
            Anterior
          </button>
          <button onClick={onNextChapter} className="pill-button px-4 py-2 text-xs font-semibold uppercase tracking-wider">
            Próximo
          </button>
        </div>
      </footer>
    </div>,
    document.body
  );
};

export default FocusMode;
