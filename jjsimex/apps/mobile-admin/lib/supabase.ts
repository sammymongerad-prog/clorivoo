import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

// Adaptateur SecureStore pour la persistance des sessions
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://rrjrnckyoqhevzoafnut.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJyanJuY2t5b3FoZXZ6b2FmbnV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzMDgzMTAsImV4cCI6MjA5Njg4NDMxMH0.9BqfBMJWmDFCJXbIgsLDd_SqmO8hOucP5QhVVJu2a-k';

// Client Supabase pour l'app mobile admin
export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
