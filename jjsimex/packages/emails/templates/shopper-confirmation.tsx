import * as React from 'react';
import { Section, Text } from '@react-email/components';
import { JJLayout, JJButton, JJCard, styles } from '../components';

export interface ShopperConfirmationProps {
  firstName: string;
  requestNumber: string;
  merchant: string;
  destination: string;
  transport: 'air' | 'sea';
  productUrl?: string;
}

export function ShopperConfirmationEmail({
  firstName,
  requestNumber,
  merchant,
  destination,
  transport,
  productUrl,
}: ShopperConfirmationProps) {
  const transportLabel = transport === 'air' ? '✈️ Avion' : '🚢 Bateau';

  return (
    <JJLayout>
      <Section style={styles.body_section}>
        <Text style={styles.h1}>Demande reçue 🛒</Text>
        <Text style={styles.greeting}>Bonjour {firstName},</Text>
        <Text style={styles.paragraph}>
          Votre demande Personal Shopper <strong style={{ color: '#F97316' }}>{requestNumber}</strong> a bien
          été reçue. Nos experts vont analyser votre demande et vous envoyer un devis sous 24-48 heures.
        </Text>

        <JJCard rows={[
          { label: '🛍️ Numéro de demande', value: requestNumber, variant: 'orange' },
          { label: 'Marchand', value: merchant },
          { label: 'Destination', value: destination },
          { label: 'Mode de transport', value: transportLabel },
        ]} />

        <Text style={{ ...styles.paragraph, color: '#9CA3AF', fontSize: '13px' }}>
          Vous recevrez un email dès que votre devis sera prêt.
        </Text>

        <JJButton href="https://jjsimex.com/demandes">Voir ma demande</JJButton>
      </Section>
    </JJLayout>
  );
}

export function shopperConfirmationSubject(requestNumber: string) {
  return `Demande reçue ${requestNumber} 🛒`;
}

export default ShopperConfirmationEmail;
