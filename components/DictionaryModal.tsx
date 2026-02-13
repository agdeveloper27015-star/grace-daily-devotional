import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { DictionaryEntry } from '../services/dictionaryService';

interface DictionaryModalProps {
  entry: DictionaryEntry | null;
  word?: string;
  bookName: string;
  chapter: number;
  verse: number;
  onClose: () => void;
}

const DictionaryModal: React.FC<DictionaryModalProps> = ({
  entry,
  word,
  bookName,
  chapter,
  verse,
  onClose
}) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => { onClose(); }, 300);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) handleClose();
  };

  const renderLoading = () => (
    <div className="px-6 py-16 flex flex-col items-center gap-4">
      <div className="w-8 h-8 border-2 border-cream/30 border-t-cream rounded-full animate-spin"></div>
      <p className="text-cream-muted text-sm">Analisando "{word || '...'}"...</p>
      <p className="text-grace-muted text-xs">Buscando significado teológico</p>
    </div>
  );

  const renderContent = () => {
    if (!entry) return renderLoading();
    return (
      <>
        {/* Word Header */}
        <div className="px-6 py-5 border-b border-grace-border">
          <h2 className="font-serif text-2xl text-cream mb-2">{entry.palavra_pt}</h2>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg text-cream-muted font-serif italic">{entry.palavra_original}</span>
            {entry.transliteracao && (
              <>
                <span className="text-grace-muted">&#8226;</span>
                <span className="text-sm text-cream-muted">{entry.transliteracao}</span>
              </>
            )}
            {entry.strong && (
              <>
                <span className="text-grace-muted">&#8226;</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-cream/10 text-cream-muted">
                  {entry.strong}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Cards */}
        <div className="px-6 pb-6 pt-4 space-y-3">
          {/* Por que esta palavra? */}
          {entry.por_que_esta_palavra && (
            <div className="bg-cream/5 rounded-2xl p-4 border border-cream/10">
              <p className="text-[10px] font-bold uppercase tracking-widest text-cream-muted mb-2">Por que esta palavra?</p>
              <p className="text-cream text-sm leading-relaxed">{entry.por_que_esta_palavra}</p>
            </div>
          )}

          {/* Significado da Raiz */}
          {entry.significado_raiz && (
            <div className="bg-grace-surface rounded-2xl p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-cream-muted mb-2">Significado da Raiz</p>
              <p className="text-cream-dark text-sm leading-relaxed">{entry.significado_raiz}</p>
            </div>
          )}

          {/* Significado Contextual */}
          {entry.significado_contextual && (
            <div className="bg-grace-surface rounded-2xl p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-cream-muted mb-2">Significado Contextual</p>
              <p className="text-cream-dark text-sm leading-relaxed">{entry.significado_contextual}</p>
            </div>
          )}

          {/* Explicação Detalhada */}
          {entry.explicacao_detalhada && (
            <div className="bg-grace-surface-2 border border-grace-border rounded-2xl p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-cream-muted mb-2">Explicação Detalhada</p>
              <p className="text-cream-dark text-sm leading-relaxed">{entry.explicacao_detalhada}</p>
            </div>
          )}

          {/* Conexão Teológica */}
          {entry.conexao_teologica && (
            <div className="bg-grace-surface rounded-2xl p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-cream-muted mb-2">Conexão Teológica</p>
              <p className="text-cream-dark text-sm leading-relaxed">{entry.conexao_teologica}</p>
            </div>
          )}

          {/* Referências Relacionadas */}
          {entry.referencias_relacionadas?.length > 0 && (
            <div className="bg-grace-surface-2 border border-grace-border rounded-2xl p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-cream-muted mb-3">Referências Relacionadas</p>
              <div className="space-y-3">
                {entry.referencias_relacionadas.map((ref, idx) => (
                  <div key={idx} className="flex gap-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-lg bg-cream/10 text-cream text-xs font-medium shrink-0">
                      {ref.referencia}
                    </span>
                    <p className="text-cream-muted text-xs leading-relaxed">{ref.relevancia}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </>
    );
  };

  const modalContent = (
    <div
      className={`fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-4 backdrop-blur-sm transition-all duration-300 ease-out ${
        isClosing ? 'bg-black/0 opacity-0' : 'bg-black/60 opacity-100'
      }`}
      onClick={handleBackdropClick}
    >
      <div
        className={`bg-grace-surface-2 sm:rounded-3xl rounded-t-3xl w-full sm:max-w-lg max-h-[90vh] overflow-hidden shadow-2xl border border-grace-border transition-all duration-300 ease-out ${
          isClosing ? 'translate-y-8 opacity-0' : 'translate-y-0 opacity-100 animate-in slide-in-from-bottom-4'
        }`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-grace-border flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-cream-muted mb-0.5">
              Dicionário Bíblico
            </p>
            <p className="text-xs text-grace-muted">
              {bookName} {chapter}:{verse}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 -mr-2 text-cream-muted hover:text-cream hover:bg-grace-surface-3 rounded-xl transition-all"
            aria-label="Fechar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {renderContent()}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default DictionaryModal;
