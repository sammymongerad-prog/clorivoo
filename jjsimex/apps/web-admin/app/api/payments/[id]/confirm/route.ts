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

  // Update payment status to confirmed
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .update({
      status: 'confirmed',
      confirmed_by: user.id,
      confirmed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*, users(id, first_name, last_name, email)')
    .single();

  if (paymentError) {
    return NextResponse.json({ error: paymentError.message }, { status: 500 });
  }

  // Trigger notification: insert into notifications table so mobile app can pick it up
  const recipientId = payment.user_id ?? payment.users?.id;
  if (recipientId) {
    await supabase.from('notifications').insert({
      user_id: recipientId,
      type: 'payment_confirmed',
      title: 'Paiement confirmé',
      body: `Votre paiement de ${payment.amount} ${payment.currency ?? 'USD'} a été confirmé.`,
      data: { payment_id: id },
      read: false,
    });
  }

  return NextResponse.json({ data: payment });
}
