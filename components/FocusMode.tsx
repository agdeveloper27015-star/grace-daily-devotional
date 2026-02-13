import React, { useState, useEffect, useRef } from 'react';
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

const FocusMode: React.FC<FocusModeProps> = ({
  chapter,
  verseHighlights,
  onClose,
  onPreviousChapter,
  onNextChapter,
}) => {
  const [fontSize, setFontSize] = useState(1.25);
  const [showControls, setShowControls] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setShowControls(true);
    timerRef.current = setTimeout(() => setShowControls(false), 3000);
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
      className="fixed inset-0 z-[100] bg-grace-bg overflow-y-auto"
      onClick={resetTimer}
      onScroll={resetTimer}
    >
      {/* Controls */}
      <div className={`fixed top-0 left-0 right-0 z-10 bg-grace-bg/90 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-grace-border transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <button onClick={onClose} className="p-2 text-cream-muted hover:text-cream transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <span className="text-xs text-cream-muted uppercase tracking-widest">{chapter.bookName} {chapter.chapterNumber}</span>
        <div className="flex gap-2">
          <button onClick={() => setFontSize(s => Math.max(0.9, s - 0.1))} className="p-2 text-cream-muted hover:text-cream text-xs font-bold">A-</button>
          <button onClick={() => setFontSize(s => Math.min(2, s + 0.1))} className="p-2 text-cream-muted hover:text-cream text-sm font-bold">A+</button>
        </div>
      </div>

      {/* Reading content */}
      <div className="max-w-2xl mx-auto px-8 sm:px-12 pt-20 pb-24">
        <h2 className="font-serif text-2xl text-cream mb-8 text-center">
          {chapter.bookName} {chapter.chapterNumber}
        </h2>
        <div className="space-y-6">
          {chapter.verses.map(verse => (
            <div key={verse.number} className={`flex gap-4 ${getHighlightClass(verseHighlights, verse.number)} rounded-lg px-2 py-1`}>
              <span className="text-[9px] font-bold text-grace-muted mt-2 min-w-[20px] text-right select-none">{verse.number}</span>
              <p className="flex-1" style={{ fontFamily: "'Merriweather', serif", fontSize: `${fontSize}rem`, lineHeight: 2, color: '#EDE0D4', letterSpacing: '0.01em' }}>
                {verse.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom nav */}
      <div className={`fixed bottom-0 left-0 right-0 bg-grace-bg/90 backdrop-blur-md px-6 py-4 flex justify-between border-t border-grace-border transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <button onClick={onPreviousChapter} className="text-xs text-cream-muted hover:text-terra transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Anterior
        </button>
        <button onClick={onNextChapter} className="text-xs text-cream-muted hover:text-terra transition-colors flex items-center gap-2">
          Próximo
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
    </div>,
    document.body
  );
};

export default FocusMode;
