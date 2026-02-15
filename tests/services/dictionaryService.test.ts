import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockIndex = {
  version: 'test',
  generatedAt: '2026-01-01T00:00:00.000Z',
  totalEntries: 1,
  totalBooks: 1,
  totalChapters: 1,
  dictionaryHash: 'abc123',
  books: {
    genesis: {
      chapters: [1],
      entryCount: 1,
    },
  },
  chapters: {
    genesis_1: {
      path: '/data/dictionary/chapters/genesis/1.json',
      entryCount: 1,
      size: 123,
    },
  },
};

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
    referencias_relacionadas: ['Gênesis 1:1', 'João 1:1'],
  },
};

describe('dictionaryService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);

        if (url.endsWith('/data/dictionary/index.json')) {
          return new Response(JSON.stringify(mockIndex), { status: 200, headers: { 'content-type': 'application/json' } });
        }

        if (url.endsWith('/data/dictionary/chapters/genesis/1.json')) {
          return new Response(JSON.stringify(mockDictionary), { status: 200, headers: { 'content-type': 'application/json' } });
        }

        return new Response('{}', { status: 404, headers: { 'content-type': 'application/json' } });
      })
    );
  });

  it('encontra palavras do versiculo com cache por prefixo', async () => {
    const service = await import('../../services/dictionaryService');

    const found = await service.findWordsInVerse('gn', 1, 1, 'No principio criou Deus os ceus e a terra.');

    expect(found).toHaveLength(1);
    expect(found[0].entry.strong).toBe('H7225');
    expect(found[0].entry.referencias_relacionadas).toEqual(['Gênesis 1:1', 'João 1:1']);
  });

  it('retorna todas as ocorrencias da mesma palavra no versiculo', async () => {
    const service = await import('../../services/dictionaryService');

    const found = await service.findWordsInVerse('gn', 1, 1, 'No principio, o principio revela o inicio.');

    expect(found).toHaveLength(2);
    expect(found[0].word.toLowerCase()).toContain('principio');
    expect(found[1].word.toLowerCase()).toContain('principio');
    expect(found[0].index).toBeLessThan(found[1].index);
  });

  it('normaliza referencias antigas com objetos para string[]', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith('/data/dictionary/index.json')) {
          return new Response(JSON.stringify(mockIndex), { status: 200, headers: { 'content-type': 'application/json' } });
        }
        if (url.endsWith('/data/dictionary/chapters/genesis/1.json')) {
          return new Response(
            JSON.stringify({
              genesis_1_1_principio: {
                ...mockDictionary.genesis_1_1_principio,
                referencias_relacionadas: [
                  { referencia: 'Gênesis 1:1', relevancia: 'origem' },
                  { referencia: 'João 1:1', relevancia: 'paralelo' },
                ],
              },
            }),
            { status: 200, headers: { 'content-type': 'application/json' } }
          );
        }
        return new Response('{}', { status: 404, headers: { 'content-type': 'application/json' } });
      })
    );

    const service = await import('../../services/dictionaryService');
    const entry = await service.getDictionaryEntry('gn', 1, 1, 'princípio');
    expect(entry?.referencias_relacionadas).toEqual(['Gênesis 1:1', 'João 1:1']);
  });
});
