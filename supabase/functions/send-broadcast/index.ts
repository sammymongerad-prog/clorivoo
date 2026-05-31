// Supabase Edge Function: send-broadcast
// Sends a push notification to a segment of users (all, buyers, sellers)
// Deploy: supabase functions deploy send-broadcast

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const BATCH_SIZE    = 100;

interface BroadcastPayload {
  segment?: 'all' | 'buyers' | 'sellers';
  type?:    'promo' | 'marketing' | 'system';
  title:    string;
  body:     string;
  data?:    Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { segment = 'all', type = 'promo', title, body, data = {} }: BroadcastPayload = await req.json();

  // 1. Fetch target users with push tokens
  let query = supabase.from('profiles').select('id, push_token').not('push_token', 'is', null);
  if (segment === 'buyers')  query = query.eq('role', 'buyer');
  if (segment === 'sellers') query = query.eq('role', 'seller');

  const { data: profiles, error } = await query;
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  const validProfiles = (profiles ?? []).filter(p => p.push_token?.startsWith('ExponentPushToken['));

  // 2. Insert notifications in bulk
  if (validProfiles.length > 0) {
    const notifs = validProfiles.map(p => ({ user_id: p.id, type, title, body, data }));
    await supabase.from('notifications').insert(notifs);
  }

  // 3. Send push in batches of 100
  const tokens = validProfiles.map(p => p.push_token);
  let sent = 0;
  for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
    const batch = tokens.slice(i, i + BATCH_SIZE).map(to => ({ to, title, body, data, sound: 'default' }));
    await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(batch),
    });
    sent += batch.length;
  }

  return new Response(JSON.stringify({ success: true, recipients: sent }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
});
