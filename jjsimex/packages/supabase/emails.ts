import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "JJ's IMEX <no-reply@jjsimex.com>";

function wrapper(content: string) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="font-family:Helvetica,Arial,sans-serif;background:#0D0D0D;color:#fff;margin:0;padding:32px 16px">
  <div style="max-width:560px;margin:0 auto;background:#1A1A1A;border-radius:16px;border:1px solid #2A2A2A">
    <div style="background:#0D0D0D;padding:28px 40px;text-align:center;border-bottom:1px solid #2A2A2A">
      <span style="color:#F97316;font-size:22px;font-weight:700">JJ's IMEX</span>
      <span style="color:#9CA3AF;font-size:12px;display:block;margin-top:4px">Service de livraison USA → Haïti & Rép. Dom.</span>
    </div>
    ${content}
    <div style="padding:20px 40px;border-top:1px solid #2A2A2A;text-align:center;color:#6B7280;font-size:11px">
      JJ's IMEX · Miami, FL · +1 (305) 600-9364<br/>Cet email est envoyé automatiquement.
    </div>
  </div>
</body></html>`;
}

export async function sendWelcomePackageEmail(
  to: string,
  firstName: string,
  tracking: string,
  weightReal: number,
  weightBilled: number,
  transport: string,
  city: string,
  price: number,
) {
  const html = wrapper(`
    <div style="padding:36px 40px">
      <h1 style="margin:0 0 6px;font-size:20px;color:#fff">Votre colis a été reçu ✅</h1>
      <p style="color:#9CA3AF;margin:0 0 24px;font-size:14px">Bonjour ${firstName},</p>
      <p style="color:#D1D5DB;font-size:14px;margin:0 0 20px">Nous avons bien reçu votre colis dans notre entrepôt de Miami.</p>
      <div style="background:#0D0D0D;border-radius:12px;padding:20px;border:1px solid #2A2A2A;margin-bottom:24px">
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="color:#9CA3AF;font-size:12px;padding:6px 0">Numéro de suivi</td><td style="color:#F97316;font-weight:700;font-size:15px;text-align:right">${tracking}</td></tr>
          <tr><td style="color:#9CA3AF;font-size:12px;padding:6px 0;border-top:1px solid #2A2A2A">Poids réel</td><td style="color:#fff;text-align:right;border-top:1px solid #2A2A2A">${weightReal} lbs</td></tr>
          <tr><td style="color:#9CA3AF;font-size:12px;padding:6px 0;border-top:1px solid #2A2A2A">Poids facturé</td><td style="color:#fff;text-align:right;border-top:1px solid #2A2A2A">${weightBilled.toFixed(2)} lbs</td></tr>
          <tr><td style="color:#9CA3AF;font-size:12px;padding:6px 0;border-top:1px solid #2A2A2A">Mode transport</td><td style="color:#fff;text-align:right;border-top:1px solid #2A2A2A">${transport}</td></tr>
          <tr><td style="color:#9CA3AF;font-size:12px;padding:6px 0;border-top:1px solid #2A2A2A">Destination</td><td style="color:#fff;text-align:right;border-top:1px solid #2A2A2A">${city}</td></tr>
          <tr><td style="color:#9CA3AF;font-size:12px;padding:6px 0;border-top:1px solid #2A2A2A">Prix total</td><td style="color:#22C55E;font-weight:700;font-size:15px;text-align:right;border-top:1px solid #2A2A2A">$${price.toFixed(2)}</td></tr>
        </table>
      </div>
      <a href="https://jjsimex.com" style="display:inline-block;background:#F97316;color:#fff;text-decoration:none;padding:12px 28px;border-radius:12px;font-weight:600;font-size:14px">Suivre mon colis</a>
    </div>
  `);

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Votre colis a été reçu ✅ — ${tracking}`,
    html,
  });
}

export async function sendPackageNotificationEmail(
  to: string,
  firstName: string,
  tracking: string,
  title: string,
  message: string,
) {
  const html = wrapper(`
    <div style="padding:36px 40px">
      <h1 style="margin:0 0 6px;font-size:20px;color:#fff">${title}</h1>
      <p style="color:#9CA3AF;margin:0 0 24px;font-size:14px">Bonjour ${firstName},</p>
      <div style="background:#0D0D0D;border-radius:12px;padding:20px;border:1px solid #2A2A2A;margin-bottom:24px">
        <p style="margin:0 0 8px;font-size:12px;color:#9CA3AF;text-transform:uppercase;letter-spacing:1px">Numéro de suivi</p>
        <p style="margin:0 0 16px;font-size:18px;font-weight:700;color:#fff">${tracking}</p>
        <p style="margin:0;font-size:14px;color:#D1D5DB">${message}</p>
      </div>
      <a href="https://jjsimex.com" style="display:inline-block;background:#F97316;color:#fff;text-decoration:none;padding:12px 28px;border-radius:12px;font-weight:600;font-size:14px">Voir les détails</a>
    </div>
  `);

  await resend.emails.send({
    from: FROM,
    to,
    subject: `${title} — ${tracking}`,
    html,
  });
}

export async function sendWelcomeEmail(
  to: string,
  firstName: string,
  suiteCode: string,
) {
  const html = wrapper(`
    <div style="padding:36px 40px">
      <h1 style="margin:0 0 6px;font-size:20px;color:#fff">Bienvenue, ${firstName} ! 👋</h1>
      <p style="color:#9CA3AF;margin:0 0 24px;font-size:14px">Votre compte JJ's IMEX est prêt.</p>
      <div style="background:#0D0D0D;border-radius:12px;padding:20px;border:1px solid #2A2A2A;margin-bottom:20px">
        <p style="margin:0 0 6px;font-size:11px;color:#9CA3AF;text-transform:uppercase;letter-spacing:1px">Votre adresse suite US</p>
        <p style="margin:0;font-size:22px;font-weight:700;color:#F97316">${suiteCode}</p>
        <p style="margin:10px 0 0;font-size:13px;color:#9CA3AF">Utilisez ce code pour recevoir vos colis aux États-Unis.</p>
      </div>
    </div>
  `);

  await resend.emails.send({
    from: FROM,
    to,
    subject: "Bienvenue chez JJ's IMEX !",
    html,
  });
}

export async function sendPasswordResetEmail(
  to: string,
  firstName: string,
  resetLink: string,
) {
  const html = wrapper(`
    <div style="padding:36px 40px">
      <h1 style="margin:0 0 6px;font-size:20px;color:#fff">Réinitialisation du mot de passe</h1>
      <p style="color:#9CA3AF;margin:0 0 16px;font-size:14px">Bonjour ${firstName},</p>
      <p style="color:#D1D5DB;font-size:14px;margin:0 0 24px">Cliquez ci-dessous pour choisir un nouveau mot de passe. Ce lien expire dans 1 heure.</p>
      <a href="${resetLink}" style="display:inline-block;background:#F97316;color:#fff;text-decoration:none;padding:12px 28px;border-radius:12px;font-weight:600;font-size:14px">Réinitialiser mon mot de passe</a>
      <p style="color:#6B7280;font-size:12px;margin-top:20px">Si vous n'avez pas fait cette demande, ignorez cet email.</p>
    </div>
  `);

  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Réinitialisation de votre mot de passe',
    html,
  });
}

export async function sendShopperNotificationEmail(
  to: string,
  firstName: string,
  requestNumber: string,
  merchant: string,
  destination: string,
) {
  const html = wrapper(`
    <div style="padding:36px 40px">
      <h1 style="margin:0 0 6px;font-size:20px;color:#fff">Nouvelle demande confirmée 🛒</h1>
      <p style="color:#9CA3AF;margin:0 0 24px;font-size:14px">Bonjour ${firstName},</p>
      <p style="color:#D1D5DB;font-size:14px;margin:0 0 24px">Votre demande Personal Shopper a bien été reçue. Nos experts vont analyser votre demande et vous envoyer un devis très bientôt.</p>
      <div style="background:#0D0D0D;border-radius:12px;padding:20px;border:1px solid #2A2A2A;margin-bottom:24px">
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="color:#9CA3AF;font-size:12px;padding:6px 0">Numéro de demande</td><td style="color:#F97316;font-weight:700;font-size:15px;text-align:right">${requestNumber}</td></tr>
          <tr><td style="color:#9CA3AF;font-size:12px;padding:6px 0;border-top:1px solid #2A2A2A">Marchand</td><td style="color:#fff;text-align:right;border-top:1px solid #2A2A2A">${merchant}</td></tr>
          <tr><td style="color:#9CA3AF;font-size:12px;padding:6px 0;border-top:1px solid #2A2A2A">Destination</td><td style="color:#fff;text-align:right;border-top:1px solid #2A2A2A">${destination}</td></tr>
        </table>
      </div>
      <a href="https://jjsimex.com" style="display:inline-block;background:#F97316;color:#fff;text-decoration:none;padding:12px 28px;border-radius:12px;font-weight:600;font-size:14px">Voir ma demande</a>
    </div>
  `);

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Demande reçue ${requestNumber} 🛒`,
    html,
  });
}

export async function sendShopperQuoteEmail(
  to: string,
  firstName: string,
  requestNumber: string,
  merchant: string,
  finalPrice: number,
  shippingCost: number,
  totalPrice: number,
  destination: string,
) {
  const html = wrapper(`
    <div style="padding:36px 40px">
      <h1 style="margin:0 0 6px;font-size:20px;color:#fff">Votre devis est prêt 💰</h1>
      <p style="color:#9CA3AF;margin:0 0 24px;font-size:14px">Bonjour ${firstName},</p>
      <p style="color:#D1D5DB;font-size:14px;margin:0 0 24px">Nous avons préparé un devis pour votre demande. Consultez les détails ci-dessous et confirmez si vous souhaiter continuer.</p>
      <div style="background:#0D0D0D;border-radius:12px;padding:20px;border:1px solid #2A2A2A;margin-bottom:24px">
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="color:#9CA3AF;font-size:12px;padding:6px 0">Numéro de demande</td><td style="color:#F97316;font-weight:700;font-size:15px;text-align:right">${requestNumber}</td></tr>
          <tr><td style="color:#9CA3AF;font-size:12px;padding:6px 0;border-top:1px solid #2A2A2A">Marchand</td><td style="color:#fff;text-align:right;border-top:1px solid #2A2A2A">${merchant}</td></tr>
          <tr><td style="color:#9CA3AF;font-size:12px;padding:6px 0;border-top:1px solid #2A2A2A">Destination</td><td style="color:#fff;text-align:right;border-top:1px solid #2A2A2A">${destination}</td></tr>
          <tr style="border-top:2px solid #F97316"><td style="color:#9CA3AF;font-size:12px;padding:8px 0">Prix du produit</td><td style="color:#fff;text-align:right;padding:8px 0">$${finalPrice.toFixed(2)}</td></tr>
          <tr><td style="color:#9CA3AF;font-size:12px;padding:6px 0">Frais d'expédition</td><td style="color:#fff;text-align:right">$${shippingCost.toFixed(2)}</td></tr>
          <tr style="border-top:1px solid #2A2A2A"><td style="color:#fff;font-size:14px;font-weight:700;padding:8px 0">TOTAL</td><td style="color:#22C55E;font-weight:700;font-size:16px;text-align:right;padding:8px 0;border-top:1px solid #2A2A2A">$${totalPrice.toFixed(2)}</td></tr>
        </table>
      </div>
      <a href="https://jjsimex.com" style="display:inline-block;background:#F97316;color:#fff;text-decoration:none;padding:12px 28px;border-radius:12px;font-weight:600;font-size:14px">Confirmer le devis</a>
    </div>
  `);

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Votre devis ${requestNumber} 💰`,
    html,
  });
}

export async function sendShopperShippedEmail(
  to: string,
  firstName: string,
  requestNumber: string,
  trackingNumber: string,
  merchant: string,
  totalPrice: number,
  destination: string,
) {
  const html = wrapper(`
    <div style="padding:36px 40px">
      <h1 style="margin:0 0 6px;font-size:20px;color:#fff">Votre commande a été expédiée ✈️</h1>
      <p style="color:#9CA3AF;margin:0 0 24px;font-size:14px">Bonjour ${firstName},</p>
      <p style="color:#D1D5DB;font-size:14px;margin:0 0 24px">Votre commande a quitté nos entrepôts et est en route vers ${destination}. Suivez votre colis avec le numéro de suivi ci-dessous.</p>
      <div style="background:#0D0D0D;border-radius:12px;padding:20px;border:1px solid #2A2A2A;margin-bottom:24px">
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="color:#9CA3AF;font-size:12px;padding:6px 0">Numéro de demande</td><td style="color:#F97316;font-weight:700;font-size:15px;text-align:right">${requestNumber}</td></tr>
          <tr><td style="color:#9CA3AF;font-size:12px;padding:6px 0;border-top:1px solid #2A2A2A">Numéro de suivi</td><td style="color:#F97316;font-weight:700;font-size:15px;text-align:right">${trackingNumber}</td></tr>
          <tr><td style="color:#9CA3AF;font-size:12px;padding:6px 0;border-top:1px solid #2A2A2A">Marchand</td><td style="color:#fff;text-align:right;border-top:1px solid #2A2A2A">${merchant}</td></tr>
          <tr><td style="color:#9CA3AF;font-size:12px;padding:6px 0;border-top:1px solid #2A2A2A">Destination</td><td style="color:#fff;text-align:right;border-top:1px solid #2A2A2A">${destination}</td></tr>
          <tr style="border-top:1px solid #2A2A2A"><td style="color:#fff;font-size:14px;font-weight:700;padding:8px 0">Montant payé</td><td style="color:#22C55E;font-weight:700;font-size:16px;text-align:right;padding:8px 0;border-top:1px solid #2A2A2A">$${totalPrice.toFixed(2)}</td></tr>
        </table>
      </div>
      <a href="https://jjsimex.com" style="display:inline-block;background:#F97316;color:#fff;text-decoration:none;padding:12px 28px;border-radius:12px;font-weight:600;font-size:14px">Suivre mon colis</a>
    </div>
  `);

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Commande expédiée ${requestNumber} ✈️`,
    html,
  });
}
