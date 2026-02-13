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
    <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-5">
      <div className="paper-panel p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="icon-button inline-flex h-9 w-9 items-center justify-center" aria-label="Voltar">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <p className="section-kicker">Biblioteca bíblica</p>
            <h2 className="editorial-title text-4xl leading-none sm:text-5xl">Selecionar livro</h2>
          </div>
        </div>
      </div>

      <div className="paper-panel p-5 sm:p-6">
        <p className="section-kicker mb-3">Velho Testamento</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {oldTestament.map((book) => (
            <button
              key={book.abbrev}
              onClick={() => onBookSelect(book)}
              className="state-card rounded-xl px-3 py-2 text-left text-sm font-semibold text-cream transition hover:bg-grace-surface-2"
            >
              {book.name}
            </button>
          ))}
        </div>
      </div>

      <div className="paper-panel p-5 sm:p-6">
        <p className="section-kicker mb-3">Novo Testamento</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {newTestament.map((book) => (
            <button
              key={book.abbrev}
              onClick={() => onBookSelect(book)}
              className="state-card rounded-xl px-3 py-2 text-left text-sm font-semibold text-cream transition hover:bg-grace-surface-2"
            >
              {book.name}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BookSelector;
