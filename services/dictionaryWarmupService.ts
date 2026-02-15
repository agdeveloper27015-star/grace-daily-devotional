import { DictionaryIndex, loadDictionaryIndex } from './dictionaryService';

export const DICTIONARY_WARMUP_EVENT = 'grace:dictionary-warmup-progress';
export const DICTIONARY_WARMUP_STATUS_KEY = 'grace_dictionary_warmup_status';
const DICTIONARY_CACHE_NAME = 'biblia-dabar-cache-v2';
const DICTIONARY_INDEX_URL = '/data/dictionary/index.json';

export type DictionaryWarmupPhase = 'idle' | 'running' | 'done' | 'error';

export interface DictionaryWarmupStatus {
  phase: DictionaryWarmupPhase;
  completed: number;
  total: number;
  percentage: number;
  updatedAt: number;
  error?: string;
}

const DEFAULT_STATUS: DictionaryWarmupStatus = {
  phase: 'idle',
  completed: 0,
  total: 0,
  percentage: 0,
  updatedAt: 0,
};

let warmupInFlight: Promise<DictionaryWarmupStatus> | null = null;
let memoryStatus: DictionaryWarmupStatus = DEFAULT_STATUS;

const getSafeStorage = (): Storage | null => {
  if (typeof window === 'undefined') return null;
  const storageCandidate = (window as unknown as { localStorage?: Storage }).localStorage;
  if (!storageCandidate) return null;
  if (typeof storageCandidate.getItem !== 'function') return null;
  if (typeof storageCandidate.setItem !== 'function') return null;
  return storageCandidate;
};

const emitStatus = (status: DictionaryWarmupStatus): void => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(DICTIONARY_WARMUP_EVENT, { detail: status }));
};

const getCacheStorage = (): CacheStorage | null => {
  if (typeof window === 'undefined') return null;
  const cacheCandidate = (window as unknown as { caches?: CacheStorage }).caches;
  if (!cacheCandidate) return null;
  if (typeof cacheCandidate.open !== 'function') return null;
  return cacheCandidate;
};

const persistToCache = async (requestUrl: string, response: Response): Promise<void> => {
  const cacheStorage = getCacheStorage();
  if (!cacheStorage) return;

  try {
    const cache = await cacheStorage.open(DICTIONARY_CACHE_NAME);
    await cache.put(requestUrl, response);
  } catch (error) {
    console.warn('[DictionaryWarmup] Falha ao persistir shard em cache:', error);
  }
};

const saveStatus = (status: DictionaryWarmupStatus): void => {
  memoryStatus = status;
  const storage = getSafeStorage();
  storage?.setItem(DICTIONARY_WARMUP_STATUS_KEY, JSON.stringify(status));
  if (typeof window !== 'undefined') emitStatus(status);
};

const parseStatus = (raw: string | null): DictionaryWarmupStatus => {
  if (!raw) return DEFAULT_STATUS;
  try {
    const parsed = JSON.parse(raw) as Partial<DictionaryWarmupStatus>;
    return {
      phase: parsed.phase || 'idle',
      completed: Number(parsed.completed || 0),
      total: Number(parsed.total || 0),
      percentage: Number(parsed.percentage || 0),
      updatedAt: Number(parsed.updatedAt || 0),
      error: parsed.error ? String(parsed.error) : undefined,
    };
  } catch {
    return DEFAULT_STATUS;
  }
};

export const getDictionaryWarmupStatus = (): DictionaryWarmupStatus => {
  const storage = getSafeStorage();
  if (!storage) return memoryStatus;
  return parseStatus(storage.getItem(DICTIONARY_WARMUP_STATUS_KEY));
};

export const isDictionaryOfflineReady = (): boolean => getDictionaryWarmupStatus().phase === 'done';

const postWarmupDoneToServiceWorker = async (index: DictionaryIndex): Promise<void> => {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    if (registration.active) {
      registration.active.postMessage({
        type: 'DICTIONARY_SYNC_COMPLETE',
        payload: {
          version: index.version,
          totalChapters: index.totalChapters,
          totalEntries: index.totalEntries,
          completedAt: Date.now(),
        },
      });
    }
  } catch (error) {
    console.warn('[DictionaryWarmup] Falha ao notificar service worker:', error);
  }
};

const updateProgress = (
  base: Omit<DictionaryWarmupStatus, 'completed' | 'percentage' | 'updatedAt'>,
  completed: number
): DictionaryWarmupStatus => {
  const total = Math.max(0, base.total);
  const percentage = total === 0 ? 0 : Math.min(100, Math.round((completed / total) * 100));
  return {
    ...base,
    completed,
    percentage,
    updatedAt: Date.now(),
  };
};

interface WarmupOptions {
  force?: boolean;
  concurrency?: number;
}

export const warmupDictionaryOffline = async (
  options: WarmupOptions = {}
): Promise<DictionaryWarmupStatus> => {
  const force = options.force === true;
  const concurrency = Math.max(1, Math.min(8, options.concurrency || 4));

  if (typeof window === 'undefined') return DEFAULT_STATUS;
  if (warmupInFlight) return warmupInFlight;

  const current = getDictionaryWarmupStatus();
  if (!force && current.phase === 'done') {
    return current;
  }

  warmupInFlight = (async () => {
    try {
      const index = await loadDictionaryIndex();
      await persistToCache(
        DICTIONARY_INDEX_URL,
        new Response(JSON.stringify(index), {
          headers: { 'content-type': 'application/json' },
        })
      );

      const chapterPaths = Object.values(index.chapters).map((meta) => meta.path);
      const total = chapterPaths.length;

      let baseStatus: Omit<DictionaryWarmupStatus, 'completed' | 'percentage' | 'updatedAt'> = {
        phase: 'running',
        total,
      };
      let completed = 0;
      saveStatus(updateProgress(baseStatus, completed));

      let cursor = 0;
      const workers = Array.from({ length: Math.min(concurrency, chapterPaths.length || 1) }, async () => {
        while (cursor < chapterPaths.length) {
          const idx = cursor;
          cursor += 1;
          const path = chapterPaths[idx];
          const response = await fetch(path);
          if (!response.ok) {
            throw new Error(`Falha ao baixar shard: ${path} (${response.status})`);
          }
          await persistToCache(path, response.clone());
          completed += 1;
          if (completed % 10 === 0 || completed === total) {
            saveStatus(updateProgress(baseStatus, completed));
          }
        }
      });

      await Promise.all(workers);
      completed = total;

      baseStatus = { phase: 'done', total };
      const finalStatus = updateProgress(baseStatus, completed);
      saveStatus(finalStatus);
      await postWarmupDoneToServiceWorker(index);
      return finalStatus;
    } catch (error) {
      const failed: DictionaryWarmupStatus = {
        phase: 'error',
        completed: 0,
        total: 0,
        percentage: 0,
        updatedAt: Date.now(),
        error: error instanceof Error ? error.message : 'Falha inesperada no warmup',
      };
      saveStatus(failed);
      return failed;
    } finally {
      warmupInFlight = null;
    }
  })();

  return warmupInFlight;
};
