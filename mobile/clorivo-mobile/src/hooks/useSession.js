import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../lib/supabase';

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = chargement initial

  useEffect(() => {
    // Charge la session existante une seule fois au démarrage
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
    });

    // Écoute uniquement les vrais changements d'état auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'SIGNED_OUT') {
        setSession(null);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (s) setSession(s);
      }
      // INITIAL_SESSION ignoré — getSession() s'en charge déjà
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
