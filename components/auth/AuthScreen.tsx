import React, { useState } from 'react';
import { signInWithGoogle } from '../../services/authService';

const AuthScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);

    try {
      await signInWithGoogle();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao iniciar login com Google.';
      setError(message);
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-10">
      <section className="paper-panel w-full p-6 sm:p-8">
        <p className="section-kicker">Acesso obrigatorio</p>
        <h1 className="editorial-title mt-2 text-5xl leading-none">Dabar Bible</h1>
        <p className="mt-3 text-sm text-cream-muted">
          Entre com sua conta Google para sincronizar progresso, favoritos e notas em todos os dispositivos.
        </p>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="pill-button-accent mt-6 inline-flex items-center gap-3 px-5 py-3 text-sm font-semibold"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d="M21.35 11.1h-9.18v2.92h5.27c-.23 1.5-1.78 4.4-5.27 4.4-3.17 0-5.76-2.62-5.76-5.86s2.59-5.86 5.76-5.86c1.8 0 3 .76 3.69 1.41l2.52-2.43C16.78 4.17 14.72 3.2 12.17 3.2 7.16 3.2 3.1 7.27 3.1 12.3s4.06 9.1 9.07 9.1c5.24 0 8.72-3.68 8.72-8.87 0-.6-.07-1.03-.15-1.43Z" />
          </svg>
          <span>{loading ? 'Redirecionando...' : 'Entrar com Google'}</span>
        </button>

        {error && <p className="mt-3 text-sm text-[var(--danger)]">{error}</p>}
      </section>
    </main>
  );
};

export default AuthScreen;
