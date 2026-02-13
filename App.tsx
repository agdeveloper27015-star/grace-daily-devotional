import React, { useEffect, useMemo, useState } from 'react';
import Home from './components/Home';
import Reading from './components/Reading';
import Search from './components/Search';
import Profile from './components/Profile';
import Notebook from './components/Notebook';
import { AppView, NavigateFn, NavigateOptions, NavigationTarget, NotebookTab } from './types';
import { getFavorites } from './services/favoritesService';
import { getNotes } from './services/notesService';
import { getReadingProgress } from './services/bibleService';

const VIEW_LABELS: Record<AppView, string> = {
  ESTUDO: 'Hub de Estudo',
  LEITURA: 'Leitura Bíblica',
  BUSCA: 'Busca Semântica',
  CADERNO: 'Caderno Espiritual',
  PERFIL: 'Perfil',
};

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Bom dia';
  if (hour >= 12 && hour < 18) return 'Boa tarde';
  return 'Boa noite';
};

const NAV_ITEMS: Array<{ view: AppView; label: string; icon: React.ReactNode }> = [
  {
    view: 'ESTUDO',
    label: 'Estudo',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6.75A2.25 2.25 0 015.25 4.5h13.5A2.25 2.25 0 0121 6.75v10.5A2.25 2.25 0 0118.75 19.5H5.25A2.25 2.25 0 013 17.25V6.75zm4.5 0v10.5m4.5-10.5v10.5" />
      </svg>
    )
  },
  {
    view: 'LEITURA',
    label: 'Leitura',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    )
  },
  {
    view: 'BUSCA',
    label: 'Busca',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    )
  },
  {
    view: 'CADERNO',
    label: 'Caderno',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3.75h9A2.25 2.25 0 0118 6v12a2.25 2.25 0 01-2.25 2.25h-9A2.25 2.25 0 014.5 18V6a2.25 2.25 0 012.25-2.25zM9 3.75v16.5" />
      </svg>
    )
  },
  {
    view: 'PERFIL',
    label: 'Perfil',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )
  },
];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('ESTUDO');
  const [readingTarget, setReadingTarget] = useState<NavigationTarget | null>(null);
  const [notebookTab, setNotebookTab] = useState<NotebookTab>('FAVORITOS');
  const [focusMode, setFocusMode] = useState(false);
  const [greeting] = useState(getGreeting());
  const [contextStats, setContextStats] = useState({ favorites: 0, notes: 0, progress: 'Sem leitura iniciada' });

  const handleNavigate: NavigateFn = (view: AppView, options?: NavigateOptions) => {
    if (options?.target) {
      setReadingTarget(options.target);
    }

    if (options?.notebookTab) {
      setNotebookTab(options.notebookTab);
    }

    setCurrentView(view);
  };

  const syncContextStats = () => {
    const progress = getReadingProgress();
    setContextStats({
      favorites: getFavorites().length,
      notes: getNotes().length,
      progress: progress ? `${progress.bookName} ${progress.chapter}` : 'Sem leitura iniciada',
    });
  };

  useEffect(() => {
    syncContextStats();
  }, [currentView]);

  useEffect(() => {
    const onStorage = () => syncContextStats();
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const currentLabel = VIEW_LABELS[currentView];

  const contextTitle = useMemo(() => {
    if (currentView === 'ESTUDO') return 'Panorama espiritual';
    if (currentView === 'LEITURA') return 'Progresso da jornada';
    if (currentView === 'BUSCA') return 'Pesquisa ativa';
    if (currentView === 'CADERNO') return 'Anotações salvas';
    return 'Seu caminho';
  }, [currentView]);

  const renderContent = () => {
    switch (currentView) {
      case 'ESTUDO':
        return <Home onNavigate={handleNavigate} />;
      case 'LEITURA':
        return (
          <Reading
            initialTarget={readingTarget}
            onTargetConsumed={() => setReadingTarget(null)}
            onFocusModeChange={setFocusMode}
          />
        );
      case 'BUSCA':
        return <Search onNavigate={handleNavigate} />;
      case 'CADERNO':
        return <Notebook activeTab={notebookTab} onTabChange={setNotebookTab} />;
      case 'PERFIL':
        return <Profile />;
      default:
        return <Home onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="app-shell">
      {!focusMode && (
        <header className="app-topbar sticky top-0 z-40">
          <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-4 py-4 lg:px-6">
            <div>
              <p className="meta-label">Grace Devocional</p>
              <h1 className="editorial-title text-[28px] leading-none lg:text-[34px]">{greeting}, Peregrino</h1>
            </div>

            <div className="text-right">
              <p className="section-kicker">Visão atual</p>
              <p className="text-sm font-semibold text-cream">{currentLabel}</p>
            </div>
          </div>
        </header>
      )}

      <div className="app-main-grid">
        <aside className="hidden lg:block">
          <div className="paper-panel sticky top-24 p-3">
            <div className="px-3 pb-3 pt-2">
              <p className="section-kicker">Navegação</p>
            </div>
            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.view}
                  onClick={() => handleNavigate(item.view)}
                  className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-semibold transition-all duration-200 ${
                    currentView === item.view
                      ? 'bg-terra text-white'
                      : 'text-cream-muted hover:bg-grace-surface-2 hover:text-cream'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        <main className="min-w-0">{renderContent()}</main>

        <aside className="context-panel">
          <div className="paper-panel p-5">
            <p className="section-kicker mb-1">{contextTitle}</p>
            <h2 className="editorial-title text-3xl">Centro de estudo</h2>
            <p className="mt-2 text-sm text-cream-muted">
              Seu ambiente para leitura, busca semântica, anotações e referências cruzadas.
            </p>

            <div className="mt-5 space-y-3">
              <div className="state-card p-4">
                <p className="section-kicker">Leitura atual</p>
                <p className="mt-1 text-sm font-semibold text-cream">{contextStats.progress}</p>
              </div>
              <div className="state-card p-4">
                <p className="section-kicker">Favoritos</p>
                <p className="mt-1 text-sm font-semibold text-cream">{contextStats.favorites} versículos salvos</p>
              </div>
              <div className="state-card p-4">
                <p className="section-kicker">Notas</p>
                <p className="mt-1 text-sm font-semibold text-cream">{contextStats.notes} reflexões no caderno</p>
              </div>
            </div>

            <div className="soft-divider mt-5 pt-4">
              <button
                onClick={() => handleNavigate('BUSCA')}
                className="pill-button-accent w-full px-4 py-3 text-sm font-semibold"
              >
                Iniciar novo estudo
              </button>
            </div>
          </div>
        </aside>
      </div>

      {!focusMode && (
        <nav className="app-bottom-nav lg:hidden">
          <ul className="grid grid-cols-5">
            {NAV_ITEMS.map((item) => (
              <li key={item.view}>
                <button
                  onClick={() => handleNavigate(item.view)}
                  data-active={currentView === item.view}
                  className="flex w-full flex-col items-center gap-1 px-2 py-3 text-[11px] font-semibold transition-colors"
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
};

export default App;
