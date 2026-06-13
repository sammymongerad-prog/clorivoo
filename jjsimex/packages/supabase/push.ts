import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface PushPayload {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound: 'default';
  badge: number;
}

export async function sendPushNotification(
  userId: string,
  title: string,
  message: string,
  data?: Record<string, unknown>,
): Promise<void> {
  const { data: tokens } = await supabaseAdmin
    .from('push_tokens')
    .select('id, token')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (!tokens || tokens.length === 0) return;

  const payloads: PushPayload[] = tokens.map((t) => ({
    to: t.token,
    title,
    body: message,
    data,
    sound: 'default',
    badge: 1,
  }));

  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payloads),
    });

    const result = await res.json();

    // Désactiver les tokens expirés
    if (result.data) {
      const expired: string[] = [];
      result.data.forEach((item: { status: string; message?: string }, idx: number) => {
        if (item.status === 'error' && item.message?.includes('DeviceNotRegistered')) {
          expired.push(tokens[idx].token);
        }
      });
      if (expired.length > 0) {
        await supabaseAdmin
          .from('push_tokens')
          .update({ is_active: false })
          .in('token', expired);
      }
    }
  } catch {
    // Push non critique — ne pas bloquer le flux principal
  }
}

export async function sendPushToAll(
  title: string,
  message: string,
  target?: 'haiti' | 'dominican_republic' | 'all',
  data?: Record<string, unknown>,
): Promise<void> {
  let query = supabaseAdmin
    .from('push_tokens')
    .select('token, user_id')
    .eq('is_active', true);

  if (target && target !== 'all') {
    // Joindre avec users pour filtrer par pays
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('destination_country', target);

    if (!users || users.length === 0) return;
    const ids = users.map((u) => u.id);
    query = query.in('user_id', ids) as typeof query;
  }

  const { data: tokens } = await query;
  if (!tokens || tokens.length === 0) return;

  // Envoyer par batch de 100 (limite Expo Push API)
  const batches: string[][] = [];
  for (let i = 0; i < tokens.length; i += 100) {
    batches.push(tokens.slice(i, i + 100).map((t) => t.token));
  }

  for (const batch of batches) {
    const payloads: PushPayload[] = batch.map((token) => ({
      to: token,
      title,
      body: message,
      data,
      sound: 'default',
      badge: 1,
    }));

    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payloads),
      });

      const result = await res.json();

      // Désactiver les tokens expirés
      if (result.data) {
        const expired: string[] = [];
        result.data.forEach((item: { status: string; message?: string }, idx: number) => {
          if (item.status === 'error' && item.message?.includes('DeviceNotRegistered')) {
            expired.push(batch[idx]);
          }
        });
        if (expired.length > 0) {
          await supabaseAdmin
            .from('push_tokens')
            .update({ is_active: false })
            .in('token', expired);
        }
      }
    } catch {
      // Non critique
    }
  }
}

// ─── sendBulkNotification (pour campagnes marketing) ────────────────────

export async function sendBulkNotification(
  title: string,
  message: string,
  target?: 'haiti' | 'dr' | 'all',
  data?: Record<string, unknown>,
): Promise<{ sent: number; failed: number }> {
  let query = supabaseAdmin
    .from('push_tokens')
    .select('token')
    .eq('is_active', true);

  if (target && target !== 'all') {
    // Mapper les codes pays
    const countryMap: Record<string, string> = { haiti: 'haiti', dr: 'dr' };
    const country = countryMap[target];

    if (country) {
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('destination_country', country);

      if (!users || users.length === 0) return { sent: 0, failed: 0 };
      const ids = users.map((u) => u.id);
      query = query.in('user_id', ids) as typeof query;
    }
  }

  const { data: tokens } = await query;
  if (!tokens || tokens.length === 0) return { sent: 0, failed: 0 };

  let sentCount = 0;
  let failedCount = 0;

  // Envoyer par batch de 100
  const batches: string[][] = [];
  for (let i = 0; i < tokens.length; i += 100) {
    batches.push(tokens.slice(i, i + 100).map((t) => t.token));
  }

  for (const batch of batches) {
    const payloads: PushPayload[] = batch.map((token) => ({
      to: token,
      title,
      body: message,
      data,
      sound: 'default',
      badge: 1,
      channelId: 'jjsimex',
    }));

    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payloads),
      });

      const result = await res.json();

      if (result.data) {
        const expired: string[] = [];
        result.data.forEach((item: { status: string; message?: string }, idx: number) => {
          if (item.status === 'ok') {
            sentCount++;
          } else {
            failedCount++;
            if (item.message?.includes('DeviceNotRegistered')) {
              expired.push(batch[idx]);
            }
          }
        });
        if (expired.length > 0) {
          await supabaseAdmin
            .from('push_tokens')
            .update({ is_active: false })
            .in('token', expired);
        }
      }
    } catch (error) {
      failedCount += batch.length;
      console.error('Erreur envoi batch notifications:', error);
    }
  }

  return { sent: sentCount, failed: failedCount };
}
