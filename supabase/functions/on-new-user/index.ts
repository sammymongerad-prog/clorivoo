// Supabase Edge Function: on-new-user
// Triggered by Database Webhook on profiles INSERT
// Sends a welcome email to new buyers and sellers
//
// Deploy: supabase functions deploy on-new-user
// Webhook: Dashboard → Database → Webhooks → profiles INSERT → POST this function URL

const RESEND_URL = 'https://api.resend.com/emails';
const FROM       = 'Clorivo <onboarding@resend.dev>';

async function sendEmail(to: string, subject: string, html: string) {
  const testOverride = Deno.env.get('TEST_EMAIL_OVERRIDE');
  const recipient = testOverride ?? to;
  const res = await fetch(RESEND_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [recipient], subject: testOverride ? `[TEST -> ${to}] ${subject}` : subject, html }),
  });
  if (!res.ok) console.error('Resend error:', await res.json().catch(() => ({})));
}

function emailWelcomeBuyer(name: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#F4F2FF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F2FF;padding:40px 0;">
<tr><td align="center">
<table width="540" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(108,77,255,0.10);">
  <tr><td style="background:linear-gradient(135deg,#6C4DFF 0%,#8B6EFF 100%);padding:32px 40px;text-align:center;">
    <span style="font-size:30px;font-weight:900;color:#fff;letter-spacing:-1.5px;">clorivo</span>
    <p style="margin:6px 0 0;font-size:11px;color:rgba(255,255,255,0.75);letter-spacing:3px;text-transform:uppercase;">shop &middot; sell &middot; ship</p>
  </td></tr>
  <tr><td style="padding:36px 40px 0;text-align:center;">
    <div style="width:64px;height:64px;border-radius:50%;background:#F0EDFF;margin:0 auto 16px;text-align:center;line-height:64px;font-size:32px;">&#128075;</div>
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0E0B1F;">Bienvenue sur Clorivo !</h1>
    <p style="margin:0;font-size:15px;color:#6B7280;">Bonjour <strong>${name}</strong>, nous sommes ravis de vous accueillir.</p>
  </td></tr>
  <tr><td style="padding:28px 40px;">
    <div style="background:#F9F8FF;border-radius:14px;padding:24px;margin-bottom:24px;text-align:center;">
      <p style="margin:0 0 6px;font-size:13px;color:#9CA3AF;text-transform:uppercase;font-weight:600;letter-spacing:1px;">Votre compte est actif</p>
      <p style="margin:0;font-size:15px;color:#0E0B1F;">D&#233;couvrez des milliers de produits livr&#233;s rapidement.</p>
    </div>
    <h2 style="margin:0 0 14px;font-size:16px;font-weight:700;color:#0E0B1F;">Par o&#249; commencer ?</h2>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:10px 0;border-bottom:1px solid #F3F4F6;">
        <table width="100%"><tr>
          <td style="width:40px;font-size:22px;">&#128722;</td>
          <td><p style="margin:0 0 2px;font-size:14px;font-weight:600;color:#0E0B1F;">Explorez le catalogue</p>
              <p style="margin:0;font-size:13px;color:#6B7280;">Des produits s&#233;lectionn&#233;s par des vendeurs de confiance.</p></td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid #F3F4F6;">
        <table width="100%"><tr>
          <td style="width:40px;font-size:22px;">&#128241;</td>
          <td><p style="margin:0 0 2px;font-size:14px;font-weight:600;color:#0E0B1F;">T&#233;l&#233;chargez l'application</p>
              <p style="margin:0;font-size:13px;color:#6B7280;">Commandez et suivez vos livraisons en temps r&#233;el.</p></td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:10px 0;">
        <table width="100%"><tr>
          <td style="width:40px;font-size:22px;">&#128172;</td>
          <td><p style="margin:0 0 2px;font-size:14px;font-weight:600;color:#0E0B1F;">Contactez les vendeurs</p>
              <p style="margin:0;font-size:13px;color:#6B7280;">Chat en direct disponible sur chaque produit.</p></td>
        </tr></table>
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="background:#F9F8FF;padding:20px 40px;border-top:1px solid #EDE9FF;">
    <p style="margin:0;font-size:12px;color:#9CA3AF;text-align:center;">&#169; 2025 Clorivo &mdash; Des questions ? Contactez notre support.</p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

function emailWelcomeSeller(name: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#F4F2FF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F2FF;padding:40px 0;">
<tr><td align="center">
<table width="540" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(108,77,255,0.10);">
  <tr><td style="background:linear-gradient(135deg,#6C4DFF 0%,#8B6EFF 100%);padding:32px 40px;text-align:center;">
    <span style="font-size:30px;font-weight:900;color:#fff;letter-spacing:-1.5px;">clorivo</span>
    <p style="margin:6px 0 0;font-size:11px;color:rgba(255,255,255,0.75);letter-spacing:3px;text-transform:uppercase;">shop &middot; sell &middot; ship</p>
  </td></tr>
  <tr><td style="padding:36px 40px 0;text-align:center;">
    <div style="width:64px;height:64px;border-radius:50%;background:#F0EDFF;margin:0 auto 16px;text-align:center;line-height:64px;font-size:32px;">&#127881;</div>
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0E0B1F;">Bienvenue chez les vendeurs Clorivo !</h1>
    <p style="margin:0;font-size:15px;color:#6B7280;">Bonjour <strong>${name}</strong>, votre compte vendeur a bien &#233;t&#233; cr&#233;&#233;.</p>
  </td></tr>
  <tr><td style="padding:28px 40px;">
    <div style="background:#FEF9EC;border-radius:14px;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#92400E;">&#9203; V&#233;rification KYC requise</p>
      <p style="margin:0;font-size:14px;color:#6B7280;line-height:22px;">Avant de pouvoir vendre, vous devez compl&#233;ter votre v&#233;rification d'identit&#233; (KYC). Cela prend g&#233;n&#233;ralement <strong>1 &#224; 2 jours ouvrables</strong>.</p>
    </div>
    <h2 style="margin:0 0 14px;font-size:16px;font-weight:700;color:#0E0B1F;">Vos prochaines &#233;tapes</h2>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:10px 0;border-bottom:1px solid #F3F4F6;">
        <table width="100%"><tr>
          <td style="width:36px;text-align:center;"><span style="display:inline-block;width:24px;height:24px;border-radius:50%;background:#6C4DFF;color:#fff;font-size:12px;font-weight:700;line-height:24px;text-align:center;">1</span></td>
          <td style="padding-left:10px;"><p style="margin:0 0 2px;font-size:14px;font-weight:600;color:#0E0B1F;">Soumettez votre KYC</p>
              <p style="margin:0;font-size:13px;color:#6B7280;">Ajoutez votre pi&#232;ce d'identit&#233; depuis l'application.</p></td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid #F3F4F6;">
        <table width="100%"><tr>
          <td style="width:36px;text-align:center;"><span style="display:inline-block;width:24px;height:24px;border-radius:50%;background:#6C4DFF;color:#fff;font-size:12px;font-weight:700;line-height:24px;text-align:center;">2</span></td>
          <td style="padding-left:10px;"><p style="margin:0 0 2px;font-size:14px;font-weight:600;color:#0E0B1F;">Attendez la validation</p>
              <p style="margin:0;font-size:13px;color:#6B7280;">Vous recevrez un email d&#232;s que votre dossier est trait&#233;.</p></td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:10px 0;">
        <table width="100%"><tr>
          <td style="width:36px;text-align:center;"><span style="display:inline-block;width:24px;height:24px;border-radius:50%;background:#6C4DFF;color:#fff;font-size:12px;font-weight:700;line-height:24px;text-align:center;">3</span></td>
          <td style="padding-left:10px;"><p style="margin:0 0 2px;font-size:14px;font-weight:600;color:#0E0B1F;">Commencez &#224; vendre</p>
              <p style="margin:0;font-size:13px;color:#6B7280;">Publiez vos produits et recevez vos premi&#232;res commandes.</p></td>
        </tr></table>
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="background:#F9F8FF;padding:20px 40px;border-top:1px solid #EDE9FF;">
    <p style="margin:0;font-size:12px;color:#9CA3AF;text-align:center;">&#169; 2025 Clorivo &mdash; Bienvenue dans la communaut&#233; des vendeurs !</p>
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

  const { record: profile } = await req.json();

  if (!profile?.email) {
    return new Response(JSON.stringify({ ok: true, skipped: 'no email' }));
  }

  const name = profile.full_name ?? profile.email.split('@')[0];
  const role = profile.role ?? 'buyer';

  if (role === 'seller') {
    await sendEmail(
      profile.email,
      'Bienvenue chez les vendeurs Clorivo !',
      emailWelcomeSeller(name),
    );
  } else {
    await sendEmail(
      profile.email,
      'Bienvenue sur Clorivo !',
      emailWelcomeBuyer(name),
    );
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
});
