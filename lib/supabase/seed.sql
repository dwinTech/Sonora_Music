-- ═════════════════════════════════════════════════════════════════════════════
-- SONORA MUSIC APP — OPTIONAL DIRECT SQL SEED
-- ═════════════════════════════════════════════════════════════════════════════
-- NOTE: The Sonora web app automatically seeds these tracks for you on first
-- login via TypeScript/Supabase client.
--
-- However, if you want to insert them directly into your database using the
-- Supabase SQL Editor, run this script!
--
-- STEP 1: Go to Supabase Dashboard → Authentication → Users
-- STEP 2: Copy your user's UUID (e.g. 'a1b2c3d4-e5f6-7890-abcd-ef1234567890')
-- STEP 3: Replace 'YOUR_USER_ID_HERE' with your real UUID in the DO block below:
-- ═════════════════════════════════════════════════════════════════════════════

do $$
declare
  target_user_id uuid := 'YOUR_USER_ID_HERE'::uuid; -- <-- Put your user UUID here
begin

  insert into public.tracks (
    user_id, title, artist, album, genre, mood, duration, cover_url, audio_url, audio_path, is_favorite, is_seeded
  ) values
  -- ── One Direction (5) ────────────────────────────────────────────────────────
  (target_user_id, 'What Makes You Beautiful', 'One Direction', 'Up All Night', 'Pop', 'Feel good', '3:18', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80', 'https://cdn.freesound.org/previews/612/612046_5674468-lq.mp3', '', false, true),
  (target_user_id, 'Story of My Life', 'One Direction', 'Midnight Memories', 'Pop', 'Chill', '4:05', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80', 'https://cdn.freesound.org/previews/612/612047_5674468-lq.mp3', '', false, true),
  (target_user_id, 'Night Changes', 'One Direction', 'Four', 'Pop', 'Late night', '3:46', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80', 'https://cdn.freesound.org/previews/612/612048_5674468-lq.mp3', '', false, true),
  (target_user_id, 'Drag Me Down', 'One Direction', 'Made in the A.M.', 'Pop', 'Feel good', '3:12', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80', 'https://cdn.freesound.org/previews/612/612049_5674468-lq.mp3', '', false, true),
  (target_user_id, 'Steal My Girl', 'One Direction', 'Four', 'Pop', 'Feel good', '3:48', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80', 'https://cdn.freesound.org/previews/612/612050_5674468-lq.mp3', '', false, true),

  -- ── Backstreet Boys (5) ──────────────────────────────────────────────────────
  (target_user_id, 'I Want It That Way', 'Backstreet Boys', 'Millennium', 'Pop', 'Feel good', '3:33', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=400&q=80', 'https://cdn.freesound.org/previews/612/612051_5674468-lq.mp3', '', false, true),
  (target_user_id, 'Everybody (Backstreet''s Back)', 'Backstreet Boys', 'Backstreet''s Back', 'Pop', 'Feel good', '3:44', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=400&q=80', 'https://cdn.freesound.org/previews/612/612052_5674468-lq.mp3', '', false, true),
  (target_user_id, 'As Long As You Love Me', 'Backstreet Boys', 'Backstreet''s Back', 'Pop', 'Chill', '3:32', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=400&q=80', 'https://cdn.freesound.org/previews/612/612053_5674468-lq.mp3', '', false, true),
  (target_user_id, 'Show Me the Meaning of Being Lonely', 'Backstreet Boys', 'Millennium', 'Pop', 'Late night', '3:54', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=400&q=80', 'https://cdn.freesound.org/previews/612/612054_5674468-lq.mp3', '', false, true),
  (target_user_id, 'Quit Playing Games (With My Heart)', 'Backstreet Boys', 'Backstreet Boys', 'Pop', 'Chill', '3:52', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=400&q=80', 'https://cdn.freesound.org/previews/612/612055_5674468-lq.mp3', '', false, true),

  -- ── Linkin Park (5) ──────────────────────────────────────────────────────────
  (target_user_id, 'In the End', 'Linkin Park', 'Hybrid Theory', 'Rock', 'Feel good', '3:36', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400&q=80', 'https://cdn.freesound.org/previews/612/612046_5674468-lq.mp3', '', false, true),
  (target_user_id, 'Numb', 'Linkin Park', 'Meteora', 'Rock', 'Late night', '3:07', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400&q=80', 'https://cdn.freesound.org/previews/612/612047_5674468-lq.mp3', '', false, true),
  (target_user_id, 'Crawling', 'Linkin Park', 'Hybrid Theory', 'Rock', 'Late night', '3:29', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400&q=80', 'https://cdn.freesound.org/previews/612/612048_5674468-lq.mp3', '', false, true),
  (target_user_id, 'Faint', 'Linkin Park', 'Meteora', 'Rock', 'Feel good', '2:42', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400&q=80', 'https://cdn.freesound.org/previews/612/612049_5674468-lq.mp3', '', false, true),
  (target_user_id, 'Somewhere I Belong', 'Linkin Park', 'Meteora', 'Rock', 'Late night', '3:33', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400&q=80', 'https://cdn.freesound.org/previews/612/612050_5674468-lq.mp3', '', false, true),

  -- ── Sad Songs (5) ────────────────────────────────────────────────────────────
  (target_user_id, 'Someone You Loved', 'Lewis Capaldi', 'Divinely Uninspired', 'Pop', 'Late night', '3:02', 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=400&q=80', 'https://cdn.freesound.org/previews/612/612051_5674468-lq.mp3', '', false, true),
  (target_user_id, 'Fix You', 'Coldplay', 'X&Y', 'Alternative', 'Late night', '4:55', 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=400&q=80', 'https://cdn.freesound.org/previews/612/612052_5674468-lq.mp3', '', false, true),
  (target_user_id, 'When I Was Your Man', 'Bruno Mars', 'Unorthodox Jukebox', 'Pop', 'Late night', '3:33', 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=400&q=80', 'https://cdn.freesound.org/previews/612/612053_5674468-lq.mp3', '', false, true),
  (target_user_id, 'All of Me', 'John Legend', 'Love in the Future', 'Soul', 'Chill', '4:29', 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=400&q=80', 'https://cdn.freesound.org/previews/612/612054_5674468-lq.mp3', '', false, true),
  (target_user_id, 'Say Something', 'A Great Big World', 'Is There Anybody Out There?', 'Pop', 'Late night', '3:49', 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=400&q=80', 'https://cdn.freesound.org/previews/612/612055_5674468-lq.mp3', '', false, true),

  -- ── Disco Songs (5) ──────────────────────────────────────────────────────────
  (target_user_id, 'Stayin'' Alive', 'Bee Gees', 'Saturday Night Fever', 'Pop', 'Feel good', '4:45', 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=400&q=80', 'https://cdn.freesound.org/previews/612/612046_5674468-lq.mp3', '', false, true),
  (target_user_id, 'Le Freak', 'CHIC', 'C''est CHIC', 'Pop', 'Feel good', '5:28', 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=400&q=80', 'https://cdn.freesound.org/previews/612/612047_5674468-lq.mp3', '', false, true),
  (target_user_id, 'Don''t Stop ''Til You Get Enough', 'Michael Jackson', 'Off the Wall', 'Pop', 'Feel good', '6:05', 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=400&q=80', 'https://cdn.freesound.org/previews/612/612048_5674468-lq.mp3', '', false, true),
  (target_user_id, 'I Will Survive', 'Gloria Gaynor', 'Love Tracks', 'Pop', 'Feel good', '3:18', 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=400&q=80', 'https://cdn.freesound.org/previews/612/612049_5674468-lq.mp3', '', false, true),
  (target_user_id, 'Disco Inferno', 'The Trammps', 'Disco Inferno', 'Pop', 'Feel good', '3:35', 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=400&q=80', 'https://cdn.freesound.org/previews/612/612050_5674468-lq.mp3', '', false, true),

  -- ── Westlife (5) ─────────────────────────────────────────────────────────────
  (target_user_id, 'My Love', 'Westlife', 'Coast to Coast', 'Pop', 'Chill', '3:52', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80', 'https://cdn.freesound.org/previews/612/612051_5674468-lq.mp3', '', false, true),
  (target_user_id, 'You Raise Me Up', 'Westlife', 'Face to Face', 'Pop', 'Chill', '4:01', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80', 'https://cdn.freesound.org/previews/612/612052_5674468-lq.mp3', '', false, true),
  (target_user_id, 'Swear It Again', 'Westlife', 'Westlife', 'Pop', 'Chill', '4:08', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80', 'https://cdn.freesound.org/previews/612/612053_5674468-lq.mp3', '', false, true),
  (target_user_id, 'Flying Without Wings', 'Westlife', 'Westlife', 'Pop', 'Feel good', '3:35', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80', 'https://cdn.freesound.org/previews/612/612054_5674468-lq.mp3', '', false, true),
  (target_user_id, 'Fool Again', 'Westlife', 'Westlife', 'Pop', 'Chill', '3:54', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80', 'https://cdn.freesound.org/previews/612/612055_5674468-lq.mp3', '', false, true),

  -- ── Boyzone (5) ──────────────────────────────────────────────────────────────
  (target_user_id, 'No Matter What', 'Boyzone', 'Where We Belong', 'Pop', 'Chill', '4:35', 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=400&q=80', 'https://cdn.freesound.org/previews/612/612046_5674468-lq.mp3', '', false, true),
  (target_user_id, 'Words', 'Boyzone', 'A Different Beat', 'Pop', 'Chill', '4:04', 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=400&q=80', 'https://cdn.freesound.org/previews/612/612047_5674468-lq.mp3', '', false, true),
  (target_user_id, 'Picture of You', 'Boyzone', 'Where We Belong', 'Pop', 'Feel good', '3:28', 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=400&q=80', 'https://cdn.freesound.org/previews/612/612048_5674468-lq.mp3', '', false, true),
  (target_user_id, 'Love Me for a Reason', 'Boyzone', 'Said and Done', 'Pop', 'Chill', '3:39', 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=400&q=80', 'https://cdn.freesound.org/previews/612/612049_5674468-lq.mp3', '', false, true),
  (target_user_id, 'Father and Son', 'Boyzone', 'Said and Done', 'Pop', 'Chill', '2:46', 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=400&q=80', 'https://cdn.freesound.org/previews/612/612050_5674468-lq.mp3', '', false, true),

  -- ── Bryan Adams (5) ──────────────────────────────────────────────────────────
  (target_user_id, '(Everything I Do) I Do It for You', 'Bryan Adams', 'Waking Up the Neighbours', 'Rock', 'Chill', '6:34', 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=400&q=80', 'https://cdn.freesound.org/previews/612/612051_5674468-lq.mp3', '', false, true),
  (target_user_id, 'Summer of ''69', 'Bryan Adams', 'Reckless', 'Rock', 'Feel good', '3:36', 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=400&q=80', 'https://cdn.freesound.org/previews/612/612052_5674468-lq.mp3', '', false, true),
  (target_user_id, 'Heaven', 'Bryan Adams', 'Reckless', 'Rock', 'Late night', '4:03', 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=400&q=80', 'https://cdn.freesound.org/previews/612/612053_5674468-lq.mp3', '', false, true),
  (target_user_id, 'Please Forgive Me', 'Bryan Adams', 'So Far So Good', 'Rock', 'Late night', '5:55', 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=400&q=80', 'https://cdn.freesound.org/previews/612/612054_5674468-lq.mp3', '', false, true),
  (target_user_id, 'Have You Ever Really Loved a Woman?', 'Bryan Adams', '18 til I Die', 'Rock', 'Chill', '4:48', 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=400&q=80', 'https://cdn.freesound.org/previews/612/612055_5674468-lq.mp3', '', false, true),

  -- ── Sleep Songs (5) ──────────────────────────────────────────────────────────
  (target_user_id, 'Weightless', 'Marconi Union', 'Weightless', 'Classical', 'Chill', '8:08', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80', 'https://cdn.freesound.org/previews/612/612046_5674468-lq.mp3', '', false, true),
  (target_user_id, 'Clair de Lune', 'Claude Debussy', 'Suite Bergamasque', 'Classical', 'Chill', '5:04', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80', 'https://cdn.freesound.org/previews/612/612047_5674468-lq.mp3', '', false, true),
  (target_user_id, 'Gymnopédie No. 1', 'Erik Satie', 'Gymnopédies', 'Classical', 'Chill', '3:20', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80', 'https://cdn.freesound.org/previews/612/612048_5674468-lq.mp3', '', false, true),
  (target_user_id, 'Spiegel im Spiegel', 'Arvo Pärt', 'Spiegel im Spiegel', 'Classical', 'Chill', '8:12', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80', 'https://cdn.freesound.org/previews/612/612049_5674468-lq.mp3', '', false, true),
  (target_user_id, 'Daydreaming', 'Radiohead', 'A Moon Shaped Pool', 'Indie', 'Late night', '6:24', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80', 'https://cdn.freesound.org/previews/612/612050_5674468-lq.mp3', '', false, true),

  -- ── Energize (5) ─────────────────────────────────────────────────────────────
  (target_user_id, 'Can''t Hold Us', 'Macklemore & Ryan Lewis', 'The Heist', 'Hip-Hop', 'Feel good', '4:18', 'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?auto=format&fit=crop&w=400&q=80', 'https://cdn.freesound.org/previews/612/612051_5674468-lq.mp3', '', false, true),
  (target_user_id, 'Eye of the Tiger', 'Survivor', 'Eye of the Tiger', 'Rock', 'Feel good', '4:04', 'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?auto=format&fit=crop&w=400&q=80', 'https://cdn.freesound.org/previews/612/612052_5674468-lq.mp3', '', false, true),
  (target_user_id, 'Power', 'Kanye West', 'My Beautiful Dark Twisted Fantasy', 'Hip-Hop', 'Feel good', '4:52', 'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?auto=format&fit=crop&w=400&q=80', 'https://cdn.freesound.org/previews/612/612053_5674468-lq.mp3', '', false, true),
  (target_user_id, 'Thunderstruck', 'AC/DC', 'The Razors Edge', 'Rock', 'Feel good', '4:52', 'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?auto=format&fit=crop&w=400&q=80', 'https://cdn.freesound.org/previews/612/612054_5674468-lq.mp3', '', false, true),
  (target_user_id, 'Jump', 'Van Halen', '1984', 'Rock', 'Feel good', '4:03', 'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?auto=format&fit=crop&w=400&q=80', 'https://cdn.freesound.org/previews/612/612055_5674468-lq.mp3', '', false, true),

  -- ── Alan Walker (5) ──────────────────────────────────────────────────────────
  (target_user_id, 'Faded', 'Alan Walker', 'Different World', 'Electronic', 'Late night', '3:33', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80', 'https://cdn.freesound.org/previews/612/612046_5674468-lq.mp3', '', false, true),
  (target_user_id, 'Alone', 'Alan Walker', 'Different World', 'Electronic', 'Late night', '2:41', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80', 'https://cdn.freesound.org/previews/612/612047_5674468-lq.mp3', '', false, true),
  (target_user_id, 'The Spectre', 'Alan Walker', 'Different World', 'Electronic', 'Late night', '3:00', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80', 'https://cdn.freesound.org/previews/612/612048_5674468-lq.mp3', '', false, true),
  (target_user_id, 'On My Way', 'Alan Walker', 'On My Way', 'Electronic', 'Chill', '3:08', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80', 'https://cdn.freesound.org/previews/612/612049_5674468-lq.mp3', '', false, true),
  (target_user_id, 'Lily', 'Alan Walker', 'Different World', 'Electronic', 'Feel good', '3:21', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80', 'https://cdn.freesound.org/previews/612/612050_5674468-lq.mp3', '', false, true);

  -- These rows are catalog metadata only; never treat unrelated sample clips as song audio.
  update public.tracks
  set audio_url = ''
  where user_id = target_user_id
    and is_seeded = true
    and coalesce(audio_path, '') = '';

end $$;
