import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifyAuth(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser(token);
  return user;
}

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  const user = await verifyAuth(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const { quote_amount, quote_currency = 'USD', notes } = body;

  if (quote_amount === undefined || quote_amount === null) {
    return NextResponse.json({ error: 'quote_amount is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('personal_shopper')
    .update({
      status: 'quoted',
      quote_amount,
      quote_currency,
      quote_notes: notes ?? null,
      quoted_by: user.id,
      quoted_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*, users(id, first_name, last_name, email)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Insert in-app notification for the requester
  const recipientId = data.user_id ?? data.users?.id;
  if (recipientId) {
    await supabase.from('notifications').insert({
      user_id: recipientId,
      type: 'shopper_quote',
      title: 'Devis reçu',
      body: `Votre demande Personal Shopper a reçu un devis de ${quote_amount} ${quote_currency}.`,
      data: { shopper_request_id: id },
      read: false,
    });
  }

  return NextResponse.json({ data });
}
