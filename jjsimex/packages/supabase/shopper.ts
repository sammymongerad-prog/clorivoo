import { createClient } from '@supabase/supabase-js';
import { sendPushNotification } from './push';
import { sendShopperNotificationEmail, sendShopperQuoteEmail, sendShopperShippedEmail } from './emails';
import { calculateShipping } from './shipping';
import type { TransportMode, DestinationCountry } from './shipping';

// ─── Client ───────────────────────────────────────────────────────────────────

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type ShopperStatus = 'pending' | 'quoted' | 'confirmed' | 'purchased' | 'shipped' | 'cancelled';

export interface CreateShopperData {
  product_url: string;
  merchant: string;
  quantity: number;
  variant?: string;
  destination_city: string;
  destination_country: DestinationCountry;
  transport_mode: TransportMode;
  notes?: string;
}

export interface ShopperRequest {
  id: string;
  request_number: string;
  client_id: string;
  product_url: string;
  merchant: string;
  quantity: number;
  variant: string | null;
  destination_city: string;
  destination_country: DestinationCountry;
  transport_mode: TransportMode;
  estimated_price: number | null;
  final_price: number | null;
  shipping_cost: number | null;
  total_price: number | null;
  status: ShopperStatus;
  notes: string | null;
  admin_notes: string | null;
  handled_by: string | null;
  created_at: string;
  updated_at: string;
  client?: {
    full_name?: string;
    email?: string;
    expo_push_token?: string | null;
  };
}

export interface GetAllFilters {
  status?: ShopperStatus;
  page?: number;
  limit?: number;
}

// ─── Générer numéro requête ───────────────────────────────────────────────────

async function generateRequestNumber(): Promise<string> {
  const supabase = getClient();
  const year = new Date().getFullYear();

  // Récupérer le dernier numéro de l'année
  const { data, count } = await supabase
    .from('personal_shopper')
    .select('request_number', { count: 'exact' })
    .like('request_number', `PS-${year}-%`)
    .order('created_at', { ascending: false })
    .limit(1);

  const nextNum = (count ?? 0) + 1;
  return `PS-${year}-${String(nextNum).padStart(5, '0')}`;
}

// ─── createShopperRequest ─────────────────────────────────────────────────────

export async function createShopperRequest(
  data: CreateShopperData,
  user_id: string,
): Promise<ShopperRequest> {
  const supabase = getClient();

  // Générer le numéro
  const request_number = await generateRequestNumber();

  // Créer la demande
  const { data: request, error } = await supabase
    .from('personal_shopper')
    .insert({
      request_number,
      client_id: user_id,
      product_url: data.product_url,
      merchant: data.merchant,
      quantity: data.quantity,
      variant: data.variant ?? null,
      destination_city: data.destination_city,
      destination_country: data.destination_country,
      transport_mode: data.transport_mode,
      notes: data.notes ?? null,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw new Error(`Erreur création demande: ${error.message}`);

  // Récupérer infos client pour les notifs
  const { data: client } = await supabase
    .from('users')
    .select('full_name, email, expo_push_token')
    .eq('id', user_id)
    .single();

  // Récupérer tous les admins
  const { data: admins } = await supabase
    .from('users')
    .select('id, expo_push_token')
    .in('role', ['admin', 'super_admin']);

  // 1. Notification in-app admin
  if (admins && admins.length > 0) {
    await supabase.from('notifications').insert(
      admins.map(admin => ({
        user_id: admin.id,
        type: 'personal_shopper',
        title: 'Nouvelle demande Personal Shopper',
        message: `${client?.full_name ?? 'Client'} — ${data.merchant} — ${request_number}`,
        action_url: `/dashboard/shopper?id=${request.id}`,
      }))
    );
  }

  // 2. Push notification admin
  if (admins && admins.length > 0) {
    for (const admin of admins) {
      await sendPushNotification(
        admin.id,
        'Nouvelle demande PS 🛒',
        `${client?.full_name ?? 'Client'} — ${data.merchant}\nDestination: ${data.destination_city}`,
        { request_id: request.id },
      ).catch(() => {});
    }
  }

  // 3. Email confirmation client
  if (client?.email) {
    await sendShopperNotificationEmail(
      client.email,
      client.full_name ?? 'Client',
      request_number,
      data.merchant,
      data.destination_city,
    ).catch(() => {});
  }

  return request as ShopperRequest;
}

// ─── getMyShopperRequests ────────────────────────────────────────────────────

export async function getMyShopperRequests(user_id: string): Promise<ShopperRequest[]> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('personal_shopper')
    .select('*')
    .eq('client_id', user_id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Erreur récupération demandes: ${error.message}`);
  return (data ?? []) as ShopperRequest[];
}

// ─── getAllShopperRequests ───────────────────────────────────────────────────

export async function getAllShopperRequests(filters?: GetAllFilters): Promise<ShopperRequest[]> {
  const supabase = getClient();

  let query = supabase
    .from('personal_shopper')
    .select('*, client:client_id(full_name, email, expo_push_token)');

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  // Trier pending en premier, puis par ancienneté
  query = query.order('status', { ascending: false })
    .order('created_at', { ascending: true });

  const { data, error } = await query;
  if (error) throw new Error(`Erreur récupération demandes admin: ${error.message}`);
  return (data ?? []) as ShopperRequest[];
}

// ─── sendQuote ───────────────────────────────────────────────────────────────

export async function sendQuote(
  request_id: string,
  final_price: number,
  admin_id: string,
): Promise<ShopperRequest> {
  const supabase = getClient();

  // Récupérer la demande
  const { data: request, error: fetchError } = await supabase
    .from('personal_shopper')
    .select('*')
    .eq('id', request_id)
    .single();

  if (fetchError) throw new Error(`Erreur récupération demande: ${fetchError.message}`);

  // Calculer frais d'expédition
  const shipping = await calculateShipping({
    destination_city: request.destination_city,
    destination_country: request.destination_country,
    transport_mode: request.transport_mode,
    real_weight_lbs: 1, // estimation par défaut
    user_id: request.client_id,
  });

  const shipping_cost = shipping.final_price;
  const total_price = final_price + shipping_cost;

  // Mettre à jour
  const { data: updated, error: updateError } = await supabase
    .from('personal_shopper')
    .update({
      final_price,
      shipping_cost,
      total_price,
      status: 'quoted',
      handled_by: admin_id,
    })
    .eq('id', request_id)
    .select()
    .single();

  if (updateError) throw new Error(`Erreur mise à jour devis: ${updateError.message}`);

  // Récupérer infos client
  const { data: client } = await supabase
    .from('users')
    .select('full_name, email, expo_push_token')
    .eq('id', request.client_id)
    .single();

  // 1. Notification in-app client
  await supabase.from('notifications').insert({
    user_id: request.client_id,
    type: 'personal_shopper',
    title: 'Votre devis est prêt !',
    message: `PS-${request.request_number}: $${total_price.toFixed(2)}`,
    action_url: `/shopper/${request_id}`,
  });

  // 2. Push notification client
  await sendPushNotification(
    request.client_id,
    'Devis reçu 💰',
    `PS-${request.request_number}\n$${total_price.toFixed(2)}\nConfirmez pour procéder.`,
    { request_id },
  ).catch(() => {});

  // 3. Email devis
  if (client?.email) {
    await sendShopperQuoteEmail(
      client.email,
      client.full_name ?? 'Client',
      request.request_number,
      request.merchant,
      final_price,
      shipping_cost,
      total_price,
      request.destination_city,
    ).catch(() => {});
  }

  return updated as ShopperRequest;
}

// ─── confirmRequest ──────────────────────────────────────────────────────────

export async function confirmRequest(request_id: string, user_id: string): Promise<ShopperRequest> {
  const supabase = getClient();

  // Mettre à jour
  const { data: updated, error: updateError } = await supabase
    .from('personal_shopper')
    .update({ status: 'confirmed' })
    .eq('id', request_id)
    .eq('client_id', user_id)
    .select()
    .single();

  if (updateError) throw new Error(`Erreur confirmation: ${updateError.message}`);

  // Notifier les admins
  const { data: admins } = await supabase
    .from('users')
    .select('id, expo_push_token')
    .in('role', ['admin', 'super_admin']);

  const { data: client } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', user_id)
    .single();

  // Notification admin in-app
  if (admins && admins.length > 0) {
    await supabase.from('notifications').insert(
      admins.map(admin => ({
        user_id: admin.id,
        type: 'personal_shopper',
        title: 'Commande confirmée ✅',
        message: `${updated.request_number} — ${client?.full_name ?? 'Client'}\nProcéder à l'achat maintenant.`,
        action_url: `/dashboard/shopper?id=${request_id}`,
      }))
    );
  }

  // Push admin
  if (admins && admins.length > 0) {
    for (const admin of admins) {
      await sendPushNotification(
        admin.id,
        'Commande confirmée ✅',
        `${updated.request_number} — ${client?.full_name ?? 'Client'}\nProc à l'achat.`,
        { request_id },
      ).catch(() => {});
    }
  }

  return updated as ShopperRequest;
}

// ─── markAsPurchased ────────────────────────────────────────────────────────

export async function markAsPurchased(request_id: string, admin_id: string): Promise<ShopperRequest> {
  const supabase = getClient();

  // Mettre à jour
  const { data: updated, error: updateError } = await supabase
    .from('personal_shopper')
    .update({ status: 'purchased', handled_by: admin_id })
    .eq('id', request_id)
    .select()
    .single();

  if (updateError) throw new Error(`Erreur achat: ${updateError.message}`);

  // Récupérer infos client
  const { data: client } = await supabase
    .from('users')
    .select('full_name, email, expo_push_token')
    .eq('id', updated.client_id)
    .single();

  // Notification client in-app
  await supabase.from('notifications').insert({
    user_id: updated.client_id,
    type: 'personal_shopper',
    title: 'Commande achetée !',
    message: `${updated.request_number} a été acheté. Expédition en cours.`,
    action_url: `/shopper/${request_id}`,
  });

  // Push client
  await sendPushNotification(
    updated.client_id,
    'Commande achetée 🛍️',
    `${updated.request_number}\nExpédition vers ${updated.destination_city} bientôt.`,
    { request_id },
  ).catch(() => {});

  return updated as ShopperRequest;
}

// ─── markAsShipped ──────────────────────────────────────────────────────────

export async function markAsShipped(
  request_id: string,
  tracking_number: string,
  admin_id: string,
): Promise<ShopperRequest> {
  const supabase = getClient();

  // Récupérer la demande
  const { data: shopper } = await supabase
    .from('personal_shopper')
    .select('*')
    .eq('id', request_id)
    .single();

  if (!shopper) throw new Error('Demande non trouvée');

  // Créer le colis associé
  const { data: pkg } = await supabase
    .from('packages')
    .insert({
      client_id: shopper.client_id,
      destination_city: shopper.destination_city,
      destination_country: shopper.destination_country,
      transport_mode: shopper.transport_mode,
      real_weight_lbs: 1,
      billed_weight_lbs: 1,
      declared_value: shopper.final_price ?? 0,
      shipping_rate: 0,
      total_price: shopper.total_price ?? 0,
      status: 'in_transit',
      notes: `Personal Shopper: ${shopper.request_number}`,
      created_by: admin_id,
    })
    .select()
    .single();

  // Mettre à jour la demande
  const { data: updated, error: updateError } = await supabase
    .from('personal_shopper')
    .update({ status: 'shipped', handled_by: admin_id })
    .eq('id', request_id)
    .select()
    .single();

  if (updateError) throw new Error(`Erreur expédition: ${updateError.message}`);

  // Récupérer infos client
  const { data: client } = await supabase
    .from('users')
    .select('full_name, email, expo_push_token')
    .eq('id', shopper.client_id)
    .single();

  // Notification client in-app
  await supabase.from('notifications').insert({
    user_id: shopper.client_id,
    type: 'personal_shopper',
    title: 'Commande expédiée !',
    message: `${updated.request_number} est en route. Suivi: ${tracking_number}`,
    action_url: `/colis/${pkg?.id}`,
  });

  // Push client
  await sendPushNotification(
    shopper.client_id,
    'Commande expédiée ✈️',
    `${updated.request_number}\nSuivez: ${tracking_number}`,
    { request_id, tracking_number },
  ).catch(() => {});

  // Email expédition
  if (client?.email) {
    await sendShopperShippedEmail(
      client.email,
      client.full_name ?? 'Client',
      updated.request_number,
      tracking_number,
      updated.merchant,
      updated.total_price ?? 0,
      updated.destination_city,
    ).catch(() => {});
  }

  return updated as ShopperRequest;
}

// ─── cancelRequest ──────────────────────────────────────────────────────────

export async function cancelRequest(
  request_id: string,
  reason: string,
  cancelled_by: string,
): Promise<ShopperRequest> {
  const supabase = getClient();

  const { data: updated, error } = await supabase
    .from('personal_shopper')
    .update({ status: 'cancelled', admin_notes: reason, handled_by: cancelled_by })
    .eq('id', request_id)
    .select()
    .single();

  if (error) throw new Error(`Erreur annulation: ${error.message}`);

  // Notifier client si annulé par admin
  if (cancelled_by !== updated.client_id) {
    const { data: client } = await supabase
      .from('users')
      .select('full_name, email, expo_push_token')
      .eq('id', updated.client_id)
      .single();

    if (client?.email) {
      await supabase.from('notifications').insert({
        user_id: updated.client_id,
        type: 'personal_shopper',
        title: 'Demande annulée',
        message: `${updated.request_number}: ${reason}`,
      });
    }
  }

  return updated as ShopperRequest;
}

// ─── subscribeToRequests (Realtime) ────────────────────────────────────────

export function subscribeToRequests(
  callback: (request: ShopperRequest) => void,
  filter?: { client_id?: string; status?: ShopperStatus },
): () => void {
  const supabase = getClient();
  const channel = supabase
    .channel(`personal_shopper_rt_${Date.now()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'personal_shopper' }, (payload) => {
      if (payload.new) callback(payload.new as ShopperRequest);
    })
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}
