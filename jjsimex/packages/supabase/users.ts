import { getClient } from './client';
import { sendPushNotification } from './push';

// A8: Block/unblock user with notification
export async function blockUser(userId: string, adminId: string): Promise<void> {
  const supabase = getClient();

  const { error } = await supabase
    .from('users')
    .update({ is_blocked: true })
    .eq('id', userId);

  if (error) throw new Error(`Erreur blocage: ${error.message}`);

  const title = 'Compte suspendu';
  const msg = "Votre compte a été suspendu. Contactez JJ's IMEX au +1 (305) 600-9364.";
  await supabase.from('notifications').insert({
    user_id: userId,
    type: 'account',
    title,
    message: msg,
  });
  sendPushNotification(userId, title, msg).catch(() => {});
}

export async function unblockUser(userId: string, adminId: string): Promise<void> {
  const supabase = getClient();

  const { error } = await supabase
    .from('users')
    .update({ is_blocked: false })
    .eq('id', userId);

  if (error) throw new Error(`Erreur déblocage: ${error.message}`);

  const title = 'Compte réactivé ✅';
  const msg = 'Votre compte a été réactivé. Bienvenue de retour !';
  await supabase.from('notifications').insert({
    user_id: userId,
    type: 'account',
    title,
    message: msg,
  });
  sendPushNotification(userId, title, msg).catch(() => {});
}
