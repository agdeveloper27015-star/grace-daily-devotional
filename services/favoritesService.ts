import { FavoriteVerse } from '../types';
import { syncDomain } from './cloudSyncService';
import { dispatchDataUpdated } from './localStateService';
import { touchSyncDomain } from './syncMetaService';
import { STORAGE_KEYS } from './storageKeys';

const FAVORITES_KEY = STORAGE_KEYS.favorites;

export const getFavorites = (): FavoriteVerse[] => {
  const stored = localStorage.getItem(FAVORITES_KEY);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveFavorites = (favorites: FavoriteVerse[]): void => {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  touchSyncDomain('favorites');
  dispatchDataUpdated('favorites');
  void syncDomain('favorites');
};

export const addFavorite = (verse: Omit<FavoriteVerse, 'id' | 'timestamp'>): FavoriteVerse => {
  const favorites = getFavorites();
  
  // Check if already exists
  const exists = favorites.some(
    f => f.bookAbbrev === verse.bookAbbrev && 
         f.chapter === verse.chapter && 
         f.verse === verse.verse
  );
  
  if (exists) {
    return favorites.find(
      f => f.bookAbbrev === verse.bookAbbrev && 
           f.chapter === verse.chapter && 
           f.verse === verse.verse
    )!;
  }
  
  const newFavorite: FavoriteVerse = {
    ...verse,
    id: `${verse.bookAbbrev}_${verse.chapter}_${verse.verse}_${Date.now()}`,
    timestamp: Date.now()
  };
  
  favorites.push(newFavorite);
  saveFavorites(favorites);
  return newFavorite;
};

export const removeFavorite = (id: string): void => {
  const favorites = getFavorites();
  const filtered = favorites.filter(f => f.id !== id);
  saveFavorites(filtered);
};

export const isFavorite = (bookAbbrev: string, chapter: number, verse: number): boolean => {
  const favorites = getFavorites();
  return favorites.some(
    f => f.bookAbbrev === bookAbbrev && 
         f.chapter === chapter && 
         f.verse === verse
  );
};

export const toggleFavorite = (verse: Omit<FavoriteVerse, 'id' | 'timestamp'>): boolean => {
  const favorites = getFavorites();
  const existing = favorites.find(
    f => f.bookAbbrev === verse.bookAbbrev && 
         f.chapter === verse.chapter && 
         f.verse === verse.verse
  );
  
  if (existing) {
    removeFavorite(existing.id);
    return false;
  } else {
    addFavorite(verse);
    return true;
  }
};

export const getFavoriteByReference = (
  bookAbbrev: string, 
  chapter: number, 
  verse: number
): FavoriteVerse | null => {
  const favorites = getFavorites();
  return favorites.find(
    f => f.bookAbbrev === bookAbbrev && 
         f.chapter === chapter && 
         f.verse === verse
  ) || null;
};
