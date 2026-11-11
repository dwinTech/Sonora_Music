// ─────────────────────────────────────────────────────────────────────────────
// Supabase Library Integration — Normalized PostgreSQL storage
//
// Tables used:
//   public.tracks           — one row per song per user
//   public.playlists        — one row per playlist per user
//   public.playlist_tracks  — junction: which tracks belong to which playlist
//
// Strategy:
//   • loadLibraryFromSupabase: fetch all rows → build MusicTrack[] with
//     playlistIds computed from playlist_tracks
//   • saveLibraryToSupabase:  upsert tracks + playlists, then reconcile
//     playlist_tracks junction rows
//   • First login: if user has 0 tracks, seed the 50 demo tracks
// ─────────────────────────────────────────────────────────────────────────────

import type { MusicTrack, Playlist } from '../../src/services/sonora-library';
import {
  getYouTubeVideoId,
  getSeedTracks,
  isDemoCatalogTrack,
  resolveTrackAudioUrl,
} from '../../src/services/sonora-library';

const AUDIO_BUCKET = 'music';
const LEGACY_AUDIO_BUCKET = 'tracks';
const SIGNED_AUDIO_URL_TTL_SECONDS = 60 * 60;

export interface LocalLibrary {
  tracks: MusicTrack[];
  playlists: Playlist[];
}

export interface UploadedAudio {
  path: string;
}

// ─── Audio Storage helpers ────────────────────────────────────────────────────

export interface TrackAudioPathStatus {
  trackId: string;
  title: string;
  status: 'present' | 'missing' | 'unverified' | 'no-path' | 'wrong-bucket' | 'legacy-bucket';
  detail?: string;
}

function decodeStoragePart(part: string): string {
  try {
    return decodeURIComponent(part);
  } catch {
    return part;
  }
}

function parseStorageObjectUrl(value: string): { bucket: string; path: string } | undefined {
  if (!/^https?:\/\//i.test(value)) return undefined;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return undefined;
  }
  const match = url.pathname.match(/\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/]+)\/(.+)$/);
  if (!match) return undefined;
  return {
    bucket: decodeStoragePart(match[1] ?? ''),
    path: (match[2] ?? '').split('/').map(decodeStoragePart).join('/'),
  };
}

function getStorageObjectReference(audioPath: string, audioUrl = ''): { bucket: string; path: string } {
  const value = audioPath.trim();
  if (!value) throw new Error('This track has no audio storage path.');

  if (/^https?:\/\//i.test(value)) {
    const reference = parseStorageObjectUrl(value);
    if (!reference) throw new Error('The saved audio path is not a Supabase Storage object URL.');
    return reference;
  }

  const normalizedPath = value.replace(/^\/+/, '');
  const firstSeparator = normalizedPath.indexOf('/');
  const prefix = firstSeparator < 0 ? normalizedPath : normalizedPath.slice(0, firstSeparator);
  const hasBucketPrefix = prefix === AUDIO_BUCKET || prefix === LEGACY_AUDIO_BUCKET;
  const path = hasBucketPrefix ? normalizedPath.slice(firstSeparator + 1) : normalizedPath;
  if (path.split('/').some((part) => !part || part === '.' || part === '..')) {
    throw new Error('The saved audio storage path is invalid.');
  }
  const urlReference = parseStorageObjectUrl(audioUrl);
  const bucket =
    hasBucketPrefix
      ? prefix
      : urlReference?.path === path
        ? urlReference.bucket
        : AUDIO_BUCKET;
  return { bucket, path };
}

/** Resolve a Storage key to a public URL or a short-lived URL for a private bucket. */
export async function resolveTrackAudioSource(track: MusicTrack): Promise<string> {
  if (track.audioPath?.trim()) {
    const reference = getStorageObjectReference(track.audioPath, track.audioUrl);
    if (![AUDIO_BUCKET, LEGACY_AUDIO_BUCKET].includes(reference.bucket)) {
      throw new Error(`This track points to unsupported Storage bucket "${reference.bucket}".`);
    }

    const { getSupabaseClient } = await import('./client');
    const storage = getSupabaseClient().storage;
    const { data: bucket, error: bucketError } = await storage.getBucket(reference.bucket);

    if (!bucketError && bucket?.public) {
      return storage.from(reference.bucket).getPublicUrl(reference.path).data.publicUrl;
    }

    const { data, error } = await storage
      .from(reference.bucket)
      .createSignedUrl(reference.path, SIGNED_AUDIO_URL_TTL_SECONDS);
    if (!error && data?.signedUrl) return data.signedUrl;

    if (bucketError) {
      const { data: publicData } = storage.from(reference.bucket).getPublicUrl(reference.path);
      return publicData.publicUrl;
    }
    throw new Error(
      `Could not create a playback URL for "${track.title}" in Storage bucket "${reference.bucket}": ${error?.message ?? 'unknown Storage error'}. Check the bucket and its SELECT policy.`,
    );
  }

  if (getYouTubeVideoId(track.audioUrl)) return track.audioUrl;
  const url = resolveTrackAudioUrl(track.audioUrl);
  if (url) return url;
  if (track.isSeeded || isDemoCatalogTrack(track.title, track.artist)) {
    throw new Error(`No original recording is linked for "${track.title}".`);
  }
  throw new Error(`"${track.title}" has no audio file or direct audio URL.`);
}

/** Check each recorded Storage path against file listings in the music bucket. */
export async function verifyTrackAudioPaths(tracks: MusicTrack[]): Promise<TrackAudioPathStatus[]> {
  const statuses: TrackAudioPathStatus[] = tracks.map((track) => ({
    trackId: track.id,
    title: track.title,
    status: 'no-path',
  }));
  const references = new Map<number, { bucket: string; folder: string; filename: string }>();

  tracks.forEach((track, index) => {
    if (!track.audioPath?.trim()) return;
    try {
      const reference = getStorageObjectReference(track.audioPath, track.audioUrl);
      if (![AUDIO_BUCKET, LEGACY_AUDIO_BUCKET].includes(reference.bucket)) {
        statuses[index] = {
          ...statuses[index]!,
          status: 'wrong-bucket',
          detail: `Stored in unsupported bucket "${reference.bucket}".`,
        };
        return;
      }
      const parts = reference.path.split('/');
      const filename = parts.pop();
      if (!filename) throw new Error('The storage path does not include a file name.');
      references.set(index, { bucket: reference.bucket, folder: parts.join('/'), filename });
    } catch (error) {
      statuses[index] = {
        ...statuses[index]!,
        status: 'unverified',
        detail: error instanceof Error ? error.message : 'Invalid Storage path.',
      };
    }
  });

  if (!references.size) return statuses;
  const { getSupabaseClient } = await import('./client');
  const storage = getSupabaseClient().storage;
  const folders = new Map<string, number[]>();
  for (const [index, reference] of references) {
    const key = `${reference.bucket}:${reference.folder}`;
    const indices = folders.get(key) ?? [];
    indices.push(index);
    folders.set(key, indices);
  }

  await Promise.all([...folders].map(async ([key, indices]) => {
    const separator = key.indexOf(':');
    const bucket = key.slice(0, separator);
    const folder = key.slice(separator + 1);
    const { data, error } = await storage.from(bucket).list(folder, { limit: 1000 });
    for (const index of indices) {
      const reference = references.get(index)!;
      if (error) {
        statuses[index] = { ...statuses[index]!, status: 'unverified', detail: error.message };
      } else {
        const found = (data ?? []).some((file) => file.name === reference.filename);
        if (!found) {
          statuses[index] = {
            ...statuses[index]!,
            status: 'missing',
            detail: `No matching file was found in "${bucket}/${folder}".`,
          };
        } else if (reference.bucket === LEGACY_AUDIO_BUCKET) {
          statuses[index] = {
            ...statuses[index]!,
            status: 'legacy-bucket',
            detail: `File exists in legacy bucket "${LEGACY_AUDIO_BUCKET}/${folder}".`,
          };
        } else {
          statuses[index] = { ...statuses[index]!, status: 'present' };
        }
      }
    }
  }));

  return statuses;
}

/** Upload an audio file to Supabase Storage bucket "music". */
export async function uploadTrackAudio(userId: string, file: File): Promise<UploadedAudio> {
  const { getSupabaseClient } = await import('./client');
  const client = getSupabaseClient();
  const ext = file.name.split('.').pop() ?? 'mp3';
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await client.storage
    .from(AUDIO_BUCKET)
    .upload(path, file, { contentType: file.type || 'audio/mpeg', upsert: false });

  if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);
  return { path };
}

/** Delete an audio file from Supabase Storage. */
export async function deleteTrackAudio(audioPath: string, audioUrl = ''): Promise<void> {
  if (!audioPath) return; // seeded/CDN tracks have no storage path
  const { getSupabaseClient } = await import('./client');
  const client = getSupabaseClient();
  const reference = getStorageObjectReference(audioPath, audioUrl);
  if (![AUDIO_BUCKET, LEGACY_AUDIO_BUCKET].includes(reference.bucket)) {
    throw new Error(`Refusing to delete audio outside supported Sonora Storage buckets.`);
  }
  const { error } = await client.storage.from(reference.bucket).remove([reference.path]);
  if (error) throw new Error(`Delete failed: ${error.message}`);
}

// ─── Row → MusicTrack mapper ──────────────────────────────────────────────────

type TrackRow = {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  mood: string;
  duration: string;
  cover_url: string;
  audio_url: string;
  audio_path: string;
  lyrics_text?: string | null;
  lyrics_lrc?: string | null;
  is_favorite: boolean;
  is_seeded?: boolean;
  playlist_ids?: string[] | null;
  created_at: string;
};

function rowToTrack(row: TrackRow, junctionPlaylistIds: string[] = []): MusicTrack {
  const playlistIds =
    Array.isArray(row.playlist_ids) && row.playlist_ids.length > 0
      ? row.playlist_ids
      : junctionPlaylistIds;

  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    album: row.album,
    genre: row.genre,
    mood: row.mood,
    duration: row.duration,
    coverUrl: row.cover_url,
    audioUrl: row.audio_url,
    audioPath: row.audio_path ?? '',
    lyricsText: row.lyrics_text ?? '',
    lyricsLrc: row.lyrics_lrc ?? '',
    isSeeded: row.is_seeded ?? false,
    is_favorite: row.is_favorite,
    playlistIds,
    createdAt: row.created_at,
  };
}

type PlaylistRow = {
  id: string;
  name: string;
  cover_url: string;
};

function rowToPlaylist(row: PlaylistRow): Playlist {
  return { id: row.id, name: row.name, coverUrl: row.cover_url };
}

// ─── Load library from Supabase ───────────────────────────────────────────────

/**
 * Load all tracks and playlists from Supabase.
 * On first login (0 tracks found), seeds metadata-only catalog entries.
 */
export async function loadLibraryFromSupabase(userId: string): Promise<LocalLibrary> {
  try {
    const { getSupabaseClient } = await import('./client');
    const client = getSupabaseClient();

    // ── 1. Fetch tracks ───────────────────────────────────────────────────────
    const { data: trackRows, error: tracksError } = await client
      .from('tracks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (tracksError) {
      throw new Error(`Could not load tracks from Supabase: ${tracksError.message}`);
    }

    // ── 2. Seed metadata-only catalog entries on first login ──────────────────
    let tracks: MusicTrack[];
    if (!trackRows?.length) {
      tracks = await seedDemoTracks(userId);
    } else {
      // ── 3. Fetch playlist_tracks to build playlistIds map ───────────────────
      const trackIds = trackRows.map((row) => row.id);
      const { data: junctionRows, error: junctionError } = await client
        .from('playlist_tracks')
        .select('playlist_id, track_id')
        .in('track_id', trackIds);
      if (junctionError) {
        throw new Error(`Could not load playlist memberships: ${junctionError.message}`);
      }

      const playlistIdsByTrack = new Map<string, string[]>();
      for (const row of junctionRows ?? []) {
        const existing = playlistIdsByTrack.get(row.track_id) ?? [];
        existing.push(row.playlist_id);
        playlistIdsByTrack.set(row.track_id, existing);
      }

      tracks = (trackRows as TrackRow[]).map((row) =>
        rowToTrack(row, playlistIdsByTrack.get(row.id) ?? []),
      );
    }

    // ── 4. Fetch playlists ────────────────────────────────────────────────────
    const { data: playlistRows, error: playlistsError } = await client
      .from('playlists')
      .select('id, name, cover_url')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (playlistsError) {
      throw new Error(`Could not load playlists from Supabase: ${playlistsError.message}`);
    }

    const playlists: Playlist[] = (playlistRows ?? []).map((row) => rowToPlaylist(row));

    return { tracks, playlists };
  } catch (err) {
    throw new Error(
      `Could not load your Supabase library: ${err instanceof Error ? err.message : 'unknown error'}`,
      { cause: err },
    );
  }
}

// ─── Save library to Supabase ─────────────────────────────────────────────────

/**
 * Persist all tracks and playlists to Supabase using upsert.
 * Also reconciles playlist_tracks junction rows.
 */
export async function saveLibraryToSupabase(
  userId: string,
  library: LocalLibrary,
): Promise<void> {
  try {
    const { getSupabaseClient } = await import('./client');
    const client = getSupabaseClient();

    // ── 1. Upsert tracks ──────────────────────────────────────────────────────
    if (library.tracks.length > 0) {
      const trackInserts = library.tracks.map((t) => ({
        id: t.id,
        user_id: userId,
        title: t.title,
        artist: t.artist,
        album: t.album,
        genre: t.genre,
        mood: t.mood,
        duration: t.duration,
        cover_url: t.coverUrl,
        audio_url: t.audioUrl,
        audio_path: t.audioPath,
        lyrics_text: t.lyricsText ?? '',
        lyrics_lrc: t.lyricsLrc ?? '',
        playlist_ids: t.playlistIds,
        is_favorite: t.is_favorite,
        created_at: t.createdAt,
      }));

      const { error: tracksError } = await client
        .from('tracks')
        .upsert(trackInserts, { onConflict: 'id' });

      if (tracksError) {
        throw new Error(`Could not save tracks to Supabase: ${tracksError.message}`);
      }
    }

    // ── 2. Upsert playlists ───────────────────────────────────────────────────
    if (library.playlists.length > 0) {
      const playlistInserts = library.playlists.map((p) => ({
        id: p.id,
        user_id: userId,
        name: p.name,
        cover_url: p.coverUrl,
      }));

      const { error: playlistsError } = await client
        .from('playlists')
        .upsert(playlistInserts, { onConflict: 'id' });

      if (playlistsError) {
        throw new Error(`Could not save playlists to Supabase: ${playlistsError.message}`);
      }
    }

    // ── 3. Reconcile playlist_tracks ─────────────────────────────────────────
    // Build the desired set of (playlist_id, track_id) pairs
    const desiredJunction: { playlist_id: string; track_id: string }[] = [];
    for (const track of library.tracks) {
      for (const playlistId of track.playlistIds) {
        desiredJunction.push({ playlist_id: playlistId, track_id: track.id });
      }
    }

    const playlistIds = library.playlists.map((p) => p.id);

    if (playlistIds.length > 0) {
      // Fetch existing junction rows for these playlists
      const { data: existingRows, error: existingError } = await client
        .from('playlist_tracks')
        .select('playlist_id, track_id')
        .in('playlist_id', playlistIds);
      if (existingError) {
        throw new Error(`Could not read playlist memberships: ${existingError.message}`);
      }

      const existingSet = new Set(
        (existingRows ?? []).map((r) => `${r.playlist_id}:${r.track_id}`),
      );
      const desiredSet = new Set(
        desiredJunction.map((r) => `${r.playlist_id}:${r.track_id}`),
      );

      // Insert rows that are in desired but not in existing
      const toInsert = desiredJunction.filter(
        (r) => !existingSet.has(`${r.playlist_id}:${r.track_id}`),
      );
      if (toInsert.length > 0) {
        const { error: insertError } = await client
          .from('playlist_tracks')
          .insert(toInsert);
        if (insertError) {
          throw new Error(`Could not save playlist memberships: ${insertError.message}`);
        }
      }

      // Delete rows that are in existing but not in desired
      const toDelete = (existingRows ?? []).filter(
        (r) => !desiredSet.has(`${r.playlist_id}:${r.track_id}`),
      );
      for (const row of toDelete) {
        const { error: deleteError } = await client
          .from('playlist_tracks')
          .delete()
          .eq('playlist_id', row.playlist_id)
          .eq('track_id', row.track_id);
        if (deleteError) {
          throw new Error(`Could not remove playlist memberships: ${deleteError.message}`);
        }
      }
    }
  } catch (err) {
    throw new Error(
      `Could not sync your library with Supabase: ${err instanceof Error ? err.message : 'unknown error'}`,
      { cause: err },
    );
  }
}

// ─── Delete a single track from Supabase ────────────────────────────────────

/** Remove a track row from Supabase (playlist_tracks cascade automatically). */
export async function deleteTrackFromSupabase(trackId: string): Promise<void> {
  try {
    const { getSupabaseClient } = await import('./client');
    const client = getSupabaseClient();
    const { error } = await client.from('tracks').delete().eq('id', trackId);
    if (error) console.warn('[Sonora] track delete error:', error.message);
  } catch (err) {
    console.warn('[Sonora] deleteTrackFromSupabase error:', err);
  }
}

/** Remove a playlist row from Supabase (playlist_tracks cascade automatically). */
export async function deletePlaylistFromSupabase(playlistId: string): Promise<void> {
  try {
    const { getSupabaseClient } = await import('./client');
    const client = getSupabaseClient();
    const { error } = await client.from('playlists').delete().eq('id', playlistId);
    if (error) console.warn('[Sonora] playlist delete error:', error.message);
  } catch (err) {
    console.warn('[Sonora] deletePlaylistFromSupabase error:', err);
  }
}


// ─── Seed 50 demo tracks ──────────────────────────────────────────────────────

async function seedDemoTracks(userId: string): Promise<MusicTrack[]> {
  const { getSupabaseClient } = await import('./client');
  const client = getSupabaseClient();
  const seedTracks = getSeedTracks();

  const inserts = seedTracks.map((track) => ({
    id: track.id,
    user_id: userId,
    title: track.title,
    artist: track.artist,
    album: track.album,
    genre: track.genre,
    mood: track.mood,
    duration: track.duration,
    cover_url: track.coverUrl,
    audio_url: '',
    audio_path: '',
    lyrics_text: track.lyricsText ?? '',
    lyrics_lrc: track.lyricsLrc ?? '',
    is_favorite: false,
    is_seeded: true,
    created_at: track.createdAt,
  }));

  const { error } = await client.from('tracks').insert(inserts);
  if (error) {
    throw new Error(`Could not create the catalog metadata in Supabase: ${error.message}`);
  }
  return seedTracks;
}
