import { getClient } from './client';
import { sendPushNotification } from './push';

// #22 + A7: Post-signup welcome + admin alert
export async function onUserCreated(userId: string): Promise<void> {
  const supabase = getClient();

  const { data: user } = await supabase
    .from('users')
    .select('full_name, us_suite, destination_city, destination_country')
    .eq('id', userId)
    .single();

  if (!user) return;

  const suite = user.us_suite ?? '—';
  const welcomeTitle = "Bienvenue chez JJ's IMEX !";
  const welcomeMsg = `Votre compte est créé. Votre adresse US : 15490 NW 7th Ave Unit 207, Suite ${suite}, Miami, FL 33169. Utilisez-la sur Amazon, Shein, Nike et plus.`;
  await supabase.from('notifications').insert({
    user_id: userId,
    type: 'system',
    title: welcomeTitle,
    message: welcomeMsg,
  });
  sendPushNotification(userId, welcomeTitle, welcomeMsg).catch(() => {});

  const { data: admins } = await supabase
    .from('users')
    .select('id')
    .in('role', ['admin', 'super_admin']);

  if (admins && admins.length > 0) {
    const adminTitle = 'Nouveau client inscrit';
    const adminMsg = `${user.full_name} vient de créer un compte. Suite : ${suite}. Destination : ${user.destination_city ?? '—'}.`;
    await supabase.from('notifications').insert(
      admins.map(a => ({
        user_id: a.id,
        type: 'system',
        title: adminTitle,
        message: adminMsg,
        action_url: '/dashboard/clients',
      }))
    );
    for (const a of admins) {
      sendPushNotification(a.id, adminTitle, adminMsg).catch(() => {});
    }
  }
}

// #21: Check and update loyalty level after spending changes
const LOYALTY_THRESHOLDS = [
  { min: 26, level: 'gold', label: 'Gold', discount: '10%' },
  { min: 11, level: 'silver', label: 'Silver', discount: '5%' },
  { min: 0, level: 'bronze', label: 'Bronze', discount: '0%' },
] as const;

export async function checkLoyaltyLevel(userId: string): Promise<void> {
  const supabase = getClient();

  const { data: user } = await supabase
    .from('users')
    .select('loyalty_level, total_packages')
    .eq('id', userId)
    .single();

  if (!user) return;

  const oldLevel = user.loyalty_level;
  const pkgs = user.total_packages ?? 0;
  const newLevel = LOYALTY_THRESHOLDS.find(t => pkgs >= t.min)!;

  if (newLevel.level === oldLevel) return;

  await supabase
    .from('users')
    .update({ loyalty_level: newLevel.level })
    .eq('id', userId);

  const titles: Record<string, string> = {
    silver: 'Niveau Silver atteint !',
    gold: 'Niveau Gold atteint !',
    bronze: 'Niveau fidélité mis à jour',
  };
  const messages: Record<string, string> = {
    silver: `Vous bénéficiez maintenant de ${newLevel.discount} de réduction sur tous vos envois.`,
    gold: `Vous bénéficiez maintenant de ${newLevel.discount} de réduction sur tous vos envois. Merci pour votre fidélité !`,
    bronze: 'Votre niveau fidélité a été ajusté.',
  };

  const title = titles[newLevel.level];
  const msg = messages[newLevel.level];
  await supabase.from('notifications').insert({
    user_id: userId,
    type: 'promo',
    title,
    message: msg,
  });
  sendPushNotification(userId, title, msg).catch(() => {});
}

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
    type: 'system',
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
    type: 'system',
    title,
    message: msg,
  });
  sendPushNotification(userId, title, msg).catch(() => {});
}
