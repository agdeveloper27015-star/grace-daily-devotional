import { SyncDomain } from '../types';
import { STORAGE_KEYS } from './storageKeys';

export const APP_DATA_UPDATED_EVENT = 'grace:data-updated';

const DOMAIN_TO_KEY: Record<SyncDomain, string> = {
  favorites: STORAGE_KEYS.favorites,
  notes: STORAGE_KEYS.notes,
  highlights: STORAGE_KEYS.highlights,
  progress: STORAGE_KEYS.progress,
  chapters: STORAGE_KEYS.chaptersRead,
  settings: STORAGE_KEYS.settings,
  plan: STORAGE_KEYS.readingPlan,
};

const hasStorage = (): boolean => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const getStorageJSON = <T>(key: string, fallback: T): T => {
  if (!hasStorage()) return fallback;
  const stored = localStorage.getItem(key);
  if (!stored) return fallback;

  try {
    const parsed = JSON.parse(stored) as T | null;
    if (parsed === null || typeof parsed === 'undefined') return fallback;
    return parsed;
  } catch {
    return fallback;
  }
};

export const setStorageJSON = (key: string, value: unknown): void => {
  if (!hasStorage()) return;
  localStorage.setItem(key, JSON.stringify(value));
};

export const dispatchDataUpdated = (domain: SyncDomain): void => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(APP_DATA_UPDATED_EVENT, { detail: { domain } }));
};

export const getLocalDomainPayload = (domain: SyncDomain): unknown => {
  const key = DOMAIN_TO_KEY[domain];
  switch (domain) {
    case 'favorites':
    case 'notes':
    case 'highlights':
    case 'chapters':
    case 'plan':
      return getStorageJSON(key, domain === 'plan' ? null : []);
    case 'progress':
      return getStorageJSON(key, null);
    case 'settings':
      return getStorageJSON(key, null);
    default:
      return null;
  }
};

export const setLocalDomainPayload = (domain: SyncDomain, payload: unknown): void => {
  const key = DOMAIN_TO_KEY[domain];
  setStorageJSON(key, payload);
  dispatchDataUpdated(domain);
};
