import React, { useState, useEffect } from 'react';
import { FavoriteVerse } from '../types';
import { getFavorites, removeFavorite } from '../services/favoritesService';

const Favorites: React.FC = () => {
  const [favorites, setFavorites] = useState<FavoriteVerse[]>([]);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = () => {
    const favs = getFavorites();
    setFavorites(favs.sort((a, b) => b.timestamp - a.timestamp));
  };

  const handleRemove = (id: string) => {
    removeFavorite(id);
    loadFavorites();
  };

  if (favorites.length === 0) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-grace-surface flex items-center justify-center border border-grace-border">
            <svg className="w-8 h-8 text-terra" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <p className="text-cream-muted text-sm font-light">
            Você ainda não tem versículos favoritos.
          </p>
          <p className="text-grace-muted text-xs mt-2">
            Toque no coração ao ler a Bíblia para salvar um versículo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <p className="text-xs font-semibold text-cream-muted tracking-[0.15em] uppercase mb-6">
        {favorites.length} versículo{favorites.length !== 1 ? 's' : ''} salvo{favorites.length !== 1 ? 's' : ''}
      </p>

      <div className="space-y-4">
        {favorites.map((favorite) => (
          <div
            key={favorite.id}
            className="p-5 bg-grace-surface rounded-2xl group relative border border-grace-border"
          >
            <div className="pr-8">
              <p className="text-xs font-bold uppercase tracking-widest text-terra mb-2">
                {favorite.bookName} {favorite.chapter}:{favorite.verse}
              </p>
              <p className="text-cream-dark leading-relaxed font-light text-sm">
                "{favorite.text}"
              </p>
            </div>

            <button
              onClick={() => handleRemove(favorite.id)}
              className="absolute top-4 right-4 p-2 text-red-400 hover:text-red-500 hover:bg-red-400/10 rounded-full transition-all sm:opacity-0 sm:group-hover:opacity-100"
              title="Remover dos favoritos"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Favorites;
