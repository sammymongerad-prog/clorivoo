import { getClient } from './client';

export interface Departure {
  id: string;
  transport_mode: 'air' | 'sea';
  departure_date: string;
  origin: string;
  destination_country: string;
  status: 'open' | 'full' | 'departed' | 'arrived';
  capacity_lbs: number;
  current_weight: number;
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
  const air = departures.find(d => d.transport_mode === 'air') ?? null;
  const sea = departures.find(d => d.transport_mode === 'sea') ?? null;

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
  const hasAir = existing.some((d: any) => d.transport_mode === 'air');
  const hasSea = existing.some((d: any) => d.transport_mode === 'sea');

  const inserts: any[] = [];

  if (!hasAir) {
    inserts.push({
      transport_mode: 'air',
      departure_date: futureDate,
      origin: 'Miami, FL',
      destination_country: 'haiti',
      status: 'open',
      capacity_lbs: 500,
      current_weight: 0,
    });
  }

  if (!hasSea) {
    inserts.push({
      transport_mode: 'sea',
      departure_date: futureDate,
      origin: 'Miami, FL',
      destination_country: 'haiti',
      status: 'open',
      capacity_lbs: 8000,
      current_weight: 0,
    });
  }

  if (inserts.length > 0) {
    await getClient().from('departures').insert(inserts);
  }
}
