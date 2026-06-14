'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient as createServerClient } from '@/lib/supabase/server';

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const supabase = await createServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      redirect('/login?error=identifiants_invalides');
    }
    redirect('/login?error=erreur_connexion');
  }

  // Vérification du rôle — seuls admin/super_admin accèdent au dashboard web
  const { data: profile } = await supabase
    .from('users')
    .select('role, is_active')
    .eq('id', data.user.id)
    .single();

  if (!profile) {
    await supabase.auth.signOut();
    redirect('/login?error=profil_introuvable');
  }

  if (!profile.is_active) {
    await supabase.auth.signOut();
    redirect('/login?error=compte_suspendu');
  }

  if (profile.role !== 'admin' && profile.role !== 'super_admin') {
    await supabase.auth.signOut();
    redirect('/login?error=acces_refuse');
  }

  revalidatePath('/dashboard');
  redirect('/dashboard');
}

export async function signOut() {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function resetPassword(formData: FormData) {
  const email = formData.get('email') as string;
  const supabase = await createServerClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
  });

  if (error) {
    redirect('/forgot-password?error=erreur_envoi');
  }

  redirect('/forgot-password?success=email_envoye');
}

export async function updatePassword(formData: FormData) {
  const password = formData.get('password') as string;
  const supabase = await createServerClient();

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect('/reset-password?error=erreur_mise_a_jour');
  }

  revalidatePath('/dashboard');
  redirect('/dashboard');
}
