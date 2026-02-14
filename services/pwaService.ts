interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;

export const INSTALL_PROMPT_AVAILABLE_EVENT = 'grace:install-prompt-available';

export const initInstallPromptListener = (): void => {
  if (typeof window === 'undefined') return;

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event as BeforeInstallPromptEvent;
    window.dispatchEvent(new CustomEvent(INSTALL_PROMPT_AVAILABLE_EVENT));
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    window.dispatchEvent(new CustomEvent(INSTALL_PROMPT_AVAILABLE_EVENT));
  });
};

export const canPromptInstall = (): boolean => deferredInstallPrompt !== null;

export const promptInstall = async (): Promise<boolean> => {
  if (!deferredInstallPrompt) return false;

  await deferredInstallPrompt.prompt();
  const choice = await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  return choice.outcome === 'accepted';
};

export const registerServiceWorker = async (): Promise<void> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  if (!import.meta.env.PROD) return;

  try {
    await navigator.serviceWorker.register('/sw.js');
  } catch (error) {
    console.error('[SW] Falha ao registrar service worker:', error);
  }
};
