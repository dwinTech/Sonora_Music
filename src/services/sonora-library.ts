// ─────────────────────────────────────────────────────────────────────────────
// Sonora Library Service
// Handles local storage persistence and provides the core data structures for
// the Sonora music app. Pre-seeds 50 demo tracks across all requested artists.
// ─────────────────────────────────────────────────────────────────────────────

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  mood: string;
  duration: string;
  coverUrl: string;
  audioUrl: string;
  audioPath: string;
  lyricsText?: string;
  lyricsLrc?: string;
  isSeeded?: boolean;
  playlistIds: string[];
  is_favorite: boolean;
  createdAt: string;
}

export interface NewTrack {
  title: string;
  artist: string;
  album: string;
  coverUrl: string;
  genre: string;
  mood: string;
  duration?: string;
  audioUrl?: string;
  audioPath?: string;
  lyricsText?: string;
  lyricsLrc?: string;
}

export interface Playlist {
  id: string;
  name: string;
  coverUrl: string;
}

export interface ListeningHistoryItem {
  trackId: string;
  playedAt: string;
}

// ─── localStorage keys ────────────────────────────────────────────────────────
const tracksKey = (userId: string) => `sonora-tracks-${userId}`;
const playlistsKey = (userId: string) => `sonora-playlists-${userId}`;
const historyKey = (userId: string) => `sonora-history-${userId}`;

// ─── makeTrack helper ─────────────────────────────────────────────────────────
export function makeTrack(fields: NewTrack, playlistId?: string): MusicTrack {
  return {
    id: crypto.randomUUID(),
    title: fields.title ?? '',
    artist: fields.artist ?? '',
    album: fields.album ?? '',
    genre: fields.genre ?? 'Pop',
    mood: fields.mood ?? 'Chill',
    duration: fields.duration ?? '3:30',
    coverUrl: fields.coverUrl ?? '',
    audioUrl: fields.audioUrl ?? '',
    audioPath: fields.audioPath ?? '',
    lyricsText: fields.lyricsText ?? '',
    lyricsLrc: fields.lyricsLrc ?? '',
    isSeeded: false,
    playlistIds: playlistId ? [playlistId] : [],
    is_favorite: false,
    createdAt: new Date().toISOString(),
  };
}

// ─── Demo track seeds ─────────────────────────────────────────────────────────
// 55 tracks across One Direction, Backstreet Boys, Linkin Park, Sad songs,
// Disco, Westlife, Boyzone, Bryan Adams, Sleep, Energize, Alan Walker.
// Catalog entries have no audio until a user adds a recording or URL.
const TRACK_YOUTUBE_MAP: Record<string, string> = {};

export function getYouTubeVideoId(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value.trim());
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    let videoId: string | undefined;
    if (host === 'youtu.be') {
      videoId = url.pathname.split('/').filter(Boolean)[0];
    } else if (['youtube.com', 'm.youtube.com', 'youtube-nocookie.com'].includes(host)) {
      const pathParts = url.pathname.split('/').filter(Boolean);
      videoId = url.pathname === '/watch'
        ? url.searchParams.get('v') ?? undefined
        : ['embed', 'shorts', 'live'].includes(pathParts[0] ?? '')
          ? pathParts[1]
          : undefined;
    }
    return videoId && /^[\w-]{11}$/.test(videoId) ? videoId : undefined;
  } catch {
    return undefined;
  }
}

function isPlayableAudioUrl(url: string | undefined): boolean {
  if (!url || !url.trim()) return false;
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    return (
      ['http:', 'https:', 'blob:', 'data:'].includes(parsed.protocol) &&
      !/(^|\.)youtube\.com$|(^|\.)youtu\.be$|(^|\.)youtube-nocookie\.com$|(^|\.)soundhelix\.com$/i.test(
        parsed.hostname,
      )
    );
  } catch {
    return false;
  }
}

export function resolveTrackAudioUrl(currentUrl?: string): string {
  if (currentUrl && isPlayableAudioUrl(currentUrl)) {
    return currentUrl;
  }
  return '';
}

const COVERS = {
  oneDirection:
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=400&q=80',
  backstreetBoys:
    'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=400&q=80',
  linkinPark:
    'https://images.unsplash.com/photo-1468164016595-6108e4c60753?auto=format&fit=crop&w=400&q=80',
  sadSong:
    'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=400&q=80',
  disco:
    'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?auto=format&fit=crop&w=400&q=80',
  westlife:
    'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?auto=format&fit=crop&w=400&q=80',
  boyzone:
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80',
  bryanAdams:
    'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=400&q=80',
  sleep:
    'https://images.unsplash.com/photo-1531353826977-0941b4779a1c?auto=format&fit=crop&w=400&q=80',
  energize:
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=400&q=80',
  alanWalker:
    'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=400&q=80',
};

type SeedTrack = Omit<MusicTrack, 'id' | 'playlistIds' | 'is_favorite' | 'audioPath'>;

const SEED_TRACKS: SeedTrack[] = [
  // ── One Direction (5) ────────────────────────────────────────────────────
  { title: 'What Makes You Beautiful', artist: 'One Direction', album: 'Up All Night', genre: 'Pop', mood: 'Feel good', duration: '3:19', coverUrl: COVERS.oneDirection, audioUrl: TRACK_YOUTUBE_MAP['What Makes You Beautiful']!, createdAt: '2024-01-01T00:00:00Z' },
  { title: 'Story of My Life', artist: 'One Direction', album: 'Midnight Memories', genre: 'Pop', mood: 'Chill', duration: '4:01', coverUrl: COVERS.oneDirection, audioUrl: TRACK_YOUTUBE_MAP['Story of My Life']!, createdAt: '2024-01-01T00:01:00Z' },
  { title: 'Best Song Ever', artist: 'One Direction', album: 'Midnight Memories', genre: 'Pop', mood: 'Feel good', duration: '3:36', coverUrl: COVERS.oneDirection, audioUrl: TRACK_YOUTUBE_MAP['Best Song Ever']!, createdAt: '2024-01-01T00:02:00Z' },
  { title: 'Night Changes', artist: 'One Direction', album: 'Four', genre: 'Pop', mood: 'Late night', duration: '3:57', coverUrl: COVERS.oneDirection, audioUrl: TRACK_YOUTUBE_MAP['Night Changes']!, createdAt: '2024-01-01T00:03:00Z' },
  { title: 'Drag Me Down', artist: 'One Direction', album: 'Made in the A.M.', genre: 'Pop', mood: 'Feel good', duration: '3:21', coverUrl: COVERS.oneDirection, audioUrl: TRACK_YOUTUBE_MAP['Drag Me Down']!, createdAt: '2024-01-01T00:04:00Z' },

  // ── Backstreet Boys (5) ──────────────────────────────────────────────────
  { title: 'I Want It That Way', artist: 'Backstreet Boys', album: 'Millennium', genre: 'Pop', mood: 'Chill', duration: '3:33', coverUrl: COVERS.backstreetBoys, audioUrl: TRACK_YOUTUBE_MAP['I Want It That Way']!, createdAt: '2024-01-01T00:05:00Z' },
  { title: "Everybody (Backstreet's Back)", artist: 'Backstreet Boys', album: 'Backstreet Boys', genre: 'Pop', mood: 'Feel good', duration: '4:07', coverUrl: COVERS.backstreetBoys, audioUrl: TRACK_YOUTUBE_MAP["Everybody (Backstreet's Back)"]!, createdAt: '2024-01-01T00:06:00Z' },
  { title: 'As Long as You Love Me', artist: 'Backstreet Boys', album: 'Backstreet Boys', genre: 'Pop', mood: 'Chill', duration: '3:33', coverUrl: COVERS.backstreetBoys, audioUrl: TRACK_YOUTUBE_MAP['As Long as You Love Me']!, createdAt: '2024-01-01T00:07:00Z' },
  { title: 'Quit Playing Games (With My Heart)', artist: 'Backstreet Boys', album: 'Backstreet Boys', genre: 'Pop', mood: 'Chill', duration: '3:53', coverUrl: COVERS.backstreetBoys, audioUrl: TRACK_YOUTUBE_MAP['Quit Playing Games (With My Heart)']!, createdAt: '2024-01-01T00:08:00Z' },
  { title: 'Show Me the Meaning of Being Lonely', artist: 'Backstreet Boys', album: 'Millennium', genre: 'Pop', mood: 'Late night', duration: '3:55', coverUrl: COVERS.backstreetBoys, audioUrl: TRACK_YOUTUBE_MAP['Show Me the Meaning of Being Lonely']!, createdAt: '2024-01-01T00:09:00Z' },

  // ── Linkin Park (5) ──────────────────────────────────────────────────────
  { title: 'In the End', artist: 'Linkin Park', album: 'Hybrid Theory', genre: 'Rock', mood: 'Late night', duration: '3:36', coverUrl: COVERS.linkinPark, audioUrl: TRACK_YOUTUBE_MAP['In the End']!, createdAt: '2024-01-01T00:10:00Z' },
  { title: 'Numb', artist: 'Linkin Park', album: 'Meteora', genre: 'Rock', mood: 'Late night', duration: '3:05', coverUrl: COVERS.linkinPark, audioUrl: TRACK_YOUTUBE_MAP['Numb']!, createdAt: '2024-01-01T00:11:00Z' },
  { title: 'Crawling', artist: 'Linkin Park', album: 'Hybrid Theory', genre: 'Rock', mood: 'Late night', duration: '3:29', coverUrl: COVERS.linkinPark, audioUrl: TRACK_YOUTUBE_MAP['Crawling']!, createdAt: '2024-01-01T00:12:00Z' },
  { title: 'Somewhere I Belong', artist: 'Linkin Park', album: 'Meteora', genre: 'Rock', mood: 'Late night', duration: '3:34', coverUrl: COVERS.linkinPark, audioUrl: TRACK_YOUTUBE_MAP['Somewhere I Belong']!, createdAt: '2024-01-01T00:13:00Z' },
  { title: 'Breaking the Habit', artist: 'Linkin Park', album: 'Meteora', genre: 'Rock', mood: 'Late night', duration: '3:16', coverUrl: COVERS.linkinPark, audioUrl: TRACK_YOUTUBE_MAP['Breaking the Habit']!, createdAt: '2024-01-01T00:14:00Z' },

  // ── Sad Songs (5) ────────────────────────────────────────────────────────
  { title: 'The Night We Met', artist: 'Lord Huron', album: 'Strange Trails', genre: 'Indie', mood: 'Late night', duration: '3:28', coverUrl: COVERS.sadSong, audioUrl: TRACK_YOUTUBE_MAP['The Night We Met']!, createdAt: '2024-01-01T00:15:00Z' },
  { title: 'Someone Like You', artist: 'Adele', album: '21', genre: 'Pop', mood: 'Late night', duration: '4:45', coverUrl: COVERS.sadSong, audioUrl: TRACK_YOUTUBE_MAP['Someone Like You']!, createdAt: '2024-01-01T00:16:00Z' },
  { title: "When the Party's Over", artist: 'Billie Eilish', album: "Don't Smile at Me", genre: 'Indie', mood: 'Late night', duration: '3:16', coverUrl: COVERS.sadSong, audioUrl: TRACK_YOUTUBE_MAP["When the Party's Over"]!, createdAt: '2024-01-01T00:17:00Z' },
  { title: 'Skinny Love', artist: 'Bon Iver', album: 'For Emma, Forever Ago', genre: 'Indie', mood: 'Late night', duration: '3:58', coverUrl: COVERS.sadSong, audioUrl: TRACK_YOUTUBE_MAP['Skinny Love']!, createdAt: '2024-01-01T00:18:00Z' },
  { title: 'Hurt', artist: 'Johnny Cash', album: 'American IV', genre: 'Country', mood: 'Late night', duration: '3:38', coverUrl: COVERS.sadSong, audioUrl: TRACK_YOUTUBE_MAP['Hurt']!, createdAt: '2024-01-01T00:19:00Z' },

  // ── Disco Songs (5) ──────────────────────────────────────────────────────
  { title: "Stayin' Alive", artist: 'Bee Gees', album: 'Saturday Night Fever', genre: 'Pop', mood: 'Feel good', duration: '4:45', coverUrl: COVERS.disco, audioUrl: TRACK_YOUTUBE_MAP["Stayin' Alive"]!, createdAt: '2024-01-01T00:20:00Z' },
  { title: 'Le Freak', artist: 'Chic', album: "C'est Chic", genre: 'R&B', mood: 'Feel good', duration: '5:31', coverUrl: COVERS.disco, audioUrl: TRACK_YOUTUBE_MAP['Le Freak']!, createdAt: '2024-01-01T00:21:00Z' },
  { title: 'I Will Survive', artist: 'Gloria Gaynor', album: 'Love Tracks', genre: 'Pop', mood: 'Feel good', duration: '3:15', coverUrl: COVERS.disco, audioUrl: TRACK_YOUTUBE_MAP['I Will Survive']!, createdAt: '2024-01-01T00:22:00Z' },
  { title: 'Dancing Queen', artist: 'ABBA', album: 'Arrival', genre: 'Pop', mood: 'Feel good', duration: '3:51', coverUrl: COVERS.disco, audioUrl: TRACK_YOUTUBE_MAP['Dancing Queen']!, createdAt: '2024-01-01T00:23:00Z' },
  { title: 'September', artist: 'Earth, Wind & Fire', album: 'The Best of Earth Wind & Fire', genre: 'R&B', mood: 'Feel good', duration: '3:35', coverUrl: COVERS.disco, audioUrl: TRACK_YOUTUBE_MAP['September']!, createdAt: '2024-01-01T00:24:00Z' },

  // ── Westlife (5) ─────────────────────────────────────────────────────────
  { title: 'Swear It Again', artist: 'Westlife', album: 'Westlife', genre: 'Pop', mood: 'Chill', duration: '4:07', coverUrl: COVERS.westlife, audioUrl: TRACK_YOUTUBE_MAP['Swear It Again']!, createdAt: '2024-01-01T00:25:00Z' },
  { title: 'You Raise Me Up', artist: 'Westlife', album: 'Allow Us to Be Frank', genre: 'Pop', mood: 'Chill', duration: '3:56', coverUrl: COVERS.westlife, audioUrl: TRACK_YOUTUBE_MAP['You Raise Me Up']!, createdAt: '2024-01-01T00:26:00Z' },
  { title: 'Flying Without Wings', artist: 'Westlife', album: 'Westlife', genre: 'Pop', mood: 'Chill', duration: '3:53', coverUrl: COVERS.westlife, audioUrl: TRACK_YOUTUBE_MAP['Flying Without Wings']!, createdAt: '2024-01-01T00:27:00Z' },
  { title: 'My Love', artist: 'Westlife', album: 'Coast to Coast', genre: 'Pop', mood: 'Chill', duration: '4:00', coverUrl: COVERS.westlife, audioUrl: TRACK_YOUTUBE_MAP['My Love']!, createdAt: '2024-01-01T00:28:00Z' },
  { title: 'Uptown Girl', artist: 'Westlife', album: 'Coast to Coast', genre: 'Pop', mood: 'Feel good', duration: '2:55', coverUrl: COVERS.westlife, audioUrl: TRACK_YOUTUBE_MAP['Uptown Girl']!, createdAt: '2024-01-01T00:29:00Z' },

  // ── Boyzone (5) ──────────────────────────────────────────────────────────
  { title: 'No Matter What', artist: 'Boyzone', album: 'Where We Belong', genre: 'Pop', mood: 'Chill', duration: '4:05', coverUrl: COVERS.boyzone, audioUrl: TRACK_YOUTUBE_MAP['No Matter What']!, createdAt: '2024-01-01T00:30:00Z' },
  { title: 'Words', artist: 'Boyzone', album: 'Said and Done', genre: 'Pop', mood: 'Chill', duration: '3:50', coverUrl: COVERS.boyzone, audioUrl: TRACK_YOUTUBE_MAP['Words']!, createdAt: '2024-01-01T00:31:00Z' },
  { title: 'A Different Beat', artist: 'Boyzone', album: 'A Different Beat', genre: 'Pop', mood: 'Feel good', duration: '4:14', coverUrl: COVERS.boyzone, audioUrl: TRACK_YOUTUBE_MAP['A Different Beat']!, createdAt: '2024-01-01T00:32:00Z' },
  { title: 'All That I Need', artist: 'Boyzone', album: 'Where We Belong', genre: 'Pop', mood: 'Chill', duration: '3:53', coverUrl: COVERS.boyzone, audioUrl: TRACK_YOUTUBE_MAP['All That I Need']!, createdAt: '2024-01-01T00:33:00Z' },
  { title: 'Every Day I Love You', artist: 'Boyzone', album: 'By Request', genre: 'Pop', mood: 'Chill', duration: '3:44', coverUrl: COVERS.boyzone, audioUrl: TRACK_YOUTUBE_MAP['Every Day I Love You']!, createdAt: '2024-01-01T00:34:00Z' },

  // ── Bryan Adams (5) ──────────────────────────────────────────────────────
  { title: "Summer of '69", artist: 'Bryan Adams', album: 'Reckless', genre: 'Rock', mood: 'Feel good', duration: '3:35', coverUrl: COVERS.bryanAdams, audioUrl: TRACK_YOUTUBE_MAP["Summer of '69"]!, createdAt: '2024-01-01T00:35:00Z' },
  { title: 'Everything I Do (I Do It for You)', artist: 'Bryan Adams', album: 'Waking Up the Neighbours', genre: 'Pop', mood: 'Chill', duration: '6:38', coverUrl: COVERS.bryanAdams, audioUrl: TRACK_YOUTUBE_MAP['Everything I Do (I Do It for You)']!, createdAt: '2024-01-01T00:36:00Z' },
  { title: 'Run to You', artist: 'Bryan Adams', album: 'Reckless', genre: 'Rock', mood: 'Feel good', duration: '3:56', coverUrl: COVERS.bryanAdams, audioUrl: TRACK_YOUTUBE_MAP['Run to You']!, createdAt: '2024-01-01T00:37:00Z' },
  { title: 'Have You Ever Really Loved a Woman?', artist: 'Bryan Adams', album: 'Don Juan DeMarco', genre: 'Pop', mood: 'Chill', duration: '4:42', coverUrl: COVERS.bryanAdams, audioUrl: TRACK_YOUTUBE_MAP['Have You Ever Really Loved a Woman?']!, createdAt: '2024-01-01T00:38:00Z' },
  { title: 'Cuts Like a Knife', artist: 'Bryan Adams', album: 'Cuts Like a Knife', genre: 'Rock', mood: 'Late night', duration: '3:54', coverUrl: COVERS.bryanAdams, audioUrl: TRACK_YOUTUBE_MAP['Cuts Like a Knife']!, createdAt: '2024-01-01T00:39:00Z' },

  // ── Sleep Songs (5) ──────────────────────────────────────────────────────
  { title: 'Weightless', artist: 'Marconi Union', album: 'Weightless', genre: 'Acoustic', mood: 'Focus', duration: '8:10', coverUrl: COVERS.sleep, audioUrl: TRACK_YOUTUBE_MAP['Weightless']!, createdAt: '2024-01-01T00:40:00Z' },
  { title: 'Gymnopédie No. 1', artist: 'Erik Satie', album: 'Gymnopédies', genre: 'Classical', mood: 'Focus', duration: '3:05', coverUrl: COVERS.sleep, audioUrl: TRACK_YOUTUBE_MAP['Gymnopédie No. 1']!, createdAt: '2024-01-01T00:41:00Z' },
  { title: 'Clair de Lune', artist: 'Claude Debussy', album: 'Suite bergamasque', genre: 'Classical', mood: 'Focus', duration: '5:10', coverUrl: COVERS.sleep, audioUrl: TRACK_YOUTUBE_MAP['Clair de Lune']!, createdAt: '2024-01-01T00:42:00Z' },
  { title: 'Lullaby (Sleep Tight)', artist: 'Lo-Fi Dreamers', album: 'Night Sounds', genre: 'Lo-Fi', mood: 'Focus', duration: '3:43', coverUrl: COVERS.sleep, audioUrl: TRACK_YOUTUBE_MAP['Lullaby (Sleep Tight)']!, createdAt: '2024-01-01T00:43:00Z' },
  { title: 'Breathe (2 AM)', artist: 'Anna Nalick', album: 'Wreck of the Day', genre: 'Acoustic', mood: 'Focus', duration: '4:28', coverUrl: COVERS.sleep, audioUrl: TRACK_YOUTUBE_MAP['Breathe (2 AM)']!, createdAt: '2024-01-01T00:44:00Z' },

  // ── Energize Songs (5) ───────────────────────────────────────────────────
  { title: 'Eye of the Tiger', artist: 'Survivor', album: 'Eye of the Tiger', genre: 'Rock', mood: 'Feel good', duration: '4:05', coverUrl: COVERS.energize, audioUrl: TRACK_YOUTUBE_MAP['Eye of the Tiger']!, createdAt: '2024-01-01T00:45:00Z' },
  { title: "Can't Stop the Feeling!", artist: 'Justin Timberlake', album: 'Trolls OST', genre: 'Pop', mood: 'Feel good', duration: '3:56', coverUrl: COVERS.energize, audioUrl: TRACK_YOUTUBE_MAP["Can't Stop the Feeling!"]!, createdAt: '2024-01-01T00:46:00Z' },
  { title: 'Power', artist: 'Kanye West', album: 'My Beautiful Dark Twisted Fantasy', genre: 'Hip-Hop', mood: 'Feel good', duration: '4:52', coverUrl: COVERS.energize, audioUrl: TRACK_YOUTUBE_MAP['Power']!, createdAt: '2024-01-01T00:47:00Z' },
  { title: 'Thunderstruck', artist: 'AC/DC', album: 'The Razors Edge', genre: 'Rock', mood: 'Feel good', duration: '4:52', coverUrl: COVERS.energize, audioUrl: TRACK_YOUTUBE_MAP['Thunderstruck']!, createdAt: '2024-01-01T00:48:00Z' },
  { title: 'Jump', artist: 'Van Halen', album: '1984', genre: 'Rock', mood: 'Feel good', duration: '4:03', coverUrl: COVERS.energize, audioUrl: TRACK_YOUTUBE_MAP['Jump']!, createdAt: '2024-01-01T00:49:00Z' },

  // ── Alan Walker (5) ──────────────────────────────────────────────────────
  { title: 'Faded', artist: 'Alan Walker', album: 'Different World', genre: 'Electronic', mood: 'Late night', duration: '3:33', coverUrl: COVERS.alanWalker, audioUrl: TRACK_YOUTUBE_MAP['Faded']!, createdAt: '2024-01-01T00:50:00Z' },
  { title: 'Alone', artist: 'Alan Walker', album: 'Different World', genre: 'Electronic', mood: 'Late night', duration: '2:41', coverUrl: COVERS.alanWalker, audioUrl: TRACK_YOUTUBE_MAP['Alone']!, createdAt: '2024-01-01T00:51:00Z' },
  { title: 'The Spectre', artist: 'Alan Walker', album: 'Different World', genre: 'Electronic', mood: 'Late night', duration: '3:00', coverUrl: COVERS.alanWalker, audioUrl: TRACK_YOUTUBE_MAP['The Spectre']!, createdAt: '2024-01-01T00:52:00Z' },
  { title: 'On My Way', artist: 'Alan Walker', album: 'On My Way', genre: 'Electronic', mood: 'Chill', duration: '3:08', coverUrl: COVERS.alanWalker, audioUrl: TRACK_YOUTUBE_MAP['On My Way']!, createdAt: '2024-01-01T00:53:00Z' },
  { title: 'Lily', artist: 'Alan Walker', album: 'Different World', genre: 'Electronic', mood: 'Feel good', duration: '3:21', coverUrl: COVERS.alanWalker, audioUrl: TRACK_YOUTUBE_MAP['Lily']!, createdAt: '2024-01-01T00:54:00Z' },
];

const DEMO_TRACK_KEYS = new Set(SEED_TRACKS.map((track) => `${track.title}\0${track.artist}`));

export function isDemoCatalogTrack(title: string, artist: string): boolean {
  return DEMO_TRACK_KEYS.has(`${title}\0${artist}`);
}

/**
 * Build and return the 50 pre-seeded demo tracks with fresh UUIDs.
 * Called by lib/supabase/library.ts to seed a new user's library in Supabase.
 */
export function getSeedTracks(): MusicTrack[] {
  return SEED_TRACKS.map((seed) => ({
    ...seed,
    id: crypto.randomUUID(),
    audioUrl: '',
    playlistIds: [],
    is_favorite: false,
    audioPath: '',
    isSeeded: true,
  }));
}

// ─── Persistence helpers ──────────────────────────────────────────────────────
// localStorage is a fast read-cache; Supabase PostgreSQL is the source of truth.

export function getTracks(userId: string): MusicTrack[] {
  try {
    const raw = localStorage.getItem(tracksKey(userId));
    if (raw !== null) {
      const parsed = JSON.parse(raw) as MusicTrack[];
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {
    // corrupted cache – fallback to seed tracks
  }
  const initial = getSeedTracks();
  saveTracks(userId, initial);
  return initial;
}

export function saveTracks(userId: string, tracks: MusicTrack[]): void {
  try {
    localStorage.setItem(tracksKey(userId), JSON.stringify(tracks));
  } catch {
    // storage quota exceeded – silently ignore
  }
}

export function getPlaylists(userId: string): Playlist[] {
  try {
    const raw = localStorage.getItem(playlistsKey(userId));
    if (raw) {
      const parsed = JSON.parse(raw) as Playlist[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // corrupted data
  }
  return [];
}

export function savePlaylists(userId: string, playlists: Playlist[]): void {
  try {
    localStorage.setItem(playlistsKey(userId), JSON.stringify(playlists));
  } catch {
    // storage quota exceeded
  }
}

export function getListeningHistory(userId: string): ListeningHistoryItem[] {
  try {
    const raw = localStorage.getItem(historyKey(userId));
    if (raw) {
      const parsed = JSON.parse(raw) as ListeningHistoryItem[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // corrupted data
  }
  return [];
}

export function saveListeningHistory(userId: string, history: ListeningHistoryItem[]): void {
  try {
    localStorage.setItem(historyKey(userId), JSON.stringify(history));
  } catch {
    // storage quota exceeded
  }
}
