import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockDictionary = {
  genesis_1_1_principio: {
    palavra_pt: 'principio',
    palavra_original: 'bereshit',
    transliteracao: 'bereshit',
    strong: 'H7225',
    significado_raiz: 'inicio',
    significado_contextual: 'comeco absoluto',
    explicacao_detalhada: 'texto de teste',
    por_que_esta_palavra: 'teste',
    conexao_teologica: 'teste',
    referencias_relacionadas: [],
  },
};

describe('dictionaryService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify(mockDictionary), { status: 200, headers: { 'content-type': 'application/json' } }))
    );
  });

  it('encontra palavras do versiculo com cache por prefixo', async () => {
    const service = await import('../../services/dictionaryService');

    const found = await service.findWordsInVerse('gn', 1, 1, 'No principio criou Deus os ceus e a terra.');

    expect(found).toHaveLength(1);
    expect(found[0].entry.strong).toBe('H7225');
  });
});
