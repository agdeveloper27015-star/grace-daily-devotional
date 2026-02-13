import React from 'react';
import Favorites from './Favorites';
import Notes from './Notes';
import { NotebookTab } from '../types';

interface NotebookProps {
  activeTab: NotebookTab;
  onTabChange: (tab: NotebookTab) => void;
}

const Notebook: React.FC<NotebookProps> = ({ activeTab, onTabChange }) => {
  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="paper-panel p-5 sm:p-6">
        <p className="section-kicker">Caderno espiritual</p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <h2 className="editorial-title text-4xl leading-none sm:text-5xl">Memórias do estudo</h2>
          <div className="inline-flex rounded-full border border-grace-border bg-grace-surface-2 p-1">
            <button
              onClick={() => onTabChange('FAVORITOS')}
              className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                activeTab === 'FAVORITOS' ? 'bg-terra text-white' : 'text-cream-muted hover:text-cream'
              }`}
            >
              Favoritos
            </button>
            <button
              onClick={() => onTabChange('NOTAS')}
              className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                activeTab === 'NOTAS' ? 'bg-terra text-white' : 'text-cream-muted hover:text-cream'
              }`}
            >
              Notas
            </button>
          </div>
        </div>

        <p className="mt-3 max-w-2xl text-sm text-cream-muted">
          Tudo o que marcou sua leitura fica reunido aqui. Alterne entre passagens favoritas e reflexões
          pessoais sem perder o contexto da sua jornada.
        </p>
      </div>

      <div className="mt-5">
        {activeTab === 'FAVORITOS' ? <Favorites /> : <Notes />}
      </div>
    </section>
  );
};

export default Notebook;
