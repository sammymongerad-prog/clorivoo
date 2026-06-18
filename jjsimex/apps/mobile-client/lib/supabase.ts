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

// Client Supabase pour l'app mobile client
export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: memoryStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
