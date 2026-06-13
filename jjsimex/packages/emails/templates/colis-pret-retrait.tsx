import * as React from 'react';
import { Section, Text, Link } from '@react-email/components';
import { JJLayout, JJButton, styles } from '../components';

export interface ColisPretRetraitProps {
  firstName: string;
  tracking: string;
  branchName: string;
  branchAddress: string;
  branchHours: string;
  branchPhone: string;
  mapsUrl?: string;
}

export function ColisPretRetraitEmail({
  firstName,
  tracking,
  branchName,
  branchAddress,
  branchHours,
  branchPhone,
  mapsUrl,
}: ColisPretRetraitProps) {
  return (
    <JJLayout>
      <Section style={styles.body_section}>
        <Text style={styles.h1}>Votre colis vous attend 📦</Text>
        <Text style={styles.greeting}>Bonjour {firstName},</Text>
        <Text style={styles.paragraph}>
          Excellente nouvelle ! Votre colis <strong style={{ color: '#F97316' }}>{tracking}</strong> est
          prêt à être retiré dans votre succursale JJ's IMEX.
        </Text>

        <Section style={{ ...styles.card, borderColor: '#F97316' }}>
          <Text style={{ color: '#F97316', fontSize: '14px', fontWeight: '700', margin: '0 0 12px' }}>
            📍 {branchName}
          </Text>
          <Text style={{ color: '#FFFFFF', fontSize: '14px', margin: '0 0 6px', lineHeight: '1.5' }}>
            {branchAddress}
          </Text>
          <Text style={{ color: '#9CA3AF', fontSize: '13px', margin: '6px 0', lineHeight: '1.5' }}>
            🕐 Horaires : {branchHours}
          </Text>
          <Text style={{ color: '#9CA3AF', fontSize: '13px', margin: '0', lineHeight: '1.5' }}>
            📞 {branchPhone}
          </Text>
        </Section>

        <Text style={{ ...styles.paragraph, color: '#9CA3AF', fontSize: '13px' }}>
          ⚠️ Merci d'apporter une pièce d'identité valide lors du retrait.
        </Text>

        <JJButton href={mapsUrl ?? 'https://jjsimex.com/succursales'}>
          Obtenir l'itinéraire
        </JJButton>
      </Section>
    </JJLayout>
  );
}

export function colisPretRetraitSubject(tracking: string) {
  return `Votre colis vous attend 📦 — ${tracking}`;
}

export default ColisPretRetraitEmail;
