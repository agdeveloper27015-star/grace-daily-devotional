import React, { useState } from 'react';

interface SyncLoginBannerProps {
  onRequestSignIn: () => Promise<void>;
  onDismiss: () => void;
}

const SyncLoginBanner: React.FC<SyncLoginBannerProps> = ({ onRequestSignIn, onDismiss }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await onRequestSignIn();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao iniciar login.';
      setError(message);
      setLoading(false);
    }
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 z-50 px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:inset-x-auto lg:bottom-6 lg:right-6 lg:w-[420px] lg:px-0 lg:pb-0">
      <div className="pointer-events-auto paper-panel animate-in fade-in slide-in-from-bottom-4 border border-grace-border bg-grace-surface p-4">
        <div className="flex flex-col gap-3">
          <div className="min-w-0">
            <p className="section-kicker">Sincronização opcional</p>
            <p className="mt-1 text-sm font-semibold text-cream">Faça login para sincronizar</p>
            <p className="text-sm text-cream-muted">
              Seus dados locais continuam funcionando; entre para sincronizar na nuvem.
            </p>
            {error && <p className="mt-2 text-xs text-[var(--danger)]">{error}</p>}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={handleSignIn}
              disabled={loading}
              className="pill-button-accent inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M21.35 11.1h-9.18v2.92h5.27c-.23 1.5-1.78 4.4-5.27 4.4-3.17 0-5.76-2.62-5.76-5.86s2.59-5.86 5.76-5.86c1.8 0 3 .76 3.69 1.41l2.52-2.43C16.78 4.17 14.72 3.2 12.17 3.2 7.16 3.2 3.1 7.27 3.1 12.3s4.06 9.1 9.07 9.1c5.24 0 8.72-3.68 8.72-8.87 0-.6-.07-1.03-.15-1.43Z"
                />
              </svg>
              <span>{loading ? 'Conectando...' : 'Entrar com Google'}</span>
            </button>

            <button
              onClick={onDismiss}
              disabled={loading}
              className="pill-button px-3 py-2 text-xs font-semibold uppercase tracking-wider"
            >
              Agora não
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyncLoginBanner;
