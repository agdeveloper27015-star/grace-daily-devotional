import { describe, expect, it } from 'vitest';
import { getSession, signInWithGoogle } from '../../services/authService';

describe('authService', () => {
  it('falha quando Supabase nao esta configurado no ambiente de teste', async () => {
    await expect(signInWithGoogle()).rejects.toThrow('Supabase nao configurado');
    await expect(getSession()).rejects.toThrow('Supabase nao configurado');
  });
});
