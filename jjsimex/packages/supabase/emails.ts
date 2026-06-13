// ─── Email service ─────────────────────────────────────────────────────────────
// Thin adapter: supabase functions call these, which delegate to @jjsimex/emails

export {
  sendEmail,
  sendBienvenueEmail,
  sendConfirmationEmail,
  sendResetPasswordEmail,
  sendColisRecuEmail,
  sendColisTransitEmail,
  sendColisPretRetraitEmail,
  sendColisLivreEmail,
  sendPaiementConfirmeEmail,
  sendDevisShopperEmail,
  sendShopperConfirmationEmail,
  sendPromoEmail,
} from '@jjsimex/emails';

// ─── Named aliases for backward compat ────────────────────────────────────────

export {
  sendBienvenueEmail as sendWelcomeEmail,
  sendResetPasswordEmail as sendPasswordResetEmail,
} from '@jjsimex/emails';

// ─── Refused / refunded payment emails (inline, not worth a full template) ────

import { Resend } from 'resend';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM = "JJ's IMEX <noreply@jjsimex.com>";
const REPLY_TO = 'support@jjsimex.com';

function miniWrapper(content: string) {
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0D0D0D;color:#fff;margin:0;padding:32px 16px">
<div style="max-width:560px;margin:0 auto;background:#111111;border-radius:16px;border:1px solid #2A2A2A;overflow:hidden">
  <div style="background:#0D0D0D;padding:28px 40px;text-align:center;border-bottom:2px solid #F97316">
    <div style="color:#F97316;font-size:28px;font-weight:700;line-height:1">JJ's IMEX</div>
    <div style="color:#9CA3AF;font-size:12px;margin-top:6px;letter-spacing:.5px">Beyond Just Shipping</div>
  </div>
  <div style="padding:36px 40px">${content}</div>
  <div style="background:#0D0D0D;padding:24px 40px;border-top:1px solid #1A1A1A;text-align:center">
    <div style="color:#F97316;font-size:13px;font-weight:700;margin:0 0 8px">JJ's IMEX — Beyond Just Shipping</div>
    <div style="color:#6B7280;font-size:11px;line-height:1.6;margin:0 0 10px">15490 NW 7th Ave, Unit 207<br/>Miami, FL 33169, USA<br/>+1 (305) 600-9364</div>
    <div style="color:#4B5563;font-size:10px;line-height:1.5;margin:0">Vous recevez cet email car vous avez un compte JJ's IMEX.</div>
  </div>
</div>
</body></html>`;
}

export async function sendPaymentRefusedEmail(
  to: string,
  firstName: string,
  reason: string,
): Promise<void> {
  try {
    const html = miniWrapper(`
      <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0 0 8px">Action requise — Paiement ❌</h1>
      <p style="color:#9CA3AF;font-size:14px;margin:0 0 20px">Bonjour ${firstName},</p>
      <p style="color:#D1D5DB;font-size:14px;line-height:1.6;margin:0 0 20px">
        Votre paiement n'a pas pu être confirmé. Veuillez nous contacter pour résoudre ce problème.
      </p>
      <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:12px;padding:16px 20px;margin-bottom:24px">
        <p style="margin:0;color:#EF4444;font-size:14px;font-weight:600">Raison : ${reason}</p>
      </div>
      <p style="color:#9CA3AF;font-size:13px;line-height:1.8;margin:0">
        📞 +1 (305) 600-9364<br/>
        📧 support@jjsimex.com<br/>
        💬 WhatsApp : +1 (305) 600-9364
      </p>
    `);
    const resend = getResend();
    await resend.emails.send({ from: FROM, replyTo: REPLY_TO, to, subject: 'Action requise — Paiement refusé', html });
  } catch (err) {
    console.error('[emails] sendPaymentRefusedEmail failed:', err);
  }
}

export async function sendPaymentRefundedEmail(
  to: string,
  firstName: string,
  amount: number,
  reason: string,
): Promise<void> {
  try {
    const html = miniWrapper(`
      <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0 0 8px">Remboursement effectué 💰</h1>
      <p style="color:#9CA3AF;font-size:14px;margin:0 0 20px">Bonjour ${firstName},</p>
      <p style="color:#D1D5DB;font-size:14px;line-height:1.6;margin:0 0 20px">
        Un remboursement de <strong style="color:#22C55E">$${amount.toFixed(2)}</strong> a été traité sur votre compte.
      </p>
      <div style="background:#1A1A1A;border:1px solid #2A2A2A;border-radius:12px;padding:20px;margin-bottom:24px">
        <table style="width:100%;border-collapse:collapse">
          <tr>
            <td style="color:#9CA3AF;font-size:12px;padding:6px 0">Montant remboursé</td>
            <td style="color:#22C55E;font-weight:700;font-size:15px;text-align:right;padding:6px 0">$${amount.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="color:#9CA3AF;font-size:12px;padding:6px 0;border-top:1px solid #2A2A2A">Raison</td>
            <td style="color:#fff;text-align:right;padding:6px 0;border-top:1px solid #2A2A2A">${reason}</td>
          </tr>
        </table>
      </div>
      <p style="color:#6B7280;font-size:12px;margin:0">Le remboursement sera reçu dans 3-5 jours ouvrables selon votre méthode de paiement.</p>
    `);
    const resend = getResend();
    await resend.emails.send({ from: FROM, replyTo: REPLY_TO, to, subject: 'Remboursement effectué 💰', html });
  } catch (err) {
    console.error('[emails] sendPaymentRefundedEmail failed:', err);
  }
}
