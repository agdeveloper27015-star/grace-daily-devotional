import React, { useEffect, useState } from 'react';
import { VerseNote } from '../types';
import { deleteNote, getNotes, updateNote } from '../services/notesService';
import { APP_DATA_UPDATED_EVENT } from '../services/localStateService';

type ViewMode = 'list' | 'edit';

const Notes: React.FC = () => {
  const [notes, setNotes] = useState<VerseNote[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedNote, setSelectedNote] = useState<VerseNote | null>(null);
  const [editedText, setEditedText] = useState('');

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

  const loadNotes = () => {
    const items = getNotes();
    setNotes(items.sort((a, b) => b.updatedAt - a.updatedAt));
  };

  const handleDelete = (id: string) => {
    deleteNote(id);
    loadNotes();
  };

  const handleEdit = (note: VerseNote) => {
    setSelectedNote(note);
    setEditedText(note.note);
    setViewMode('edit');
  };

  const handleCancel = () => {
    setViewMode('list');
    setSelectedNote(null);
    setEditedText('');
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

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

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
        <p className="editorial-title text-3xl">Sem notas ainda</p>
        <p className="mt-2 text-sm text-cream-muted">Abra um versículo e registre suas observações no caderno.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notes.map((note) => (
        <article key={note.id} className="paper-panel p-4 sm:p-5">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="section-kicker">
                {note.bookName} {note.chapter}:{note.verse}
              </p>
              <p className="mt-1 text-xs text-cream-muted">Editado em {formatDate(note.updatedAt)}</p>
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
