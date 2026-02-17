import React, { useEffect, useMemo, useState } from 'react';
import { BibleBook, VerseNote } from '../types';
import { addNote, deleteNote, getNotes, updateNote } from '../services/notesService';
import { APP_DATA_UPDATED_EVENT } from '../services/localStateService';
import { getBooks } from '../services/bibleService';

type ViewMode = 'list' | 'edit' | 'create';

const Notes: React.FC = () => {
  const [notes, setNotes] = useState<VerseNote[]>([]);
  const [books, setBooks] = useState<BibleBook[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedNote, setSelectedNote] = useState<VerseNote | null>(null);
  const [editedText, setEditedText] = useState('');
  const [createBookAbbrev, setCreateBookAbbrev] = useState('');
  const [createChapter, setCreateChapter] = useState('1');
  const [createVerse, setCreateVerse] = useState('1');
  const [createText, setCreateText] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSavingCreate, setIsSavingCreate] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    loadNotes();

    const refresh = () => loadNotes();
    window.addEventListener('storage', refresh);
    window.addEventListener(APP_DATA_UPDATED_EVENT, refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener(APP_DATA_UPDATED_EVENT, refresh);
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadBooks = async () => {
      try {
        const allBooks = await getBooks();
        if (!active) return;
        setBooks(allBooks);
        if (!createBookAbbrev && allBooks.length > 0) {
          setCreateBookAbbrev(allBooks[0].abbrev);
        }
      } catch {
        if (active) setBooks([]);
      }
    };

    void loadBooks();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 2400);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const loadNotes = () => {
    const items = getNotes();
    setNotes(items.sort((a, b) => b.updatedAt - a.updatedAt));
  };

  const handleDelete = (id: string) => {
    deleteNote(id);
    loadNotes();
  };

  const handleEdit = (note: VerseNote) => {
    setFormError(null);
    setSelectedNote(note);
    setEditedText(note.note);
    setViewMode('edit');
  };

  const resetCreateForm = () => {
    setCreateChapter('1');
    setCreateVerse('1');
    setCreateText('');
    setFormError(null);
    setIsSavingCreate(false);
  };

  const openCreate = () => {
    if (!createBookAbbrev && books.length > 0) {
      setCreateBookAbbrev(books[0].abbrev);
    }
    setSelectedNote(null);
    setEditedText('');
    setFormError(null);
    setViewMode('create');
  };

  const handleCancel = () => {
    setViewMode('list');
    setSelectedNote(null);
    setEditedText('');
    resetCreateForm();
  };

  const handleSave = () => {
    if (!selectedNote) return;
    const text = editedText.trim();
    if (text) {
      updateNote(selectedNote.id, text);
      loadNotes();
    }
    handleCancel();
  };

  const selectedCreateBook = useMemo(
    () => books.find((book) => book.abbrev === createBookAbbrev) ?? null,
    [books, createBookAbbrev]
  );

  const booksByAbbrev = useMemo(() => {
    return new Map(books.map((book) => [book.abbrev, book]));
  }, [books]);

  const versePreviewByNoteId = useMemo(() => {
    const previews = new Map<string, string>();
    for (const note of notes) {
      const book = booksByAbbrev.get(note.bookAbbrev);
      const chapterVerses = book?.chapters[note.chapter - 1];
      const verseText = chapterVerses?.[note.verse - 1];
      if (!verseText) continue;

      const normalized = verseText.replace(/\s+/g, ' ').trim();
      const preview = normalized.length > 140
        ? `${normalized.slice(0, 140).trimEnd()}...`
        : normalized;

      previews.set(note.id, preview);
    }
    return previews;
  }, [notes, booksByAbbrev]);

  const handleCreate = async () => {
    setFormError(null);
    const text = createText.trim();
    const chapterNumber = Number.parseInt(createChapter, 10);
    const verseNumber = Number.parseInt(createVerse, 10);

    if (!selectedCreateBook) {
      setFormError('Selecione um livro válido.');
      return;
    }

    if (!text) {
      setFormError('Escreva uma nota antes de salvar.');
      return;
    }

    if (Number.isNaN(chapterNumber) || chapterNumber < 1 || chapterNumber > selectedCreateBook.chapters.length) {
      setFormError(`Capítulo inválido. ${selectedCreateBook.name} possui ${selectedCreateBook.chapters.length} capítulos.`);
      return;
    }

    const versesInChapter = selectedCreateBook.chapters[chapterNumber - 1]?.length ?? 0;
    if (Number.isNaN(verseNumber) || verseNumber < 1 || verseNumber > versesInChapter) {
      setFormError(`Versículo inválido. O capítulo ${chapterNumber} possui ${versesInChapter} versículos.`);
      return;
    }

    setIsSavingCreate(true);
    addNote(selectedCreateBook.abbrev, selectedCreateBook.name, chapterNumber, verseNumber, text);
    loadNotes();
    setFeedback('Nota salva no caderno.');
    setViewMode('list');
    resetCreateForm();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (viewMode === 'create') {
    return (
      <div className="paper-panel p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="section-kicker">Nova reflexão</p>
            <h3 className="editorial-title text-3xl">Criar nota</h3>
          </div>
          <button onClick={handleCancel} className="icon-button inline-flex h-9 w-9 items-center justify-center" aria-label="Fechar criação">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="space-y-1">
            <span className="section-kicker">Livro</span>
            <select
              value={createBookAbbrev}
              onChange={(event) => {
                setCreateBookAbbrev(event.target.value);
                setCreateChapter('1');
                setCreateVerse('1');
                setFormError(null);
              }}
              className="h-11 w-full rounded-2xl border border-grace-border bg-grace-surface px-3 text-sm text-cream outline-none transition focus:border-terra"
            >
              {books.map((book) => (
                <option key={book.abbrev} value={book.abbrev}>
                  {book.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="section-kicker">Capítulo</span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={selectedCreateBook?.chapters.length ?? 1}
              value={createChapter}
              onChange={(event) => {
                setCreateChapter(event.target.value);
                setFormError(null);
              }}
              className="h-11 w-full rounded-2xl border border-grace-border bg-grace-surface px-3 text-sm text-cream outline-none transition focus:border-terra"
            />
          </label>

          <label className="space-y-1">
            <span className="section-kicker">Versículo</span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              value={createVerse}
              onChange={(event) => {
                setCreateVerse(event.target.value);
                setFormError(null);
              }}
              className="h-11 w-full rounded-2xl border border-grace-border bg-grace-surface px-3 text-sm text-cream outline-none transition focus:border-terra"
            />
          </label>
        </div>

        <p className="mt-2 text-xs text-cream-muted">
          Se já existir nota para esta referência, ela será atualizada.
        </p>

        <textarea
          value={createText}
          onChange={(event) => {
            setCreateText(event.target.value);
            setFormError(null);
          }}
          placeholder="Escreva sua reflexão sobre este versículo..."
          className="mt-4 h-56 w-full rounded-2xl border border-grace-border bg-grace-surface p-4 text-sm text-cream outline-none transition focus:border-terra"
          autoFocus
        />

        {formError && <p className="mt-3 text-sm text-[var(--danger)]">{formError}</p>}

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={() => void handleCreate()}
            className="pill-button-accent px-5 py-2.5 text-sm font-semibold"
            disabled={isSavingCreate}
          >
            {isSavingCreate ? 'Salvando...' : 'Salvar nota'}
          </button>
          <button onClick={handleCancel} className="pill-button px-5 py-2.5 text-sm font-semibold">
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  if (viewMode === 'edit' && selectedNote) {
    return (
      <div className="paper-panel p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="section-kicker">Editar reflexão</p>
            <h3 className="editorial-title text-3xl">{selectedNote.bookName} {selectedNote.chapter}:{selectedNote.verse}</h3>
          </div>
          <button onClick={handleCancel} className="icon-button inline-flex h-9 w-9 items-center justify-center" aria-label="Voltar">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <textarea
          value={editedText}
          onChange={(event) => setEditedText(event.target.value)}
          placeholder="Escreva sua reflexão sobre este versículo..."
          className="h-56 w-full rounded-2xl border border-grace-border bg-grace-surface p-4 text-sm text-cream outline-none transition focus:border-terra"
          autoFocus
        />

        <div className="mt-4 flex flex-wrap gap-3">
          <button onClick={handleSave} className="pill-button-accent px-5 py-2.5 text-sm font-semibold">
            Salvar
          </button>
          <button onClick={handleCancel} className="pill-button px-5 py-2.5 text-sm font-semibold">
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="paper-panel p-8 text-center">
        {feedback && (
          <div className="mb-4 rounded-2xl border border-grace-border bg-grace-surface px-4 py-2 text-xs font-semibold text-cream">
            {feedback}
          </div>
        )}
        <p className="editorial-title text-3xl">Sem notas ainda</p>
        <p className="mt-2 text-sm text-cream-muted">Você já pode criar sua primeira reflexão aqui no caderno.</p>
        <button onClick={openCreate} className="pill-button-accent mt-5 px-5 py-2.5 text-sm font-semibold">
          Criar primeira nota
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="paper-panel flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
        <div>
          <p className="section-kicker">Notas do caderno</p>
          <p className="mt-1 text-sm text-cream-muted">Crie ou edite reflexões sem sair desta tela.</p>
        </div>
        <button onClick={openCreate} className="pill-button-accent px-5 py-2.5 text-sm font-semibold">
          Criar nota
        </button>
      </div>

      {feedback && (
        <div className="paper-panel px-4 py-2 text-xs font-semibold text-cream">
          {feedback}
        </div>
      )}

      {notes.map((note) => (
        <article key={note.id} className="paper-panel p-4 sm:p-5">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="section-kicker">
                {note.bookName} {note.chapter}:{note.verse}
              </p>
              <p className="mt-1 text-xs text-cream-muted">Editado em {formatDate(note.updatedAt)}</p>
              {versePreviewByNoteId.has(note.id) && (
                <p className="mt-2 text-sm italic text-cream-muted">
                  "{versePreviewByNoteId.get(note.id)}"
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(note)}
                className="icon-button inline-flex h-8 w-8 items-center justify-center"
                title="Editar nota"
                aria-label="Editar nota"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button
                onClick={() => handleDelete(note.id)}
                className="icon-button inline-flex h-8 w-8 items-center justify-center text-[var(--danger)]"
                title="Excluir nota"
                aria-label="Excluir nota"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          <p className="reading-body text-[1.02rem] whitespace-pre-wrap text-cream-dark">{note.note}</p>
        </article>
      ))}
    </div>
  );
};

export default Notes;
