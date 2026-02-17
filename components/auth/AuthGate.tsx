import React, { PropsWithChildren, useEffect } from 'react';
import { getSession, onAuthStateChange } from '../../services/authService';
import { bootstrapAfterLogin } from '../../services/cloudSyncService';
import { isSupabaseConfigured } from '../../services/supabaseClient';

const AuthGate: React.FC<PropsWithChildren> = ({ children }) => {
  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    const init = async () => {
      try {
        const currentSession = await getSession();
        if (currentSession) {
          void bootstrapAfterLogin();
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Falha ao validar autenticacao.';
        // Non-blocking auth: app stays usable in local mode.
        console.warn('[AuthGate] ', message);
      }
    };

    void init();

    const { data } = onAuthStateChange((_event, nextSession) => {
      if (nextSession) {
        void bootstrapAfterLogin();
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  return <>{children}</>;
};

export default AuthGate;
