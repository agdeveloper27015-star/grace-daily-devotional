import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { BibleBook, BibleChapter, BibleVerse, HighlightColor } from '../types';
import {
  fetchBibleData,
  getChapter,
  saveReadingProgress,
  getReadingProgress,
  getNextChapter,
  getPreviousChapter
} from '../services/bibleService';
import { isFavorite, toggleFavorite } from '../services/favoritesService';
import { hasNote, addNote, getNoteByReference, updateNote, deleteNote } from '../services/notesService';
import { findWordsInVerse, DictionaryEntry } from '../services/dictionaryService';
import { getHighlightsByChapter, addHighlight, removeHighlight } from '../services/highlightsService';
import DictionaryModal from './DictionaryModal';
import BookSelector from './BookSelector';
import ChapterSelector from './ChapterSelector';
import VerseDisplay from './VerseDisplay';
import FocusMode from './FocusMode';
import ReadingProgress from './ReadingProgress';

type ViewState = 'plans' | 'books' | 'chapters' | 'reading';

interface ReadingProps {
  initialTarget?: { bookAbbrev: string; chapter: number; verse?: number } | null;
  onTargetConsumed?: () => void;
  onFocusModeChange?: (active: boolean) => void;
}

interface VerseDictionaryWords {
  words: Array<{ word: string; entry: DictionaryEntry; index: number }>;
  loaded: boolean;
}

const Reading: React.FC<ReadingProps> = ({ initialTarget, onTargetConsumed, onFocusModeChange }) => {
  const [viewState, setViewState] = useState<ViewState>('plans');
  const [books, setBooks] = useState<BibleBook[]>([]);
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
  const [currentChapter, setCurrentChapter] = useState<BibleChapter | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedChapterNumber, setSelectedChapterNumber] = useState<number>(1);
  const [favoritedVerses, setFavoritedVerses] = useState<Set<string>>(new Set());
  const [versesWithNotes, setVersesWithNotes] = useState<Set<string>>(new Set());
  const [highlightedVerse, setHighlightedVerse] = useState<number | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);

  // Note modal
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [closingNoteModal, setClosingNoteModal] = useState(false);
  const [selectedVerseForNote, setSelectedVerseForNote] = useState<BibleVerse | null>(null);
  const [noteText, setNoteText] = useState('');
  const [existingNoteId, setExistingNoteId] = useState<string | null>(null);

  // Dictionary
  const [studyMode, setStudyMode] = useState(() => {
    const saved = localStorage.getItem('grace_study_mode');
    return saved ? JSON.parse(saved) : true;
  });
  const [dictionaryWords, setDictionaryWords] = useState<Map<number, VerseDictionaryWords>>(new Map());
  const [showDictionaryModal, setShowDictionaryModal] = useState(false);
  const [selectedDictionaryEntry, setSelectedDictionaryEntry] = useState<DictionaryEntry | null>(null);
  const [selectedWord, setSelectedWord] = useState('');
  const [loadingDictionary, setLoadingDictionary] = useState(false);

  // Highlights
  const [verseHighlights, setVerseHighlights] = useState<Map<number, HighlightColor>>(new Map());

  // Focus mode
  const [focusMode, setFocusMode] = useState(false);

  useEffect(() => {
    loadBooks().then(() => {
      if (initialTarget) {
        navigateToTarget(initialTarget.bookAbbrev, initialTarget.chapter, initialTarget.verse);
        if (onTargetConsumed) onTargetConsumed();
      } else {
        restoreProgress();
      }
    });
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    localStorage.setItem('grace_study_mode', JSON.stringify(studyMode));
  }, [studyMode]);

  useEffect(() => {
    if (currentChapter && studyMode) {
      loadDictionaryWords();
    }
  }, [currentChapter, studyMode]);

  useEffect(() => {
    if (currentChapter) {
      checkFavoritedVerses();
      checkVersesWithNotes();
      loadHighlights();
    }
  }, [currentChapter]);

  useEffect(() => {
    onFocusModeChange?.(focusMode);
  }, [focusMode]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToTarget = async (bookAbbrev: string, chapterNum: number, verseNum?: number) => {
    const bible = await fetchBibleData();
    const book = bible.find(b => b.abbrev === bookAbbrev);
    if (book) {
      setSelectedBook(book);
      setSelectedChapterNumber(chapterNum);
      const chapter = await getChapter(bookAbbrev, chapterNum);
      if (chapter) {
        setCurrentChapter(chapter);
        setViewState('reading');
        if (verseNum) {
          setHighlightedVerse(verseNum);
          setTimeout(() => {
            const el = document.getElementById(`verse-${verseNum}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 300);
          setTimeout(() => setHighlightedVerse(null), 3000);
        }
      }
    }
  };

  const loadBooks = async () => {
    const bibleBooks = await fetchBibleData();
    setBooks(bibleBooks);
  };

  const restoreProgress = async () => {
    const progress = getReadingProgress();
    if (progress) {
      const bible = await fetchBibleData();
      const book = bible.find(b => b.abbrev === progress.bookAbbrev);
      if (book) {
        setSelectedBook(book);
        setSelectedChapterNumber(progress.chapter);
      }
    }
  };

  const checkFavoritedVerses = () => {
    if (!currentChapter) return;
    const favorited = new Set<string>();
    currentChapter.verses.forEach(verse => {
      if (isFavorite(currentChapter.bookAbbrev, currentChapter.chapterNumber, verse.number)) {
        favorited.add(`${verse.number}`);
      }
    });
    setFavoritedVerses(favorited);
  };

  const checkVersesWithNotes = () => {
    if (!currentChapter) return;
    const withNotes = new Set<string>();
    currentChapter.verses.forEach(verse => {
      if (hasNote(currentChapter.bookAbbrev, currentChapter.chapterNumber, verse.number)) {
        withNotes.add(`${verse.number}`);
      }
    });
    setVersesWithNotes(withNotes);
  };

  const loadHighlights = () => {
    if (!currentChapter) return;
    const chapterHighlights = getHighlightsByChapter(currentChapter.bookAbbrev, currentChapter.chapterNumber);
    const map = new Map<number, HighlightColor>();
    chapterHighlights.forEach(h => map.set(h.verse, h.color));
    setVerseHighlights(map);
  };

  const loadDictionaryWords = async () => {
    if (!currentChapter) return;
    setLoadingDictionary(true);
    const newMap = new Map<number, VerseDictionaryWords>();
    for (const verse of currentChapter.verses) {
      const words = await findWordsInVerse(
        currentChapter.bookAbbrev,
        currentChapter.chapterNumber,
        verse.number,
        verse.text
      );
      newMap.set(verse.number, { words, loaded: true });
    }
    setDictionaryWords(newMap);
    setLoadingDictionary(false);
  };

  const handleBookSelect = (book: BibleBook) => {
    setSelectedBook(book);
    setViewState('chapters');
  };

  const handleResumeProgress = async (book: BibleBook, chapterNumber: number) => {
    setSelectedBook(book);
    await handleChapterSelect(chapterNumber, book);
  };

  const handleChapterSelect = async (chapterNumber: number, explicitBook?: BibleBook) => {
    const bookToUse = explicitBook || selectedBook;
    if (!bookToUse) return;
    setLoading(true);
    setSelectedChapterNumber(chapterNumber);
    const chapter = await getChapter(bookToUse.abbrev, chapterNumber);
    if (chapter) {
      setCurrentChapter(chapter);
      saveReadingProgress({
        bookAbbrev: bookToUse.abbrev,
        bookName: bookToUse.name,
        chapter: chapterNumber,
        timestamp: Date.now()
      });
      setViewState('reading');
    }
    setLoading(false);
  };

  const handleNextChapter = async () => {
    if (!currentChapter) return;
    const next = await getNextChapter(currentChapter.bookAbbrev, currentChapter.chapterNumber);
    if (next) {
      const book = books.find(b => b.abbrev === next.abbrev);
      if (book) {
        setSelectedBook(book);
        handleChapterSelect(next.chapter, book);
      }
    }
  };

  const handlePreviousChapter = async () => {
    if (!currentChapter) return;
    const prev = await getPreviousChapter(currentChapter.bookAbbrev, currentChapter.chapterNumber);
    if (prev) {
      const book = books.find(b => b.abbrev === prev.abbrev);
      if (book) {
        setSelectedBook(book);
        handleChapterSelect(prev.chapter, book);
      }
    }
  };

  const handleToggleFavorite = (verse: BibleVerse) => {
    if (!currentChapter) return;
    const verseKey = `${verse.number}`;
    const isNowFavorite = toggleFavorite({
      bookAbbrev: currentChapter.bookAbbrev,
      bookName: currentChapter.bookName,
      chapter: currentChapter.chapterNumber,
      verse: verse.number,
      text: verse.text
    });
    setFavoritedVerses(prev => {
      const next = new Set(prev);
      if (isNowFavorite) next.add(verseKey); else next.delete(verseKey);
      return next;
    });
  };

  const handleHighlight = (verseNumber: number, color: HighlightColor) => {
    if (!currentChapter) return;
    const current = verseHighlights.get(verseNumber);
    if (current === color) {
      removeHighlight(currentChapter.bookAbbrev, currentChapter.chapterNumber, verseNumber);
      setVerseHighlights(prev => { const m = new Map(prev); m.delete(verseNumber); return m; });
    } else {
      addHighlight(currentChapter.bookAbbrev, currentChapter.chapterNumber, verseNumber, color);
      setVerseHighlights(prev => { const m = new Map(prev); m.set(verseNumber, color); return m; });
    }
  };

  const removeVerseHighlight = (verseNumber: number) => {
    if (!currentChapter) return;
    removeHighlight(currentChapter.bookAbbrev, currentChapter.chapterNumber, verseNumber);
    setVerseHighlights(prev => { const m = new Map(prev); m.delete(verseNumber); return m; });
  };

  // Note modal
  const openNoteModal = (verse: BibleVerse) => {
    if (!currentChapter) return;
    setSelectedVerseForNote(verse);
    const existing = getNoteByReference(currentChapter.bookAbbrev, currentChapter.chapterNumber, verse.number);
    if (existing) {
      setNoteText(existing.note);
      setExistingNoteId(existing.id);
    } else {
      setNoteText('');
      setExistingNoteId(null);
    }
    document.body.style.overflow = 'hidden';
    setShowNoteModal(true);
  };

  const closeNoteModal = () => {
    setClosingNoteModal(true);
    setTimeout(() => {
      document.body.style.overflow = focusMode ? 'hidden' : '';
      setShowNoteModal(false);
      setClosingNoteModal(false);
      setSelectedVerseForNote(null);
      setNoteText('');
      setExistingNoteId(null);
    }, 500);
  };

  const saveNote = () => {
    if (!currentChapter || !selectedVerseForNote) return;
    if (noteText.trim()) {
      if (existingNoteId) {
        updateNote(existingNoteId, noteText.trim());
      } else {
        addNote(
          currentChapter.bookAbbrev,
          currentChapter.bookName,
          currentChapter.chapterNumber,
          selectedVerseForNote.number,
          noteText.trim()
        );
      }
      checkVersesWithNotes();
    }
    closeNoteModal();
  };

  const deleteCurrentNote = () => {
    if (existingNoteId) {
      deleteNote(existingNoteId);
      checkVersesWithNotes();
    }
    closeNoteModal();
  };

  // Dictionary
  const openDictionaryModalForEntry = (entry: DictionaryEntry) => {
    setSelectedWord(entry.palavra_pt);
    setSelectedDictionaryEntry(entry);
    setShowDictionaryModal(true);
  };

  const closeDictionaryModal = () => {
    setShowDictionaryModal(false);
    setTimeout(() => {
      setSelectedDictionaryEntry(null);
      setSelectedWord('');
    }, 300);
  };

  const handleWordClick = async (word: string, verseNumber: number, localEntry?: DictionaryEntry) => {
    if (localEntry) {
      openDictionaryModalForEntry(localEntry);
      return;
    }
    // No AI fallback — dictionary is offline-only now
    // If no local entry, show nothing
  };

  // === RENDER ===

  const renderLoading = () => (
    <div className="paper-panel p-8 text-center">
      <div className="w-8 h-8 border-2 border-terra border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
      <p className="text-cream-muted text-sm">Carregando capítulo...</p>
    </div>
  );

  const renderNoteModal = () => {
    if (!showNoteModal || !selectedVerseForNote || !currentChapter) return null;
    return ReactDOM.createPortal(
      <div
        className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm transition-all duration-300 ease-out ${
          closingNoteModal ? 'bg-black/0 opacity-0' : 'bg-black/35 opacity-100'
        }`}
        onClick={(e) => { if (e.target === e.currentTarget) closeNoteModal(); }}
      >
        <div className={`w-full max-w-md rounded-3xl border border-grace-border bg-grace-surface p-6 transition-all duration-300 ease-out ${
          closingNoteModal ? 'translate-y-3 opacity-0' : 'translate-y-0 opacity-100 animate-in zoom-in-95'
        }`}>
          <div className="mb-4">
            <h3 className="section-kicker mb-1">
              {currentChapter.bookName} {currentChapter.chapterNumber}:{selectedVerseForNote.number}
            </h3>
            <p className="text-sm text-cream-muted italic line-clamp-2">
              "{selectedVerseForNote.text}"
            </p>
          </div>
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Escreva sua reflexão sobre este versículo..."
            className="w-full h-32 p-4 bg-grace-surface-2 rounded-2xl border border-grace-border resize-none outline-none focus:border-terra text-cream text-sm leading-relaxed mb-4 placeholder:text-grace-muted"
          />
          <div className="flex flex-wrap gap-3">
            <button onClick={saveNote} className="pill-button-accent flex-1 py-3 text-xs font-semibold uppercase tracking-widest">
              {existingNoteId ? 'Atualizar' : 'Salvar'}
            </button>
            {existingNoteId && (
              <button onClick={deleteCurrentNote} className="pill-button px-6 py-3 text-xs font-semibold uppercase tracking-widest text-[var(--danger)]">
                Excluir
              </button>
            )}
            <button onClick={closeNoteModal} className="pill-button flex-1 py-3 text-xs font-semibold uppercase tracking-widest">
              Cancelar
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  const renderDictionaryModal = () => {
    if (!showDictionaryModal) return null;
    return (
      <DictionaryModal
        entry={selectedDictionaryEntry}
        word={selectedWord}
        bookName={currentChapter?.bookName || ''}
        chapter={currentChapter?.chapterNumber || 0}
        verse={0}
        onClose={closeDictionaryModal}
      />
    );
  };

  return (
    <>
      {viewState === 'books' && (
        <BookSelector
          books={books}
          onBookSelect={handleBookSelect}
          onBack={() => setViewState('plans')}
        />
      )}
      {viewState === 'chapters' && selectedBook && (
        <ChapterSelector
          book={selectedBook}
          onChapterSelect={handleChapterSelect}
          onBack={() => setViewState('books')}
        />
      )}
      {viewState === 'reading' && (loading ? renderLoading() : currentChapter && (
        <VerseDisplay
          chapter={currentChapter}
          studyMode={studyMode}
          loadingDictionary={loadingDictionary}
          dictionaryWords={dictionaryWords}
          favoritedVerses={favoritedVerses}
          versesWithNotes={versesWithNotes}
          verseHighlights={verseHighlights}
          highlightedVerse={highlightedVerse}
          selectedVerse={selectedVerse}
          onSelectVerse={setSelectedVerse}
          onToggleFavorite={handleToggleFavorite}
          onOpenNote={openNoteModal}
          onHighlight={handleHighlight}
          onRemoveHighlight={removeVerseHighlight}
          onWordClick={handleWordClick}
          onPreviousChapter={handlePreviousChapter}
          onNextChapter={handleNextChapter}
          onGoToChapters={() => setViewState('chapters')}
          onEnterFocusMode={() => setFocusMode(true)}
          onToggleStudyMode={() => setStudyMode(!studyMode)}
        />
      ))}
      {viewState === 'plans' && (
        <ReadingProgress
          books={books}
          onBookSelect={handleBookSelect}
          onShowBooks={() => setViewState('books')}
          onResumeProgress={handleResumeProgress}
        />
      )}
      {renderNoteModal()}
      {renderDictionaryModal()}
      {focusMode && currentChapter && (
        <FocusMode
          chapter={currentChapter}
          verseHighlights={verseHighlights}
          onClose={() => setFocusMode(false)}
          onPreviousChapter={handlePreviousChapter}
          onNextChapter={handleNextChapter}
        />
      )}

      {/* Back to top */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-24 right-5 lg:bottom-6 lg:right-6 w-12 h-12 rounded-full bg-terra text-white border border-[rgba(255,255,255,0.35)] flex items-center justify-center transition-all duration-300 hover:scale-105 z-50 ${
          showBackToTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
      </button>
    </>
  );
};

export default Reading;
