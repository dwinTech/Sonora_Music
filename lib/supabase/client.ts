import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

let client: SupabaseClient<Database> | undefined;

export function getSupabaseClient(): SupabaseClient<Database> {
  if (client) return client;

  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey || anonKey.toLocaleLowerCase().includes('your_')) {
    throw new Error(
      'Authentication is not configured. Set VITE_SUPABASE_URL and a valid VITE_SUPABASE_ANON_KEY in your local .env file.',
    );
  }

  client = createBrowserClient<Database>(url, anonKey);
  return client;
}
