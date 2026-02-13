import React, { useEffect, useState } from 'react';
import { Scripture, ReadingProgress, ExploreItem } from '../types';
import { getDailyVerse, getReadingProgress as getBibleProgress, getReadingPercentage, parseReference } from '../services/bibleService';
import { NavigationTarget } from '../App';
import { getFavorites } from '../services/favoritesService';
import { getNotes } from '../services/notesService';

interface HomeProps {
  onNavigate?: (view: string, target?: NavigationTarget) => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const dailyVerse = getDailyVerse();
  const [verse] = useState<Scripture>(dailyVerse);

  const [favoritesCount, setFavoritesCount] = useState(0);
  const [notesCount, setNotesCount] = useState(0);
  const [readingProgress, setReadingProgress] = useState<ReadingProgress | null>(null);

  const exploreItems: ExploreItem[] = [
    {
      id: 'search',
      title: 'Busca',
      subtitle: 'Versículos e tópicos',
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24">
          <path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      id: 'favorites',
      title: 'Favoritos',
      subtitle: 'Seus versículos salvos',
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24">
          <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      id: 'notes',
      title: 'Notas',
      subtitle: 'Diário e pensamentos',
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24">
          <path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      id: 'plans',
      title: 'Planos',
      subtitle: 'Devocionais diários',
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24">
          <path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    }
  ];

  useEffect(() => {
    loadCounts();
    loadReadingProgress();
  }, []);

  const loadReadingProgress = async () => {
    const progress = getBibleProgress();
    if (progress) {
      const percentage = await getReadingPercentage(progress.bookAbbrev, progress.chapter);
      setReadingProgress({
        book: progress.bookName,
        chapter: progress.chapter,
        percentage
      });
    }
  };

  const loadCounts = () => {
    setFavoritesCount(getFavorites().length);
    setNotesCount(getNotes().length);
  };

  const getSubtitle = (id: string): string => {
    if (id === 'favorites' && favoritesCount > 0) {
      return `${favoritesCount} versículo${favoritesCount !== 1 ? 's' : ''} salvo${favoritesCount !== 1 ? 's' : ''}`;
    }
    if (id === 'notes' && notesCount > 0) {
      return `${notesCount} nota${notesCount !== 1 ? 's' : ''}`;
    }
    const item = exploreItems.find(i => i.id === id);
    return item?.subtitle || '';
  };

  const handleExploreClick = (id: string) => {
    if (onNavigate) {
      if (id === 'favorites') {
        onNavigate('FAVORITES');
      } else if (id === 'notes') {
        onNavigate('NOTES');
      } else if (id === 'plans') {
        onNavigate('LEITURA');
      } else if (id === 'search') {
        onNavigate('PESQUISA');
      }
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Daily Inspiration */}
      <section className="mb-12 mt-4">
        <h2 className="text-xs font-semibold text-cream-muted tracking-[0.15em] uppercase mb-4">
          Inspiração Diária
        </h2>
        <button
          onClick={async () => {
            if (onNavigate) {
              const nav = await parseReference(verse.reference);
              if (nav) onNavigate('LEITURA', nav);
            }
          }}
          className="text-left w-full group"
        >
          <blockquote className="font-serif italic text-[24px] font-medium leading-[1.3] text-cream mb-5 group-hover:text-terra transition-colors">
            "{verse.text}"
          </blockquote>
          <p className="text-[11px] font-bold tracking-widest uppercase text-cream-muted group-hover:text-terra transition-colors">
            {verse.reference} →
          </p>
        </button>
      </section>

      {/* Reading Progress */}
      <section className="mb-14">
        {readingProgress ? (
          <button onClick={() => onNavigate && onNavigate('LEITURA')} className="w-full text-left group">
            <div className="flex justify-between items-end mb-2">
              <h3 className="font-serif text-3xl text-cream group-hover:text-terra transition-colors">
                {readingProgress.book} {readingProgress.chapter}
              </h3>
              <span className="text-sm font-medium text-cream mb-1">{readingProgress.percentage}%</span>
            </div>
            <div className="w-full bg-grace-surface-3 h-[2px] rounded-full overflow-hidden">
              <div
                className="bg-terra h-full transition-all duration-1000 ease-out"
                style={{ width: `${readingProgress.percentage}%` }}
              ></div>
            </div>
          </button>
        ) : (
          <button
            onClick={() => onNavigate && onNavigate('LEITURA')}
            className="w-full text-left p-5 bg-grace-surface rounded-2xl border border-grace-border group hover:bg-grace-surface-2 transition-colors"
          >
            <h3 className="font-serif text-2xl text-cream group-hover:text-terra transition-colors">
              Comece sua leitura
            </h3>
            <p className="text-xs text-cream-muted mt-1 uppercase tracking-widest">
              Toque para iniciar sua jornada bíblica
            </p>
          </button>
        )}
      </section>

      {/* Explore Section */}
      <section>
        <h2 className="text-xs font-semibold text-cream-muted tracking-[0.15em] uppercase mb-2">
          Explorar
        </h2>
        <ul className="divide-y divide-grace-border">
          {exploreItems.map((item) => (
            <li key={item.id} className="py-4">
              <button
                onClick={() => handleExploreClick(item.id)}
                className="flex items-center w-full text-left group"
              >
                <div className="mr-5 text-cream group-hover:text-terra transition-colors">
                  {item.icon}
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-semibold text-cream group-hover:text-terra transition-colors">
                    {item.title}
                  </span>
                  <span className="text-sm text-cream-muted font-light mt-0.5">
                    {getSubtitle(item.id)}
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default Home;
