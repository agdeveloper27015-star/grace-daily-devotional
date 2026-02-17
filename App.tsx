import React, { useEffect, useState } from 'react';
import Home from './components/Home';
import Reading from './components/Reading';
import Search from './components/Search';
import Profile from './components/Profile';
import Notebook from './components/Notebook';
import AuthGate from './components/auth/AuthGate';
import SyncLoginBanner from './components/auth/SyncLoginBanner';
import PrimaryTopNav from './components/layout/PrimaryTopNav';
import { AppView, NavigateFn, NavigateOptions, NavigationTarget, NotebookTab } from './types';
import { getSession, onAuthStateChange, signInWithGoogle } from './services/authService';
import { isSupabaseConfigured } from './services/supabaseClient';
import { STORAGE_KEYS } from './services/storageKeys';

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Bom dia';
  if (hour >= 12 && hour < 18) return 'Boa tarde';
  return 'Boa noite';
};

const DEFAULT_DISPLAY_NAME = 'Peregrino';
const BANNER_REAPPEAR_MS = 24 * 60 * 60 * 1000;

const getDisplayName = (session: Awaited<ReturnType<typeof getSession>>): string => {
  if (!session?.user) return DEFAULT_DISPLAY_NAME;

  const metadata = (session.user.user_metadata ?? {}) as Record<string, unknown>;
  const candidates = [
    metadata.full_name,
    metadata.name,
    metadata.given_name,
    session.user.email?.split('@')[0],
  ];

  const firstValid = candidates.find((candidate) => typeof candidate === 'string' && candidate.trim().length > 0) as string | undefined;
  if (!firstValid) return DEFAULT_DISPLAY_NAME;

  const trimmed = firstValid.trim();
  const firstName = trimmed.split(/\s+/)[0];
  return firstName || DEFAULT_DISPLAY_NAME;
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('ESTUDO');
  const [readingTarget, setReadingTarget] = useState<NavigationTarget | null>(null);
  const [notebookTab, setNotebookTab] = useState<NotebookTab>('FAVORITOS');
  const [focusMode, setFocusMode] = useState(false);
  const [greeting] = useState(getGreeting());
  const [displayName, setDisplayName] = useState(DEFAULT_DISPLAY_NAME);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [bannerDismissedAt, setBannerDismissedAt] = useState<number | null>(null);

  const handleNavigate: NavigateFn = (view: AppView, options?: NavigateOptions) => {
    if (options?.target) {
      setReadingTarget(options.target);
    }

    if (options?.notebookTab) {
      setNotebookTab(options.notebookTab);
    }

    setCurrentView(view);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view') as AppView | null;
    const bookAbbrev = params.get('book');
    const chapter = params.get('chapter');
    const verse = params.get('verse');

    if (view && ['ESTUDO', 'LEITURA', 'BUSCA', 'CADERNO', 'PERFIL'].includes(view)) {
      setCurrentView(view);
    }

    if (!bookAbbrev || !chapter) return;

    const parsedChapter = Number.parseInt(chapter, 10);
    const parsedVerse = verse ? Number.parseInt(verse, 10) : undefined;
    if (Number.isNaN(parsedChapter)) return;

    setReadingTarget({
      bookAbbrev,
      chapter: parsedChapter,
      verse: parsedVerse,
    });
    setCurrentView('LEITURA');
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setDisplayName(DEFAULT_DISPLAY_NAME);
      setIsAuthenticated(false);
      return;
    }

    let active = true;

    const syncSessionState = async () => {
      try {
        const session = await getSession();
        if (!active) return;
        setDisplayName(getDisplayName(session));
        setIsAuthenticated(Boolean(session));
      } catch {
        if (active) {
          setDisplayName(DEFAULT_DISPLAY_NAME);
          setIsAuthenticated(false);
        }
      }
    };

    void syncSessionState();

    const { data } = onAuthStateChange((_event, session) => {
      setDisplayName(getDisplayName(session));
      setIsAuthenticated(Boolean(session));
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEYS.syncBannerDismissedAt);
    if (!raw) return;
    const parsed = Number(raw);
    if (!Number.isNaN(parsed)) {
      setBannerDismissedAt(parsed);
    }
  }, []);

  const handleRequestSignIn = async () => {
    await signInWithGoogle();
  };

  const dismissSyncBanner = () => {
    const now = Date.now();
    setBannerDismissedAt(now);
    localStorage.setItem(STORAGE_KEYS.syncBannerDismissedAt, String(now));
  };

  const shouldShowSyncBanner =
    isSupabaseConfigured &&
    !isAuthenticated &&
    !focusMode &&
    currentView !== 'LEITURA' &&
    (!bannerDismissedAt || Date.now() - bannerDismissedAt >= BANNER_REAPPEAR_MS);

  const showPrimaryTopNav = !focusMode;
  const topNavMode = currentView === 'ESTUDO' ? 'home' : 'compact';

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
        return <Profile isAuthenticated={isAuthenticated} onRequestSignIn={isSupabaseConfigured ? handleRequestSignIn : undefined} />;
      default:
        return <Home onNavigate={handleNavigate} />;
    }
  };

  const appShell = (
    <div className="app-shell">
      {showPrimaryTopNav && (
        <PrimaryTopNav
          mode={topNavMode}
          currentView={currentView}
          greeting={greeting}
          displayName={displayName}
          onNavigate={(view) => handleNavigate(view)}
        />
      )}

      {shouldShowSyncBanner && (
        <SyncLoginBanner onRequestSignIn={handleRequestSignIn} onDismiss={dismissSyncBanner} />
      )}

      <div className={`app-main-grid ${currentView === 'ESTUDO' ? 'app-main-grid--home' : ''}`}>
        <main className="min-w-0">{renderContent()}</main>
      </div>
    </div>
  );

  return <AuthGate>{appShell}</AuthGate>;
};

export default App;
