import React, { useEffect, useState } from 'react';
import { getFavorites } from '../services/favoritesService';
import { getNotes } from '../services/notesService';
import { fetchBibleData, getReadingProgress } from '../services/bibleService';

const FIRST_VISIT_KEY = 'grace_first_visit';

const Profile: React.FC = () => {
  const [stats, setStats] = useState({
    versesRead: 0,
    favorites: 0,
    notes: 0,
    daysUsing: 0,
  });

  useEffect(() => {
    void loadStats();
  }, []);

  const loadStats = async () => {
    const favorites = getFavorites();
    const notes = getNotes();
    const progress = getReadingProgress();

    let versesRead = 0;
    if (progress) {
      const bible = await fetchBibleData();
      const book = bible.find((item) => item.abbrev === progress.bookAbbrev);
      if (book) {
        for (let chapterIndex = 0; chapterIndex < progress.chapter && chapterIndex < book.chapters.length; chapterIndex += 1) {
          versesRead += book.chapters[chapterIndex].length;
        }
      }
    }

    let firstVisit = localStorage.getItem(FIRST_VISIT_KEY);
    if (!firstVisit) {
      firstVisit = Date.now().toString();
      localStorage.setItem(FIRST_VISIT_KEY, firstVisit);
    }

    const daysUsing = Math.floor((Date.now() - Number(firstVisit)) / (1000 * 60 * 60 * 24)) + 1;

    setStats({
      versesRead,
      favorites: favorites.length,
      notes: notes.length,
      daysUsing,
    });
  };

  const cards = [
    { label: 'Versículos lidos', value: stats.versesRead },
    { label: 'Favoritos', value: stats.favorites },
    { label: 'Notas', value: stats.notes },
    { label: 'Dias de uso', value: stats.daysUsing },
  ];

  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-5">
      <div className="paper-panel p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="section-kicker">Meu perfil</p>
            <h2 className="editorial-title text-4xl leading-none sm:text-5xl">Peregrino</h2>
            <p className="mt-2 text-sm text-cream-muted">Sua jornada espiritual acompanhada por métricas reais do app.</p>
          </div>
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-grace-border bg-grace-surface-2">
            <svg className="h-8 w-8 text-terra" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map((card) => (
          <article key={card.label} className="paper-panel p-5">
            <p className="section-kicker">{card.label}</p>
            <p className="mt-2 text-4xl font-semibold text-cream">{card.value}</p>
          </article>
        ))}
      </div>

      <div className="paper-panel p-5 sm:p-6">
        <p className="section-kicker">Configurações</p>
        <div className="mt-3 space-y-2">
          <button className="state-card flex w-full items-center justify-between p-4 text-left transition hover:bg-grace-surface-2">
            <span className="text-sm font-semibold text-cream">Configurações da Conta</span>
            <span className="text-xs text-cream-muted">Em breve</span>
          </button>
          <button className="state-card flex w-full items-center justify-between p-4 text-left transition hover:bg-grace-surface-2">
            <span className="text-sm font-semibold text-cream">Notificações Diárias</span>
            <span className="text-xs text-cream-muted">Ativo</span>
          </button>
          <button className="state-card flex w-full items-center justify-between p-4 text-left transition hover:bg-grace-surface-2">
            <span className="text-sm font-semibold text-cream">Idioma</span>
            <span className="text-xs text-cream-muted">Português (BR)</span>
          </button>
        </div>
      </div>

      <div className="paper-panel p-5 text-center">
        <p className="section-kicker">Sobre</p>
        <p className="mt-1 text-sm text-cream-dark">Grace Daily Devotional 1.0</p>
        <p className="text-xs text-cream-muted">Feito para estudo bíblico diário</p>
      </div>
    </section>
  );
};

export default Profile;
