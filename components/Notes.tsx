import React, { useState, useEffect } from 'react';
import { VerseNote } from '../types';
import { getNotes, deleteNote, updateNote } from '../services/notesService';

type ViewMode = 'list' | 'edit';

const Notes: React.FC = () => {
  const [notes, setNotes] = useState<VerseNote[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedNote, setSelectedNote] = useState<VerseNote | null>(null);
  const [editedText, setEditedText] = useState('');

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = () => {
    const allNotes = getNotes();
    setNotes(allNotes.sort((a, b) => b.updatedAt - a.updatedAt));
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

  const handleSave = () => {
    if (!selectedNote) return;
    if (editedText.trim()) {
      updateNote(selectedNote.id, editedText.trim());
      loadNotes();
    }
    setViewMode('list');
    setSelectedNote(null);
    setEditedText('');
  };

  const handleCancel = () => {
    setViewMode('list');
    setSelectedNote(null);
    setEditedText('');
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (viewMode === 'edit' && selectedNote) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center mb-6">
          <button onClick={handleCancel} className="text-cream-muted hover:text-cream transition-colors mr-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-xs font-semibold text-cream-muted tracking-[0.15em] uppercase">Editar Nota</h2>
        </div>

        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-widest text-terra mb-2">
            {selectedNote.bookName} {selectedNote.chapter}:{selectedNote.verse}
          </p>
        </div>

        <textarea
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
          placeholder="Escreva sua reflexão sobre este versículo..."
          className="w-full h-48 p-4 bg-grace-surface rounded-2xl border-0 resize-none focus:ring-2 focus:ring-terra/30 text-cream text-sm leading-relaxed placeholder:text-grace-muted"
          autoFocus
        />

        <div className="flex gap-3 mt-4">
          <button onClick={handleSave} className="flex-1 bg-terra text-cream py-3 rounded-full text-xs font-semibold uppercase tracking-widest hover:bg-terra-light transition-colors">
            Salvar
          </button>
          <button onClick={handleCancel} className="flex-1 bg-grace-surface-3 text-cream-muted py-3 rounded-full text-xs font-semibold uppercase tracking-widest hover:bg-grace-border transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-grace-surface flex items-center justify-center border border-grace-border">
            <svg className="w-8 h-8 text-terra" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
          </div>
          <p className="text-cream-muted text-sm font-light">
            Voce ainda nao tem notas.
          </p>
          <p className="text-grace-muted text-xs mt-2">
            Toque no ícone de nota ao ler a Bíblia para adicionar uma reflexão.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <p className="text-xs font-semibold text-cream-muted tracking-[0.15em] uppercase mb-6">
        {notes.length} nota{notes.length !== 1 ? 's' : ''}
      </p>

      <div className="space-y-4">
        {notes.map((note) => (
          <div
            key={note.id}
            className="p-5 bg-grace-surface rounded-2xl group relative hover:bg-grace-surface-2 transition-colors border border-grace-border"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-terra">
                  {note.bookName} {note.chapter}:{note.verse}
                </p>
                <p className="text-[10px] text-grace-muted mt-1">
                  Editado em {formatDate(note.updatedAt)}
                </p>
              </div>
              <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEdit(note)}
                  className="p-2 text-cream-muted hover:text-terra hover:bg-terra/10 rounded-full transition-all"
                  title="Editar nota"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(note.id)}
                  className="p-2 text-cream-muted hover:text-red-400 hover:bg-red-400/10 rounded-full transition-all"
                  title="Excluir nota"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
            <p className="text-cream-dark text-sm leading-relaxed whitespace-pre-wrap">
              {note.note}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notes;
