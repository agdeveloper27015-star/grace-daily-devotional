import React, { useState } from 'react';
import { searchBible, BibleSearchResult } from '../services/bibleService';
import { toggleFavorite, isFavorite } from '../services/favoritesService';
import { NavigationTarget } from '../App';

interface SearchProps {
  onNavigate?: (view: string, target?: NavigationTarget) => void;
}

const Search: React.FC<SearchProps> = ({ onNavigate }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BibleSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [favoritedVerses, setFavoritedVerses] = useState<Set<string>>(new Set());

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    const searchResults = await searchBible(query);
    setResults(searchResults);

    const favorited = new Set<string>();
    searchResults.forEach(r => {
      if (isFavorite(r.bookAbbrev, r.chapter, r.verse)) {
        favorited.add(`${r.bookAbbrev}_${r.chapter}_${r.verse}`);
      }
    });
    setFavoritedVerses(favorited);
    setLoading(false);
  };

  const handleToggleFavorite = (result: BibleSearchResult) => {
    const key = `${result.bookAbbrev}_${result.chapter}_${result.verse}`;
    const isNowFavorite = toggleFavorite({
      bookAbbrev: result.bookAbbrev,
      bookName: result.bookName,
      chapter: result.chapter,
      verse: result.verse,
      text: result.text
    });

    setFavoritedVerses(prev => {
      const next = new Set(prev);
      if (isNowFavorite) {
        next.add(key);
      } else {
        next.delete(key);
      }
      return next;
    });
  };

  const popularSearches = [
    'amor', 'paz', 'fe', 'esperanca', 'forca',
    'perdao', 'sabedoria', 'graca', 'misericordia', 'alegria'
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex: amor, Salmos, fe, esperanca..."
            className="w-full pl-4 pr-12 py-3 border-b-2 border-grace-border focus:border-terra focus:ring-0 outline-none text-cream font-light bg-transparent transition-all placeholder:text-grace-muted"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-terra hover:scale-110 transition-transform"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </form>

      {/* Popular searches */}
      {!searched && (
        <div className="mb-8">
          <p className="text-[10px] font-bold uppercase tracking-widest text-terra mb-3">
            Buscas Populares
          </p>
          <div className="flex flex-wrap gap-2">
            {popularSearches.map((term) => (
              <button
                key={term}
                onClick={async () => {
                  setQuery(term);
                  setLoading(true);
                  setSearched(true);
                  const searchResults = await searchBible(term);
                  setResults(searchResults);
                  const favorited = new Set<string>();
                  searchResults.forEach(r => {
                    if (isFavorite(r.bookAbbrev, r.chapter, r.verse)) {
                      favorited.add(`${r.bookAbbrev}_${r.chapter}_${r.verse}`);
                    }
                  });
                  setFavoritedVerses(favorited);
                  setLoading(false);
                }}
                className="px-4 py-2 bg-grace-surface hover:bg-grace-surface-2 rounded-full text-xs font-medium text-cream-muted hover:text-cream transition-colors capitalize"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-terra border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-cream-muted text-xs italic">Buscando nas escrituras...</p>
        </div>
      )}

      {searched && !loading && results.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-terra mb-4">
            {results.length} versículo{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
          </p>
          <div className="space-y-3">
            {results.map((result, idx) => {
              const key = `${result.bookAbbrev}_${result.chapter}_${result.verse}`;
              return (
                <div
                  key={idx}
                  onClick={() => onNavigate && onNavigate('LEITURA', { bookAbbrev: result.bookAbbrev, chapter: result.chapter, verse: result.verse })}
                  className="p-4 bg-grace-surface rounded-2xl group hover:bg-grace-surface-2 transition-colors relative cursor-pointer border border-grace-border"
                >
                  <div className="flex justify-between items-start">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-terra mb-2">
                      {result.bookName} {result.chapter}:{result.verse}
                    </p>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleToggleFavorite(result); }}
                      className={`p-1.5 rounded-full transition-all ${
                        favoritedVerses.has(key)
                          ? 'text-red-400 bg-red-400/10'
                          : 'text-grace-muted hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      <svg
                        className="w-4 h-4"
                        fill={favoritedVerses.has(key) ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-cream-dark leading-relaxed font-light text-sm pr-8">
                    {result.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {searched && !loading && results.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-grace-surface flex items-center justify-center">
            <svg className="w-8 h-8 text-grace-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <p className="text-cream-muted text-sm font-light">
            Nenhum versículo encontrado para "{query}"
          </p>
          <p className="text-grace-muted text-xs mt-2">
            Tente palavras diferentes ou mais simples
          </p>
        </div>
      )}

      {!searched && !loading && (
        <div className="text-center py-12">
          <p className="text-cream-muted text-sm font-light italic">
            Pesquise por palavras, temas ou nomes de livros da Bíblia.
          </p>
        </div>
      )}
    </div>
  );
};

export default Search;
