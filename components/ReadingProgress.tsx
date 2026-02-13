import React from 'react';
import { BibleBook } from '../types';
import { getReadingProgress } from '../services/bibleService';

interface ReadingProgressProps {
  books: BibleBook[];
  onBookSelect: (book: BibleBook) => void;
  onShowBooks: () => void;
  onResumeProgress: (book: BibleBook, chapter: number) => void;
}

const ReadingProgress: React.FC<ReadingProgressProps> = ({ books, onBookSelect, onShowBooks, onResumeProgress }) => {
  const progress = getReadingProgress();

  const plans = [
    {
      id: 'novo-testamento',
      title: 'Novo Testamento',
      subtitle: 'Evangelhos, cartas e revelação apostólica.',
      abbrev: 'mt',
    },
    {
      id: 'velho-testamento',
      title: 'Velho Testamento',
      subtitle: 'Lei, história, poesia e profetas.',
      abbrev: 'gn',
    },
  ];

  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-5">
      <div className="paper-panel p-5 sm:p-6">
        <p className="section-kicker">Jornada bíblica</p>
        <h2 className="editorial-title mt-1 text-4xl leading-none sm:text-5xl">Entrada de leitura</h2>
        <p className="mt-2 text-sm text-cream-muted">
          Escolha uma trilha inicial, abra todos os livros ou retome exatamente o capítulo em que você parou.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {plans.map((plan) => (
          <article key={plan.id} className="paper-panel p-5">
            <p className="section-kicker">Plano sugerido</p>
            <h3 className="editorial-title mt-1 text-3xl">{plan.title}</h3>
            <p className="mt-2 text-sm text-cream-muted">{plan.subtitle}</p>
            <button
              onClick={() => {
                const book = books.find((item) => item.abbrev === plan.abbrev);
                if (book) onBookSelect(book);
              }}
              className="pill-button-accent mt-4 px-4 py-2 text-xs font-semibold uppercase tracking-wider"
            >
              Começar trilha
            </button>
          </article>
        ))}
      </div>

      <div className="paper-panel p-5 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            onClick={onShowBooks}
            className="state-card p-4 text-left transition hover:bg-grace-surface-2"
          >
            <p className="section-kicker">Biblioteca completa</p>
            <h4 className="editorial-title text-2xl">Todos os livros</h4>
            <p className="mt-1 text-sm text-cream-muted">{books.length} livros disponíveis</p>
          </button>

          <button
            onClick={() => {
              if (!progress) {
                onShowBooks();
                return;
              }
              const book = books.find((item) => item.abbrev === progress.bookAbbrev);
              if (book) onResumeProgress(book, progress.chapter);
            }}
            className="state-card p-4 text-left transition hover:bg-grace-surface-2"
          >
            <p className="section-kicker">Retomar sessão</p>
            <h4 className="editorial-title text-2xl">Onde parei</h4>
            <p className="mt-1 text-sm text-cream-muted">
              {progress ? `${progress.bookName} ${progress.chapter}` : 'Ainda sem progresso salvo'}
            </p>
          </button>
        </div>
      </div>
    </section>
  );
};

export default ReadingProgress;
