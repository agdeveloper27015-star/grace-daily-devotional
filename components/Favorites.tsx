import React, { useEffect, useState } from 'react';
import { FavoriteVerse } from '../types';
import { getFavorites, removeFavorite } from '../services/favoritesService';

const Favorites: React.FC = () => {
  const [favorites, setFavorites] = useState<FavoriteVerse[]>([]);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = () => {
    const items = getFavorites();
    setFavorites(items.sort((a, b) => b.timestamp - a.timestamp));
  };

  const handleRemove = (id: string) => {
    removeFavorite(id);
    loadFavorites();
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
      {favorites.map((favorite) => (
        <article key={favorite.id} className="paper-panel p-4 sm:p-5">
          <div className="mb-2 flex items-start justify-between gap-3">
            <p className="section-kicker">
              {favorite.bookName} {favorite.chapter}:{favorite.verse}
            </p>
            <button
              onClick={() => handleRemove(favorite.id)}
              className="icon-button inline-flex h-8 w-8 items-center justify-center text-[var(--danger)]"
              title="Remover dos favoritos"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p className="reading-body text-[1.02rem] text-cream-dark">"{favorite.text}"</p>
        </article>
      ))}
    </div>
  );
};

export default Favorites;
