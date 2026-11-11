// ─────────────────────────────────────────────────────────────────────────────
// Supabase Database Types
// Typed to match the normalized Sonora PostgreSQL schema (tracks, playlists,
// playlist_tracks tables).
// ─────────────────────────────────────────────────────────────────────────────

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      tracks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          artist: string;
          album: string;
          genre: string;
          mood: string;
          duration: string;
          cover_url: string;
          audio_url: string;
          audio_path: string;
          lyrics_text: string;
          lyrics_lrc: string;
          playlist_ids?: string[] | null;
          is_favorite: boolean;
          is_seeded: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          artist?: string;
          album?: string;
          genre?: string;
          mood?: string;
          duration?: string;
          cover_url?: string;
          audio_url?: string;
          audio_path?: string;
          lyrics_text?: string;
          lyrics_lrc?: string;
          playlist_ids?: string[] | null;
          is_favorite?: boolean;
          is_seeded?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          artist?: string;
          album?: string;
          genre?: string;
          mood?: string;
          duration?: string;
          cover_url?: string;
          audio_url?: string;
          audio_path?: string;
          lyrics_text?: string;
          lyrics_lrc?: string;
          playlist_ids?: string[] | null;
          is_favorite?: boolean;
          is_seeded?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'tracks_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };

      playlists: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          cover_url: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          cover_url?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          cover_url?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'playlists_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };

      playlist_tracks: {
        Row: {
          playlist_id: string;
          track_id: string;
          added_at: string;
        };
        Insert: {
          playlist_id: string;
          track_id: string;
          added_at?: string;
        };
        Update: {
          playlist_id?: string;
          track_id?: string;
          added_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'playlist_tracks_playlist_id_fkey';
            columns: ['playlist_id'];
            referencedRelation: 'playlists';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'playlist_tracks_track_id_fkey';
            columns: ['track_id'];
            referencedRelation: 'tracks';
            referencedColumns: ['id'];
          },
        ];
      };
    };

    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
