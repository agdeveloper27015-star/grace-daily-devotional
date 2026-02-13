import React from 'react';
import { BibleBook } from '../types';

interface ChapterSelectorProps {
  book: BibleBook;
  onChapterSelect: (chapterNumber: number) => void;
  onBack: () => void;
}

const ChapterSelector: React.FC<ChapterSelectorProps> = ({ book, onChapterSelect, onBack }) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="text-cream-muted hover:text-cream transition-colors mr-4">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h2 className="text-xs font-semibold text-cream-muted tracking-[0.15em] uppercase">{book.name}</h2>
      </div>
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-terra mb-3">Selecionar Capítulo</h3>
      <div className="grid grid-cols-5 gap-2">
        {book.chapters.map((_, index) => (
          <button key={index} onClick={() => onChapterSelect(index + 1)} className="aspect-square bg-grace-surface hover:bg-grace-surface-2 rounded-xl flex items-center justify-center transition-colors border border-grace-border">
            <span className="text-sm font-medium text-cream-dark">{index + 1}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ChapterSelector;
