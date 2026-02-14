import { supabase } from './supabaseClient';
import { getUserSettings, updateUserSettings } from './themeService';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
};

const getRegistration = async (): Promise<ServiceWorkerRegistration> => {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service Worker nao suportado neste navegador.');
  }

  const existing = await navigator.serviceWorker.getRegistration();
  if (existing) return existing;

  const registration = await navigator.serviceWorker.register('/sw.js');
  return registration;
};

const upsertSubscription = async (subscription: PushSubscription, enabled: boolean): Promise<void> => {
  if (!supabase) return;
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error('Usuario nao autenticado para salvar notificacoes.');

  const {
    endpoint,
    keys: { p256dh, auth },
  } = subscription.toJSON() as {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  };

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const settings = getUserSettings();

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      {
        user_id: userId,
        endpoint,
        p256dh,
        auth,
        enabled,
        timezone,
        reminder_time: settings.notificationTime,
      },
      { onConflict: 'endpoint' }
    );

  if (error) throw error;
};

export const enableDailyReminder = async (): Promise<void> => {
  if (!('Notification' in window)) {
    throw new Error('Notificacoes nao suportadas neste navegador.');
  }

  if (!VAPID_PUBLIC_KEY) {
    throw new Error('Defina VITE_VAPID_PUBLIC_KEY para ativar push.');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Permissao de notificacao negada.');
  }

  const registration = await getRegistration();
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  await upsertSubscription(subscription, true);
  updateUserSettings({ notificationEnabled: true });
};

export const disableDailyReminder = async (): Promise<void> => {
  const registration = await getRegistration();
  const subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    if (supabase) {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (userId) {
        await supabase.from('push_subscriptions').update({ enabled: false }).eq('endpoint', subscription.endpoint).eq('user_id', userId);
      }
    }
    await subscription.unsubscribe();
  }

  updateUserSettings({ notificationEnabled: false });
};

export const updateReminderTime = async (time: string): Promise<void> => {
  updateUserSettings({ notificationTime: time });

  const registration = await getRegistration();
  const subscription = await registration.pushManager.getSubscription();

  if (subscription && supabase) {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return;
    await supabase
      .from('push_subscriptions')
      .update({ reminder_time: time })
      .eq('endpoint', subscription.endpoint)
      .eq('user_id', userId);
  }
};
