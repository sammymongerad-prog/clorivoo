import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'JJ\'s IMEX <no-reply@jjsimex.com>';

export async function sendWelcomeEmail(to: string, firstName: string, suiteCode: string) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Bienvenue chez JJ\'s IMEX !',
    html: welcomeTemplate(firstName, suiteCode),
  });
}

export async function sendPasswordResetEmail(to: string, firstName: string, resetLink: string) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Réinitialisation de votre mot de passe',
    html: resetTemplate(firstName, resetLink),
  });
}

export async function sendPackageNotificationEmail(
  to: string,
  firstName: string,
  trackingNumber: string,
  status: string,
) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Mise à jour de votre colis ${trackingNumber}`,
    html: packageNotifTemplate(firstName, trackingNumber, status),
  });
}

const baseStyle = `
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  background-color: #0D0D0D;
  color: #FFFFFF;
  margin: 0;
  padding: 0;
`;

const containerStyle = `
  max-width: 560px;
  margin: 0 auto;
  background-color: #1A1A1A;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #2A2A2A;
`;

const headerStyle = `
  background-color: #0D0D0D;
  padding: 32px 40px;
  text-align: center;
  border-bottom: 1px solid #2A2A2A;
`;

const bodyStyle = `padding: 40px;`;

const footerStyle = `
  padding: 24px 40px;
  border-top: 1px solid #2A2A2A;
  text-align: center;
  color: #6B7280;
  font-size: 12px;
`;

const btnStyle = `
  display: inline-block;
  background-color: #F97316;
  color: #FFFFFF;
  text-decoration: none;
  padding: 12px 28px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 15px;
  margin-top: 24px;
`;

function wrapper(content: string) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="${baseStyle}">
  <div style="padding: 32px 16px; background-color: #0D0D0D;">
    <div style="${containerStyle}">
      <div style="${headerStyle}">
        <span style="color: #F97316; font-size: 22px; font-weight: 700; letter-spacing: 0.5px;">JJ's IMEX</span>
        <span style="color: #9CA3AF; font-size: 13px; display: block; margin-top: 4px;">Service de livraison USA → Haïti & RD</span>
      </div>
      ${content}
      <div style="${footerStyle}">
        <p>JJ's IMEX · Miami, FL · +1 (305) 600-9364</p>
        <p style="margin-top: 4px;">Cet email a été envoyé automatiquement. Ne pas répondre.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function welcomeTemplate(firstName: string, suiteCode: string) {
  return wrapper(`
    <div style="${bodyStyle}">
      <h1 style="margin: 0 0 8px; font-size: 22px; color: #FFFFFF;">Bienvenue, ${firstName} ! 👋</h1>
      <p style="color: #9CA3AF; margin: 0 0 24px; font-size: 15px;">Votre compte JJ's IMEX est prêt.</p>
      <div style="background-color: #0D0D0D; border-radius: 12px; padding: 20px; border: 1px solid #2A2A2A; margin-bottom: 24px;">
        <p style="margin: 0 0 4px; font-size: 12px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 1px;">Votre adresse suite US</p>
        <p style="margin: 0; font-size: 20px; font-weight: 700; color: #F97316;">${suiteCode}</p>
        <p style="margin: 8px 0 0; font-size: 13px; color: #9CA3AF;">Utilisez ce code pour recevoir vos colis aux États-Unis.</p>
      </div>
      <p style="color: #D1D5DB; font-size: 14px; line-height: 1.6; margin: 0;">
        Vous pouvez désormais suivre vos colis, consulter vos factures et gérer votre compte directement depuis l'application.
      </p>
    </div>
  `);
}

function resetTemplate(firstName: string, resetLink: string) {
  return wrapper(`
    <div style="${bodyStyle}">
      <h1 style="margin: 0 0 8px; font-size: 22px; color: #FFFFFF;">Réinitialisation du mot de passe</h1>
      <p style="color: #9CA3AF; margin: 0 0 24px; font-size: 15px;">Bonjour ${firstName},</p>
      <p style="color: #D1D5DB; font-size: 14px; line-height: 1.6; margin: 0 0 8px;">
        Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.
      </p>
      <p style="color: #9CA3AF; font-size: 13px; margin: 0 0 24px;">Ce lien expire dans 1 heure.</p>
      <a href="${resetLink}" style="${btnStyle}">Réinitialiser mon mot de passe</a>
      <p style="color: #6B7280; font-size: 12px; margin-top: 24px;">
        Si vous n'avez pas fait cette demande, ignorez cet email.
      </p>
    </div>
  `);
}

function packageNotifTemplate(firstName: string, trackingNumber: string, status: string) {
  return wrapper(`
    <div style="${bodyStyle}">
      <h1 style="margin: 0 0 8px; font-size: 22px; color: #FFFFFF;">Mise à jour de votre colis</h1>
      <p style="color: #9CA3AF; margin: 0 0 24px; font-size: 15px;">Bonjour ${firstName},</p>
      <div style="background-color: #0D0D0D; border-radius: 12px; padding: 20px; border: 1px solid #2A2A2A; margin-bottom: 24px;">
        <p style="margin: 0 0 4px; font-size: 12px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 1px;">Numéro de suivi</p>
        <p style="margin: 0; font-size: 18px; font-weight: 700; color: #FFFFFF;">${trackingNumber}</p>
        <p style="margin: 12px 0 0 0; font-size: 12px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 1px;">Statut</p>
        <p style="margin: 4px 0 0; font-size: 15px; font-weight: 600; color: #F97316;">${status}</p>
      </div>
      <p style="color: #D1D5DB; font-size: 14px; line-height: 1.6; margin: 0;">
        Connectez-vous à l'application JJ's IMEX pour plus de détails.
      </p>
    </div>
  `);
}
