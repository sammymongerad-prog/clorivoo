import { useState, useEffect, createContext, useContext, useRef } from 'react';
import { supabase } from '../lib/supabase';

const SessionContext = createContext(undefined);

export function SessionProvider({ children }) {
  const [session, setSession] = useState(undefined);
  // Track whether getSession() has resolved so we know who "wins" on conflict
  const initialLoadDone = useRef(false);

  useEffect(() => {
    let cancelled = false;

    // 1. Authoritative initial load (5s timeout fallback → treat as logged out)
    const sessionTimeout = setTimeout(() => {
      if (cancelled || initialLoadDone.current) return;
      initialLoadDone.current = true;
      setSession(null);
    }, 5000);

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      clearTimeout(sessionTimeout);
      if (cancelled) return;
      initialLoadDone.current = true;
      setSession(s ?? null);
    }).catch(() => {
      clearTimeout(sessionTimeout);
      if (cancelled) return;
      initialLoadDone.current = true;
      setSession(null);
    });

    // 2. Listen for subsequent changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      if (cancelled) return;

      // Ignore INITIAL_SESSION — getSession() above is more reliable
      if (event === 'INITIAL_SESSION') return;

      // Wait until the initial load completes before applying changes
      if (!initialLoadDone.current) {
        // Only apply SIGNED_IN immediately (user just logged in during loading)
        if (event === 'SIGNED_IN' && s) {
          initialLoadDone.current = true;
          setSession(s);
        }
        return;
      }

      setSession(s ?? null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
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
