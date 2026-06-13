import * as React from 'react';
import { Section, Text } from '@react-email/components';
import { JJLayout, JJButton, JJCard, styles } from '../components';

export interface PaiementConfirmeProps {
  firstName: string;
  transactionNumber: string;
  amount: number;
  method: string;
  trackingNumber?: string;
  date: string;
}

const METHOD_LABELS: Record<string, string> = {
  moncash: 'MonCash',
  zelle: 'Zelle',
  wire: 'Virement bancaire',
  cash: 'Espèces',
  visa_mc: 'Carte bancaire (Visa/MC)',
};

export function PaiementConfirmeEmail({
  firstName,
  transactionNumber,
  amount,
  method,
  trackingNumber,
  date,
}: PaiementConfirmeProps) {
  const methodLabel = METHOD_LABELS[method] ?? method;
  const rows = [
    { label: '💳 Transaction', value: transactionNumber, variant: 'orange' as const },
    { label: 'Montant', value: `$${amount.toFixed(2)}`, variant: 'green' as const },
    { label: 'Méthode de paiement', value: methodLabel },
    { label: 'Date', value: date },
  ];

  if (trackingNumber) {
    rows.push({ label: '📦 Colis associé', value: trackingNumber, variant: 'orange' as const });
  }

  return (
    <JJLayout>
      <Section style={styles.body_section}>
        <Text style={styles.h1}>Paiement confirmé 💰</Text>
        <Text style={styles.greeting}>Bonjour {firstName},</Text>
        <Text style={styles.paragraph}>
          Votre paiement de <strong style={{ color: '#22C55E' }}>${amount.toFixed(2)}</strong> a bien été
          confirmé. Voici le récapitulatif de votre transaction.
        </Text>

        <JJCard rows={rows} />

        <JJButton href="https://jjsimex.com/paiements">
          Voir mon reçu
        </JJButton>

        <Text style={styles.noteSmall}>
          Merci de faire confiance à JJ's IMEX ! Votre colis est en cours de traitement.
        </Text>
      </Section>
    </JJLayout>
  );
}

export function paiementConfirmeSubject(transactionNumber: string) {
  return `Paiement confirmé 💰 — ${transactionNumber}`;
}

export default PaiementConfirmeEmail;
