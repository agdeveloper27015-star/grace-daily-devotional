import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockIndex = {
  version: 'v-test',
  generatedAt: '2026-01-01T00:00:00.000Z',
  totalEntries: 2,
  totalBooks: 1,
  totalChapters: 2,
  dictionaryHash: 'test-hash',
  books: {
    genesis: {
      chapters: [1, 2],
      entryCount: 2,
    },
  },
  chapters: {
    genesis_1: {
      path: '/data/dictionary/chapters/genesis/1.json',
      entryCount: 1,
      size: 100,
    },
    genesis_2: {
      path: '/data/dictionary/chapters/genesis/2.json',
      entryCount: 1,
      size: 100,
    },
  },
};

describe('dictionaryWarmupService', () => {
  let cachePut: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
    const storage = window.localStorage as unknown as {
      clear?: () => void;
      removeItem?: (key: string) => void;
    };
    storage.removeItem?.('grace_dictionary_warmup_status');
    storage.clear?.();

    const postMessage = vi.fn();
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        ready: Promise.resolve({ active: { postMessage } }),
      },
    });

    cachePut = vi.fn(async () => undefined);
    Object.defineProperty(window, 'caches', {
      configurable: true,
      value: {
        open: vi.fn(async () => ({
          put: cachePut,
        })),
      },
    });
  });

  it('baixa os shards e marca status como concluido', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/data/dictionary/index.json')) {
        return new Response(JSON.stringify(mockIndex), { status: 200, headers: { 'content-type': 'application/json' } });
      }
      if (url.endsWith('/data/dictionary/chapters/genesis/1.json')) {
        return new Response(JSON.stringify({ genesis_1_1_principio: {} }), { status: 200, headers: { 'content-type': 'application/json' } });
      }
      if (url.endsWith('/data/dictionary/chapters/genesis/2.json')) {
        return new Response(JSON.stringify({ genesis_2_1_ceu: {} }), { status: 200, headers: { 'content-type': 'application/json' } });
      }
      return new Response('{}', { status: 404, headers: { 'content-type': 'application/json' } });
    });

    vi.stubGlobal('fetch', fetchMock);

    const service = await import('../../services/dictionaryWarmupService');
    const status = await service.warmupDictionaryOffline({ force: true, concurrency: 2 });

    expect(status.phase).toBe('done');
    expect(status.total).toBe(2);
    expect(status.completed).toBe(2);
    expect(status.percentage).toBe(100);

    const saved = service.getDictionaryWarmupStatus();
    expect(saved.phase).toBe('done');
    expect(saved.percentage).toBe(100);
    expect(service.isDictionaryOfflineReady()).toBe(true);
    expect(cachePut).toHaveBeenCalled();
    expect(cachePut).toHaveBeenCalledTimes(3);
  });

  it('nao reexecuta warmup quando ja concluido sem force', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/data/dictionary/index.json')) {
        return new Response(JSON.stringify(mockIndex), { status: 200, headers: { 'content-type': 'application/json' } });
      }
      if (url.endsWith('/data/dictionary/chapters/genesis/1.json')) {
        return new Response(JSON.stringify({ genesis_1_1_principio: {} }), { status: 200, headers: { 'content-type': 'application/json' } });
      }
      if (url.endsWith('/data/dictionary/chapters/genesis/2.json')) {
        return new Response(JSON.stringify({ genesis_2_1_ceu: {} }), { status: 200, headers: { 'content-type': 'application/json' } });
      }
      return new Response('{}', { status: 404, headers: { 'content-type': 'application/json' } });
    });

    vi.stubGlobal('fetch', fetchMock);

    const service = await import('../../services/dictionaryWarmupService');
    await service.warmupDictionaryOffline({ force: true, concurrency: 1 });
    const callsAfterFirstRun = fetchMock.mock.calls.length;

    const second = await service.warmupDictionaryOffline();
    expect(second.phase).toBe('done');
    expect(fetchMock.mock.calls.length).toBe(callsAfterFirstRun);
  });
});
