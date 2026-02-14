import { ThemePreference, UserSettings } from '../types';
import { syncDomain } from './cloudSyncService';
import { APP_DATA_UPDATED_EVENT, dispatchDataUpdated, getStorageJSON, setStorageJSON } from './localStateService';
import { touchSyncDomain } from './syncMetaService';
import { STORAGE_KEYS } from './storageKeys';

export const DEFAULT_NOTIFICATION_TIME = '07:00';

export const getDefaultSettings = (): UserSettings => ({
  theme: 'system',
  notificationEnabled: false,
  notificationTime: DEFAULT_NOTIFICATION_TIME,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
});

export const getUserSettings = (): UserSettings => {
  const stored = getStorageJSON<Partial<UserSettings>>(STORAGE_KEYS.settings, {});
  return {
    ...getDefaultSettings(),
    ...stored,
  };
};

export const saveUserSettings = (settings: UserSettings): void => {
  setStorageJSON(STORAGE_KEYS.settings, settings);
  touchSyncDomain('settings');
  dispatchDataUpdated('settings');
  void syncDomain('settings');
};

export const updateUserSettings = (updates: Partial<UserSettings>): UserSettings => {
  const next = {
    ...getUserSettings(),
    ...updates,
  };
  saveUserSettings(next);
  return next;
};

export const resolveTheme = (preference: ThemePreference): 'light' | 'dark' => {
  if (preference === 'light' || preference === 'dark') return preference;

  if (typeof window === 'undefined' || !window.matchMedia) {
    return 'light';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const applyThemeToDocument = (preference: ThemePreference): void => {
  if (typeof document === 'undefined') return;
  const resolved = resolveTheme(preference);
  document.documentElement.setAttribute('data-theme', resolved);
  document.documentElement.setAttribute('data-theme-preference', preference);
};

export const initializeTheme = (): void => {
  const settings = getUserSettings();
  applyThemeToDocument(settings.theme);

  if (typeof window === 'undefined' || !window.matchMedia) return;

  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const listener = () => {
    const nextSettings = getUserSettings();
    if (nextSettings.theme === 'system') {
      applyThemeToDocument('system');
    }
  };

  if (typeof media.addEventListener === 'function') {
    media.addEventListener('change', listener);
  } else {
    media.addListener(listener);
  }

  window.addEventListener(APP_DATA_UPDATED_EVENT, (event) => {
    const detail = (event as CustomEvent<{ domain?: string }>).detail;
    if (detail?.domain === 'settings') {
      const nextSettings = getUserSettings();
      applyThemeToDocument(nextSettings.theme);
    }
  });
};

export const setThemePreference = (theme: ThemePreference): void => {
  updateUserSettings({ theme });
  applyThemeToDocument(theme);
};
