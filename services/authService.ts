import { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

const assertSupabase = () => {
  if (!supabase) {
    throw new Error('Supabase nao configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
  }
  return supabase;
};

export const signInWithGoogle = async (): Promise<void> => {
  const client = assertSupabase();
  const redirectTo = `${window.location.origin}/`;
  const { error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  });

  if (error) {
    throw error;
  }
};

export const signOut = async (): Promise<void> => {
  const client = assertSupabase();
  const { error } = await client.auth.signOut();
  if (error) throw error;
};

export const getSession = async (): Promise<Session | null> => {
  const client = assertSupabase();
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  return data.session;
};

export const getCurrentUserId = async (): Promise<string | null> => {
  const session = await getSession();
  return session?.user?.id ?? null;
};

export const onAuthStateChange = (callback: (event: AuthChangeEvent, session: Session | null) => void) => {
  const client = assertSupabase();
  return client.auth.onAuthStateChange(callback);
};
