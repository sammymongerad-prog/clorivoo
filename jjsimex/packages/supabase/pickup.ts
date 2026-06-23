import { getClient } from './client';
import { sendPushNotification } from './push';

export interface CreatePickupData {
  pickup_address: string;
  pickup_date: string;
  pickup_time: string;
  estimated_weight?: number;
  notes?: string;
}

export interface PickupRequest {
  id: string;
  client_id: string;
  pickup_address: string;
  pickup_date: string;
  pickup_time: string;
  estimated_weight: number | null;
  notes: string | null;
  status: 'pending' | 'confirmed' | 'collected' | 'cancelled';
  created_at: string;
  updated_at: string | null;
}

export async function createPickupRequest(data: CreatePickupData, userId: string): Promise<PickupRequest> {
  const { data: pickup, error } = await getClient()
    .from('pickup_requests')
    .insert({
      client_id: userId,
      pickup_address: data.pickup_address,
      pickup_date: data.pickup_date,
      pickup_time: data.pickup_time,
      estimated_weight: data.estimated_weight ?? null,
      notes: data.notes ?? null,
      status: 'pending',
    })
    .select()
    .single();

  if (error || !pickup) {
    throw new Error('Erreur lors de la création de la demande de pickup.');
  }

  const { data: user } = await getClient()
    .from('users')
    .select('first_name, last_name')
    .eq('id', userId)
    .single();

  const clientName = user ? `${user.first_name} ${user.last_name}` : 'Un client';

  const { data: admins } = await getClient()
    .from('users')
    .select('id')
    .in('role', ['admin', 'super_admin', 'employee']);

  const pickTitle = 'Nouvelle demande de pickup 🚚';
  const pickBody = `${clientName} demande un pickup à ${data.pickup_address} le ${data.pickup_date}.`;
  if (admins) {
    const notifications = admins.map((admin) => ({
      user_id: admin.id,
      type: 'system',
      title: pickTitle,
      body: pickBody,
      data: { pickup_id: pickup.id },
      is_read: false,
    }));
    await getClient().from('notifications').insert(notifications);
    for (const admin of admins) {
      sendPushNotification(admin.id, pickTitle, pickBody).catch(() => {});
    }
  }

  // #14: Client confirmation notification
  const pickConfTitle = 'Demande de pickup enregistrée';
  const pickConfMsg = `Votre pickup à ${data.pickup_address} le ${data.pickup_date} est en attente de confirmation.`;
  await getClient().from('notifications').insert({
    user_id: userId,
    type: 'system',
    title: pickConfTitle,
    message: pickConfMsg,
    action_url: `/pickup/${pickup.id}`,
  });
  sendPushNotification(userId, pickConfTitle, pickConfMsg).catch(() => {});

  return pickup as PickupRequest;
}

// #15: confirmPickup — admin confirms a pickup request
export async function confirmPickup(requestId: string, adminId: string): Promise<PickupRequest> {
  const supabase = getClient();

  const { data: updated, error } = await supabase
    .from('pickup_requests')
    .update({ status: 'confirmed' })
    .eq('id', requestId)
    .select()
    .single();

  if (error || !updated) throw new Error('Erreur confirmation pickup.');

  const confTitle = 'Pickup confirmé ✅';
  const confMsg = `Votre pickup du ${updated.pickup_date} à ${updated.pickup_address} est confirmé.`;
  await supabase.from('notifications').insert({
    user_id: updated.client_id,
    type: 'system',
    title: confTitle,
    message: confMsg,
    action_url: `/pickup/${requestId}`,
  });
  sendPushNotification(updated.client_id, confTitle, confMsg).catch(() => {});

  return updated as PickupRequest;
}

// #16: completePickup — admin marks pickup as collected
export async function completePickup(requestId: string, adminId: string): Promise<PickupRequest> {
  const supabase = getClient();

  const { data: updated, error } = await supabase
    .from('pickup_requests')
    .update({ status: 'collected' })
    .eq('id', requestId)
    .select()
    .single();

  if (error || !updated) throw new Error('Erreur complétion pickup.');

  const collTitle = 'Pickup collecté 📦';
  const collMsg = `Vos colis ont été collectés à ${updated.pickup_address}. Ils seront traités sous peu.`;
  await supabase.from('notifications').insert({
    user_id: updated.client_id,
    type: 'system',
    title: collTitle,
    message: collMsg,
    action_url: `/pickup/${requestId}`,
  });
  sendPushNotification(updated.client_id, collTitle, collMsg).catch(() => {});

  return updated as PickupRequest;
}

// getAllPickupRequests — admin view
export async function getAllPickupRequests(): Promise<PickupRequest[]> {
  const { data, error } = await getClient()
    .from('pickup_requests')
    .select('*, client:client_id(full_name, email)')
    .order('created_at', { ascending: false });

  if (error) throw new Error('Erreur chargement pickups.');
  return (data ?? []) as PickupRequest[];
}

export async function getMyPickupRequests(userId: string): Promise<PickupRequest[]> {
  const { data, error } = await getClient()
    .from('pickup_requests')
    .select('*')
    .eq('client_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error('Erreur lors du chargement des demandes.');
  return (data ?? []) as PickupRequest[];
}
