-- ═════════════════════════════════════════════════════════════════════════════
-- SONORA MUSIC APP — SUPABASE POSTGRESQL SCHEMA
-- Run this entire script once in your Supabase SQL Editor.
-- Dashboard → SQL Editor → New query → paste → Run
-- ═════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. TRACKS table
--    One row per song per user. Uploaded audio is referenced by audio_path;
--    audio_url is reserved for an authorized, direct browser-playable URL.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.tracks (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users (id) on delete cascade,
  title       text        not null,
  artist      text        not null default '',
  album       text        not null default '',
  genre       text        not null default 'Pop',
  mood        text        not null default 'Chill',
  duration    text        not null default '0:00',
  cover_url   text        not null default '',
  audio_url   text        not null default '',
  audio_path   text        not null default '',   -- empty until an audio object is uploaded
  lyrics_text  text        not null default '',
  lyrics_lrc   text        not null default '',
  playlist_ids text[]      not null default '{}',
  is_favorite  boolean     not null default false,
  is_seeded    boolean     not null default false, -- true = auto-seeded demo track
  created_at   timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. PLAYLISTS table
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.playlists (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users (id) on delete cascade,
  name        text        not null,
  cover_url   text        not null default '',
  created_at  timestamptz not null default now(),
  constraint playlists_user_name_unique unique (user_id, name)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. PLAYLIST_TRACKS junction table
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.playlist_tracks (
  playlist_id uuid        not null references public.playlists (id) on delete cascade,
  track_id    uuid        not null references public.tracks (id) on delete cascade,
  added_at    timestamptz not null default now(),
  primary key (playlist_id, track_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Row-Level Security — users only see / modify their own data
-- ─────────────────────────────────────────────────────────────────────────────

-- tracks
alter table public.tracks enable row level security;

create policy "tracks: select own"   on public.tracks for select using (auth.uid() = user_id);
create policy "tracks: insert own"   on public.tracks for insert with check (auth.uid() = user_id);
create policy "tracks: update own"   on public.tracks for update using (auth.uid() = user_id);
create policy "tracks: delete own"   on public.tracks for delete using (auth.uid() = user_id);

-- playlists
alter table public.playlists enable row level security;

create policy "playlists: select own" on public.playlists for select using (auth.uid() = user_id);
create policy "playlists: insert own" on public.playlists for insert with check (auth.uid() = user_id);
create policy "playlists: update own" on public.playlists for update using (auth.uid() = user_id);
create policy "playlists: delete own" on public.playlists for delete using (auth.uid() = user_id);

-- playlist_tracks (RLS via join — only rows whose playlist belongs to the user)
alter table public.playlist_tracks enable row level security;

create policy "playlist_tracks: select own"
  on public.playlist_tracks for select
  using (exists (
    select 1 from public.playlists p
    where p.id = playlist_id and p.user_id = auth.uid()
  ));

create policy "playlist_tracks: insert own"
  on public.playlist_tracks for insert
  with check (exists (
    select 1 from public.playlists p
    where p.id = playlist_id and p.user_id = auth.uid()
  ));

create policy "playlist_tracks: delete own"
  on public.playlist_tracks for delete
  using (exists (
    select 1 from public.playlists p
    where p.id = playlist_id and p.user_id = auth.uid()
  ));

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Indexes for common query patterns
-- ─────────────────────────────────────────────────────────────────────────────
create index if not exists tracks_user_id_idx          on public.tracks (user_id);
create index if not exists tracks_created_at_idx       on public.tracks (user_id, created_at desc);
create index if not exists playlists_user_id_idx       on public.playlists (user_id);
create index if not exists playlist_tracks_track_id_idx on public.playlist_tracks (track_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Supabase Storage bucket setup (run manually in dashboard if not done)
-- ─────────────────────────────────────────────────────────────────────────────
-- Storage → New bucket → Name: "music" → Public: OFF (private)
--
-- Apply lib/supabase/migrations/20261106_music_storage_and_lyrics.sql to
-- configure the private music bucket and its user-scoped Storage policies.
--

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. (Optional) Drop old blob table if you ran a previous version
-- ─────────────────────────────────────────────────────────────────────────────
-- drop table if exists public.sonora_library;
