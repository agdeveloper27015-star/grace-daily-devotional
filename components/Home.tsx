import React, { useEffect, useMemo, useState } from 'react';
import { Scripture } from '../types';
import { getDailyVerse, getReadingPercentage, getReadingProgress as getBibleProgress, parseReference } from '../services/bibleService';
import { NavigateFn } from '../types';
import { APP_DATA_UPDATED_EVENT } from '../services/localStateService';

interface HomeProps {
  onNavigate?: NavigateFn;
}

interface ReadingSnapshot {
  title: string;
  percentage: number | null;
}

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const [verse] = useState<Scripture>(getDailyVerse());
  const [readingSnapshot, setReadingSnapshot] = useState<ReadingSnapshot>({
    title: 'Inicie sua leitura',
    percentage: null,
  });

  useEffect(() => {
    const refresh = () => {
      void loadReadingSnapshot();
    };

    void loadReadingSnapshot();
    window.addEventListener('storage', refresh);
    window.addEventListener(APP_DATA_UPDATED_EVENT, refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener(APP_DATA_UPDATED_EVENT, refresh);
    };
  }, []);

  const loadReadingSnapshot = async () => {
    const progress = getBibleProgress();
    if (!progress) {
      setReadingSnapshot({
        title: 'Comece por qualquer livro',
        percentage: null,
      });
      return;
    }

    const percentage = await getReadingPercentage(progress.bookAbbrev, progress.chapter);
    setReadingSnapshot({
      title: `${progress.bookName} ${progress.chapter}`,
      percentage,
    });
  };

  const openDailyVerse = async () => {
    if (!onNavigate) return;

    const nav = await parseReference(verse.reference);
    if (nav) {
      onNavigate('LEITURA', { target: nav });
      return;
    }
    onNavigate('LEITURA');
  };

  const exploreItems = useMemo(
    () => [
      {
        id: 'search',
        title: 'Busca',
        subtitle: 'Versiculos e topicos',
        onClick: () => onNavigate?.('BUSCA'),
        icon: (
          <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        ),
      },
      {
        id: 'favorites',
        title: 'Favoritos',
        subtitle: 'Seus versiculos salvos',
        onClick: () => onNavigate?.('CADERNO', { notebookTab: 'FAVORITOS' }),
        icon: (
          <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
        ),
      },
      {
        id: 'notes',
        title: 'Notas',
        subtitle: 'Diario e pensamentos',
        onClick: () => onNavigate?.('CADERNO', { notebookTab: 'NOTAS' }),
        icon: (
          <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
        ),
      },
      {
        id: 'plans',
        title: 'Planos',
        subtitle: 'Devocionais diarios',
        onClick: () => onNavigate?.('LEITURA'),
        icon: (
          <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
        ),
      },
    ],
    [onNavigate]
  );

  return (
    <div className="home-editorial animate-in fade-in slide-in-from-bottom-4 duration-700">
      <section className="home-editorial__section">
        <p className="home-editorial__kicker">Inspiracao diaria</p>
        <blockquote className="home-editorial__quote">“{verse.text}”</blockquote>
        <button type="button" className="home-editorial__reference" onClick={openDailyVerse}>
          {verse.reference}
        </button>
      </section>

      <section className="home-editorial__section">
        <div className="home-editorial__reading-row">
          <h3 className="editorial-title home-editorial__reading-title">{readingSnapshot.title}</h3>
          {readingSnapshot.percentage !== null && (
            <span className="home-editorial__reading-percentage">{readingSnapshot.percentage}%</span>
          )}
        </div>
        <div
          className="home-editorial__progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={readingSnapshot.percentage ?? 0}
        >
          <div className="home-editorial__progress-fill" style={{ width: `${readingSnapshot.percentage ?? 0}%` }} />
        </div>
      </section>

      <section className="home-editorial__section">
        <p className="home-editorial__kicker">Explorar</p>
        <div className="home-editorial__menu" role="list">
          {exploreItems.map((item) => (
            <button key={item.id} type="button" className="home-editorial__menu-item" onClick={item.onClick}>
              <span className="home-editorial__menu-icon" aria-hidden="true">{item.icon}</span>
              <span className="home-editorial__menu-content">
                <span className="home-editorial__menu-title">{item.title}</span>
                <span className="home-editorial__menu-subtitle">{item.subtitle}</span>
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
