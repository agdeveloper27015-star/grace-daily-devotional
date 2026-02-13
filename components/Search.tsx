import React, { useState } from 'react';
import { searchBible, BibleSearchResult } from '../services/bibleService';
import { isFavorite, toggleFavorite } from '../services/favoritesService';
import { NavigateFn } from '../types';

interface SearchProps {
  onNavigate?: NavigateFn;
}

const POPULAR_SEARCHES = ['graça', 'fé', 'sabedoria', 'esperança', 'perdão', 'paz', 'aliança', 'oração'];

const Search: React.FC<SearchProps> = ({ onNavigate }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BibleSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [favoritedVerses, setFavoritedVerses] = useState<Set<string>>(new Set());

  const searchTerm = async (term: string) => {
    const parsed = term.trim();
    if (!parsed) return;

    setLoading(true);
    setSearched(true);

    const searchResults = await searchBible(parsed);
    setResults(searchResults);

    const favorited = new Set<string>();
    searchResults.forEach((item) => {
      if (isFavorite(item.bookAbbrev, item.chapter, item.verse)) {
        favorited.add(`${item.bookAbbrev}_${item.chapter}_${item.verse}`);
      }
    });
    setFavoritedVerses(favorited);
    setLoading(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await searchTerm(query);
  };

  const handleToggleFavorite = (result: BibleSearchResult) => {
    const key = `${result.bookAbbrev}_${result.chapter}_${result.verse}`;
    const favorited = toggleFavorite({
      bookAbbrev: result.bookAbbrev,
      bookName: result.bookName,
      chapter: result.chapter,
      verse: result.verse,
      text: result.text,
    });

    setFavoritedVerses((prev) => {
      const next = new Set(prev);
      if (favorited) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-5">
      <div className="paper-panel p-5 sm:p-6">
        <p className="section-kicker">Busca semântica</p>
        <h2 className="editorial-title mt-1 text-4xl leading-none sm:text-5xl">Descobrir conexões</h2>
        <p className="mt-2 max-w-2xl text-sm text-cream-muted">
          Busque por termos teológicos, nomes de livros, emoções ou temas. Toque em um resultado para abrir
          a passagem diretamente na leitura.
        </p>

        <form onSubmit={handleSubmit} className="mt-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ex: justiça, salmos, fé, consolação"
              className="h-12 w-full rounded-2xl border border-grace-border bg-grace-surface px-4 text-base text-cream outline-none transition focus:border-terra"
            />
            <button type="submit" className="pill-button-accent h-12 px-6 text-sm font-semibold">
              Buscar
            </button>
          </div>
        </form>

        {!searched && (
          <div className="mt-4 flex flex-wrap gap-2">
            {POPULAR_SEARCHES.map((term) => (
              <button
                key={term}
                onClick={() => {
                  setQuery(term);
                  void searchTerm(term);
                }}
                className="pill-button px-3 py-1.5 text-xs font-semibold capitalize"
              >
                {term}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading && (
        <div className="paper-panel p-8 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-terra border-t-transparent" />
          <p className="mt-3 text-sm text-cream-muted">Buscando referências no texto bíblico...</p>
        </div>
      )}

      {searched && !loading && results.length === 0 && (
        <div className="paper-panel p-8 text-center">
          <p className="editorial-title text-3xl">Nenhum resultado</p>
          <p className="mt-2 text-sm text-cream-muted">Tente termos mais amplos ou sinônimos em português.</p>
        </div>
      )}

      {searched && !loading && results.length > 0 && (
        <div className="paper-panel p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="section-kicker">Resultados</p>
            <p className="text-sm font-semibold text-cream">{results.length} passagens encontradas</p>
          </div>

          <div className="space-y-3">
            {results.map((result, index) => {
              const key = `${result.bookAbbrev}_${result.chapter}_${result.verse}`;
              const isFavoritedVerse = favoritedVerses.has(key);

              return (
                <article
                  key={`${key}_${index}`}
                  onClick={() => onNavigate?.('LEITURA', { target: { bookAbbrev: result.bookAbbrev, chapter: result.chapter, verse: result.verse } })}
                  className="state-card cursor-pointer p-4 transition hover:bg-grace-surface-2"
                >
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <p className="section-kicker">
                      {result.bookName} {result.chapter}:{result.verse}
                    </p>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        handleToggleFavorite(result);
                      }}
                      className={`icon-button inline-flex h-8 w-8 items-center justify-center ${
                        isFavoritedVerse ? 'text-[var(--danger)] border-[rgba(155,34,38,0.3)]' : ''
                      }`}
                      title={isFavoritedVerse ? 'Remover favorito' : 'Salvar favorito'}
                      aria-label={isFavoritedVerse ? 'Remover favorito' : 'Salvar favorito'}
                    >
                      <svg
                        className="h-4 w-4"
                        fill={isFavoritedVerse ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                  </div>

                  <p className="reading-body text-[1.02rem] text-cream-dark">{result.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};

export default Search;
