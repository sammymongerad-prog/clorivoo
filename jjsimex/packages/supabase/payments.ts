import { getClient } from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PaymentMethod = 'moncash' | 'zelle' | 'wire' | 'cash' | 'visa_mc';
export type PaymentStatus = 'pending' | 'confirmed' | 'failed' | 'refunded';

export interface CreatePaymentData {
  package_id: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
}

export interface Payment {
  id: string;
  transaction_number: string;
  user_id: string;
  package_id: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
  status: PaymentStatus;
  confirmed_by?: string | null;
  confirmed_at?: string | null;
  refused_reason?: string | null;
  refund_reason?: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    full_name?: string;
    email?: string;
    expo_push_token?: string | null;
  };
  package?: {
    tracking_number?: string;
    destination_city?: string;
    total_price?: number;
  };
}

export interface GetAllPaymentsFilters {
  status?: PaymentStatus;
  method?: PaymentMethod;
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaymentStats {
  total_revenue: number;
  pending_amount: number;
  confirmed_amount: number;
  failed_amount: number;
  by_method: Record<PaymentMethod, { count: number; amount: number }>;
  period_comparison: {
    current: number;
    previous: number;
    percentage_change: number;
  };
}

// ─── Générer numéro transaction ───────────────────────────────────────────────

async function generateTransactionNumber(): Promise<string> {
  const supabase = getClient();
  const year = new Date().getFullYear();

  const { count } = await supabase
    .from('payments')
    .select('transaction_number', { count: 'exact' })
    .like('transaction_number', `TXN-${year}-%`)
    .order('created_at', { ascending: false })
    .limit(1);

  const nextNum = (count ?? 0) + 1;
  return `TXN-${year}-${String(nextNum).padStart(5, '0')}`;
}

// ─── createPayment ────────────────────────────────────────────────────────────

export async function createPayment(
  data: CreatePaymentData,
  user_id: string,
): Promise<Payment> {
  const supabase = getClient();

  // Générer numéro transaction
  const transaction_number = await generateTransactionNumber();

  // Créer le paiement
  const { data: payment, error } = await supabase
    .from('payments')
    .insert({
      transaction_number,
      user_id,
      package_id: data.package_id,
      amount: data.amount,
      method: data.method,
      reference: data.reference,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw new Error(`Erreur création paiement: ${error.message}`);

  // Récupérer infos client
  const { data: client } = await supabase
    .from('users')
    .select('full_name, email, expo_push_token')
    .eq('id', user_id)
    .single();

  const methodLabel: Record<PaymentMethod, string> = {
    moncash: 'MonCash',
    zelle: 'Zelle',
    wire: 'Virement',
    cash: 'Espèces',
    visa_mc: 'Carte bancaire',
  };

  // 1. Notification in-app admin
  const { data: admins } = await supabase
    .from('users')
    .select('id')
    .in('role', ['admin', 'super_admin']);

  if (admins && admins.length > 0) {
    await supabase.from('notifications').insert(
      admins.map(admin => ({
        user_id: admin.id,
        type: 'payment',
        title: 'Nouveau paiement en attente 💳',
        message: `${client?.full_name ?? 'Client'} — $${data.amount.toFixed(2)} via ${methodLabel[data.method]}`,
        action_url: `/dashboard/paiements?id=${payment.id}`,
      }))
    );
  }

  return payment as Payment;
}

// ─── getMyPayments ────────────────────────────────────────────────────────────

export async function getMyPayments(user_id: string): Promise<Payment[]> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('payments')
    .select('*, package:package_id(tracking_number, destination_city, total_price)')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Erreur récupération paiements: ${error.message}`);
  return (data ?? []) as Payment[];
}

// ─── getAllPayments ───────────────────────────────────────────────────────────

export async function getAllPayments(filters?: GetAllPaymentsFilters): Promise<Payment[]> {
  const supabase = getClient();

  let query = supabase
    .from('payments')
    .select('*, user:user_id(full_name, email), package:package_id(tracking_number, destination_city, total_price)');

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.method) {
    query = query.eq('method', filters.method);
  }

  if (filters?.date_from) {
    query = query.gte('created_at', filters.date_from);
  }

  if (filters?.date_to) {
    query = query.lte('created_at', filters.date_to);
  }

  if (filters?.search) {
    query = query.or(`user.full_name.ilike.%${filters.search}%,transaction_number.ilike.%${filters.search}%,reference.ilike.%${filters.search}%`);
  }

  query = query.order('status', { ascending: false })
    .order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) throw new Error(`Erreur récupération paiements admin: ${error.message}`);
  return (data ?? []) as Payment[];
}

// ─── confirmPayment ───────────────────────────────────────────────────────────

export async function confirmPayment(
  payment_id: string,
  admin_id: string,
): Promise<Payment> {
  const supabase = getClient();

  // Récupérer le paiement
  const { data: payment, error: fetchError } = await supabase
    .from('payments')
    .select('*')
    .eq('id', payment_id)
    .single();

  if (fetchError) throw new Error(`Erreur récupération paiement: ${fetchError.message}`);

  // Mettre à jour le paiement
  const { data: updated, error: updateError } = await supabase
    .from('payments')
    .update({
      status: 'confirmed',
      confirmed_by: admin_id,
      confirmed_at: new Date().toISOString(),
    })
    .eq('id', payment_id)
    .select()
    .single();

  if (updateError) throw new Error(`Erreur confirmation paiement: ${updateError.message}`);

  // Mettre à jour total_spent du client
  const { data: currentUser } = await supabase
    .from('users')
    .select('total_spent')
    .eq('id', payment.user_id)
    .single();

  const newTotal = (currentUser?.total_spent ?? 0) + payment.amount;
  await supabase
    .from('users')
    .update({ total_spent: newTotal })
    .eq('id', payment.user_id);

  // Récupérer infos client et colis
  const { data: client } = await supabase
    .from('users')
    .select('full_name, email, expo_push_token')
    .eq('id', payment.user_id)
    .single();

  const { data: pkg } = await supabase
    .from('packages')
    .select('tracking_number')
    .eq('id', payment.package_id)
    .single();

  // 1. Notification in-app client
  await supabase.from('notifications').insert({
    user_id: payment.user_id,
    type: 'payment',
    title: 'Paiement confirmé ✅',
    message: `Votre paiement de $${payment.amount.toFixed(2)} a été confirmé.`,
    action_url: `/colis/${payment.package_id}`,
  });

  return updated as Payment;
}

// ─── refusePayment ────────────────────────────────────────────────────────────

export async function refusePayment(
  payment_id: string,
  reason: string,
  admin_id: string,
): Promise<Payment> {
  const supabase = getClient();

  const { data: payment, error: fetchError } = await supabase
    .from('payments')
    .select('*')
    .eq('id', payment_id)
    .single();

  if (fetchError) throw new Error(`Erreur récupération paiement: ${fetchError.message}`);

  const { data: updated, error: updateError } = await supabase
    .from('payments')
    .update({
      status: 'failed',
      refused_reason: reason,
    })
    .eq('id', payment_id)
    .select()
    .single();

  if (updateError) throw new Error(`Erreur refus paiement: ${updateError.message}`);

  // Récupérer infos client
  const { data: client } = await supabase
    .from('users')
    .select('full_name, email, expo_push_token')
    .eq('id', payment.user_id)
    .single();

  // 1. Notification in-app client
  await supabase.from('notifications').insert({
    user_id: payment.user_id,
    type: 'payment',
    title: 'Paiement non confirmé ❌',
    message: `Votre paiement n'a pas pu être confirmé. Contactez-nous.`,
    action_url: '/colis',
  });

  return updated as Payment;
}

// ─── refundPayment ────────────────────────────────────────────────────────────

export async function refundPayment(
  payment_id: string,
  reason: string,
  admin_id: string,
): Promise<Payment> {
  const supabase = getClient();

  const { data: payment, error: fetchError } = await supabase
    .from('payments')
    .select('*')
    .eq('id', payment_id)
    .single();

  if (fetchError) throw new Error(`Erreur récupération paiement: ${fetchError.message}`);

  // Mettre à jour total_spent du client
  const { data: currentUser } = await supabase
    .from('users')
    .select('total_spent')
    .eq('id', payment.user_id)
    .single();

  const newTotal = Math.max(0, (currentUser?.total_spent ?? 0) - payment.amount);
  await supabase
    .from('users')
    .update({ total_spent: newTotal })
    .eq('id', payment.user_id);

  const { data: updated, error: updateError } = await supabase
    .from('payments')
    .update({
      status: 'refunded',
      refund_reason: reason,
    })
    .eq('id', payment_id)
    .select()
    .single();

  if (updateError) throw new Error(`Erreur remboursement: ${updateError.message}`);

  // Récupérer infos client
  const { data: client } = await supabase
    .from('users')
    .select('full_name, email, expo_push_token')
    .eq('id', payment.user_id)
    .single();

  // 1. Notification in-app client
  await supabase.from('notifications').insert({
    user_id: payment.user_id,
    type: 'payment',
    title: 'Remboursement effectué 💰',
    message: `Un remboursement de $${payment.amount.toFixed(2)} a été effectué.`,
    action_url: '/paiements',
  });

  return updated as Payment;
}

// ─── getPaymentStats ──────────────────────────────────────────────────────────

export async function getPaymentStats(period: 'day' | 'week' | 'month' | 'year'): Promise<PaymentStats> {
  const supabase = getClient();

  const now = new Date();
  let dateFrom = new Date();
  let previousFrom = new Date();
  let previousTo = new Date();

  if (period === 'day') {
    dateFrom.setDate(now.getDate() - 1);
    previousFrom.setDate(now.getDate() - 2);
    previousTo.setDate(now.getDate() - 1);
  } else if (period === 'week') {
    dateFrom.setDate(now.getDate() - 7);
    previousFrom.setDate(now.getDate() - 14);
    previousTo.setDate(now.getDate() - 7);
  } else if (period === 'month') {
    dateFrom.setMonth(now.getMonth() - 1);
    previousFrom.setMonth(now.getMonth() - 2);
    previousTo.setMonth(now.getMonth() - 1);
  } else {
    dateFrom.setFullYear(now.getFullYear() - 1);
    previousFrom.setFullYear(now.getFullYear() - 2);
    previousTo.setFullYear(now.getFullYear() - 1);
  }

  // Paiements confirmés de la période actuelle
  const { data: confirmedPayments } = await supabase
    .from('payments')
    .select('amount, method')
    .eq('status', 'confirmed')
    .gte('created_at', dateFrom.toISOString())
    .lte('created_at', now.toISOString());

  // Paiements confirmés de la période précédente
  const { data: previousPayments } = await supabase
    .from('payments')
    .select('amount')
    .eq('status', 'confirmed')
    .gte('created_at', previousFrom.toISOString())
    .lte('created_at', previousTo.toISOString());

  // Paiements en attente
  const { data: pendingPayments } = await supabase
    .from('payments')
    .select('amount')
    .eq('status', 'pending')
    .gte('created_at', dateFrom.toISOString());

  // Paiements échoués
  const { data: failedPayments } = await supabase
    .from('payments')
    .select('amount')
    .eq('status', 'failed')
    .gte('created_at', dateFrom.toISOString());

  const currentTotal = (confirmedPayments ?? []).reduce((sum, p) => sum + (p.amount || 0), 0);
  const previousTotal = (previousPayments ?? []).reduce((sum, p) => sum + (p.amount || 0), 0);

  const byMethod: Record<PaymentMethod, { count: number; amount: number }> = {
    moncash: { count: 0, amount: 0 },
    zelle: { count: 0, amount: 0 },
    wire: { count: 0, amount: 0 },
    cash: { count: 0, amount: 0 },
    visa_mc: { count: 0, amount: 0 },
  };

  for (const payment of confirmedPayments ?? []) {
    byMethod[payment.method as PaymentMethod].count += 1;
    byMethod[payment.method as PaymentMethod].amount += payment.amount || 0;
  }

  return {
    total_revenue: currentTotal,
    pending_amount: (pendingPayments ?? []).reduce((sum, p) => sum + (p.amount || 0), 0),
    confirmed_amount: currentTotal,
    failed_amount: (failedPayments ?? []).reduce((sum, p) => sum + (p.amount || 0), 0),
    by_method: byMethod,
    period_comparison: {
      current: currentTotal,
      previous: previousTotal,
      percentage_change: previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0,
    },
  };
}

// ─── subscribeToPayments (Realtime) ─────────────────────────────────────────

export function subscribeToPayments(
  callback: (payment: Payment) => void,
  filter?: { status?: PaymentStatus; user_id?: string },
): () => void {
  const supabase = getClient();
  const channel = supabase
    .channel(`payments_rt_${Date.now()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, (payload) => {
      if (payload.new) callback(payload.new as Payment);
    })
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}
