import { getClient } from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TransportMode = 'air' | 'sea';
export type LoyaltyLevel = 'bronze' | 'silver' | 'gold';
export type DestinationCountry = 'haiti' | 'dr'; // enum DB : 'haiti' | 'dr'

export const LOYALTY_DISCOUNT: Record<LoyaltyLevel, number> = {
  bronze: 0,
  silver: 5,
  gold: 10,
};

export interface ShippingParams {
  destination_city: string;
  destination_country: DestinationCountry;
  transport_mode: TransportMode;
  real_weight_lbs: number;
  length_in?: number;
  width_in?: number;
  height_in?: number;
  user_id?: string;
}

export interface ShippingResult {
  volumetric_weight: number;
  billed_weight: number;
  base_price: number;
  loyalty_discount_percent: number;
  loyalty_discount_amount: number;
  final_price: number;
  transport_mode: TransportMode;
  estimated_days_min: number;
  estimated_days_max: number;
  estimated_delivery_date: string;
  rate_per_lb_used: number;
  loyalty_level: LoyaltyLevel | null;
}

export interface ShippingRate {
  id: string;
  destination_country: DestinationCountry;
  destination_city: string;
  air_rate_per_lb: number;
  sea_rate_per_lb: number;
  air_days_min: number;
  air_days_max: number;
  sea_weeks_min: number;
  sea_weeks_max: number;
  is_active: boolean;
  updated_at: string;
  updated_by: string | null;
}

export interface ExchangeRate {
  id: string;
  usd_to_htg: number;
  usd_to_dop: number;
  eur_to_htg: number;
  cad_to_htg: number;
  is_auto: boolean;
  updated_at: string;
  updated_by: string | null;
}

// ─── Helpers internes ─────────────────────────────────────────────────────────

function calcVolumetricWeight(l?: number, w?: number, h?: number): number {
  if (!l || !w || !h) return 0;
  return Math.round((l * w * h) / 139 * 10) / 10;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

// ─── calculateShipping ────────────────────────────────────────────────────────

export async function calculateShipping(params: ShippingParams): Promise<ShippingResult> {
  const supabase = getClient();

  // 1. Tarif depuis Supabase
  const { data: row } = await supabase
    .from('shipping_rates')
    .select('air_rate_per_lb, sea_rate_per_lb, air_days_min, air_days_max, sea_weeks_min, sea_weeks_max')
    .eq('destination_country', params.destination_country)
    .eq('destination_city', params.destination_city)
    .eq('is_active', true)
    .maybeSingle();

  // Fallback tarifs par défaut
  const defaults: Record<DestinationCountry, { air: number; sea: number }> = {
    haiti: { air: 9.5, sea: 4.5 },
    dr: { air: 11, sea: 5.5 },
  };
  const fb = defaults[params.destination_country];
  const rate_per_lb = params.transport_mode === 'air'
    ? (row?.air_rate_per_lb ?? fb.air)
    : (row?.sea_rate_per_lb ?? fb.sea);

  const days_min = params.transport_mode === 'air'
    ? (row?.air_days_min ?? 5)
    : (row?.sea_weeks_min ?? 3) * 7;
  const days_max = params.transport_mode === 'air'
    ? (row?.air_days_max ?? 7)
    : (row?.sea_weeks_max ?? 4) * 7;

  // 2. Poids
  const volumetric_weight = calcVolumetricWeight(params.length_in, params.width_in, params.height_in);
  const billed_weight = Math.max(params.real_weight_lbs, volumetric_weight);
  const base_price = Math.max(5, Math.round(billed_weight * rate_per_lb * 100) / 100);

  // 3. Fidélité
  let loyalty_level: LoyaltyLevel | null = null;
  let loyalty_discount_percent = 0;

  if (params.user_id) {
    const { data: user } = await supabase
      .from('users')
      .select('loyalty_level')
      .eq('id', params.user_id)
      .maybeSingle();

    if (user?.loyalty_level) {
      loyalty_level = user.loyalty_level as LoyaltyLevel;
      loyalty_discount_percent = LOYALTY_DISCOUNT[loyalty_level] ?? 0;
    }
  }

  const loyalty_discount_amount = Math.round(base_price * loyalty_discount_percent / 100 * 100) / 100;
  const final_price = Math.round((base_price - loyalty_discount_amount) * 100) / 100;

  // 4. Date estimée
  const delivery_date = addDays(new Date(), days_max);

  return {
    volumetric_weight,
    billed_weight,
    base_price,
    loyalty_discount_percent,
    loyalty_discount_amount,
    final_price,
    transport_mode: params.transport_mode,
    estimated_days_min: days_min,
    estimated_days_max: days_max,
    estimated_delivery_date: formatDate(delivery_date),
    rate_per_lb_used: rate_per_lb,
    loyalty_level,
  };
}

// ─── getShippingRates ─────────────────────────────────────────────────────────

export async function getShippingRates(): Promise<ShippingRate[]> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('shipping_rates')
    .select('*')
    .order('destination_country')
    .order('destination_city');
  if (error) throw new Error(`getShippingRates: ${error.message}`);
  return (data ?? []) as ShippingRate[];
}

// ─── updateShippingRate ───────────────────────────────────────────────────────

export async function updateShippingRate(
  id: string,
  data: { air_rate_per_lb?: number; sea_rate_per_lb?: number },
  admin_id: string,
): Promise<ShippingRate> {
  const supabase = getClient();
  const { data: updated, error } = await supabase
    .from('shipping_rates')
    .update({ ...data, updated_by: admin_id })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`updateShippingRate: ${error.message}`);
  return updated as ShippingRate;
}

// ─── getExchangeRates ─────────────────────────────────────────────────────────

export async function getExchangeRates(): Promise<ExchangeRate> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('exchange_rates')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();
  if (error) throw new Error(`getExchangeRates: ${error.message}`);
  return data as ExchangeRate;
}

// ─── updateExchangeRate ───────────────────────────────────────────────────────

export async function updateExchangeRate(
  data: { usd_to_htg?: number; usd_to_dop?: number; eur_to_htg?: number; cad_to_htg?: number },
  admin_id: string,
): Promise<ExchangeRate> {
  const supabase = getClient();
  const { data: existing } = await supabase
    .from('exchange_rates')
    .select('id')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();
  if (!existing) throw new Error('Aucun taux de change trouvé');

  const { data: updated, error } = await supabase
    .from('exchange_rates')
    .update({ ...data, updated_by: admin_id, is_auto: false })
    .eq('id', existing.id)
    .select()
    .single();
  if (error) throw new Error(`updateExchangeRate: ${error.message}`);
  return updated as ExchangeRate;
}

// ─── subscribeToExchangeRates (Realtime) ──────────────────────────────────────

export function subscribeToExchangeRates(callback: (rates: ExchangeRate) => void): () => void {
  const supabase = getClient();
  const channel = supabase
    .channel('exchange_rates_rt')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'exchange_rates' }, (payload) => {
      if (payload.new) callback(payload.new as ExchangeRate);
    })
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

// ─── subscribeToShippingRates (Realtime) ─────────────────────────────────────

export function subscribeToShippingRates(callback: () => void): () => void {
  const supabase = getClient();
  const channel = supabase
    .channel(`shipping_rates_rt_${Date.now()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'shipping_rates' }, () => {
      callback();
    })
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

// ─── getDestinationCities ─────────────────────────────────────────────────────

export async function getDestinationCities(): Promise<{
  haiti: string[];
  dr: string[];
}> {
  const supabase = getClient();
  const { data } = await supabase
    .from('shipping_rates')
    .select('destination_country, destination_city')
    .eq('is_active', true)
    .order('destination_city');

  const result: { haiti: string[]; dr: string[] } = { haiti: [], dr: [] };
  for (const row of data ?? []) {
    const c = row.destination_country as DestinationCountry;
    if (result[c]) result[c].push(row.destination_city);
  }

  // Fallback
  if (result.haiti.length === 0)
    result.haiti = ['Port-au-Prince', 'Cap-Haïtien', 'Pétion-Ville', 'Les Cayes', 'Gonaïves', 'Jacmel'];
  if (result.dr.length === 0)
    result.dr = ['Santo Domingo', 'Santiago', 'Punta Cana'];

  return result;
}
