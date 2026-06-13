import * as React from 'react';
import { Section, Text } from '@react-email/components';
import { JJLayout, JJButton, JJCard, styles } from '../components';

export interface ColisRecuProps {
  firstName: string;
  tracking: string;
  weightBilled: number;
  transport: 'air' | 'sea';
  destination: string;
  price: number;
  estimatedDate: string;
}

export function ColisRecuEmail({
  firstName,
  tracking,
  weightBilled,
  transport,
  destination,
  price,
  estimatedDate,
}: ColisRecuProps) {
  const transportLabel = transport === 'air' ? '✈️ Avion' : '🚢 Bateau';

  return (
    <JJLayout>
      <Section style={styles.body_section}>
        <Text style={styles.h1}>Votre colis est arrivé ✅</Text>
        <Text style={styles.greeting}>Bonjour {firstName},</Text>
        <Text style={styles.paragraph}>
          Bonne nouvelle ! Nous avons bien reçu votre colis dans notre entrepôt de Miami.
          Il sera expédié vers votre destination très prochainement.
        </Text>

        <JJCard rows={[
          { label: '📦 Numéro de suivi', value: tracking, variant: 'orange' },
          { label: 'Poids facturé', value: `${weightBilled.toFixed(2)} lbs` },
          { label: 'Mode de transport', value: transportLabel },
          { label: 'Destination', value: destination },
          { label: 'Prix total', value: `$${price.toFixed(2)}`, variant: 'green' },
          { label: 'Estimation livraison', value: estimatedDate },
        ]} />

        <JJButton href={`https://jjsimex.com/tracker?tracking=${tracking}`}>
          Suivre mon colis
        </JJButton>
      </Section>
    </JJLayout>
  );
}

export function colisRecuSubject(tracking: string) {
  return `Votre colis est arrivé ✅ — ${tracking}`;
}

export default ColisRecuEmail;
