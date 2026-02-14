import { createClient } from 'jsr:@supabase/supabase-js@2';
import webpush from 'npm:web-push';

interface PushRow {
  id: number;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  enabled: boolean;
  timezone: string;
  reminder_time: string;
  last_sent_on: string | null;
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!;
const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!;
const vapidSubject = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:dev@grace.local';

webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

const supabase = createClient(supabaseUrl, serviceRole);

const localDate = (date: Date, timezone: string): string => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};

const localTime = (date: Date, timezone: string): string => {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
};

const shouldSendNow = (row: PushRow, now: Date): boolean => {
  if (!row.enabled) return false;

  const currentTime = localTime(now, row.timezone);
  if (currentTime !== row.reminder_time) return false;

  const today = localDate(now, row.timezone);
  return row.last_sent_on !== today;
};

Deno.serve(async () => {
  const now = new Date();

  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('id,user_id,endpoint,p256dh,auth,enabled,timezone,reminder_time,last_sent_on')
    .eq('enabled', true);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const rows = (data ?? []) as PushRow[];
  let sent = 0;
  let failed = 0;

  for (const row of rows) {
    if (!shouldSendNow(row, now)) continue;

    try {
      await webpush.sendNotification(
        {
          endpoint: row.endpoint,
          keys: {
            p256dh: row.p256dh,
            auth: row.auth,
          },
        },
        JSON.stringify({
          title: 'Bíblia Dabar',
          body: 'Seu lembrete diario: reserve um tempo para sua leitura de hoje.',
          url: '/',
          at: now.toISOString(),
        })
      );

      const dateToPersist = localDate(now, row.timezone);
      const { error: updateError } = await supabase
        .from('push_subscriptions')
        .update({ last_sent_on: dateToPersist })
        .eq('id', row.id);

      if (updateError) {
        failed += 1;
      } else {
        sent += 1;
      }
    } catch {
      failed += 1;
    }
  }

  return new Response(
    JSON.stringify({
      checked: rows.length,
      sent,
      failed,
      processedAt: now.toISOString(),
    }),
    { status: 200, headers: { 'content-type': 'application/json' } }
  );
});
