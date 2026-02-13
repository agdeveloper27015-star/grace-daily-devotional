import React, { useState, useEffect } from 'react';
import { getFavorites } from '../services/favoritesService';
import { getNotes } from '../services/notesService';
import { getReadingProgress, fetchBibleData } from '../services/bibleService';

const FIRST_VISIT_KEY = 'grace_first_visit';

const Profile: React.FC = () => {
  const [stats, setStats] = useState({
    versesRead: 0,
    favorites: 0,
    notes: 0,
    daysUsing: 0
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const favorites = getFavorites();
    const notes = getNotes();
    const progress = getReadingProgress();

    let versesRead = 0;
    if (progress) {
      const bible = await fetchBibleData();
      const book = bible.find(b => b.abbrev === progress.bookAbbrev);
      if (book) {
        // Conta versículos reais dos capítulos já lidos
        for (let i = 0; i < progress.chapter && i < book.chapters.length; i++) {
          versesRead += book.chapters[i].length;
        }
      }
    }

    let firstVisit = localStorage.getItem(FIRST_VISIT_KEY);
    if (!firstVisit) {
      firstVisit = Date.now().toString();
      localStorage.setItem(FIRST_VISIT_KEY, firstVisit);
    }
    const daysUsing = Math.floor((Date.now() - parseInt(firstVisit)) / (1000 * 60 * 60 * 24)) + 1;

    setStats({
      versesRead,
      favorites: favorites.length,
      notes: notes.length,
      daysUsing
    });
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header do Perfil */}
      <div className="flex flex-col items-center mb-8">
        <div className="h-24 w-24 rounded-full bg-terra/20 flex items-center justify-center shadow-md mb-4 ring-4 ring-terra/10">
          <svg className="w-12 h-12 text-terra" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h3 className="text-2xl font-extralight text-cream">Meu Perfil</h3>
        <p className="text-xs text-cream-muted uppercase tracking-widest mt-1">Peregrino da Fé</p>
      </div>

      {/* Secao Minha Jornada */}
      <div className="mb-8">
        <h4 className="text-xs font-semibold text-cream-muted uppercase tracking-[0.15em] mb-4">
          Minha Jornada
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 bg-grace-surface rounded-2xl border border-grace-border">
            <div className="text-2xl font-serif text-terra mb-1">
              {formatNumber(stats.versesRead)}
            </div>
            <div className="text-[10px] uppercase tracking-widest text-cream-muted">
              Versículos Lidos
            </div>
          </div>
          <div className="p-4 bg-grace-surface rounded-2xl border border-grace-border">
            <div className="text-2xl font-serif text-terra mb-1">
              {stats.favorites}
            </div>
            <div className="text-[10px] uppercase tracking-widest text-cream-muted">
              Favoritos
            </div>
          </div>
          <div className="p-4 bg-grace-surface rounded-2xl border border-grace-border">
            <div className="text-2xl font-serif text-terra mb-1">
              {stats.notes}
            </div>
            <div className="text-[10px] uppercase tracking-widest text-cream-muted">
              Notas
            </div>
          </div>
          <div className="p-4 bg-grace-surface rounded-2xl border border-grace-border">
            <div className="text-2xl font-serif text-terra mb-1">
              {stats.daysUsing}
            </div>
            <div className="text-[10px] uppercase tracking-widest text-cream-muted">
              Dias de Caminhada
            </div>
          </div>
        </div>
      </div>

      {/* Configurações */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-cream-muted uppercase tracking-[0.15em] mb-2">
          Configurações
        </h4>
        <button className="w-full flex justify-between items-center p-4 rounded-xl hover:bg-grace-surface-2 transition-colors bg-grace-surface border border-grace-border">
          <span className="text-cream font-medium">Configurações da Conta</span>
          <svg className="w-5 h-5 text-grace-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <button className="w-full flex justify-between items-center p-4 rounded-xl hover:bg-grace-surface-2 transition-colors bg-grace-surface border border-grace-border">
          <span className="text-cream font-medium">Notificações Diárias</span>
          <div className="w-10 h-5 bg-terra rounded-full relative">
            <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm"></div>
          </div>
        </button>
        <button className="w-full flex justify-between items-center p-4 rounded-xl hover:bg-grace-surface-2 transition-colors bg-grace-surface border border-grace-border">
          <span className="text-cream font-medium">Idiomas</span>
          <span className="text-xs text-cream-muted">Português (BR)</span>
        </button>
      </div>

      {/* Sobre o Grace */}
      <div className="mt-10 pt-6 border-t border-grace-border">
        <div className="text-center">
          <p className="text-xs text-cream-muted mb-2">Grace Daily Devotional</p>
          <p className="text-[10px] text-grace-muted">Versão 2.0</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
