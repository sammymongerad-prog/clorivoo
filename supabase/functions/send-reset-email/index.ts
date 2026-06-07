import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // ── 1. Vérification des variables d'environnement ──────────────
    const SUPABASE_URL          = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const RESEND_API_KEY        = Deno.env.get('RESEND_API_KEY');
    const SITE_URL              = Deno.env.get('SITE_URL') ?? 'https://clorivoo.vercel.app';

    if (!SUPABASE_URL) {
      console.error('[send-reset-email] MANQUANT: SUPABASE_URL');
      return new Response(JSON.stringify({ error: 'Configuration serveur incomplète: SUPABASE_URL manquante' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!SUPABASE_SERVICE_KEY) {
      console.error('[send-reset-email] MANQUANT: SUPABASE_SERVICE_ROLE_KEY');
      return new Response(JSON.stringify({ error: 'Configuration serveur incomplète: SUPABASE_SERVICE_ROLE_KEY manquante' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!RESEND_API_KEY) {
      console.error('[send-reset-email] MANQUANT: RESEND_API_KEY — ajoutez-la dans Supabase Dashboard → Edge Functions → Secrets');
      return new Response(JSON.stringify({ error: 'Configuration serveur incomplète: RESEND_API_KEY manquante' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ── 2. Lecture du body ─────────────────────────────────────────
    const { email, redirectTo } = await req.json();
    if (!email) {
      console.error('[send-reset-email] Paramètre manquant: email');
      return new Response(JSON.stringify({ error: 'Email requis' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ── 3. Génération du lien de reset via Admin API ───────────────
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: redirectTo ?? `${SITE_URL}/reset-password` },
    });

    if (linkError) {
      console.error('[send-reset-email] generateLink error:', linkError.message, '| email:', email);
      // Retour silencieux: ne pas révéler si l'email est enregistré
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!data?.properties?.action_link) {
      console.error('[send-reset-email] generateLink: action_link absent dans la réponse | email:', email);
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const resetLink = data.properties.action_link;

    // ── 4. Envoi via Resend ────────────────────────────────────────
    const testOverride = Deno.env.get('TEST_EMAIL_OVERRIDE');
    const recipient    = testOverride ?? email;
    const subject      = 'Reinitialisation de votre mot de passe - Clorivo';

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Clorivo <onboarding@resend.dev>',
        to: [recipient],
        subject: testOverride ? `[TEST -> ${email}] ${subject}` : subject,
        html: buildEmailHtml(resetLink),
      }),
    });

    if (!res.ok) {
      const resendErr = await res.json().catch(() => ({}));
      console.error('[send-reset-email] Resend API error:', res.status, JSON.stringify(resendErr));
      throw new Error(`Resend ${res.status}: ${resendErr.message ?? 'Erreur inconnue'}`);
    }

    console.log('[send-reset-email] Email envoyé avec succès à:', recipient);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    console.error('[send-reset-email] Exception non gérée:', e.message);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function buildEmailHtml(resetLink: string) {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#F4F2FF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F2FF;padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(108,77,255,0.10);">
        <tr>
          <td style="background:linear-gradient(135deg,#6C4DFF 0%,#8B6EFF 100%);padding:36px 40px;text-align:center;">
            <span style="font-size:32px;font-weight:900;color:#fff;letter-spacing:-1.5px;">clorivo</span>
            <p style="margin:8px 0 0;font-size:12px;color:rgba(255,255,255,0.75);letter-spacing:3px;text-transform:uppercase;">shop · sell · ship</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 40px 0;text-align:center;">
            <div style="display:inline-flex;align-items:center;justify-content:center;width:72px;height:72px;border-radius:50%;background:#F0EDFF;">
              <span style="font-size:36px;">🔑</span>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 40px 32px;">
            <h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#0E0B1F;text-align:center;">Réinitialisation de mot de passe</h1>
            <p style="margin:0 0 24px;font-size:15px;color:#6B7280;line-height:24px;text-align:center;">Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe.</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center" style="padding:8px 0 28px;">
                <a href="${resetLink}" style="display:inline-block;background:linear-gradient(135deg,#6C4DFF 0%,#8B6EFF 100%);color:#fff;font-size:16px;font-weight:700;text-decoration:none;padding:16px 40px;border-radius:14px;">
                  Réinitialiser mon mot de passe
                </a>
              </td></tr>
            </table>
            <div style="background:#FEF9EC;border-radius:10px;padding:14px 16px;margin-bottom:24px;">
              <p style="margin:0;font-size:13px;color:#92400E;text-align:center;">⏱ Ce lien expire dans <strong>1 heure</strong>. Ignorez cet email si vous n'êtes pas à l'origine de cette demande.</p>
            </div>
            <p style="margin:0;font-size:12px;color:#9CA3AF;text-align:center;word-break:break-all;">
              Lien direct : <span style="color:#6C4DFF;">${resetLink}</span>
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#F9F8FF;padding:20px 40px;border-top:1px solid #EDE9FF;">
            <p style="margin:0;font-size:12px;color:#9CA3AF;text-align:center;">© 2025 Clorivo — La marketplace qui vous rapproche des meilleurs vendeurs.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

