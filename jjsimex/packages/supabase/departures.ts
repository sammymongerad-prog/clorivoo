import { getClient } from './client';

export interface Departure {
  id: string;
  type: 'air' | 'sea';
  departure_date: string;
  origin: string;
  destinations: string[];
  status: 'open' | 'closed' | 'departed' | 'arrived';
  capacity_lbs: number;
  used_capacity_lbs: number;
  created_at: string;
}

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

export async function ensureUpcomingDepartures(): Promise<void> {
  const now = new Date();
  const in20Days = new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000);
  const today = now.toISOString().split('T')[0];
  const futureDate = in20Days.toISOString().split('T')[0];

  const { data } = await getClient()
    .from('departures')
    .select('id, transport_mode')
    .eq('status', 'open')
    .gte('departure_date', today)
    .lte('departure_date', futureDate);

  const existing = data ?? [];
  const hasAir = existing.some((d: any) => d.type === 'air');
  const hasSea = existing.some((d: any) => d.type === 'sea');

  const inserts: any[] = [];

  if (!hasAir) {
    inserts.push({
      type: 'air',
      departure_date: futureDate,
      origin: 'Miami, FL',
      destinations: ['Port-au-Prince', 'Cap-Haïtien'],
      status: 'open',
      capacity_lbs: 500,
      used_capacity_lbs: 0,
    });
  }

  if (!hasSea) {
    inserts.push({
      type: 'sea',
      departure_date: futureDate,
      origin: 'Miami, FL',
      destinations: ['Port-au-Prince', 'Cap-Haïtien'],
      status: 'open',
      capacity_lbs: 8000,
      used_capacity_lbs: 0,
    });
  }

  if (inserts.length > 0) {
    await getClient().from('departures').insert(inserts);
  }
}
