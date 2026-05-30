import { useState, useEffect, createContext, useContext, useRef } from 'react';
import { supabase } from '../lib/supabase';

const SessionContext = createContext(undefined);

export function SessionProvider({ children }) {
  const [session, setSession] = useState(undefined);
  const loaded = useRef(false);

  useEffect(() => {
    // Charge la session une seule fois au démarrage
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      loaded.current = true;
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      // N'agit qu'après le chargement initial pour éviter les races
      if (!loaded.current && event !== 'SIGNED_IN') return;

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (s) setSession(s);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
      }
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
