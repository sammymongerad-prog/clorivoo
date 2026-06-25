import { getClient } from './client';
import { sendPushNotification } from './push';
import { calculateShipping } from './shipping';
import type { TransportMode, DestinationCountry } from './shipping';

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
  shipping_rate: number | null;
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

  // Confirmation client
  const clientConfTitle = 'Demande Personal Shopper reçue';
  const clientConfMsg = `Votre demande ${request_number} (${data.merchant}) a été enregistrée. Nous vous enverrons un devis sous 24h.`;
  await supabase.from('notifications').insert({
    user_id: user_id,
    type: 'personal_shopper',
    title: clientConfTitle,
    message: clientConfMsg,
    action_url: `/shopper/${request.id}`,
  });
  sendPushNotification(user_id, clientConfTitle, clientConfMsg).catch(e => console.error('Push error:', e));

  // Notification admins
  const shopTitle = 'Nouvelle demande Personal Shopper';
  const shopMsg = `${client?.full_name ?? 'Client'} — ${data.merchant} — ${request_number}`;
  if (admins && admins.length > 0) {
    await supabase.from('notifications').insert(
      admins.map(admin => ({
        user_id: admin.id,
        type: 'personal_shopper',
        title: shopTitle,
        message: shopMsg,
        action_url: `/dashboard/shopper?id=${request.id}`,
      }))
    );
    for (const admin of admins) {
      sendPushNotification(admin.id, shopTitle, shopMsg).catch(e => console.error('Push error:', e));
    }
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

  const shipping_rate = shipping.final_price;
  const total_price = final_price + shipping_rate;

  // Mettre à jour
  const { data: updated, error: updateError } = await supabase
    .from('personal_shopper')
    .update({
      final_price,
      shipping_rate,
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

  const quoteTitle = 'Votre devis est prêt !';
  const quoteMsg = `PS-${request.request_number}: $${total_price.toFixed(2)}`;
  await supabase.from('notifications').insert({
    user_id: request.client_id,
    type: 'personal_shopper',
    title: quoteTitle,
    message: quoteMsg,
    action_url: `/shopper/${request_id}`,
  });
  sendPushNotification(request.client_id, quoteTitle, quoteMsg).catch(e => console.error('Push error:', e));

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

  const confShopTitle = 'Commande confirmée ✅';
  const confShopMsg = `${updated.request_number} — ${client?.full_name ?? 'Client'}\nProcéder à l'achat maintenant.`;
  if (admins && admins.length > 0) {
    await supabase.from('notifications').insert(
      admins.map(admin => ({
        user_id: admin.id,
        type: 'personal_shopper',
        title: confShopTitle,
        message: confShopMsg,
        action_url: `/dashboard/shopper?id=${request_id}`,
      }))
    );
    for (const admin of admins) {
      sendPushNotification(admin.id, confShopTitle, confShopMsg).catch(e => console.error('Push error:', e));
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

  const purchTitle = 'Commande achetée !';
  const purchMsg = `${updated.request_number} a été acheté. Expédition en cours.`;
  await supabase.from('notifications').insert({
    user_id: updated.client_id,
    type: 'personal_shopper',
    title: purchTitle,
    message: purchMsg,
    action_url: `/shopper/${request_id}`,
  });
  sendPushNotification(updated.client_id, purchTitle, purchMsg).catch(e => console.error('Push error:', e));

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

  const shipShopTitle = 'Commande expédiée !';
  const shipShopMsg = `${updated.request_number} est en route. Suivi: ${tracking_number}`;
  await supabase.from('notifications').insert({
    user_id: shopper.client_id,
    type: 'personal_shopper',
    title: shipShopTitle,
    message: shipShopMsg,
    action_url: `/colis/${pkg?.id}`,
  });
  sendPushNotification(shopper.client_id, shipShopTitle, shipShopMsg).catch(e => console.error('Push error:', e));

  return updated as ShopperRequest;
}

// ─── cancelRequest ──────────────────────────────────────────────────────────

export async function cancelRequest(
  request_id: string,
  reason: string,
  cancelled_by: string,
): Promise<ShopperRequest> {
  const supabase = getClient();

  const { data: me } = await supabase.from('users').select('role').eq('id', cancelled_by).single();
  const isStaff = me?.role === 'admin' || me?.role === 'super_admin' || me?.role === 'employee';

  let query = supabase
    .from('personal_shopper')
    .update({ status: 'cancelled', admin_notes: reason, handled_by: cancelled_by })
    .eq('id', request_id);

  if (!isStaff) query = query.eq('client_id', cancelled_by);

  const { data: updated, error } = await query.select().single();

  if (error) throw new Error(`Erreur annulation: ${error.message}`);

  // Notifier client si annulé par admin
  if (cancelled_by !== updated.client_id) {
    const { data: client } = await supabase
      .from('users')
      .select('full_name, email, expo_push_token')
      .eq('id', updated.client_id)
      .single();

    const cancelTitle = 'Demande annulée';
    const cancelMsg = `${updated.request_number}: ${reason}`;
    await supabase.from('notifications').insert({
      user_id: updated.client_id,
      type: 'personal_shopper',
      title: cancelTitle,
      message: cancelMsg,
    });
    sendPushNotification(updated.client_id, cancelTitle, cancelMsg).catch(e => console.error('Push error:', e));
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
