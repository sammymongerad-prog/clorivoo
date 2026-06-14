import { NextRequest, NextResponse } from 'next/server';

/**
 * Email sending via Resend.
 * Caller must provide the service role key as the Authorization Bearer token
 * to prevent arbitrary email sending from the client.
 */
function verifyServiceRole(request: NextRequest): boolean {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  return !!token && token === process.env.SUPABASE_SERVICE_ROLE_KEY;
}

export async function POST(request: NextRequest) {
  if (!verifyServiceRole(request)) {
    return NextResponse.json({ error: 'Unauthorized: service role key required' }, { status: 401 });
  }

  const body = await request.json();
  const { to, subject, html, replyTo } = body;

  if (!to || !subject || !html) {
    return NextResponse.json(
      { error: 'to, subject, and html are required' },
      { status: 400 }
    );
  }

  const payload: Record<string, unknown> = {
    from: "JJ's IMEX <noreply@jjsimex.com>",
    to: [to],
    subject,
    html,
  };

  if (replyTo) {
    payload.reply_to = replyTo;
  }

  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!resendResponse.ok) {
    const errorData = await resendResponse.json().catch(() => ({ message: 'Unknown error' }));
    return NextResponse.json(
      { error: 'Resend API error', details: errorData },
      { status: resendResponse.status }
    );
  }

  const result = await resendResponse.json();
  return NextResponse.json({ success: true, id: result.id });
}
