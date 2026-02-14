import React from 'react';

export interface NavigationTarget {
  bookAbbrev: string;
  chapter: number;
  verse?: number;
}

export type AppView = 'ESTUDO' | 'LEITURA' | 'BUSCA' | 'CADERNO' | 'PERFIL';
export type NotebookTab = 'FAVORITOS' | 'NOTAS';

export interface NavigateOptions {
  target?: NavigationTarget;
  notebookTab?: NotebookTab;
}

export type NavigateFn = (view: AppView, options?: NavigateOptions) => void;

export interface Scripture {
  text: string;
  reference: string;
}

export interface ReadingProgress {
  book: string;
  chapter: number;
  percentage: number;
}

export interface ExploreItem {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}

// Bible types
export interface BibleBook {
  abbrev: string;
  name: string;
  chapters: string[][];
}

export interface BibleVerse {
  number: number;
  text: string;
  bookAbbrev?: string;
  bookName?: string;
  chapterNumber?: number;
}

export interface BibleChapter {
  bookAbbrev: string;
  bookName: string;
  chapterNumber: number;
  verses: BibleVerse[];
}

export interface BibleReference {
  bookAbbrev: string;
  bookName: string;
  chapter: number;
  verse: number;
}

// Favorites types
export interface FavoriteVerse {
  id: string;
  bookAbbrev: string;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
  timestamp: number;
}

// Notes types
export interface VerseNote {
  id: string;
  bookAbbrev: string;
  bookName: string;
  chapter: number;
  verse: number;
  note: string;
  timestamp: number;
  updatedAt: number;
}

// Highlight types
export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink' | 'orange';

export interface VerseHighlight {
  id: string;
  bookAbbrev: string;
  chapter: number;
  verse: number;
  color: HighlightColor;
  timestamp: number;
}

export type ThemePreference = 'system' | 'light' | 'dark';

export interface UserSettings {
  theme: ThemePreference;
  notificationEnabled: boolean;
  notificationTime: string;
  timezone: string;
}

export interface ChapterReadRecord {
  bookAbbrev: string;
  chapter: number;
  readAt: number;
}

export interface ReadingPlanChapter {
  bookAbbrev: string;
  bookName: string;
  chapter: number;
}

export interface ReadingPlanDay {
  day: number;
  chapters: ReadingPlanChapter[];
}

export interface ReadingPlanDefinition {
  id: string;
  title: string;
  description: string;
  totalDays: number;
  days: ReadingPlanDay[];
}

export interface ReadingPlanState {
  planId: string;
  isActive: boolean;
  startDate: string;
  completedDates: string[];
  openedChaptersByDate: Record<string, string[]>;
  updatedAt: number;
}

export type SyncDomain =
  | 'favorites'
  | 'notes'
  | 'highlights'
  | 'progress'
  | 'chapters'
  | 'settings'
  | 'plan';

export interface SyncMeta {
  favorites: number;
  notes: number;
  highlights: number;
  progress: number;
  chapters: number;
  settings: number;
  plan: number;
  lastSyncedAt: number;
}
