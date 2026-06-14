'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getClient } from '@jjsimex/supabase';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

interface AuthContextValue {
  profile: Profile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({ profile: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = getClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase.from('users').select('id, first_name, last_name, email, role').eq('id', session.user.id).single();
        if (data) setProfile(data as Profile);
      }
      setLoading(false);
    })();
  }, []);

  return <AuthContext.Provider value={{ profile, loading }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
