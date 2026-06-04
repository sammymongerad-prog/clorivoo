// Supabase Edge Function: send-email
// Generic transactional email sender via Resend
// Called internally by other edge functions — never exposed directly
// Deploy: supabase functions deploy send-email

const RESEND_URL = 'https://api.resend.com/emails';
const FROM       = 'Clorivo <onboarding@resend.dev>'; // TODO: remplacer par noreply@clorivo.com après vérification domaine

interface EmailPayload {
  to:      string;
  subject: string;
  html:    string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' } });
  }

  const payload: EmailPayload = await req.json();
  const { to, subject, html } = payload;

  if (!to || !subject || !html) {
    return new Response(JSON.stringify({ error: 'to, subject and html are required' }), { status: 400 });
  }

  // En mode test (sans domaine verifie), rediriger tous les emails vers TEST_EMAIL_OVERRIDE
  const testOverride = Deno.env.get('TEST_EMAIL_OVERRIDE');
  const recipient = testOverride ?? to;

  const res = await fetch(RESEND_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM, to: [recipient], subject: testOverride ? `[TEST -> ${to}] ${subject}` : subject, html }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error('Resend error:', err);
    return new Response(JSON.stringify({ error: err.message ?? 'Resend error' }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
});
