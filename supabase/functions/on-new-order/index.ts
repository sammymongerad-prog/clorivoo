// Supabase Edge Function: on-new-order
// Triggered by a Database Webhook on orders INSERT
// Notifies the buyer (confirmation) and seller (new order)
// Deploy: supabase functions deploy on-new-order
// Then in Supabase Dashboard → Database → Webhooks → Create webhook:
//   Table: orders, Event: INSERT, HTTP POST to this function URL

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const NOTIFY_URL = `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-notification`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' } });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { record: order } = await req.json();
  const authHeader = { 'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`, 'Content-Type': 'application/json' };

  // Notify buyer
  await fetch(NOTIFY_URL, {
    method: 'POST', headers: authHeader,
    body: JSON.stringify({
      user_id: order.buyer_id,
      type: 'order',
      title: 'Commande confirmée 🎉',
      body: `Votre commande #${order.id.slice(0, 8).toUpperCase()} de $${Number(order.total_amount).toFixed(2)} a été passée avec succès.`,
      data: { order_id: order.id },
    }),
  });

  // Notify sellers for each order item
  const { data: items } = await supabase
    .from('order_items')
    .select('seller_id, title')
    .eq('order_id', order.id);

  const sellerIds = [...new Set((items ?? []).map((i: any) => i.seller_id).filter(Boolean))];

  for (const seller_id of sellerIds) {
    await fetch(NOTIFY_URL, {
      method: 'POST', headers: authHeader,
      body: JSON.stringify({
        user_id: seller_id,
        type: 'order',
        title: 'Nouvelle commande 📦',
        body: `Vous avez reçu une commande de $${Number(order.total_amount).toFixed(2)}.`,
        data: { order_id: order.id },
      }),
    });
  }

  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
});
