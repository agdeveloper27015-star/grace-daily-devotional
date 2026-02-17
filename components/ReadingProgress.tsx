import React, { useEffect, useState } from 'react';
import { BibleBook } from '../types';
import { getReadingProgress } from '../services/bibleService';
import { activatePlan, getPlanProgressPercentage, getReadingPlanState, getTodayPlan } from '../services/readingPlanService';
import { APP_DATA_UPDATED_EVENT } from '../services/localStateService';

interface ReadingProgressProps {
  books: BibleBook[];
  onBookSelect: (book: BibleBook) => void;
  onShowBooks: () => void;
  onResumeProgress: (book: BibleBook, chapter: number) => void;
}

const ReadingProgress: React.FC<ReadingProgressProps> = ({ books, onBookSelect, onShowBooks, onResumeProgress }) => {
  const progress = getReadingProgress();
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [planActive, setPlanActive] = useState(false);
  const [planDay, setPlanDay] = useState<number | null>(null);
  const [planChapters, setPlanChapters] = useState<Array<{ bookAbbrev: string; bookName: string; chapter: number }>>([]);
  const [planCompletedToday, setPlanCompletedToday] = useState(false);
  const [planProgress, setPlanProgress] = useState(0);

  const loadPlan = async () => {
    const state = getReadingPlanState();
    setPlanActive(Boolean(state?.isActive));

    if (!state?.isActive) {
      setPlanDay(null);
      setPlanChapters([]);
      setPlanCompletedToday(false);
      setPlanProgress(0);
      return;
    }

    const today = await getTodayPlan();
    const percentage = await getPlanProgressPercentage();
    setPlanProgress(percentage);

    if (!today) {
      setPlanDay(null);
      setPlanChapters([]);
      setPlanCompletedToday(false);
      return;
    }

    setPlanDay(today.dayIndex);
    setPlanChapters(today.day.chapters);
    setPlanCompletedToday(today.completed);
  };

  useEffect(() => {
    void loadPlan();

    const refresh = () => {
      void loadPlan();
    };

    window.addEventListener('storage', refresh);
    window.addEventListener(APP_DATA_UPDATED_EVENT, refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener(APP_DATA_UPDATED_EVENT, refresh);
    };
  }, []);

  const handleActivatePlan = async () => {
    setLoadingPlan(true);
    activatePlan();
    await loadPlan();
    setLoadingPlan(false);
  };

  const openPlanChapter = (bookAbbrev: string, chapter: number) => {
    const book = books.find((item) => item.abbrev === bookAbbrev);
    if (!book) return;
    onResumeProgress(book, chapter);
  };

  const openBookByAbbrev = (abbrev: string) => {
    const book = books.find((item) => item.abbrev === abbrev);
    if (book) onBookSelect(book);
  };

  return (
    <section className="reading-entry-premium animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="reading-entry-hero paper-panel p-5 sm:p-6">
        <p className="section-kicker">Leitura biblica</p>
        <h2 className="editorial-title mt-1 text-4xl leading-none sm:text-5xl">Entrada de leitura</h2>
        <p className="reading-entry-hero__subtitle">
          Um ponto de partida limpo para continuar sua jornada sem excesso de informacao.
        </p>
        <div className="reading-entry-hero__actions">
          <button
            onClick={() => {
              if (!progress) {
                onShowBooks();
                return;
              }
              const book = books.find((item) => item.abbrev === progress.bookAbbrev);
              if (book) onResumeProgress(book, progress.chapter);
            }}
            className="pill-button-accent px-5 py-2.5 text-xs font-semibold uppercase tracking-wider"
          >
            {progress ? `Continuar ${progress.bookName} ${progress.chapter}` : 'Iniciar leitura'}
          </button>
          <button
            onClick={onShowBooks}
            className="pill-button px-4 py-2 text-xs font-semibold uppercase tracking-wider"
          >
            Biblioteca
          </button>
        </div>

        <div className="reading-entry-hero__quickstart">
          <button
            onClick={() => openBookByAbbrev('mt')}
            className="pill-button px-3 py-1.5 text-xs font-semibold"
          >
            Novo Testamento
          </button>
          <button
            onClick={() => openBookByAbbrev('gn')}
            className="pill-button px-3 py-1.5 text-xs font-semibold"
          >
            Velho Testamento
          </button>
        </div>
      </div>

      <article className="reading-entry-plan paper-panel p-5 sm:p-6">
        <p className="section-kicker">Plano estruturado</p>
        <h3 className="editorial-title mt-1 text-3xl">Biblia em 1 ano</h3>
        <p className="mt-2 text-sm text-cream-muted">
          Ativacao manual com progresso automatico conforme os capitulos do dia sao abertos.
        </p>

        {!planActive && (
          <button
            onClick={handleActivatePlan}
            disabled={loadingPlan}
            className="pill-button-accent mt-4 px-4 py-2 text-xs font-semibold uppercase tracking-wider"
          >
            {loadingPlan ? 'Ativando...' : 'Ativar plano'}
          </button>
        )}

        {planActive && (
          <div className="mt-4 space-y-3">
            <div className="reading-entry-plan__status state-card p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-cream">
                  {planDay ? `Dia ${planDay} de 365` : 'Plano concluido'}
                </p>
                <span className="text-xs font-semibold text-cream-muted">{planProgress}%</span>
              </div>
              <p className="mt-1 text-xs text-cream-muted">
                {planCompletedToday ? 'Leitura de hoje concluida.' : 'Leitura de hoje pendente.'}
              </p>
              <div className="mt-3 h-2 rounded-full bg-grace-surface-3">
                <div className="h-full rounded-full bg-terra transition-all duration-500" style={{ width: `${planProgress}%` }} />
              </div>
            </div>

            {planChapters.length > 0 && (
              <div className="reading-entry-plan__chapters state-card p-4">
                <p className="section-kicker">Hoje</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {planChapters.map((item, idx) => (
                    <button
                      key={`${item.bookAbbrev}_${item.chapter}_${idx}`}
                      onClick={() => openPlanChapter(item.bookAbbrev, item.chapter)}
                      className="pill-button px-3 py-1.5 text-xs font-semibold"
                    >
                      {item.bookName} {item.chapter}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </article>
    </section>
  );
};

export default ReadingProgress;
