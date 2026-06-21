import { getClient } from './client';

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

  if (admins) {
    const notifications = admins.map((admin) => ({
      user_id: admin.id,
      type: 'pickup_request',
      title: 'Nouvelle demande de pickup 🚚',
      body: `${clientName} demande un pickup à ${data.pickup_address} le ${data.pickup_date}.`,
      data: { pickup_id: pickup.id },
      is_read: false,
    }));
    await getClient().from('notifications').insert(notifications);
  }

  return pickup as PickupRequest;
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
