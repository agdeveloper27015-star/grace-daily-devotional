import React, { useEffect, useMemo, useState } from 'react';
import { Scripture } from '../types';
import { getDailyVerse, getReadingPercentage, getReadingProgress as getBibleProgress, parseReference } from '../services/bibleService';
import { getFavorites } from '../services/favoritesService';
import { getNotes } from '../services/notesService';
import { NavigateFn } from '../types';
import { APP_DATA_UPDATED_EVENT } from '../services/localStateService';

interface HomeProps {
  onNavigate?: NavigateFn;
}

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const [verse] = useState<Scripture>(getDailyVerse());
  const [readingCard, setReadingCard] = useState<{ title: string; subtitle: string; percentage: number | null }>({
    title: 'Comece sua leitura',
    subtitle: 'Escolha um livro e inicie seu próximo capítulo.',
    percentage: null,
  });
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [notesCount, setNotesCount] = useState(0);

  useEffect(() => {
    loadContext();

    const refresh = () => {
      void loadContext();
    };

    window.addEventListener('storage', refresh);
    window.addEventListener(APP_DATA_UPDATED_EVENT, refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener(APP_DATA_UPDATED_EVENT, refresh);
    };
  }, []);

  const loadContext = async () => {
    const progress = getBibleProgress();
    setFavoritesCount(getFavorites().length);
    setNotesCount(getNotes().length);

    if (!progress) return;

    const percentage = await getReadingPercentage(progress.bookAbbrev, progress.chapter);
    setReadingCard({
      title: `${progress.bookName} ${progress.chapter}`,
      subtitle: 'Retome exatamente de onde você parou.',
      percentage,
    });
  };

  const quickActions = useMemo(
    () => [
      {
        id: 'buscar',
        title: 'Busca semântica',
        subtitle: 'Encontre termos, temas e passagens conectadas.',
        onClick: () => onNavigate?.('BUSCA'),
        icon: (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        ),
      },
      {
        id: 'caderno',
        title: 'Caderno espiritual',
        subtitle: 'Revise favoritos e notas do seu estudo recente.',
        onClick: () => onNavigate?.('CADERNO'),
        icon: (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3.75h9A2.25 2.25 0 0118 6v12a2.25 2.25 0 01-2.25 2.25h-9A2.25 2.25 0 014.5 18V6a2.25 2.25 0 012.25-2.25zM9 3.75v16.5" />
          </svg>
        ),
      },
      {
        id: 'leitura',
        title: 'Abrir leitura',
        subtitle: 'Entrar no texto bíblico com foco e marcações.',
        onClick: () => onNavigate?.('LEITURA'),
        icon: (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        ),
      },
    ],
    [onNavigate]
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-5">
      <section className="paper-panel overflow-hidden">
        <div className="bg-gradient-to-r from-grace-surface via-grace-surface to-grace-surface-2 p-6 sm:p-7">
          <p className="section-kicker">Versículo do dia</p>
          <blockquote className="editorial-title mt-3 text-3xl leading-[1.15] sm:text-4xl">
            "{verse.text}"
          </blockquote>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={async () => {
                if (!onNavigate) return;
                const nav = await parseReference(verse.reference);
                if (nav) onNavigate('LEITURA', { target: nav });
              }}
              className="pill-button-accent px-5 py-2.5 text-sm font-semibold"
            >
              Estudar esta passagem
            </button>
            <span className="meta-label">{verse.reference}</span>
          </div>
        </div>
      </section>

      <section className="paper-panel p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="section-kicker">Leitura contínua</p>
            <h3 className="editorial-title text-3xl leading-none sm:text-4xl">{readingCard.title}</h3>
            <p className="mt-1 text-sm text-cream-muted">{readingCard.subtitle}</p>
          </div>
          <button onClick={() => onNavigate?.('LEITURA')} className="pill-button px-4 py-2 text-xs font-semibold uppercase tracking-wider">
            Abrir
          </button>
        </div>

        {readingCard.percentage !== null && (
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold text-cream-muted">
              <span>Progresso no livro</span>
              <span>{readingCard.percentage}%</span>
            </div>
            <div className="h-2 rounded-full bg-grace-surface-3">
              <div className="h-full rounded-full bg-terra transition-all duration-700" style={{ width: `${readingCard.percentage}%` }} />
            </div>
          </div>
        )}
      </section>

      <section className="paper-panel p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="section-kicker">Fluxo principal</p>
            <h3 className="editorial-title text-3xl leading-none sm:text-4xl">Hub de estudo</h3>
          </div>
          <button
            onClick={() => onNavigate?.('CADERNO')}
            className="pill-button px-4 py-2 text-xs font-semibold uppercase tracking-wider"
          >
            Abrir caderno
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <article className="state-card p-4">
            <p className="section-kicker">Favoritos</p>
            <p className="mt-1 text-lg font-semibold text-cream">{favoritesCount}</p>
          </article>
          <article className="state-card p-4">
            <p className="section-kicker">Notas</p>
            <p className="mt-1 text-lg font-semibold text-cream">{notesCount}</p>
          </article>
          <article className="state-card p-4">
            <p className="section-kicker">Sessão sugerida</p>
            <p className="mt-1 text-lg font-semibold text-cream">Palavras-Chave</p>
          </article>
        </div>

        <div className="mt-4 grid gap-3">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={action.onClick}
              className="state-card flex items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-grace-surface-2"
            >
              <span className="icon-button inline-flex h-10 w-10 items-center justify-center">{action.icon}</span>
              <span>
                <span className="block text-base font-semibold text-cream">{action.title}</span>
                <span className="block text-sm text-cream-muted">{action.subtitle}</span>
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
