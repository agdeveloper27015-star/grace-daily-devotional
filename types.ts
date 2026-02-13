import React from 'react';

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