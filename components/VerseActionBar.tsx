import React from 'react';
import { BibleVerse, HighlightColor } from '../types';

const HIGHLIGHT_COLORS: { color: HighlightColor; hex: string }[] = [
  { color: 'yellow', hex: '#FACC15' },
  { color: 'green', hex: '#4ADE80' },
  { color: 'blue', hex: '#60A5FA' },
  { color: 'pink', hex: '#FB7185' },
  { color: 'orange', hex: '#E8945A' },
];

interface VerseActionBarProps {
  verse: BibleVerse;
  bookName: string;
  chapterNumber: number;
  isFavorited: boolean;
  hasNote: boolean;
  highlightColor?: HighlightColor;
  onToggleFavorite: (verse: BibleVerse) => void;
  onOpenNote: (verse: BibleVerse) => void;
  onHighlight: (verseNumber: number, color: HighlightColor) => void;
  onRemoveHighlight: (verseNumber: number) => void;
}

const VerseActionBar: React.FC<VerseActionBarProps> = ({
  verse,
  bookName,
  chapterNumber,
  isFavorited,
  hasNote,
  highlightColor,
  onToggleFavorite,
  onOpenNote,
  onHighlight,
  onRemoveHighlight,
}) => {
  return (
    <div className="my-2 animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
      <div className="bg-grace-surface-2 border border-grace-border rounded-2xl shadow-2xl px-3 py-2 inline-flex items-center gap-1.5">
        <span className="text-[10px] text-terra font-semibold tracking-wide mr-1">
          {bookName} {chapterNumber}:{verse.number}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(verse); }}
          className={`p-1.5 rounded-lg transition-all ${
            isFavorited ? 'text-red-400 bg-red-400/10' : 'text-cream-muted hover:text-red-400 hover:bg-red-400/10'
          }`}
        >
          <svg className="w-4 h-4" fill={isFavorited ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onOpenNote(verse); }}
          className={`p-1.5 rounded-lg transition-all ${
            hasNote ? 'text-amber-500 bg-amber-500/10' : 'text-cream-muted hover:text-amber-500 hover:bg-amber-500/10'
          }`}
        >
          <svg className="w-4 h-4" fill={hasNote ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <div className="w-px h-4 bg-grace-border mx-0.5"></div>
        {HIGHLIGHT_COLORS.map(({ color, hex }) => (
          <button
            key={color}
            onClick={(e) => { e.stopPropagation(); onHighlight(verse.number, color); }}
            className={`w-5 h-5 rounded-full transition-transform hover:scale-110 ${highlightColor === color ? 'ring-2 ring-cream ring-offset-1 ring-offset-grace-surface-2' : ''}`}
            style={{ backgroundColor: hex }}
          />
        ))}
        {highlightColor && (
          <button
            onClick={(e) => { e.stopPropagation(); onRemoveHighlight(verse.number); }}
            className="w-5 h-5 rounded-full bg-grace-surface-3 flex items-center justify-center text-cream-muted hover:text-red-400 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default VerseActionBar;
