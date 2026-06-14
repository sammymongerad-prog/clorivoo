import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { user_id, user_ids, title, body, data } = await req.json();

    // Get push tokens
    const targetIds = user_ids ?? (user_id ? [user_id] : []);
    const { data: tokens } = await supabase
      .from('push_tokens')
      .select('token')
      .in('user_id', targetIds);

    if (!tokens?.length) {
      return new Response(JSON.stringify({ sent: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const messages = tokens.map(({ token }) => ({
      to: token,
      title,
      body,
      data: data ?? {},
      sound: 'default',
      badge: 1,
    }));

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(messages),
    });

    const result = await response.json();

    // Save notification to DB
    if (user_id || user_ids) {
      const notifInserts = targetIds.map((uid: string) => ({
        user_id: uid,
        title,
        body,
        type: data?.type ?? 'systeme',
        action_url: data?.screen ? `/${data.screen}` : null,
      }));
      await supabase.from('notifications').insert(notifInserts);
    }

    return new Response(JSON.stringify({ sent: messages.length, result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
