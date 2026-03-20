/*
 * Supabase client singleton — auto-activates when VITE_SUPABASE_URL and
 * VITE_SUPABASE_ANON_KEY are set. Returns null otherwise.
 *
 * To enable server-side caching, create the table in Supabase SQL Editor:
 *
 *   CREATE TABLE IF NOT EXISTS tweet_cache (
 *     tweet_id   TEXT PRIMARY KEY,
 *     payload    JSONB NOT NULL,
 *     fetched_at TIMESTAMPTZ DEFAULT now()
 *   );
 *   ALTER TABLE tweet_cache ENABLE ROW LEVEL SECURITY;
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from './env'

let _client: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient | null {
  if (!env.supabaseUrl || !env.supabaseAnonKey) return null
  if (!_client) {
    _client = createClient(env.supabaseUrl, env.supabaseAnonKey)
  }
  return _client
}

export const isSupabaseConfigured = (): boolean =>
  Boolean(env.supabaseUrl && env.supabaseAnonKey)
