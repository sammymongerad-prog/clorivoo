import * as React from 'react';
import { Section, Text } from '@react-email/components';
import { JJLayout, JJButton, JJCard, styles } from '../components';

export interface ColisLivreProps {
  firstName: string;
  tracking: string;
  destination: string;
  deliveredAt: string;
}

export function ColisLivreEmail({ firstName, tracking, destination, deliveredAt }: ColisLivreProps) {
  return (
    <JJLayout>
      <Section style={styles.body_section}>
        <Text style={styles.h1}>Colis livré avec succès ✅</Text>
        <Text style={styles.greeting}>Bonjour {firstName},</Text>
        <Text style={styles.paragraph}>
          Votre colis <strong style={{ color: '#F97316' }}>{tracking}</strong> a été livré avec succès
          à <strong style={{ color: '#FFFFFF' }}>{destination}</strong>. Merci de faire confiance
          à JJ's IMEX !
        </Text>

        <JJCard rows={[
          { label: '📦 Numéro de suivi', value: tracking, variant: 'orange' },
          { label: 'Destination', value: destination },
          { label: 'Date de livraison', value: deliveredAt, variant: 'green' },
        ]} />

        <Text style={{ ...styles.paragraph, color: '#9CA3AF', fontSize: '13px' }}>
          Votre satisfaction est notre priorité. Laissez-nous un avis pour nous aider à améliorer nos services.
        </Text>

        <JJButton href="https://jjsimex.com/avis">
          Laisser un avis
        </JJButton>
      </Section>
    </JJLayout>
  );
}

export function colisLivreSubject(tracking: string) {
  return `Colis livré avec succès ✅ — ${tracking}`;
}

export default ColisLivreEmail;
