create extension if not exists pgcrypto;

create table if not exists public.user_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  favorites jsonb not null default '[]'::jsonb,
  notes jsonb not null default '[]'::jsonb,
  highlights jsonb not null default '[]'::jsonb,
  progress jsonb,
  chapters jsonb not null default '[]'::jsonb,
  settings jsonb,
  plan jsonb,
  favorites_updated_at timestamptz,
  notes_updated_at timestamptz,
  highlights_updated_at timestamptz,
  progress_updated_at timestamptz,
  chapters_updated_at timestamptz,
  settings_updated_at timestamptz,
  plan_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.push_subscriptions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  enabled boolean not null default true,
  timezone text not null default 'UTC',
  reminder_time text not null default '07:00',
  last_sent_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(endpoint)
);

create table if not exists public.reading_plan_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id text not null default 'bible-1y',
  is_active boolean not null default false,
  start_date date,
  completed_dates jsonb not null default '[]'::jsonb,
  opened_chapters_by_date jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key(user_id, plan_id)
);

alter table public.user_state enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.reading_plan_state enable row level security;

create policy "user_state_select_own" on public.user_state
for select using (auth.uid() = user_id);

create policy "user_state_insert_own" on public.user_state
for insert with check (auth.uid() = user_id);

create policy "user_state_update_own" on public.user_state
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "push_subscriptions_select_own" on public.push_subscriptions
for select using (auth.uid() = user_id);

create policy "push_subscriptions_insert_own" on public.push_subscriptions
for insert with check (auth.uid() = user_id);

create policy "push_subscriptions_update_own" on public.push_subscriptions
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "push_subscriptions_delete_own" on public.push_subscriptions
for delete using (auth.uid() = user_id);

create policy "reading_plan_state_select_own" on public.reading_plan_state
for select using (auth.uid() = user_id);

create policy "reading_plan_state_insert_own" on public.reading_plan_state
for insert with check (auth.uid() = user_id);

create policy "reading_plan_state_update_own" on public.reading_plan_state
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_user_state_updated_at
before update on public.user_state
for each row execute function public.touch_updated_at();

create trigger trg_push_subscriptions_updated_at
before update on public.push_subscriptions
for each row execute function public.touch_updated_at();
