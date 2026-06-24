import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Returns a Supabase client usable in both browser and server contexts
// Uses anon key — for admin operations use service role directly
let _client: ReturnType<typeof createSupabaseClient> | null = null;

// Fallback public project credentials (anon key is safe to embed in clients —
// it's protected by RLS). Used when EXPO_PUBLIC_/NEXT_PUBLIC_ env vars are not
// inlined, which is the case inside this shared package under Expo/Metro.
const FALLBACK_URL = 'https://rrjrnckyoqhevzoafnut.supabase.co';
const FALLBACK_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJyanJuY2t5b3FoZXZ6b2FmbnV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzMDgzMTAsImV4cCI6MjA5Njg4NDMxMH0.9BqfBMJWmDFCJXbIgsLDd_SqmO8hOucP5QhVVJu2a-k';

export function setClient(client: ReturnType<typeof createSupabaseClient>) {
  _client = client;
}

export function getClient() {
  if (_client) return _client;
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL ?? FALLBACK_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
    FALLBACK_ANON_KEY;
  _client = createSupabaseClient(url, key);
  return _client;
}
