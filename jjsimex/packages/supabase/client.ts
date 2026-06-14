import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Returns a Supabase client usable in both browser and server contexts
// Uses anon key — for admin operations use service role directly
let _client: ReturnType<typeof createSupabaseClient> | null = null;

export function getClient() {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
  _client = createSupabaseClient(url, key);
  return _client;
}
