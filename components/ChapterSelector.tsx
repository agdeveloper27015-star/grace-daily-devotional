import React from 'react';
import { BibleBook } from '../types';

interface ChapterSelectorProps {
  book: BibleBook;
  onChapterSelect: (chapterNumber: number) => void;
  onBack: () => void;
}

const ChapterSelector: React.FC<ChapterSelectorProps> = ({ book, onChapterSelect, onBack }) => {
  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-5">
      <div className="paper-panel p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="icon-button inline-flex h-9 w-9 items-center justify-center" aria-label="Voltar">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <p className="section-kicker">Livro selecionado</p>
            <h2 className="editorial-title text-4xl leading-none sm:text-5xl">{book.name}</h2>
          </div>
        </div>
      </div>

      <div className="paper-panel p-5 sm:p-6">
        <p className="section-kicker mb-3">Capítulos</p>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
          {book.chapters.map((_, index) => (
            <button
              key={index}
              onClick={() => onChapterSelect(index + 1)}
              className="state-card aspect-square rounded-xl text-base font-semibold text-cream transition hover:bg-grace-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-terra"
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ChapterSelector;
