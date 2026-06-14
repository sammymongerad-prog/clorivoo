import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { to, subject, html, template, templateData } = await req.json();

    let emailHtml = html;
    if (!emailHtml && template) {
      // Basic template rendering
      emailHtml = renderTemplate(template, templateData);
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: "JJ's IMEX <noreply@jjsimex.com>",
        to: Array.isArray(to) ? to : [to],
        subject,
        html: emailHtml,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message ?? 'Resend error');
    }

    return new Response(JSON.stringify({ id: result.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function renderTemplate(template: string, data: Record<string, string> = {}): string {
  const templates: Record<string, string> = {
    package_received: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0D0D0D;color:#fff;padding:32px;border-radius:12px">
        <div style="text-align:center;margin-bottom:24px">
          <span style="font-size:32px">📦</span>
          <h1 style="color:#F97316;margin:8px 0">Colis reçu !</h1>
        </div>
        <p>Bonjour <strong>${data.name ?? ''}</strong>,</p>
        <p>Votre colis <strong style="color:#F97316">${data.tracking ?? ''}</strong> est arrivé à notre entrepôt de Miami.</p>
        <div style="background:#1A1A1A;border-radius:8px;padding:16px;margin:16px 0">
          <p style="margin:0;color:#9CA3AF">Poids: <strong style="color:#fff">${data.weight ?? ''}</strong></p>
          <p style="margin:8px 0 0;color:#9CA3AF">Transport: <strong style="color:#fff">${data.transport ?? ''}</strong></p>
        </div>
        <p style="color:#9CA3AF;font-size:13px">L'équipe JJ's IMEX</p>
      </div>`,
    payment_confirmed: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0D0D0D;color:#fff;padding:32px;border-radius:12px">
        <h1 style="color:#22C55E">✓ Paiement confirmé</h1>
        <p>Bonjour <strong>${data.name ?? ''}</strong>,</p>
        <p>Votre paiement de <strong style="color:#F97316">${data.amount ?? ''}</strong> a été confirmé.</p>
        <p style="color:#9CA3AF;font-size:13px">L'équipe JJ's IMEX</p>
      </div>`,
  };
  return templates[template] ?? `<p>${JSON.stringify(data)}</p>`;
}
