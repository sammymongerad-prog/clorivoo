import * as React from 'react';
import { Section, Text } from '@react-email/components';
import { JJLayout, JJButton, JJCard, styles } from '../components';

export interface ColisTransitProps {
  firstName: string;
  tracking: string;
  transport: 'air' | 'sea';
  destination: string;
  estimatedDate: string;
}

export function ColisTransitEmail({
  firstName,
  tracking,
  transport,
  destination,
  estimatedDate,
}: ColisTransitProps) {
  const transportLabel = transport === 'air' ? '✈️ Avion' : '🚢 Bateau';
  const transitMsg = transport === 'air'
    ? 'Il est actuellement en vol vers votre destination.'
    : 'Il est actuellement à bord d\'un navire vers votre destination.';

  return (
    <JJLayout>
      <Section style={styles.body_section}>
        <Text style={styles.h1}>Votre colis est en route {transport === 'air' ? '✈️' : '🚢'}</Text>
        <Text style={styles.greeting}>Bonjour {firstName},</Text>
        <Text style={styles.paragraph}>
          Votre colis <strong style={{ color: '#F97316' }}>{tracking}</strong> est en transit
          vers <strong style={{ color: '#FFFFFF' }}>{destination}</strong>. {transitMsg}
        </Text>

        <JJCard rows={[
          { label: '📦 Numéro de suivi', value: tracking, variant: 'orange' },
          { label: 'Mode de transport', value: transportLabel },
          { label: 'Destination', value: destination },
          { label: 'Estimation livraison', value: estimatedDate },
        ]} />

        <JJButton href={`https://jjsimex.com/tracker?tracking=${tracking}`}>
          Suivre mon colis
        </JJButton>
      </Section>
    </JJLayout>
  );
}

export function colisTransitSubject(tracking: string) {
  return `Votre colis est en route ✈️ — ${tracking}`;
}

export default ColisTransitEmail;
