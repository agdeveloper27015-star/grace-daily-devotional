import { SyncDomain } from '../types';
import { getCurrentUserId } from './authService';
import { getLocalDomainPayload, setLocalDomainPayload } from './localStateService';
import { getSyncMeta, markSyncCompleted, mergeSyncMeta } from './syncMetaService';
import { supabase } from './supabaseClient';

const DOMAINS: SyncDomain[] = ['favorites', 'notes', 'highlights', 'progress', 'chapters', 'settings', 'plan'];

type SyncReason = 'startup' | 'manual' | 'focus' | 'online' | 'mutation';

type RemoteStateRow = {
  user_id: string;
  favorites: unknown;
  notes: unknown;
  highlights: unknown;
  progress: unknown;
  chapters: unknown;
  settings: unknown;
  plan: unknown;
  favorites_updated_at: string | null;
  notes_updated_at: string | null;
  highlights_updated_at: string | null;
  progress_updated_at: string | null;
  chapters_updated_at: string | null;
  settings_updated_at: string | null;
  plan_updated_at: string | null;
};

const REMOTE_UPDATED_AT_COLUMN: Record<SyncDomain, keyof RemoteStateRow> = {
  favorites: 'favorites_updated_at',
  notes: 'notes_updated_at',
  highlights: 'highlights_updated_at',
  progress: 'progress_updated_at',
  chapters: 'chapters_updated_at',
  settings: 'settings_updated_at',
  plan: 'plan_updated_at',
};

let listenersAttached = false;
let syncInFlight: Promise<void> | null = null;

const toEpochMs = (value: string | null): number => {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const ensureRowExists = async (userId: string): Promise<RemoteStateRow> => {
  if (!supabase) {
    throw new Error('Supabase nao configurado.');
  }

  const { data, error } = await supabase.from('user_state').select('*').eq('user_id', userId).maybeSingle();
  if (error) throw error;

  if (data) {
    return data as RemoteStateRow;
  }

  const meta = getSyncMeta();
  const payload: Record<string, unknown> = {
    user_id: userId,
  };

  for (const domain of DOMAINS) {
    payload[domain] = getLocalDomainPayload(domain);
    const timestamp = meta[domain];
    payload[REMOTE_UPDATED_AT_COLUMN[domain]] = timestamp ? new Date(timestamp).toISOString() : null;
  }

  const { data: inserted, error: insertError } = await supabase
    .from('user_state')
    .insert(payload)
    .select('*')
    .single();

  if (insertError) throw insertError;
  return inserted as RemoteStateRow;
};

const buildRemoteUpdate = (domain: SyncDomain, payload: unknown, timestampMs: number): Record<string, unknown> => ({
  [domain]: payload,
  [REMOTE_UPDATED_AT_COLUMN[domain]]: new Date(timestampMs).toISOString(),
});

const syncWithRow = async (userId: string, row: RemoteStateRow): Promise<void> => {
  if (!supabase) return;

  const localMeta = getSyncMeta();
  const pulledMeta: Partial<Record<SyncDomain, number>> = {};

  for (const domain of DOMAINS) {
    const localTimestamp = localMeta[domain] || 0;
    const remoteTimestamp = toEpochMs(row[REMOTE_UPDATED_AT_COLUMN[domain]] as string | null);

    if (localTimestamp > remoteTimestamp) {
      const payload = getLocalDomainPayload(domain);
      const { error } = await supabase.from('user_state').update(buildRemoteUpdate(domain, payload, localTimestamp)).eq('user_id', userId);
      if (error) throw error;
      continue;
    }

    if (remoteTimestamp > localTimestamp) {
      setLocalDomainPayload(domain, row[domain]);
      pulledMeta[domain] = remoteTimestamp;
    }
  }

  if (Object.keys(pulledMeta).length > 0) {
    mergeSyncMeta(pulledMeta);
  }

  markSyncCompleted();
};

export const syncAll = async (_reason: SyncReason = 'manual'): Promise<void> => {
  if (syncInFlight) return syncInFlight;

  syncInFlight = (async () => {
    if (!supabase) return;

    const userId = await getCurrentUserId();
    if (!userId) return;

    const row = await ensureRowExists(userId);
    await syncWithRow(userId, row);
  })();

  try {
    await syncInFlight;
  } finally {
    syncInFlight = null;
  }
};

export const syncDomain = async (domain: SyncDomain): Promise<void> => {
  if (!supabase) return;

  const userId = await getCurrentUserId();
  if (!userId) return;

  const row = await ensureRowExists(userId);
  const localMeta = getSyncMeta();
  const localTimestamp = localMeta[domain] || 0;
  const remoteTimestamp = toEpochMs(row[REMOTE_UPDATED_AT_COLUMN[domain]] as string | null);

  if (localTimestamp > remoteTimestamp) {
    const payload = getLocalDomainPayload(domain);
    const { error } = await supabase
      .from('user_state')
      .update(buildRemoteUpdate(domain, payload, localTimestamp))
      .eq('user_id', userId);
    if (error) throw error;
    markSyncCompleted();
    return;
  }

  if (remoteTimestamp > localTimestamp) {
    setLocalDomainPayload(domain, row[domain]);
    mergeSyncMeta({ [domain]: remoteTimestamp });
    markSyncCompleted();
  }
};

export const bootstrapAfterLogin = async (): Promise<void> => {
  if (!supabase) return;

  await syncAll('startup');

  if (listenersAttached || typeof window === 'undefined') {
    return;
  }

  window.addEventListener('online', () => {
    void syncAll('online');
  });

  window.addEventListener('focus', () => {
    void syncAll('focus');
  });

  listenersAttached = true;
};
