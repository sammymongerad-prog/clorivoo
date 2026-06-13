import * as React from 'react';
import { Section, Text, Link, Row, Column } from '@react-email/components';
import { JJLayout, JJCard, styles } from '../components';

export interface DevisShopperProps {
  firstName: string;
  requestNumber: string;
  productUrl: string;
  merchant: string;
  finalPrice: number;
  shippingCost: number;
  totalPrice: number;
  transport: 'air' | 'sea';
  destination: string;
  confirmUrl?: string;
  cancelUrl?: string;
}

export function DevisShopperEmail({
  firstName,
  requestNumber,
  productUrl,
  merchant,
  finalPrice,
  shippingCost,
  totalPrice,
  transport,
  destination,
  confirmUrl,
  cancelUrl,
}: DevisShopperProps) {
  const transportLabel = transport === 'air' ? '✈️ Avion' : '🚢 Bateau';
  const confirmHref = confirmUrl ?? 'https://jjsimex.com/demandes';
  const cancelHref = cancelUrl ?? 'https://jjsimex.com/demandes';

  return (
    <JJLayout>
      <Section style={styles.body_section}>
        <Text style={styles.h1}>Votre devis est prêt 💰</Text>
        <Text style={styles.greeting}>Bonjour {firstName},</Text>
        <Text style={styles.paragraph}>
          Votre devis pour la demande <strong style={{ color: '#F97316' }}>{requestNumber}</strong> est
          prêt. Consultez le récapitulatif et confirmez si vous souhaitez continuer.
        </Text>

        <JJCard rows={[
          { label: '🛍️ Produit', value: merchant, variant: 'orange' },
          { label: 'Prix du produit', value: `$${finalPrice.toFixed(2)}` },
          { label: 'Frais d\'expédition', value: `$${shippingCost.toFixed(2)}` },
          { label: 'Mode de transport', value: transportLabel },
          { label: 'Destination', value: destination },
          { label: 'TOTAL', value: `$${totalPrice.toFixed(2)}`, variant: 'green' },
        ]} />

        <Text style={{ color: '#9CA3AF', fontSize: '13px', margin: '0 0 20px' }}>
          Produit : <Link href={productUrl} style={{ color: '#F97316' }}>Voir le produit</Link>
        </Text>

        <Row>
          <Column style={{ paddingRight: '8px' }}>
            <Link href={confirmHref} style={styles.buttonGreen}>
              Confirmer ma commande
            </Link>
          </Column>
          <Column>
            <Link href={cancelHref} style={styles.buttonGray}>
              Annuler
            </Link>
          </Column>
        </Row>

        <Text style={styles.noteSmall}>
          Ce devis est valable 48 heures. Passé ce délai, nous devrons le recalculer.
        </Text>
      </Section>
    </JJLayout>
  );
}

export function devisShopperSubject(requestNumber: string) {
  return `Votre devis est prêt 💰 — ${requestNumber}`;
}

export default DevisShopperEmail;
