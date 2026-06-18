import { createClient } from '@supabase/supabase-js';

// Stockage de session EN MÉMOIRE pour l'instant : aucun module natif touché
// (expo-secure-store n'est pas dans le build de dev courant). La session ne
// survit donc pas à un redémarrage de l'app — ce sera remplacé par un vrai
// stockage sécurisé persistant au prochain rebuild (expo-secure-store est
// déjà ajouté aux dépendances).
const mem = new Map<string, string>();
const memoryStorage = {
  getItem: async (key: string) => (mem.has(key) ? mem.get(key)! : null),
  setItem: async (key: string, value: string) => {
    mem.set(key, value);
  },
  removeItem: async (key: string) => {
    mem.delete(key);
  },
};

// Identifiants publics du projet (la clé anon est conçue pour être embarquée
// côté client — protégée par les règles RLS). Secours si l'env n'est pas injecté.
const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://rrjrnckyoqhevzoafnut.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJyanJuY2t5b3FoZXZ6b2FmbnV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzMDgzMTAsImV4cCI6MjA5Njg4NDMxMH0.9BqfBMJWmDFCJXbIgsLDd_SqmO8hOucP5QhVVJu2a-k';

// Client Supabase pour l'app mobile client
export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      storage: memoryStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
