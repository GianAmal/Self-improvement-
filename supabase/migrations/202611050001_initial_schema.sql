-- Daymark initial schema
-- Every user-owned table is protected by RLS and scoped to auth.uid().

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 90),
  category text not null default 'Personal',
  frequency text not null default 'Daily',
  color text not null default 'sage',
  sort_order integer not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null references public.habits(id) on delete cascade,
  completed_on date not null,
  completed_at timestamptz not null default now(),
  unique (habit_id, completed_on)
);

create table if not exists public.daily_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_date date not null,
  intention text not null default '',
  priorities jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id, plan_date)
);

create table if not exists public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null,
  planned_seconds integer not null default 1500 check (planned_seconds > 0),
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  completed boolean not null default false,
  label text not null default 'Focused work',
  created_at timestamptz not null default now()
);

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  body text not null default '',
  mood text not null default 'Steady',
  energy integer not null default 3 check (energy between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, entry_date)
);

create index if not exists habits_user_sort_idx on public.habits(user_id, sort_order);
create index if not exists habit_logs_user_date_idx on public.habit_logs(user_id, completed_on desc);
create index if not exists focus_sessions_user_date_idx on public.focus_sessions(user_id, started_at desc);
create index if not exists journal_entries_user_date_idx on public.journal_entries(user_id, entry_date desc);

alter table public.profiles enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;
alter table public.daily_plans enable row level security;
alter table public.focus_sessions enable row level security;
alter table public.journal_entries enable row level security;

drop policy if exists "Profiles are private to their owner" on public.profiles;
create policy "Profiles are private to their owner" on public.profiles
  for all to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "Users manage their own habits" on public.habits;
create policy "Users manage their own habits" on public.habits
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage their own habit logs" on public.habit_logs;
create policy "Users manage their own habit logs" on public.habit_logs
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.habits h
      where h.id = habit_id and h.user_id = (select auth.uid())
    )
  );

drop policy if exists "Users manage their own daily plans" on public.daily_plans;
create policy "Users manage their own daily plans" on public.daily_plans
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage their own focus sessions" on public.focus_sessions;
create policy "Users manage their own focus sessions" on public.focus_sessions
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage their own journal entries" on public.journal_entries;
create policy "Users manage their own journal entries" on public.journal_entries
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles, public.habits, public.habit_logs,
  public.daily_plans, public.focus_sessions, public.journal_entries to authenticated;