// Supabase Edge Function: send-notification
// Sends an Expo push notification + saves it to the notifications table
// Deploy: supabase functions deploy send-notification

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface NotificationPayload {
  user_id: string;
  type: 'order' | 'message' | 'promo' | 'system';
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const payload: NotificationPayload = await req.json();
  const { user_id, type, title, body, data = {} } = payload;

  // 1. Save to notifications table
  await supabase.from('notifications').insert({ user_id, type, title, body, data });

  // 2. Get push token
  const { data: profile } = await supabase
    .from('profiles')
    .select('push_token')
    .eq('id', user_id)
    .single();

  if (profile?.push_token?.startsWith('ExponentPushToken[')) {
    await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Accept-Encoding': 'gzip, deflate' },
      body: JSON.stringify({
        to: profile.push_token,
        title,
        body,
        data,
        sound: 'default',
        badge: 1,
        channelId: type === 'message' ? 'messages' : 'default',
      }),
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
});
