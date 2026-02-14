import React, { useEffect, useState } from 'react';
import { ThemePreference, UserSettings } from '../types';
import { getFavorites } from '../services/favoritesService';
import { getNotes } from '../services/notesService';
import { getChaptersRead, getTotalReadVerses } from '../services/bibleService';
import { APP_DATA_UPDATED_EVENT } from '../services/localStateService';
import { canPromptInstall, INSTALL_PROMPT_AVAILABLE_EVENT, promptInstall } from '../services/pwaService';
import { disableDailyReminder, enableDailyReminder, updateReminderTime } from '../services/notificationService';
import { deactivatePlan, getReadingPlanState } from '../services/readingPlanService';
import { signOut } from '../services/authService';
import { getUserSettings, setThemePreference } from '../services/themeService';
import { STORAGE_KEYS } from '../services/storageKeys';

const Profile: React.FC = () => {
  const [stats, setStats] = useState({
    versesRead: 0,
    chaptersRead: 0,
    favorites: 0,
    notes: 0,
    daysUsing: 0,
  });
  const [settings, setSettings] = useState<UserSettings>(getUserSettings());
  const [installAvailable, setInstallAvailable] = useState(canPromptInstall());
  const [planActive, setPlanActive] = useState(Boolean(getReadingPlanState()?.isActive));
  const [busyNotification, setBusyNotification] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadStats = async () => {
    const favorites = getFavorites();
    const notes = getNotes();
    const chaptersRead = getChaptersRead();
    const versesRead = await getTotalReadVerses();

    let firstVisit = localStorage.getItem(STORAGE_KEYS.firstVisit);
    if (!firstVisit) {
      firstVisit = Date.now().toString();
      localStorage.setItem(STORAGE_KEYS.firstVisit, firstVisit);
    }

    const daysUsing = Math.floor((Date.now() - Number(firstVisit)) / (1000 * 60 * 60 * 24)) + 1;

    setStats({
      versesRead,
      chaptersRead: chaptersRead.length,
      favorites: favorites.length,
      notes: notes.length,
      daysUsing,
    });
  };

  const refreshSettings = () => {
    setSettings(getUserSettings());
    setPlanActive(Boolean(getReadingPlanState()?.isActive));
    setInstallAvailable(canPromptInstall());
  };

  useEffect(() => {
    void loadStats();
    refreshSettings();

    const onData = () => {
      void loadStats();
      refreshSettings();
    };

    window.addEventListener('storage', onData);
    window.addEventListener(APP_DATA_UPDATED_EVENT, onData);
    window.addEventListener(INSTALL_PROMPT_AVAILABLE_EVENT, onData);

    return () => {
      window.removeEventListener('storage', onData);
      window.removeEventListener(APP_DATA_UPDATED_EVENT, onData);
      window.removeEventListener(INSTALL_PROMPT_AVAILABLE_EVENT, onData);
    };
  }, []);

  const showFeedback = (message: string) => {
    setFeedback(message);
    setTimeout(() => setFeedback(null), 2600);
  };

  const handleThemeChange = (theme: ThemePreference) => {
    setThemePreference(theme);
    setSettings(getUserSettings());
    showFeedback('Tema atualizado.');
  };

  const handleInstall = async () => {
    const accepted = await promptInstall();
    showFeedback(accepted ? 'Instalacao iniciada.' : 'Instalacao cancelada.');
    setInstallAvailable(canPromptInstall());
  };

  const handleNotificationToggle = async () => {
    setBusyNotification(true);
    try {
      if (settings.notificationEnabled) {
        await disableDailyReminder();
        showFeedback('Lembrete diario desativado.');
      } else {
        await enableDailyReminder();
        showFeedback('Lembrete diario ativado.');
      }
      setSettings(getUserSettings());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao atualizar notificacoes.';
      showFeedback(message);
    } finally {
      setBusyNotification(false);
    }
  };

  const handleTimeChange = async (value: string) => {
    try {
      await updateReminderTime(value);
      setSettings(getUserSettings());
      showFeedback('Horario do lembrete atualizado.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao atualizar horario.';
      showFeedback(message);
    }
  };

  const handleDeactivatePlan = () => {
    deactivatePlan();
    setPlanActive(false);
    showFeedback('Plano anual desativado.');
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao sair da conta.';
      showFeedback(message);
    }
  };

  const cards = [
    { label: 'Versiculos lidos', value: stats.versesRead },
    { label: 'Capitulos lidos', value: stats.chaptersRead },
    { label: 'Favoritos', value: stats.favorites },
    { label: 'Notas', value: stats.notes },
    { label: 'Dias de uso', value: stats.daysUsing },
  ];

  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-5">
      {feedback && <div className="paper-panel p-3 text-center text-xs font-semibold text-cream">{feedback}</div>}

      <div className="paper-panel p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="section-kicker">Meu perfil</p>
            <h2 className="editorial-title text-4xl leading-none sm:text-5xl">Conta e jornada</h2>
            <p className="mt-2 text-sm text-cream-muted">Seus dados estao sincronizados na nuvem e disponiveis em todos os dispositivos.</p>
          </div>
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-grace-border bg-grace-surface-2">
            <svg className="h-8 w-8 text-terra" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <article key={card.label} className="paper-panel p-5">
            <p className="section-kicker">{card.label}</p>
            <p className="mt-2 text-4xl font-semibold text-cream">{card.value}</p>
          </article>
        ))}
      </div>

      <div className="paper-panel p-5 sm:p-6">
        <p className="section-kicker">Tema</p>
        <div className="mt-3 inline-flex rounded-full border border-grace-border bg-grace-surface-2 p-1">
          {(['system', 'light', 'dark'] as ThemePreference[]).map((theme) => (
            <button
              key={theme}
              onClick={() => handleThemeChange(theme)}
              className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                settings.theme === theme ? 'bg-terra text-white' : 'text-cream-muted'
              }`}
            >
              {theme === 'system' ? 'Sistema' : theme === 'light' ? 'Claro' : 'Escuro'}
            </button>
          ))}
        </div>
      </div>

      <div className="paper-panel p-5 sm:p-6">
        <p className="section-kicker">Notificacoes diarias</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            onClick={handleNotificationToggle}
            disabled={busyNotification}
            className={`pill-button px-4 py-2 text-xs font-semibold uppercase tracking-wider ${
              settings.notificationEnabled ? 'border-terra text-terra' : ''
            }`}
          >
            {settings.notificationEnabled ? 'Desativar lembrete' : 'Ativar lembrete'}
          </button>

          <label className="text-xs font-semibold uppercase tracking-wider text-cream-muted">
            Horario
            <input
              type="time"
              value={settings.notificationTime}
              onChange={(event) => {
                void handleTimeChange(event.target.value);
              }}
              className="ml-2 rounded-xl border border-grace-border bg-grace-surface px-3 py-1 text-sm text-cream"
            />
          </label>
        </div>
      </div>

      <div className="paper-panel p-5 sm:p-6">
        <p className="section-kicker">Plano de leitura</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-cream">
            {planActive ? 'Plano Biblia em 1 ano ativo' : 'Plano anual inativo'}
          </span>
          {planActive && (
            <button onClick={handleDeactivatePlan} className="pill-button px-4 py-2 text-xs font-semibold uppercase tracking-wider">
              Desativar plano
            </button>
          )}
        </div>
      </div>

      <div className="paper-panel p-5 sm:p-6">
        <p className="section-kicker">Aplicativo</p>
        <div className="mt-3 space-y-2">
          <button
            onClick={() => {
              if (installAvailable) {
                void handleInstall();
              }
            }}
            disabled={!installAvailable}
            className="state-card flex w-full items-center justify-between p-4 text-left transition hover:bg-grace-surface-2 disabled:opacity-60"
          >
            <span className="text-sm font-semibold text-cream">Instalar no celular</span>
            <span className="text-xs text-cream-muted">{installAvailable ? 'Disponivel' : 'Ja instalado ou indisponivel'}</span>
          </button>

          <button onClick={handleSignOut} className="state-card flex w-full items-center justify-between p-4 text-left transition hover:bg-grace-surface-2">
            <span className="text-sm font-semibold text-cream">Sair da conta</span>
            <span className="text-xs text-cream-muted">Google OAuth</span>
          </button>
        </div>
      </div>

      <div className="paper-panel p-5 text-center">
        <p className="section-kicker">Sobre</p>
        <p className="mt-1 text-sm text-cream-dark">Dabar Bible 2.0</p>
        <p className="text-xs text-cream-muted">Feito para estudo biblico diario</p>
      </div>
    </section>
  );
};

export default Profile;
