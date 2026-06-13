import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { registerForPushNotifications, unregisterPushNotifications } from '@jjsimex/ui/notifications';

interface AdminProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'admin' | 'super_admin' | 'employee';
  is_active: boolean;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: AdminProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, role, is_active')
      .eq('id', userId)
      .single();
    setProfile(data as AdminProfile | null);
    setLoading(false);
  }


  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) return { error: 'Email ou mot de passe incorrect.' };

    const { data: prof } = await supabase
      .from('users')
      .select('role, is_active')
      .eq('id', data.user.id)
      .single();

    if (!prof) {
      await supabase.auth.signOut();
      return { error: 'Profil introuvable. Contactez le support.' };
    }

    if (!prof.is_active) {
      await supabase.auth.signOut();
      return { error: 'Votre compte a été suspendu. Contactez JJ\'s IMEX au +1 (305) 600-9364.' };
    }

    const allowedRoles = ['admin', 'super_admin', 'employee'];
    if (!allowedRoles.includes(prof.role)) {
      await supabase.auth.signOut();
      return { error: 'Accès refusé. Cette application est réservée au personnel JJ\'s IMEX.' };
    }

    await registerForPushNotifications(data.user.id);
    return { error: null };
  }

  async function signOut() {
    if (user) await unregisterPushNotifications(user.id);
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return ctx;
}
