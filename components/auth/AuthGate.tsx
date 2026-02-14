import React, { PropsWithChildren, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { getSession, onAuthStateChange } from '../../services/authService';
import { bootstrapAfterLogin } from '../../services/cloudSyncService';
import { isSupabaseConfigured } from '../../services/supabaseClient';
import AuthScreen from './AuthScreen';

const AuthGate: React.FC<PropsWithChildren> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bypassAuth, setBypassAuth] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setBypassAuth(true);
      setLoading(false);
      return;
    }

    let isMounted = true;

    const init = async () => {
      try {
        const currentSession = await getSession();
        if (!isMounted) return;
        setSession(currentSession);
        if (currentSession) {
          void bootstrapAfterLogin();
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Falha ao validar autenticacao.';
        if (isMounted) setError(message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void init();

    const { data } = onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) {
        void bootstrapAfterLogin();
      }
    });

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center justify-center px-4">
        <div className="paper-panel p-6 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-terra border-t-transparent" />
          <p className="mt-3 text-sm text-cream-muted">Carregando autenticacao...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center justify-center px-4">
        <div className="paper-panel p-6 text-center">
          <p className="section-kicker">Erro de autenticacao</p>
          <p className="mt-2 text-sm text-[var(--danger)]">{error}</p>
        </div>
      </main>
    );
  }

  if (bypassAuth) {
    return (
      <>
        <div
          style={{
            position: 'fixed',
            top: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            padding: '8px 12px',
            borderRadius: 999,
            border: '1px solid rgba(255,255,255,0.35)',
            background: 'rgba(17,17,17,0.82)',
            color: '#fff',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          Modo local sem auth (Supabase nao configurado)
        </div>
        {children}
      </>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  return <>{children}</>;
};

export default AuthGate;
