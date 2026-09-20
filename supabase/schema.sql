-- RoadmapTool-v3 cloud backup table for Supabase.
-- Run this in the Supabase SQL editor, then enable email auth
-- (Authentication -> Providers -> Email, including magic links).
--
-- Table stores one scenario library per user. The app upserts on
-- user_id and reads back the latest backup for restore/merge.

create table if not exists public.scenario_libraries (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.scenario_libraries enable row level security;

drop policy if exists "Users manage their own scenario library"
  on public.scenario_libraries;

create policy "Users manage their own scenario library"
  on public.scenario_libraries
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
