import React, { useEffect, useState } from 'react';
import { FavoriteVerse } from '../types';
import { getFavorites, removeFavorite } from '../services/favoritesService';
import { shareVerse } from '../services/shareService';
import { APP_DATA_UPDATED_EVENT } from '../services/localStateService';

const Favorites: React.FC = () => {
  const [favorites, setFavorites] = useState<FavoriteVerse[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    loadFavorites();

    const refresh = () => loadFavorites();
    window.addEventListener('storage', refresh);
    window.addEventListener(APP_DATA_UPDATED_EVENT, refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener(APP_DATA_UPDATED_EVENT, refresh);
    };
  }, []);

  const loadFavorites = () => {
    const items = getFavorites();
    setFavorites(items.sort((a, b) => b.timestamp - a.timestamp));
  };

  const handleRemove = (id: string) => {
    removeFavorite(id);
    loadFavorites();
  };

  const handleShare = async (favorite: FavoriteVerse) => {
    const result = await shareVerse({
      text: favorite.text,
      reference: `${favorite.bookName} ${favorite.chapter}:${favorite.verse}`,
      bookAbbrev: favorite.bookAbbrev,
      chapter: favorite.chapter,
      verse: favorite.verse,
    });

    if (result === 'shared') setFeedback('Versiculo compartilhado.');
    else if (result === 'copied') setFeedback('Versiculo copiado.');
    else setFeedback('Falha ao compartilhar.');

    setTimeout(() => setFeedback(null), 2400);
  };

  if (favorites.length === 0) {
    return (
      <div className="paper-panel p-8 text-center">
        <p className="editorial-title text-3xl">Sem favoritos ainda</p>
        <p className="mt-2 text-sm text-cream-muted">Marque versículos durante a leitura para montar sua coleção.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {feedback && (
        <div className="paper-panel px-4 py-2 text-xs font-semibold text-cream">
          {feedback}
        </div>
      )}
      {favorites.map((favorite) => (
        <article key={favorite.id} className="paper-panel p-4 sm:p-5">
          <div className="mb-2 flex items-start justify-between gap-3">
            <p className="section-kicker">
              {favorite.bookName} {favorite.chapter}:{favorite.verse}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleShare(favorite)}
                className="icon-button inline-flex h-8 w-8 items-center justify-center"
                title="Compartilhar versiculo"
                aria-label="Compartilhar versiculo"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C9.886 14.17 11.325 14.625 12.8 14.625c1.474 0 2.913-.456 4.116-1.283m0 0a2.1 2.1 0 113.084 1.815A2.1 2.1 0 0116.916 13.34zm-8.232 0a2.1 2.1 0 10-3.084 1.815A2.1 2.1 0 008.684 13.34zm8.232 0V9.225a2.1 2.1 0 10-4.2 0v4.117" />
                </svg>
              </button>
              <button
                onClick={() => handleRemove(favorite.id)}
                className="icon-button inline-flex h-8 w-8 items-center justify-center text-[var(--danger)]"
                title="Remover dos favoritos"
                aria-label="Remover dos favoritos"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <p className="reading-body text-[1.02rem] text-cream-dark">"{favorite.text}"</p>
        </article>
      ))}
    </div>
  );
};

export default Favorites;
