import { describe, expect, it } from 'vitest';
import { getSession, signInWithGoogle } from '../../services/authService';
import { isSupabaseConfigured } from '../../services/supabaseClient';

describe('authService', () => {
  it('falha quando Supabase nao esta configurado no ambiente de teste', async () => {
    if (isSupabaseConfigured) {
      // Em ambientes com variáveis reais, este teste não é aplicável.
      expect(isSupabaseConfigured).toBe(true);
      return;
    }

    await expect(signInWithGoogle()).rejects.toThrow('Supabase nao configurado');
    await expect(getSession()).rejects.toThrow('Supabase nao configurado');
  });
});
