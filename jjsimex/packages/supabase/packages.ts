import { getClient } from './client';

const supabaseAdmin = getClient();

// ─── Types ────────────────────────────────────────────────────────────────────

export type PackageStatus =
  | 'received_usa'
  | 'in_transit'
  | 'arrived'
  | 'ready_pickup'
  | 'delivered'
  | 'pending';

export interface PackageFilters {
  status?: PackageStatus;
  transport_mode?: 'air' | 'sea';
  destination_country?: 'haiti' | 'dominican_republic';
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
}

export interface CreatePackageData {
  client_id: string;
  transport_mode: 'air' | 'sea';
  weight_real: number;
  length_in?: number;
  width_in?: number;
  height_in?: number;
  declared_value: number;
  insurance_amount?: number;
  destination_country: 'haiti' | 'dominican_republic';
  destination_city: string;
  destination_address: string;
  notes?: string;
}

// ─── CLIENT : Suivre un colis ─────────────────────────────────────────────────

export async function trackPackage(trackingNumber: string) {
  const { data: pkg, error } = await supabaseAdmin
    .from('packages')
    .select(`
      *,
      package_status_history (
        id, status, notes, created_at,
        users!updated_by ( first_name, last_name )
      ),
      departures ( id, transport_mode, departure_date, origin, status ),
      payments ( id, status, amount, method, transaction_number )
    `)
    .eq('tracking_number', trackingNumber.toUpperCase())
    .order('created_at', { referencedTable: 'package_status_history', ascending: true })
    .single();

  if (error || !pkg) {
    throw new Error('Numéro de suivi introuvable. Vérifiez et réessayez.');
  }

  const estimatedDelivery = calculateEstimatedDelivery(pkg);

  return { ...pkg, estimated_delivery: estimatedDelivery };
}

// ─── CLIENT : Mes colis ───────────────────────────────────────────────────────

export async function getMyPackages(
  userId: string,
  filters?: { status?: PackageStatus; page?: number },
) {
  const page = filters?.page ?? 1;
  const pageSize = 20;
  const from = (page - 1) * pageSize;

  let query = supabaseAdmin
    .from('packages')
    .select('id, tracking_number, status, transport_mode, destination_city, destination_country, weight_billed, shipping_cost, is_paid, created_at, received_at, shipped_at, arrived_at, delivered_at', { count: 'exact' })
    .eq('client_id', userId)
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1);

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error, count } = await query;

  if (error) throw new Error('Erreur lors du chargement des colis.');

  return {
    packages: data ?? [],
    total: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

// ─── CLIENT : Détail d'un colis ───────────────────────────────────────────────

export async function getPackageDetail(packageId: string, userId: string) {
  const { data: pkg, error } = await supabaseAdmin
    .from('packages')
    .select(`
      *,
      package_status_history (
        id, status, notes, created_at,
        users!updated_by ( first_name, last_name )
      ),
      payments ( id, status, amount, method, transaction_number, created_at ),
      departures ( id, transport_mode, departure_date, origin )
    `)
    .eq('id', packageId)
    .eq('client_id', userId)
    .order('created_at', { referencedTable: 'package_status_history', ascending: true })
    .single();

  if (error || !pkg) {
    throw new Error('Colis introuvable ou accès non autorisé.');
  }

  return pkg;
}

// ─── ADMIN : Créer un colis ───────────────────────────────────────────────────

export async function createPackage(data: CreatePackageData, adminId: string) {
  // Calcul du poids volumétrique
  let weightVolumetric = 0;
  if (data.length_in && data.width_in && data.height_in) {
    weightVolumetric = (data.length_in * data.width_in * data.height_in) / 139;
  }

  // Poids facturé = MAX(réel, volumétrique)
  const weightBilled = Math.max(data.weight_real, weightVolumetric);

  // Récupérer le tarif
  const { data: rate, error: rateError } = await supabaseAdmin
    .from('shipping_rates')
    .select('price_per_lb, min_days, max_days')
    .eq('destination_country', data.destination_country)
    .eq('destination_city', data.destination_city)
    .eq('transport_mode', data.transport_mode)
    .eq('is_active', true)
    .single();

  if (rateError || !rate) {
    // Tarif par défaut si non trouvé
    const defaultRate = data.transport_mode === 'air' ? 6.5 : 3.0;
    const shippingCost = parseFloat((weightBilled * defaultRate).toFixed(2));
    return insertPackage(data, adminId, weightVolumetric, weightBilled, shippingCost);
  }

  const shippingCost = parseFloat((weightBilled * rate.price_per_lb).toFixed(2));
  return insertPackage(data, adminId, weightVolumetric, weightBilled, shippingCost);
}

async function insertPackage(
  data: CreatePackageData,
  adminId: string,
  weightVolumetric: number,
  weightBilled: number,
  shippingCost: number,
) {
  const { data: pkg, error } = await supabaseAdmin
    .from('packages')
    .insert({
      client_id: data.client_id,
      transport_mode: data.transport_mode,
      weight_real: data.weight_real,
      weight_volumetric: weightVolumetric,
      weight_billed: weightBilled,
      declared_value: data.declared_value,
      insurance_amount: data.insurance_amount ?? 0,
      destination_country: data.destination_country,
      destination_city: data.destination_city,
      destination_address: data.destination_address,
      shipping_cost: shippingCost,
      status: 'received_usa',
      is_paid: false,
      notes: data.notes,
    })
    .select('*, users!client_id(first_name, last_name, email, whatsapp)')
    .single();

  if (error || !pkg) {
    throw new Error('Erreur lors de la création du colis. Réessayez.');
  }

  // Insérer statut initial dans historique
  await supabaseAdmin.from('package_status_history').insert({
    package_id: pkg.id,
    status: 'received_usa',
    updated_by: adminId,
    notes: 'Colis reçu dans notre entrepôt de Miami.',
  });

  // Créer notification in-app
  await supabaseAdmin.from('notifications').insert({
    user_id: data.client_id,
    type: 'colis_received',
    title: 'Colis reçu ✅',
    body: `Votre colis ${pkg.tracking_number} est arrivé dans notre entrepôt Miami.`,
    data: { package_id: pkg.id, tracking_number: pkg.tracking_number },
    is_read: false,
    package_id: pkg.id,
  });

  const client = (pkg as { users?: { first_name: string; last_name: string; email: string } }).users;

  return pkg;
}

// ─── ADMIN : Mettre à jour le statut ─────────────────────────────────────────

export async function updatePackageStatus(
  packageId: string,
  newStatus: PackageStatus,
  note: string,
  adminId: string,
) {
  // Récupérer le colis avec infos client et succursale
  const { data: pkg, error } = await supabaseAdmin
    .from('packages')
    .select(`
      *,
      users!client_id ( id, first_name, email ),
      departures ( origin )
    `)
    .eq('id', packageId)
    .single();

  if (error || !pkg) throw new Error('Colis introuvable.');

  const timestampField: Record<string, string> = {
    in_transit: 'shipped_at',
    arrived: 'arrived_at',
    delivered: 'delivered_at',
  };

  const updateData: Record<string, unknown> = { status: newStatus };
  if (timestampField[newStatus]) {
    updateData[timestampField[newStatus]] = new Date().toISOString();
  }

  // Update du statut
  const { error: updateError } = await supabaseAdmin
    .from('packages')
    .update(updateData)
    .eq('id', packageId);

  if (updateError) throw new Error('Erreur lors de la mise à jour du statut.');

  // Historique
  await supabaseAdmin.from('package_status_history').insert({
    package_id: packageId,
    status: newStatus,
    updated_by: adminId,
    notes: note,
  });

  const client = (pkg as { users?: { id: string; first_name: string; email: string } }).users;
  if (!client) return pkg;

  // Messages push selon statut
  const pushMessages: Record<string, { title: string; body: string }> = {
    in_transit: {
      title: 'Colis en route ✈️',
      body: `${pkg.tracking_number} est en transit vers ${pkg.destination_city}.`,
    },
    arrived: {
      title: 'Colis arrivé 🎉',
      body: `${pkg.tracking_number} est arrivé. Disponible en succursale bientôt.`,
    },
    ready_pickup: {
      title: 'Colis prêt à retirer 📦',
      body: `${pkg.tracking_number} vous attend à notre succursale de ${pkg.destination_city}.`,
    },
    delivered: {
      title: 'Colis livré ✅',
      body: `${pkg.tracking_number} a été livré. Merci de faire confiance à JJ's IMEX !`,
    },
  };

  const notifTypes: Record<string, string> = {
    in_transit: 'colis_transit',
    arrived: 'colis_arrived',
    ready_pickup: 'colis_ready',
    delivered: 'colis_delivered',
  };

  const msg = pushMessages[newStatus];
  if (msg) {
    // Notification in-app
    await supabaseAdmin.from('notifications').insert({
      user_id: client.id,
      type: notifTypes[newStatus] ?? 'colis_transit',
      title: msg.title,
      body: msg.body,
      data: { package_id: packageId, tracking_number: pkg.tracking_number },
      is_read: false,
      package_id: packageId,
    });

  }

  return pkg;
}

// ─── ADMIN : Liste des colis ──────────────────────────────────────────────────

export async function getAllPackages(filters: PackageFilters = {}) {
  const page = filters.page ?? 1;
  const pageSize = 20;
  const from = (page - 1) * pageSize;

  let query = supabaseAdmin
    .from('packages')
    .select(
      `id, tracking_number, status, transport_mode, destination_country, destination_city,
       weight_billed, shipping_cost, is_paid, created_at,
       users!client_id ( id, first_name, last_name, email, whatsapp )`,
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1);

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.transport_mode) query = query.eq('transport_mode', filters.transport_mode);
  if (filters.destination_country) query = query.eq('destination_country', filters.destination_country);
  if (filters.date_from) query = query.gte('created_at', filters.date_from);
  if (filters.date_to) query = query.lte('created_at', filters.date_to);
  if (filters.search) {
    query = query.or(
      `tracking_number.ilike.%${filters.search}%`,
    );
  }

  const { data, error, count } = await query;
  if (error) throw new Error('Erreur lors du chargement des colis.');

  return {
    packages: data ?? [],
    total: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

// ─── ADMIN : Assigner à un départ ─────────────────────────────────────────────

export async function assignToDeparture(packageId: string, departureId: string) {
  // Récupérer le colis
  const { data: pkg } = await supabaseAdmin
    .from('packages')
    .select('weight_billed, destination_country')
    .eq('id', packageId)
    .single();

  if (!pkg) throw new Error('Colis introuvable.');

  // Vérifier capacité du départ
  const { data: departure } = await supabaseAdmin
    .from('departures')
    .select('capacity_lbs, current_weight, destination_country, status')
    .eq('id', departureId)
    .single();

  if (!departure) throw new Error('Départ introuvable.');

  if (departure.status === 'departed' || departure.status === 'arrived') {
    throw new Error('Ce départ est déjà parti. Choisissez un autre.');
  }

  const available = departure.capacity_lbs - departure.current_weight;
  if (pkg.weight_billed > available) {
    throw new Error(
      `Capacité insuffisante pour ce départ. Choisissez un autre. (Disponible: ${available.toFixed(1)} lbs)`,
    );
  }

  // Assigner le colis
  const { error } = await supabaseAdmin
    .from('packages')
    .update({ departure_id: departureId })
    .eq('id', packageId);

  if (error) throw new Error('Erreur lors de l\'assignation.');

  // Mettre à jour le poids utilisé
  await supabaseAdmin
    .from('departures')
    .update({ current_weight: departure.current_weight + pkg.weight_billed })
    .eq('id', departureId);

  return { success: true };
}

// ─── ADMIN MOBILE : Scanner un colis ─────────────────────────────────────────

export async function scanPackage(trackingNumber: string) {
  const { data: pkg, error } = await supabaseAdmin
    .from('packages')
    .select(`
      id, tracking_number, status, transport_mode,
      destination_country, destination_city, destination_address,
      weight_real, weight_billed, shipping_cost, is_paid,
      received_at, shipped_at, arrived_at, delivered_at,
      users!client_id ( id, first_name, last_name, whatsapp, email )
    `)
    .eq('tracking_number', trackingNumber.toUpperCase())
    .single();

  if (error || !pkg) {
    throw new Error('Numéro de suivi introuvable. Vérifiez et réessayez.');
  }

  // Actions disponibles selon statut
  const nextStatuses: Record<string, PackageStatus[]> = {
    pending: ['received_usa'],
    received_usa: ['in_transit'],
    in_transit: ['arrived'],
    arrived: ['ready_pickup'],
    ready_pickup: ['delivered'],
    delivered: [],
  };

  return {
    ...pkg,
    available_actions: nextStatuses[pkg.status] ?? [],
  };
}

// ─── ADMIN : Note interne ────────────────────────────────────────────────────

export async function addInternalNote(packageId: string, note: string, adminId: string) {
  const { data: pkg } = await supabaseAdmin
    .from('packages')
    .select('internal_notes')
    .eq('id', packageId)
    .single();

  if (!pkg) throw new Error('Colis introuvable.');

  const timestamp = new Date().toLocaleString('fr-FR', { timeZone: 'America/New_York' });
  const existingNotes = pkg.internal_notes ? pkg.internal_notes + '\n\n' : '';
  const newNote = `${existingNotes}[${timestamp}] ${note}`;

  const { error } = await supabaseAdmin
    .from('packages')
    .update({ internal_notes: newNote })
    .eq('id', packageId);

  if (error) throw new Error('Erreur lors de l\'ajout de la note.');

  await supabaseAdmin.from('package_status_history').insert({
    package_id: packageId,
    status: 'received_usa',
    updated_by: adminId,
    notes: `[NOTE INTERNE] ${note}`,
  });

  return { success: true };
}

// ─── ADMIN : Statistiques ─────────────────────────────────────────────────────

export async function getPackageStats(period: 'week' | 'month' | 'year' = 'month') {
  const now = new Date();
  const periodStart = new Date(now);
  const prevStart = new Date(now);

  if (period === 'week') {
    periodStart.setDate(now.getDate() - 7);
    prevStart.setDate(now.getDate() - 14);
  } else if (period === 'month') {
    periodStart.setMonth(now.getMonth() - 1);
    prevStart.setMonth(now.getMonth() - 2);
  } else {
    periodStart.setFullYear(now.getFullYear() - 1);
    prevStart.setFullYear(now.getFullYear() - 2);
  }

  const [current, previous] = await Promise.all([
    supabaseAdmin
      .from('packages')
      .select('status, destination_country, transport_mode, shipping_cost')
      .gte('created_at', periodStart.toISOString()),
    supabaseAdmin
      .from('packages')
      .select('status, shipping_cost')
      .gte('created_at', prevStart.toISOString())
      .lt('created_at', periodStart.toISOString()),
  ]);

  const packages = current.data ?? [];
  const prevPackages = previous.data ?? [];

  const byStatus: Record<string, number> = {};
  const byCountry: Record<string, number> = {};
  const byTransport: Record<string, number> = {};
  let totalRevenue = 0;

  for (const p of packages) {
    byStatus[p.status] = (byStatus[p.status] ?? 0) + 1;
    byCountry[p.destination_country] = (byCountry[p.destination_country] ?? 0) + 1;
    byTransport[p.transport_mode] = (byTransport[p.transport_mode] ?? 0) + 1;
    totalRevenue += p.shipping_cost ?? 0;
  }

  const prevRevenue = prevPackages.reduce((sum, p) => sum + (p.shipping_cost ?? 0), 0);
  const revenueGrowth =
    prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
  const countGrowth =
    prevPackages.length > 0
      ? ((packages.length - prevPackages.length) / prevPackages.length) * 100
      : 0;

  return {
    total: packages.length,
    by_status: byStatus,
    by_country: byCountry,
    by_transport: byTransport,
    revenue: parseFloat(totalRevenue.toFixed(2)),
    revenue_growth: parseFloat(revenueGrowth.toFixed(1)),
    count_growth: parseFloat(countGrowth.toFixed(1)),
    period,
  };
}

// ─── subscribeToPackages (Realtime) ──────────────────────────────────────────

export function subscribeToPackages(
  callback: (pkg: Record<string, unknown>) => void,
  filter?: { client_id?: string; status?: PackageStatus },
): () => void {
  const supabase = supabaseAdmin;
  const channel = supabase
    .channel(`packages_rt_${Date.now()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'packages' }, (payload) => {
      if (payload.new) callback(payload.new as Record<string, unknown>);
    })
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}

// ─── Utilitaire : Date estimée de livraison ───────────────────────────────────

function calculateEstimatedDelivery(pkg: {
  status: string;
  transport_mode: string;
  received_at?: string;
  shipped_at?: string;
}): string | null {
  if (pkg.status === 'delivered') return null;

  const base = pkg.shipped_at ?? pkg.received_at;
  if (!base) return null;

  const baseDate = new Date(base);
  const daysToAdd = pkg.transport_mode === 'air' ? 7 : 21;
  baseDate.setDate(baseDate.getDate() + daysToAdd);

  return baseDate.toISOString().split('T')[0];
}
