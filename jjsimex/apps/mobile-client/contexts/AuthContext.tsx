import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  whatsapp: string;
  role: string;
  us_suite: string;
  loyalty_level: string;
  destination_country: string;
  destination_city: string;
  is_active: boolean;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (data: SignUpData) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
}

interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  whatsapp: string;
  destinationCountry: string;
  destinationCity: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    }).catch(() => setLoading(false));

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
    try {
      const { data } = await supabase
        .from('users')
        .select('id, first_name, last_name, email, whatsapp, role, us_suite, loyalty_level, destination_country, destination_city, is_active')
        .eq('id', userId)
        .single();
      setProfile(data ?? null);
    } catch {}
    setLoading(false);
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: 'Email ou mot de passe incorrect.' };

    const { data: prof } = await supabase
      .from('users')
      .select('is_active')
      .eq('id', data.user.id)
      .single();

    if (!prof?.is_active) {
      await supabase.auth.signOut();
      return { error: "Votre compte a été suspendu. Contactez JJ's IMEX au +1 (305) 600-9364." };
    }

    return { error: null };
  }

  async function signUp(data: SignUpData) {
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: `${data.firstName} ${data.lastName}`,
          role: 'client',
          destination_country: data.destinationCountry,
          destination_city: data.destinationCity,
          phone_whatsapp: data.whatsapp,
        },
      },
    });

    if (error) {
      if (error.message.includes('already registered')) {
        return { error: 'Un compte existe déjà avec cet email.' };
      }
      return { error: 'Erreur lors de la création du compte. Réessayez.' };
    }
    return { error: null };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) return { error: "Erreur lors de l'envoi. Vérifiez l'adresse email." };
    return { error: null };
  }

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signIn, signUp, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return ctx;
}
