// Supabase Edge Function: on-kyc-update
// Triggered by Database Webhook on kyc_requests UPDATE
// Sends email to seller when KYC is approved or rejected
//
// Deploy: supabase functions deploy on-kyc-update
// Webhook: Dashboard → Database → Webhooks → kyc_requests UPDATE → POST this function URL

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const EMAIL_URL    = `${SUPABASE_URL}/functions/v1/send-email`;

const authHeader = () => ({
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
});

function emailKycApproved(sellerName: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#F4F2FF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F2FF;padding:40px 0;">
<tr><td align="center">
<table width="540" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(108,77,255,0.10);">
  <tr><td style="background:linear-gradient(135deg,#6C4DFF 0%,#8B6EFF 100%);padding:32px 40px;text-align:center;">
    <span style="font-size:30px;font-weight:900;color:#fff;letter-spacing:-1.5px;">clorivo</span>
    <p style="margin:6px 0 0;font-size:11px;color:rgba(255,255,255,0.75);letter-spacing:3px;text-transform:uppercase;">shop · sell · ship</p>
  </td></tr>
  <tr><td style="padding:36px 40px 0;text-align:center;">
    <div style="width:64px;height:64px;border-radius:50%;background:#ECFDF5;margin:0 auto 16px;text-align:center;line-height:64px;font-size:32px;">🎉</div>
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#0E0B1F;">Compte vendeur activé !</h1>
    <p style="margin:0;font-size:15px;color:#6B7280;">Bonjour <strong>${sellerName}</strong>, félicitations !</p>
  </td></tr>
  <tr><td style="padding:24px 40px;">
    <div style="background:#ECFDF5;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;">
      <p style="margin:0 0 6px;font-size:15px;color:#059669;font-weight:700;">✅ Vérification KYC approuvée</p>
      <p style="margin:0;font-size:14px;color:#6B7280;">Votre identité a été vérifiée avec succès. Vous pouvez maintenant vendre sur Clorivo.</p>
    </div>
    <h2 style="margin:0 0 12px;font-size:16px;font-weight:700;color:#0E0B1F;">Prochaines étapes</h2>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${[
        ['🏪', 'Configurez votre boutique', 'Ajoutez votre logo, description et couleurs de marque.'],
        ['📦', 'Ajoutez vos produits', 'Importez depuis CJ Dropshipping ou créez manuellement.'],
        ['💰', 'Commencez à vendre', 'Vos produits seront visibles par tous les acheteurs Clorivo.'],
      ].map(([icon, title, desc]) => `
      <tr><td style="padding:10px 0;border-bottom:1px solid #F3F4F6;">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="width:40px;font-size:22px;">${icon}</td>
          <td><p style="margin:0 0 2px;font-size:14px;font-weight:600;color:#0E0B1F;">${title}</p>
              <p style="margin:0;font-size:13px;color:#6B7280;">${desc}</p></td>
        </tr></table>
      </td></tr>`).join('')}
    </table>
  </td></tr>
  <tr><td style="background:#F9F8FF;padding:20px 40px;border-top:1px solid #EDE9FF;">
    <p style="margin:0;font-size:12px;color:#9CA3AF;text-align:center;">© 2025 Clorivo — Bienvenue dans la communauté des vendeurs !</p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

function emailKycRejected(sellerName: string, reason?: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#F4F2FF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F2FF;padding:40px 0;">
<tr><td align="center">
<table width="540" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(108,77,255,0.10);">
  <tr><td style="background:linear-gradient(135deg,#6C4DFF 0%,#8B6EFF 100%);padding:32px 40px;text-align:center;">
    <span style="font-size:30px;font-weight:900;color:#fff;letter-spacing:-1.5px;">clorivo</span>
    <p style="margin:6px 0 0;font-size:11px;color:rgba(255,255,255,0.75);letter-spacing:3px;text-transform:uppercase;">shop · sell · ship</p>
  </td></tr>
  <tr><td style="padding:36px 40px 0;text-align:center;">
    <div style="width:64px;height:64px;border-radius:50%;background:#FEE2E2;margin:0 auto 16px;text-align:center;line-height:64px;font-size:32px;">⚠️</div>
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#0E0B1F;">Vérification non approuvée</h1>
    <p style="margin:0;font-size:15px;color:#6B7280;">Bonjour <strong>${sellerName}</strong>,</p>
  </td></tr>
  <tr><td style="padding:24px 40px;">
    <div style="background:#FEF2F2;border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 8px;font-size:14px;color:#991B1B;font-weight:600;">Votre dossier KYC n'a pas pu être approuvé.</p>
      ${reason ? `<p style="margin:0;font-size:14px;color:#6B7280;"><strong>Raison :</strong> ${reason}</p>` : ''}
    </div>
    <div style="background:#FEF9EC;border-radius:12px;padding:16px 18px;margin-bottom:20px;">
      <p style="margin:0 0 6px;font-size:14px;color:#92400E;font-weight:600;">Que faire ?</p>
      <p style="margin:0;font-size:14px;color:#6B7280;line-height:22px;">
        Soumettez à nouveau votre demande depuis l'application en vous assurant que vos documents sont :<br/>
        • Lisibles et non floutés<br/>
        • En cours de validité<br/>
        • Au format JPEG ou PNG
      </p>
    </div>
    <p style="margin:0;font-size:13px;color:#9CA3AF;text-align:center;">Pour toute question, contactez notre support.</p>
  </td></tr>
  <tr><td style="background:#F9F8FF;padding:20px 40px;border-top:1px solid #EDE9FF;">
    <p style="margin:0;font-size:12px;color:#9CA3AF;text-align:center;">© 2025 Clorivo</p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' } });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const { record: kyc, old_record: oldKyc } = await req.json();

  // Only act on status change to approved or rejected
  if (!kyc || !oldKyc || kyc.status === oldKyc.status) {
    return new Response(JSON.stringify({ ok: true, skipped: true }));
  }
  if (kyc.status !== 'approved' && kyc.status !== 'rejected') {
    return new Response(JSON.stringify({ ok: true, skipped: 'irrelevant status' }));
  }

  const { data: seller } = await supabase
    .from('profiles').select('full_name, email').eq('id', kyc.seller_id).single();

  if (!seller?.email) {
    return new Response(JSON.stringify({ ok: true, skipped: 'no email' }));
  }

  const sellerName = seller.full_name ?? 'Vendeur';

  if (kyc.status === 'approved') {
    await fetch(EMAIL_URL, {
      method: 'POST', headers: authHeader(),
      body: JSON.stringify({
        to: seller.email,
        subject: '🎉 Votre compte vendeur Clorivo est activé !',
        html: emailKycApproved(sellerName),
      }),
    });
  } else {
    await fetch(EMAIL_URL, {
      method: 'POST', headers: authHeader(),
      body: JSON.stringify({
        to: seller.email,
        subject: 'Mise à jour de votre dossier KYC — Clorivo',
        html: emailKycRejected(sellerName, kyc.review_notes),
      }),
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
