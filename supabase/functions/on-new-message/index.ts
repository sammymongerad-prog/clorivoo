// Supabase Edge Function: on-new-message
// Triggered by Database Webhook on messages INSERT
// Notifies the other participant of the conversation
// Deploy: supabase functions deploy on-new-message

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

  const { record: message } = await req.json();
  const authHeader = { 'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`, 'Content-Type': 'application/json' };

  // Get conversation participants
  const { data: conv } = await supabase
    .from('conversations')
    .select('buyer_id, seller_id, products(title)')
    .eq('id', message.conversation_id)
    .single();

  if (!conv) return new Response('ok');

  // Get sender name
  const { data: sender } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', message.sender_id)
    .single();

  const senderName = sender?.full_name ?? 'Quelqu\'un';
  const recipient  = message.sender_id === conv.buyer_id ? conv.seller_id : conv.buyer_id;
  const productTitle = (conv.products as any)?.title;

  await fetch(NOTIFY_URL, {
    method: 'POST', headers: authHeader,
    body: JSON.stringify({
      user_id: recipient,
      type: 'message',
      title: `💬 ${senderName}`,
      body: productTitle
        ? `À propos de "${productTitle}" : ${message.content.slice(0, 80)}`
        : message.content.slice(0, 100),
      data: { conversation_id: message.conversation_id },
    }),
  });

  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
});
