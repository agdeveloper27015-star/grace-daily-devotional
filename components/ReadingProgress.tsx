import React from 'react';
import { BibleBook } from '../types';
import { getReadingProgress } from '../services/bibleService';

interface ReadingProgressProps {
  books: BibleBook[];
  onBookSelect: (book: BibleBook) => void;
  onChapterSelect: (chapterNumber: number) => void;
  onShowBooks: () => void;
}

const ReadingProgress: React.FC<ReadingProgressProps> = ({ books, onBookSelect, onChapterSelect, onShowBooks }) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <h2 className="text-xs font-semibold text-cream-muted tracking-[0.15em] uppercase mb-6">
        Planos de Leitura
      </h2>
      <div className="space-y-6">
        <div className="p-6 bg-grace-surface rounded-3xl border border-grace-border">
          <h3 className="font-serif text-2xl text-cream mb-2">Novo Testamento</h3>
          <p className="text-xs text-cream-muted uppercase tracking-widest mb-4">Leia a vida de Jesus e dos apóstolos</p>
          <button
            onClick={() => { const mateus = books.find(b => b.abbrev === 'mt'); if (mateus) onBookSelect(mateus); }}
            className="bg-terra text-cream px-6 py-2 rounded-full text-xs font-semibold uppercase tracking-widest hover:bg-terra-light transition-colors"
          >
            Começar
          </button>
        </div>

        <div className="p-6 bg-grace-surface rounded-3xl border border-grace-border">
          <h3 className="font-serif text-2xl text-cream mb-2">Velho Testamento</h3>
          <p className="text-xs text-cream-muted uppercase tracking-widest mb-4">Desde a criação até os profetas</p>
          <button
            onClick={() => { const genesis = books.find(b => b.abbrev === 'gn'); if (genesis) onBookSelect(genesis); }}
            className="bg-terra text-cream px-6 py-2 rounded-full text-xs font-semibold uppercase tracking-widest hover:bg-terra-light transition-colors"
          >
            Começar
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div
            onClick={onShowBooks}
            className="p-5 border border-grace-border rounded-2xl hover:bg-grace-surface-2 transition-colors cursor-pointer group bg-grace-surface"
          >
            <p className="text-[10px] font-bold uppercase text-terra mb-1">Bíblia</p>
            <h4 className="font-serif text-lg text-cream">Todos os Livros</h4>
            <p className="text-xs text-cream-muted mt-1">{books.length} livros</p>
          </div>
          <div
            onClick={() => {
              const progress = getReadingProgress();
              if (progress && books.length > 0) {
                const book = books.find(b => b.abbrev === progress.bookAbbrev);
                if (book) onChapterSelect(progress.chapter);
              } else {
                onShowBooks();
              }
            }}
            className="p-5 border border-grace-border rounded-2xl hover:bg-grace-surface-2 transition-colors cursor-pointer group bg-grace-surface"
          >
            <p className="text-[10px] font-bold uppercase text-terra mb-1">Continuar</p>
            <h4 className="font-serif text-lg text-cream">Onde Parei</h4>
            <p className="text-xs text-cream-muted mt-1">Retomar leitura</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReadingProgress;
