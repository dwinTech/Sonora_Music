-- 1. Add any columns the app expects that your tracks table may be missing
alter table public.tracks
  add column if not exists audio_url    text    not null default '',
  add column if not exists audio_path   text    not null default '',
  add column if not exists lyrics_text  text    not null default '',
  add column if not exists lyrics_lrc   text    not null default '',
  add column if not exists playlist_ids text[]  not null default '{}',
  add column if not exists is_favorite  boolean not null default false,
  add column if not exists is_seeded    boolean not null default false;

-- 2. Private "music" bucket for uploaded audio
insert into storage.buckets (id, name, public)
values ('music', 'music', false)
on conflict (id) do nothing;

-- 3. Storage policies: each user can only access files in their own folder
drop policy if exists "sonora music read own" on storage.objects;
create policy "sonora music read own"
  on storage.objects for select
  using (
    bucket_id = 'music'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "sonora music upload own" on storage.objects;
create policy "sonora music upload own"
  on storage.objects for insert
  with check (
    bucket_id = 'music'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "sonora music update own" on storage.objects;
create policy "sonora music update own"
  on storage.objects for update
  using (
    bucket_id = 'music'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'music'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "sonora music delete own" on storage.objects;
create policy "sonora music delete own"
  on storage.objects for delete
  using (
    bucket_id = 'music'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- 4. Make the API pick up the new columns right away
notify pgrst, 'reload schema';