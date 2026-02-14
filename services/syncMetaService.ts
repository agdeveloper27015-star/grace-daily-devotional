import { SyncDomain, SyncMeta } from '../types';
import { getStorageJSON, setStorageJSON } from './localStateService';
import { STORAGE_KEYS } from './storageKeys';

const defaultSyncMeta = (): SyncMeta => ({
  favorites: 0,
  notes: 0,
  highlights: 0,
  progress: 0,
  chapters: 0,
  settings: 0,
  plan: 0,
  lastSyncedAt: 0,
});

export const getSyncMeta = (): SyncMeta => {
  const stored = getStorageJSON<Partial<SyncMeta>>(STORAGE_KEYS.syncMeta, {});
  return {
    ...defaultSyncMeta(),
    ...stored,
  };
};

export const saveSyncMeta = (meta: SyncMeta): void => {
  setStorageJSON(STORAGE_KEYS.syncMeta, meta);
};

export const touchSyncDomain = (domain: SyncDomain, timestamp: number = Date.now()): void => {
  const meta = getSyncMeta();
  meta[domain] = timestamp;
  saveSyncMeta(meta);
};

export const markSyncCompleted = (timestamp: number = Date.now()): void => {
  const meta = getSyncMeta();
  meta.lastSyncedAt = timestamp;
  saveSyncMeta(meta);
};

export const mergeSyncMeta = (incoming: Partial<SyncMeta>): void => {
  const current = getSyncMeta();
  saveSyncMeta({
    ...current,
    ...incoming,
  });
};
