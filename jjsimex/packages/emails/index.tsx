import * as React from 'react';
import { render } from '@react-email/render';
import { Resend } from 'resend';

// Templates
import { BienvenueEmail } from './templates/bienvenue';
import { ConfirmationEmailTemplate } from './templates/confirmation-email';
import { ResetPasswordEmail } from './templates/reset-password';
import { ColisRecuEmail, colisRecuSubject } from './templates/colis-recu';
import { ColisTransitEmail, colisTransitSubject } from './templates/colis-transit';
import { ColisPretRetraitEmail, colisPretRetraitSubject } from './templates/colis-pret-retrait';
import { ColisLivreEmail, colisLivreSubject } from './templates/colis-livre';
import { PaiementConfirmeEmail, paiementConfirmeSubject } from './templates/paiement-confirme';
import { DevisShopperEmail, devisShopperSubject } from './templates/devis-shopper';
import { PromoMarketingEmail } from './templates/promo-marketing';
import { ShopperConfirmationEmail, shopperConfirmationSubject } from './templates/shopper-confirmation';

// Re-export all template types
export type { BienvenueProps } from './templates/bienvenue';
export type { ConfirmationEmailProps } from './templates/confirmation-email';
export type { ResetPasswordProps } from './templates/reset-password';
export type { ColisRecuProps } from './templates/colis-recu';
export type { ColisTransitProps } from './templates/colis-transit';
export type { ColisPretRetraitProps } from './templates/colis-pret-retrait';
export type { ColisLivreProps } from './templates/colis-livre';
export type { PaiementConfirmeProps } from './templates/paiement-confirme';
export type { DevisShopperProps } from './templates/devis-shopper';
export type { PromoMarketingProps } from './templates/promo-marketing';
export type { ShopperConfirmationProps } from './templates/shopper-confirmation';

// Re-export templates
export { BienvenueEmail } from './templates/bienvenue';
export { ConfirmationEmailTemplate } from './templates/confirmation-email';
export { ResetPasswordEmail } from './templates/reset-password';
export { ColisRecuEmail } from './templates/colis-recu';
export { ColisTransitEmail } from './templates/colis-transit';
export { ColisPretRetraitEmail } from './templates/colis-pret-retrait';
export { ColisLivreEmail } from './templates/colis-livre';
export { PaiementConfirmeEmail } from './templates/paiement-confirme';
export { DevisShopperEmail } from './templates/devis-shopper';
export { PromoMarketingEmail } from './templates/promo-marketing';
export { ShopperConfirmationEmail } from './templates/shopper-confirmation';

// ─── Email Type Definitions ───────────────────────────────────────────────────

export type EmailType =
  | 'bienvenue'
  | 'confirmation_email'
  | 'reset_password'
  | 'colis_recu'
  | 'colis_transit'
  | 'colis_pret_retrait'
  | 'colis_livre'
  | 'paiement_confirme'
  | 'devis_shopper'
  | 'shopper_confirmation'
  | 'promo_marketing';

// ─── sendEmail ────────────────────────────────────────────────────────────────

const FROM = "JJ's IMEX <noreply@jjsimex.com>";
const REPLY_TO = 'support@jjsimex.com';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

interface SendEmailOptions {
  to: string;
  subject: string;
  element: React.ReactElement;
}

async function send({ to, subject, element }: SendEmailOptions): Promise<void> {
  try {
    const html = await render(element);
    const resend = getResend();
    await resend.emails.send({
      from: FROM,
      replyTo: REPLY_TO,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error(`[emails] Failed to send "${subject}" to ${to}:`, err);
  }
}

// ─── Individual email functions ───────────────────────────────────────────────

export async function sendBienvenueEmail(
  to: string,
  firstName: string,
  suiteCode: string,
) {
  await send({
    to,
    subject: "Bienvenue chez JJ's IMEX 🎉",
    element: React.createElement(BienvenueEmail, { firstName, suiteCode }),
  });
}

export async function sendConfirmationEmail(
  to: string,
  firstName: string,
  confirmLink: string,
) {
  await send({
    to,
    subject: "Confirmez votre adresse email — JJ's IMEX",
    element: React.createElement(ConfirmationEmailTemplate, { firstName, confirmLink }),
  });
}

export async function sendResetPasswordEmail(
  to: string,
  firstName: string,
  resetLink: string,
) {
  await send({
    to,
    subject: "Réinitialisation de votre mot de passe — JJ's IMEX",
    element: React.createElement(ResetPasswordEmail, { firstName, resetLink }),
  });
}

export async function sendColisRecuEmail(
  to: string,
  firstName: string,
  tracking: string,
  weightBilled: number,
  transport: 'air' | 'sea',
  destination: string,
  price: number,
  estimatedDate: string,
) {
  await send({
    to,
    subject: colisRecuSubject(tracking),
    element: React.createElement(ColisRecuEmail, {
      firstName, tracking, weightBilled, transport, destination, price, estimatedDate,
    }),
  });
}

export async function sendColisTransitEmail(
  to: string,
  firstName: string,
  tracking: string,
  transport: 'air' | 'sea',
  destination: string,
  estimatedDate: string,
) {
  await send({
    to,
    subject: colisTransitSubject(tracking),
    element: React.createElement(ColisTransitEmail, {
      firstName, tracking, transport, destination, estimatedDate,
    }),
  });
}

export async function sendColisPretRetraitEmail(
  to: string,
  firstName: string,
  tracking: string,
  branchName: string,
  branchAddress: string,
  branchHours: string,
  branchPhone: string,
  mapsUrl?: string,
) {
  await send({
    to,
    subject: colisPretRetraitSubject(tracking),
    element: React.createElement(ColisPretRetraitEmail, {
      firstName, tracking, branchName, branchAddress, branchHours, branchPhone, mapsUrl,
    }),
  });
}

export async function sendColisLivreEmail(
  to: string,
  firstName: string,
  tracking: string,
  destination: string,
  deliveredAt: string,
) {
  await send({
    to,
    subject: colisLivreSubject(tracking),
    element: React.createElement(ColisLivreEmail, {
      firstName, tracking, destination, deliveredAt,
    }),
  });
}

export async function sendPaiementConfirmeEmail(
  to: string,
  firstName: string,
  transactionNumber: string,
  amount: number,
  method: string,
  date: string,
  trackingNumber?: string,
) {
  await send({
    to,
    subject: paiementConfirmeSubject(transactionNumber),
    element: React.createElement(PaiementConfirmeEmail, {
      firstName, transactionNumber, amount, method, date, trackingNumber,
    }),
  });
}

export async function sendDevisShopperEmail(
  to: string,
  firstName: string,
  requestNumber: string,
  productUrl: string,
  merchant: string,
  finalPrice: number,
  shippingCost: number,
  totalPrice: number,
  transport: 'air' | 'sea',
  destination: string,
  confirmUrl?: string,
  cancelUrl?: string,
) {
  await send({
    to,
    subject: devisShopperSubject(requestNumber),
    element: React.createElement(DevisShopperEmail, {
      firstName, requestNumber, productUrl, merchant, finalPrice, shippingCost, totalPrice,
      transport, destination, confirmUrl, cancelUrl,
    }),
  });
}

export async function sendShopperConfirmationEmail(
  to: string,
  firstName: string,
  requestNumber: string,
  merchant: string,
  destination: string,
  transport: 'air' | 'sea',
  productUrl?: string,
) {
  await send({
    to,
    subject: shopperConfirmationSubject(requestNumber),
    element: React.createElement(ShopperConfirmationEmail, {
      firstName, requestNumber, merchant, destination, transport, productUrl,
    }),
  });
}

export async function sendPromoEmail(
  to: string,
  title: string,
  subtitle: string | undefined,
  body: string,
  ctaText: string,
  ctaUrl: string,
  badge?: string,
  highlight?: string,
  imageUrl?: string,
  expiresAt?: string,
) {
  await send({
    to,
    subject: title,
    element: React.createElement(PromoMarketingEmail, {
      title, subtitle, body, ctaText, ctaUrl, badge, highlight, imageUrl, expiresAt,
    }),
  });
}

// ─── Generic sendEmail dispatcher ─────────────────────────────────────────────

interface EmailDataMap {
  bienvenue: { firstName: string; suiteCode: string };
  confirmation_email: { firstName: string; confirmLink: string };
  reset_password: { firstName: string; resetLink: string };
  colis_recu: { firstName: string; tracking: string; weightBilled: number; transport: 'air' | 'sea'; destination: string; price: number; estimatedDate: string };
  colis_transit: { firstName: string; tracking: string; transport: 'air' | 'sea'; destination: string; estimatedDate: string };
  colis_pret_retrait: { firstName: string; tracking: string; branchName: string; branchAddress: string; branchHours: string; branchPhone: string; mapsUrl?: string };
  colis_livre: { firstName: string; tracking: string; destination: string; deliveredAt: string };
  paiement_confirme: { firstName: string; transactionNumber: string; amount: number; method: string; date: string; trackingNumber?: string };
  devis_shopper: { firstName: string; requestNumber: string; productUrl: string; merchant: string; finalPrice: number; shippingCost: number; totalPrice: number; transport: 'air' | 'sea'; destination: string; confirmUrl?: string; cancelUrl?: string };
  shopper_confirmation: { firstName: string; requestNumber: string; merchant: string; destination: string; transport: 'air' | 'sea'; productUrl?: string };
  promo_marketing: { title: string; subtitle?: string; body: string; ctaText: string; ctaUrl: string; badge?: string; highlight?: string; imageUrl?: string; expiresAt?: string };
}

export async function sendEmail<T extends EmailType>(
  type: T,
  to: string,
  data: EmailDataMap[T],
): Promise<void> {
  try {
    switch (type) {
      case 'bienvenue': {
        const d = data as EmailDataMap['bienvenue'];
        await sendBienvenueEmail(to, d.firstName, d.suiteCode);
        break;
      }
      case 'confirmation_email': {
        const d = data as EmailDataMap['confirmation_email'];
        await sendConfirmationEmail(to, d.firstName, d.confirmLink);
        break;
      }
      case 'reset_password': {
        const d = data as EmailDataMap['reset_password'];
        await sendResetPasswordEmail(to, d.firstName, d.resetLink);
        break;
      }
      case 'colis_recu': {
        const d = data as EmailDataMap['colis_recu'];
        await sendColisRecuEmail(to, d.firstName, d.tracking, d.weightBilled, d.transport, d.destination, d.price, d.estimatedDate);
        break;
      }
      case 'colis_transit': {
        const d = data as EmailDataMap['colis_transit'];
        await sendColisTransitEmail(to, d.firstName, d.tracking, d.transport, d.destination, d.estimatedDate);
        break;
      }
      case 'colis_pret_retrait': {
        const d = data as EmailDataMap['colis_pret_retrait'];
        await sendColisPretRetraitEmail(to, d.firstName, d.tracking, d.branchName, d.branchAddress, d.branchHours, d.branchPhone, d.mapsUrl);
        break;
      }
      case 'colis_livre': {
        const d = data as EmailDataMap['colis_livre'];
        await sendColisLivreEmail(to, d.firstName, d.tracking, d.destination, d.deliveredAt);
        break;
      }
      case 'paiement_confirme': {
        const d = data as EmailDataMap['paiement_confirme'];
        await sendPaiementConfirmeEmail(to, d.firstName, d.transactionNumber, d.amount, d.method, d.date, d.trackingNumber);
        break;
      }
      case 'devis_shopper': {
        const d = data as EmailDataMap['devis_shopper'];
        await sendDevisShopperEmail(to, d.firstName, d.requestNumber, d.productUrl, d.merchant, d.finalPrice, d.shippingCost, d.totalPrice, d.transport, d.destination, d.confirmUrl, d.cancelUrl);
        break;
      }
      case 'shopper_confirmation': {
        const d = data as EmailDataMap['shopper_confirmation'];
        await sendShopperConfirmationEmail(to, d.firstName, d.requestNumber, d.merchant, d.destination, d.transport, d.productUrl);
        break;
      }
      case 'promo_marketing': {
        const d = data as EmailDataMap['promo_marketing'];
        await sendPromoEmail(to, d.title, d.subtitle, d.body, d.ctaText, d.ctaUrl, d.badge, d.highlight, d.imageUrl, d.expiresAt);
        break;
      }
    }
    console.log(`[emails] Sent "${type}" to ${to}`);
  } catch (err) {
    console.error(`[emails] Error sending "${type}" to ${to}:`, err);
  }
}
