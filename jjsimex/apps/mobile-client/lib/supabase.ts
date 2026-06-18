import { createClient } from '@supabase/supabase-js';

// Stockage de session : on tente expo-secure-store (vrai stockage sécurisé,
// persistant). S'il n'est pas présent dans le build natif courant, on bascule
// sur un stockage en mémoire pour ne pas crasher (la session ne survivra alors
// pas à un redémarrage — corrigé au prochain build avec expo-secure-store).
function createSessionStorage() {
  try {
    const SecureStore = require('expo-secure-store');
    if (SecureStore && typeof SecureStore.getItemAsync === 'function') {
      return {
        getItem: (key: string) => SecureStore.getItemAsync(key),
        setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
        removeItem: (key: string) => SecureStore.deleteItemAsync(key),
      };
    }
  } catch (e) {
    // module natif absent du build courant — fallback mémoire
  }

  const mem = new Map<string, string>();
  return {
    getItem: async (key: string) => (mem.has(key) ? mem.get(key)! : null),
    setItem: async (key: string, value: string) => {
      mem.set(key, value);
    },
    removeItem: async (key: string) => {
      mem.delete(key);
    },
  };
}

// Client Supabase pour l'app mobile client
export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: createSessionStorage(),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
