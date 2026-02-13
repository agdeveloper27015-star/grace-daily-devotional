import React, { useState, useEffect } from 'react';
import Home from './components/Home';
import Reading from './components/Reading';
import Search from './components/Search';
import Profile from './components/Profile';
import Favorites from './components/Favorites';
import Notes from './components/Notes';

type ViewType = 'INÍCIO' | 'LEITURA' | 'PESQUISA' | 'PERFIL' | 'FAVORITES' | 'NOTES';

export interface NavigationTarget {
  bookAbbrev: string;
  chapter: number;
  verse?: number;
}

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return 'Bom dia';
  } else if (hour >= 12 && hour < 18) {
    return 'Boa tarde';
  } else {
    return 'Boa noite';
  }
};

const VIEW_LABELS: Record<ViewType, string> = {
  'INÍCIO': 'Início',
  'LEITURA': 'Leitura',
  'PESQUISA': 'Pesquisa',
  'PERFIL': 'Perfil',
  'FAVORITES': 'Favoritos',
  'NOTES': 'Notas',
} as const;

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('INÍCIO');
  const [readingTarget, setReadingTarget] = useState<NavigationTarget | null>(null);
  const [greeting] = useState<string>(getGreeting());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.classList.add('sidebar-open');
    } else {
      document.body.classList.remove('sidebar-open');
    }
    return () => document.body.classList.remove('sidebar-open');
  }, [sidebarOpen]);

  const handleNavigate = (view: string, target?: NavigationTarget) => {
    if (view === 'FAVORITES' || view === 'NOTES' ||
        view === 'INÍCIO' || view === 'LEITURA' || view === 'PESQUISA' || view === 'PERFIL') {
      if (target) setReadingTarget(target);
      setCurrentView(view as ViewType);
    }
  };

  const handleSidebarNav = (view: ViewType) => {
    setCurrentView(view);
    setSidebarOpen(false);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'INÍCIO':
        return <Home onNavigate={handleNavigate} />;
      case 'LEITURA':
        return <Reading initialTarget={readingTarget} onTargetConsumed={() => setReadingTarget(null)} onFocusModeChange={setFocusMode} />;
      case 'PESQUISA':
        return <Search onNavigate={handleNavigate} />;
      case 'PERFIL':
        return <Profile />;
      case 'FAVORITES':
        return <Favorites />;
      case 'NOTES':
        return <Notes />;
      default:
        return <Home onNavigate={handleNavigate} />;
    }
  };

  const navItems: { view: ViewType; label: string; icon: React.ReactNode }[] = [
    {
      view: 'INÍCIO', label: 'Inicio',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
    },
    {
      view: 'LEITURA', label: 'Leitura',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
    },
    {
      view: 'PESQUISA', label: 'Pesquisa',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
    },
  ];

  const secondaryNavItems: { view: ViewType; label: string; icon: React.ReactNode }[] = [
    {
      view: 'FAVORITES', label: 'Favoritos',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
    },
    {
      view: 'NOTES', label: 'Notas',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
    },
    {
      view: 'PERFIL', label: 'Perfil',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
    },
  ];

  return (
    <div className="min-h-screen bg-grace-bg relative">
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <aside className={`fixed left-0 top-0 h-full w-72 bg-grace-surface z-50 transform transition-transform duration-300 ease-in-out flex flex-col border-r border-grace-border ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Brand */}
        <div className="px-6 pt-12 pb-8">
          <h1 className="font-serif text-3xl text-terra tracking-wide">Grace</h1>
          <p className="text-[10px] text-cream-muted uppercase tracking-[0.2em] mt-1">Devocional Diário</p>
        </div>

        {/* Main nav */}
        <nav className="flex-1 px-3">
          <ul className="space-y-1">
            {navItems.map(item => (
              <li key={item.view}>
                <button
                  onClick={() => handleSidebarNav(item.view)}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    currentView === item.view
                      ? 'bg-terra/15 text-terra border-l-2 border-terra'
                      : 'text-cream-muted hover:text-cream hover:bg-grace-surface-2'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              </li>
            ))}
          </ul>

          <div className="h-px bg-grace-border my-4 mx-4" />

          <ul className="space-y-1">
            {secondaryNavItems.map(item => (
              <li key={item.view}>
                <button
                  onClick={() => handleSidebarNav(item.view)}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    currentView === item.view
                      ? 'bg-terra/15 text-terra border-l-2 border-terra'
                      : 'text-cream-muted hover:text-cream hover:bg-grace-surface-2'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="px-6 py-6 border-t border-grace-border">
          <p className="text-[10px] text-grace-muted">Grace v2.0</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col min-h-screen max-w-lg mx-auto">
        {/* Compact Header */}
        {!focusMode && (
          <header className="sticky top-0 z-30 bg-grace-bg/90 backdrop-blur-md px-6 py-4 header-glow">
            <div className="flex justify-between items-center">
              {/* Hamburger */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 -ml-2 text-cream-muted hover:text-cream transition-colors"
                aria-label="Abrir menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
                </svg>
              </button>

              {/* Greeting / Page title */}
              <div className="text-center">
                {currentView === 'INÍCIO' ? (
                  <h1 className="text-lg tracking-tight text-cream font-extralight">
                    {greeting}, <span className="text-terra">Peregrino</span>
                  </h1>
                ) : (
                  <h1 className="text-xs font-semibold uppercase tracking-widest text-cream-muted">
                    {VIEW_LABELS[currentView]}
                  </h1>
                )}
              </div>

              {/* Avatar */}
              <div
                className="h-9 w-9 rounded-full bg-terra/20 border border-terra/30 flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
                onClick={() => { setCurrentView('PERFIL'); setSidebarOpen(false); }}
              >
                <svg className="w-4 h-4 text-terra" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          </header>
        )}

        {/* Main Content */}
        <main className={`flex-1 ${focusMode ? '' : 'px-6 pt-4 pb-12'}`}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
