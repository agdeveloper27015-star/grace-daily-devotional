import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { DictionaryEntry } from '../services/dictionaryService';

interface DictionaryModalProps {
  entry: DictionaryEntry | null;
  word?: string;
  notFound?: boolean;
  bookName: string;
  chapter: number;
  verse: number;
  onClose: () => void;
}

const DictionaryModal: React.FC<DictionaryModalProps> = ({ entry, word, notFound = false, bookName, chapter, verse, onClose }) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => onClose(), 220);
  };

  const renderLoading = () => (
    <div className="p-8 text-center">
      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-terra border-t-transparent" />
      <p className="mt-3 text-sm text-cream-muted">Analisando "{word || '...'}" no dicionário local...</p>
    </div>
  );

  const renderContent = () => {
    if (!entry && !notFound) return renderLoading();

    if (notFound) {
      return (
        <div className="space-y-3 p-5 sm:p-6">
          <div className="state-card p-4">
            <p className="section-kicker">Sem entrada local</p>
            <h2 className="editorial-title text-4xl">{word || 'Termo'}</h2>
            <p className="mt-2 text-sm text-cream-dark">
              Esta palavra ainda nao possui registro no dicionario offline para esta referencia.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3 p-5 sm:p-6">
        <div className="state-card p-4">
          <p className="section-kicker">Termo principal</p>
          <h2 className="editorial-title text-4xl">{entry.palavra_pt}</h2>
          <p className="mt-1 text-sm text-cream-muted">
            {entry.palavra_original}
            {entry.transliteracao ? ` • ${entry.transliteracao}` : ''}
            {entry.strong ? ` • ${entry.strong}` : ''}
          </p>
        </div>

        {entry.por_que_esta_palavra && (
          <div className="state-card p-4">
            <p className="section-kicker">Por que esta palavra?</p>
            <p className="mt-2 text-sm text-cream-dark">{entry.por_que_esta_palavra}</p>
          </div>
        )}

        {entry.significado_raiz && (
          <div className="state-card p-4">
            <p className="section-kicker">Significado da raiz</p>
            <p className="mt-2 text-sm text-cream-dark">{entry.significado_raiz}</p>
          </div>
        )}

        {entry.significado_contextual && (
          <div className="state-card p-4">
            <p className="section-kicker">Significado contextual</p>
            <p className="mt-2 text-sm text-cream-dark">{entry.significado_contextual}</p>
          </div>
        )}

        {entry.explicacao_detalhada && (
          <div className="state-card p-4">
            <p className="section-kicker">Explicação detalhada</p>
            <p className="mt-2 text-sm text-cream-dark">{entry.explicacao_detalhada}</p>
          </div>
        )}

        {entry.conexao_teologica && (
          <div className="state-card p-4">
            <p className="section-kicker">Conexão teológica</p>
            <p className="mt-2 text-sm text-cream-dark">{entry.conexao_teologica}</p>
          </div>
        )}

        {entry.referencias_relacionadas?.length > 0 && (
          <div className="state-card p-4">
            <p className="section-kicker">Referências relacionadas</p>
            <div className="mt-3 space-y-2">
              {entry.referencias_relacionadas.map((reference, index) => (
                <div key={index} className="rounded-xl border border-grace-border bg-grace-surface-2 p-3">
                  <p className="text-sm font-semibold text-cream">{reference.referencia}</p>
                  <p className="mt-1 text-xs text-cream-muted">{reference.relevancia}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return ReactDOM.createPortal(
    <div
      className={`fixed inset-0 z-[9999] flex items-end justify-center bg-[rgba(17,17,17,0.35)] p-0 backdrop-blur-sm transition-opacity duration-200 sm:items-center sm:p-4 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={(event) => {
        if (event.target === event.currentTarget) handleClose();
      }}
    >
      <div
        className={`w-full max-w-2xl overflow-hidden rounded-t-3xl border border-grace-border bg-grace-surface sm:rounded-3xl transition-transform duration-200 ${
          isClosing ? 'translate-y-5' : 'translate-y-0'
        }`}
      >
        <header className="flex items-center justify-between border-b border-grace-border px-5 py-4 sm:px-6">
          <div>
            <p className="section-kicker">Dicionário bíblico</p>
            <p className="text-xs text-cream-muted">{bookName} {chapter}:{verse}</p>
          </div>
          <button onClick={handleClose} className="icon-button inline-flex h-9 w-9 items-center justify-center" aria-label="Fechar">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="max-h-[78vh] overflow-y-auto">{renderContent()}</div>
      </div>
    </div>,
    document.body
  );
};

export default DictionaryModal;
