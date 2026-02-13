import React from 'react';
import { BibleVerse, HighlightColor } from '../types';

const HIGHLIGHT_COLORS: { color: HighlightColor; hex: string; label: string }[] = [
  { color: 'yellow', hex: '#FACC15', label: 'Amarelo' },
  { color: 'green', hex: '#4ADE80', label: 'Verde' },
  { color: 'blue', hex: '#60A5FA', label: 'Azul' },
  { color: 'pink', hex: '#FB7185', label: 'Rosa' },
  { color: 'orange', hex: '#E8945A', label: 'Laranja' },
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
    <div className="animate-in fade-in my-2" onClick={(event) => event.stopPropagation()}>
      <div className="state-card inline-flex flex-wrap items-center gap-2 rounded-2xl px-3 py-2">
        <span className="section-kicker text-[10px]">
          {bookName} {chapterNumber}:{verse.number}
        </span>

        <button
          onClick={(event) => {
            event.stopPropagation();
            onToggleFavorite(verse);
          }}
          className={`icon-button inline-flex h-8 w-8 items-center justify-center ${
            isFavorited ? 'text-[var(--danger)] border-[rgba(155,34,38,0.35)]' : ''
          }`}
          title={isFavorited ? 'Remover favorito' : 'Adicionar favorito'}
          aria-label={isFavorited ? 'Remover favorito' : 'Adicionar favorito'}
        >
          <svg className="h-4 w-4" fill={isFavorited ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        <button
          onClick={(event) => {
            event.stopPropagation();
            onOpenNote(verse);
          }}
          className={`icon-button inline-flex h-8 w-8 items-center justify-center ${
            hasNote ? 'text-[var(--warning)] border-[rgba(156,107,0,0.35)]' : ''
          }`}
          title={hasNote ? 'Editar nota' : 'Criar nota'}
          aria-label={hasNote ? 'Editar nota' : 'Criar nota'}
        >
          <svg className="h-4 w-4" fill={hasNote ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>

        <span className="mx-1 h-5 w-px bg-grace-border" />

        {HIGHLIGHT_COLORS.map(({ color, hex, label }) => (
          <button
            key={color}
            onClick={(event) => {
              event.stopPropagation();
              onHighlight(verse.number, color);
            }}
            className={`inline-flex h-7 w-7 items-center justify-center rounded-full transition hover:scale-105 ${
              highlightColor === color ? 'ring-2 ring-terra ring-offset-2 ring-offset-white' : ''
            }`}
            style={{ backgroundColor: hex }}
            title={label}
            aria-label={`Destacar em ${label}`}
          />
        ))}

        {highlightColor && (
          <button
            onClick={(event) => {
              event.stopPropagation();
              onRemoveHighlight(verse.number);
            }}
            className="icon-button inline-flex h-8 w-8 items-center justify-center text-[var(--danger)]"
            title="Limpar destaque"
            aria-label="Limpar destaque"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default VerseActionBar;
