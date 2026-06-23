import { getClient } from './client';
import { sendPushNotification } from './push';

export type DepartureStatus = 'open' | 'closed' | 'departed' | 'arrived';

export interface Departure {
  id: string;
  type: 'air' | 'sea';
  departure_date: string;
  origin: string;
  destinations: string[];
  status: DepartureStatus;
  capacity_lbs: number;
  used_capacity_lbs: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  package_count?: number;
}

export interface CreateDepartureData {
  type: 'air' | 'sea';
  departure_date: string;
  origin?: string;
  destinations: string[];
  capacity_lbs: number;
  notes?: string;
}

// ─── getAllDepartures ─────────────────────────────────────────────────────────

export async function getAllDepartures(
  filter?: { status?: DepartureStatus; type?: 'air' | 'sea' },
): Promise<Departure[]> {
  const supabase = getClient();

  let query = supabase
    .from('departures')
    .select('*')
    .order('departure_date', { ascending: true });

  if (filter?.status) query = query.eq('status', filter.status);
  if (filter?.type) query = query.eq('type', filter.type);

  const { data, error } = await query;
  if (error) throw new Error(`Erreur chargement départs: ${error.message}`);

  const departures = (data ?? []) as Departure[];

  // Count packages per departure
  const ids = departures.map(d => d.id);
  if (ids.length > 0) {
    const { data: pkgCounts } = await supabase
      .from('packages')
      .select('departure_id')
      .in('departure_id', ids);

    const countMap: Record<string, number> = {};
    for (const p of pkgCounts ?? []) {
      countMap[p.departure_id] = (countMap[p.departure_id] ?? 0) + 1;
    }
    for (const d of departures) {
      d.package_count = countMap[d.id] ?? 0;
    }
  }

  return departures;
}

// ─── getNextDepartures ───────────────────────────────────────────────────────

export async function getNextDepartures(): Promise<{ air: Departure | null; sea: Departure | null }> {
  const today = new Date().toISOString().split('T')[0];

  const { data } = await getClient()
    .from('departures')
    .select('*')
    .eq('status', 'open')
    .gte('departure_date', today)
    .order('departure_date', { ascending: true });

  const departures = (data ?? []) as Departure[];
  const air = departures.find(d => d.type === 'air') ?? null;
  const sea = departures.find(d => d.type === 'sea') ?? null;

  return { air, sea };
}

// ─── createDeparture ─────────────────────────────────────────────────────────

export async function createDeparture(
  data: CreateDepartureData,
  adminId: string,
): Promise<Departure> {
  const supabase = getClient();

  const { data: departure, error } = await supabase
    .from('departures')
    .insert({
      type: data.type,
      departure_date: data.departure_date,
      origin: data.origin ?? 'Miami, FL',
      destinations: data.destinations,
      capacity_lbs: data.capacity_lbs,
      used_capacity_lbs: 0,
      status: 'open',
      notes: data.notes ?? null,
      created_by: adminId,
    })
    .select()
    .single();

  if (error || !departure) {
    throw new Error(`Erreur création départ: ${error?.message ?? 'unknown'}`);
  }

  return departure as Departure;
}

// ─── closeDeparture ──────────────────────────────────────────────────────────

export async function closeDeparture(departureId: string): Promise<Departure> {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('departures')
    .update({ status: 'closed' })
    .eq('id', departureId)
    .eq('status', 'open')
    .select()
    .single();

  if (error || !data) throw new Error('Impossible de fermer ce départ.');
  return data as Departure;
}

// ─── markDeparted ────────────────────────────────────────────────────────────

export async function markDeparted(departureId: string): Promise<Departure> {
  const supabase = getClient();

  const { data: dep, error: updateError } = await supabase
    .from('departures')
    .update({ status: 'departed' })
    .eq('id', departureId)
    .in('status', ['open', 'closed'])
    .select()
    .single();

  if (updateError || !dep) throw new Error('Impossible de marquer ce départ comme parti.');

  // Update all assigned packages to in_transit
  await supabase
    .from('packages')
    .update({ status: 'in_transit' })
    .eq('departure_id', departureId)
    .in('status', ['received_usa']);

  return dep as Departure;
}

// ─── markArrived ─────────────────────────────────────────────────────────────

export async function markArrived(departureId: string): Promise<Departure> {
  const supabase = getClient();

  const { data: dep, error } = await supabase
    .from('departures')
    .update({ status: 'arrived' })
    .eq('id', departureId)
    .eq('status', 'departed')
    .select()
    .single();

  if (error || !dep) throw new Error('Impossible de marquer ce départ comme arrivé.');

  // Update all assigned packages to arrived
  await supabase
    .from('packages')
    .update({ status: 'arrived' })
    .eq('departure_id', departureId)
    .eq('status', 'in_transit');

  return dep as Departure;
}

// ─── notifyDepartureClients ──────────────────────────────────────────────────

export async function notifyDepartureClients(departureId: string): Promise<number> {
  const supabase = getClient();

  // Get departure info
  const { data: dep } = await supabase
    .from('departures')
    .select('*')
    .eq('id', departureId)
    .single();

  if (!dep) throw new Error('Départ introuvable.');

  // Get unique clients with packages in this departure
  const { data: packages } = await supabase
    .from('packages')
    .select('client_id, tracking_number')
    .eq('departure_id', departureId);

  if (!packages || packages.length === 0) return 0;

  const uniqueClients = [...new Set(packages.map(p => p.client_id))];
  const typeLabel = dep.type === 'air' ? 'Vol' : 'Bateau';
  const destLabel = (dep.destinations as string[]).join(', ');
  const dateFormatted = new Date(dep.departure_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  const title = `${typeLabel} prévu le ${dateFormatted}`;
  const message = `Votre colis est prévu sur le ${typeLabel.toLowerCase()} ${dep.origin} → ${destLabel} du ${dateFormatted}.`;

  // Insert notifications for all clients
  const notifications = uniqueClients.map(clientId => ({
    user_id: clientId,
    type: 'package' as const,
    title,
    message,
    action_url: '/colis',
  }));

  await supabase.from('notifications').insert(notifications);

  // Push notifications
  for (const clientId of uniqueClients) {
    sendPushNotification(clientId, title, message).catch(() => {});
  }

  return uniqueClients.length;
}

// ─── getDeparturePackages ────────────────────────────────────────────────────

export async function getDeparturePackages(departureId: string) {
  const { data, error } = await getClient()
    .from('packages')
    .select('id, tracking_number, status, billed_weight_lbs, destination_city, destination_country, client_id, users!client_id(full_name)')
    .eq('departure_id', departureId)
    .order('created_at', { ascending: false });

  if (error) throw new Error('Erreur chargement colis du départ.');
  return data ?? [];
}

// ─── subscribeToDepartures (Realtime) ────────────────────────────────────────

export function subscribeToDepartures(
  callback: (departure: Departure) => void,
): () => void {
  const supabase = getClient();
  const channel = supabase
    .channel(`departures_rt_${Date.now()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'departures' }, (payload) => {
      if (payload.new) callback(payload.new as Departure);
    })
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}
