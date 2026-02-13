import React from 'react';
import { BibleBook } from '../types';

interface BookSelectorProps {
  books: BibleBook[];
  onBookSelect: (book: BibleBook) => void;
  onBack: () => void;
}

const BookSelector: React.FC<BookSelectorProps> = ({ books, onBookSelect, onBack }) => {
  const oldTestament = books.slice(0, 39);
  const newTestament = books.slice(39);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="text-cream-muted hover:text-cream transition-colors mr-4">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h2 className="text-xs font-semibold text-cream-muted tracking-[0.15em] uppercase">Selecionar Livro</h2>
      </div>
      <div className="mb-8">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-terra mb-3">Velho Testamento</h3>
        <div className="grid grid-cols-3 gap-2">
          {oldTestament.map((book) => (
            <button key={book.abbrev} onClick={() => onBookSelect(book)} className="p-3 bg-grace-surface hover:bg-grace-surface-2 rounded-xl text-left transition-colors border border-grace-border">
              <span className="text-xs font-medium text-cream-dark block truncate">{book.name}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-terra mb-3">Novo Testamento</h3>
        <div className="grid grid-cols-3 gap-2">
          {newTestament.map((book) => (
            <button key={book.abbrev} onClick={() => onBookSelect(book)} className="p-3 bg-grace-surface hover:bg-grace-surface-2 rounded-xl text-left transition-colors border border-grace-border">
              <span className="text-xs font-medium text-cream-dark block truncate">{book.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BookSelector;
