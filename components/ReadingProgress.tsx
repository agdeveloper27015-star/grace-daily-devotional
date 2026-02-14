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

  const plans = [
    {
      id: 'novo-testamento',
      title: 'Novo Testamento',
      subtitle: 'Evangelhos, cartas e revelação apostólica.',
      abbrev: 'mt',
    },
    {
      id: 'velho-testamento',
      title: 'Velho Testamento',
      subtitle: 'Lei, história, poesia e profetas.',
      abbrev: 'gn',
    },
  ];

  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-5">
      <div className="paper-panel p-5 sm:p-6">
        <p className="section-kicker">Jornada bíblica</p>
        <h2 className="editorial-title mt-1 text-4xl leading-none sm:text-5xl">Entrada de leitura</h2>
        <p className="mt-2 text-sm text-cream-muted">
          Escolha uma trilha inicial, abra todos os livros ou retome exatamente o capítulo em que você parou.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <article className="paper-panel p-5 md:col-span-2">
          <p className="section-kicker">Plano estruturado</p>
          <h3 className="editorial-title mt-1 text-3xl">Biblia em 1 ano</h3>
          <p className="mt-2 text-sm text-cream-muted">
            Ativacao manual. Dia 1 inicia na data da adesao e a conclusao de hoje e automatica ao abrir os capitulos do dia.
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
              <div className="state-card p-4">
                <p className="section-kicker">Status do plano</p>
                <p className="mt-1 text-sm font-semibold text-cream">
                  {planDay ? `Dia ${planDay} de 365` : 'Plano concluido ou fora da janela de 365 dias'}
                </p>
                <p className="mt-1 text-xs text-cream-muted">
                  {planCompletedToday ? 'Leitura de hoje concluida.' : 'Leitura de hoje pendente.'}
                </p>
                <div className="mt-3 h-2 rounded-full bg-grace-surface-3">
                  <div className="h-full rounded-full bg-terra transition-all duration-500" style={{ width: `${planProgress}%` }} />
                </div>
              </div>

              {planChapters.length > 0 && (
                <div className="state-card p-4">
                  <p className="section-kicker">Capitulos de hoje</p>
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

        {plans.map((plan) => (
          <article key={plan.id} className="paper-panel p-5">
            <p className="section-kicker">Trilha livre</p>
            <h3 className="editorial-title mt-1 text-3xl">{plan.title}</h3>
            <p className="mt-2 text-sm text-cream-muted">{plan.subtitle}</p>
            <button
              onClick={() => {
                const book = books.find((item) => item.abbrev === plan.abbrev);
                if (book) onBookSelect(book);
              }}
              className="pill-button mt-4 px-4 py-2 text-xs font-semibold uppercase tracking-wider"
            >
              Explorar livros
            </button>
          </article>
        ))}
      </div>

      <div className="paper-panel p-5 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            onClick={onShowBooks}
            className="state-card p-4 text-left transition hover:bg-grace-surface-2"
          >
            <p className="section-kicker">Biblioteca completa</p>
            <h4 className="editorial-title text-2xl">Todos os livros</h4>
            <p className="mt-1 text-sm text-cream-muted">{books.length} livros disponíveis</p>
          </button>

          <button
            onClick={() => {
              if (!progress) {
                onShowBooks();
                return;
              }
              const book = books.find((item) => item.abbrev === progress.bookAbbrev);
              if (book) onResumeProgress(book, progress.chapter);
            }}
            className="state-card p-4 text-left transition hover:bg-grace-surface-2"
          >
            <p className="section-kicker">Retomar sessão</p>
            <h4 className="editorial-title text-2xl">Onde parei</h4>
            <p className="mt-1 text-sm text-cream-muted">
              {progress ? `${progress.bookName} ${progress.chapter}` : 'Ainda sem progresso salvo'}
            </p>
          </button>
        </div>
      </div>
    </section>
  );
};

export default ReadingProgress;
