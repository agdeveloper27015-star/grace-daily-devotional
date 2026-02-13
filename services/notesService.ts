import { VerseNote } from '../types';

const NOTES_KEY = 'grace_notes';

export const getNotes = (): VerseNote[] => {
  const stored = localStorage.getItem(NOTES_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveNotes = (notes: VerseNote[]): void => {
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
};

export const addNote = (
  bookAbbrev: string, 
  bookName: string, 
  chapter: number, 
  verse: number, 
  noteText: string
): VerseNote => {
  const notes = getNotes();
  
  // Check if note already exists for this verse
  const existingIndex = notes.findIndex(
    n => n.bookAbbrev === bookAbbrev && 
         n.chapter === chapter && 
         n.verse === verse
  );
  
  const now = Date.now();
  
  if (existingIndex >= 0) {
    // Update existing note
    notes[existingIndex] = {
      ...notes[existingIndex],
      note: noteText,
      updatedAt: now
    };
    saveNotes(notes);
    return notes[existingIndex];
  }
  
  // Create new note
  const newNote: VerseNote = {
    id: `${bookAbbrev}_${chapter}_${verse}_${now}`,
    bookAbbrev,
    bookName,
    chapter,
    verse,
    note: noteText,
    timestamp: now,
    updatedAt: now
  };
  
  notes.push(newNote);
  saveNotes(notes);
  return newNote;
};

export const updateNote = (id: string, noteText: string): VerseNote | null => {
  const notes = getNotes();
  const index = notes.findIndex(n => n.id === id);
  
  if (index >= 0) {
    notes[index] = {
      ...notes[index],
      note: noteText,
      updatedAt: Date.now()
    };
    saveNotes(notes);
    return notes[index];
  }
  return null;
};

export const deleteNote = (id: string): void => {
  const notes = getNotes();
  const filtered = notes.filter(n => n.id !== id);
  saveNotes(filtered);
};

export const getNoteByReference = (
  bookAbbrev: string, 
  chapter: number, 
  verse: number
): VerseNote | null => {
  const notes = getNotes();
  return notes.find(
    n => n.bookAbbrev === bookAbbrev && 
         n.chapter === chapter && 
         n.verse === verse
  ) || null;
};

export const hasNote = (bookAbbrev: string, chapter: number, verse: number): boolean => {
  return getNoteByReference(bookAbbrev, chapter, verse) !== null;
};

export const getNotesByBook = (bookAbbrev: string): VerseNote[] => {
  const notes = getNotes();
  return notes.filter(n => n.bookAbbrev === bookAbbrev);
};

export const getNotesByChapter = (bookAbbrev: string, chapter: number): VerseNote[] => {
  const notes = getNotes();
  return notes.filter(n => n.bookAbbrev === bookAbbrev && n.chapter === chapter);
};
