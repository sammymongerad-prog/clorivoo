import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

async function verifyAuth(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser(token);
  return user;
}

async function getTokensForUsers(userIds: string[]): Promise<string[]> {
  const { data, error } = await supabase
    .from('push_tokens')
    .select('token')
    .in('user_id', userIds)
    .eq('active', true);

  if (error || !data) return [];
  return data.map((row: { token: string }) => row.token).filter(Boolean);
}

export async function POST(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { title, body: messageBody, data: pushData, bulk, user_ids, user_id } = body;

  if (!title || !messageBody) {
    return NextResponse.json({ error: 'title and body are required' }, { status: 400 });
  }

  let tokens: string[] = [];

  if (bulk && Array.isArray(user_ids) && user_ids.length > 0) {
    // Bulk send to multiple users
    tokens = await getTokensForUsers(user_ids);
  } else if (user_id) {
    // Single user
    tokens = await getTokensForUsers([user_id]);
  } else {
    return NextResponse.json(
      { error: 'Provide user_id for single send or user_ids with bulk: true for bulk send' },
      { status: 400 }
    );
  }

  if (tokens.length === 0) {
    return NextResponse.json({ message: 'No push tokens found for the specified user(s)', sent: 0 });
  }

  const messages = tokens.map((token) => ({
    to: token,
    title,
    body: messageBody,
    data: pushData ?? {},
    sound: 'default',
  }));

  const response = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(messages),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return NextResponse.json(
      { error: 'Expo Push API error', details: errorText },
      { status: 502 }
    );
  }

  const result = await response.json();
  return NextResponse.json({ sent: tokens.length, result });
}
