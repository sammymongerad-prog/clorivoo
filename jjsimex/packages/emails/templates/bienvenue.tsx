import * as React from 'react';
import { Section, Text, Link } from '@react-email/components';
import { JJLayout, JJButton, JJCard, styles } from '../components';

export interface BienvenueProps {
  firstName: string;
  suiteCode: string;
}

export function BienvenueEmail({ firstName, suiteCode }: BienvenueProps) {
  return (
    <JJLayout>
      <Section style={styles.body_section}>
        <Text style={styles.h1}>Bienvenue chez JJ's IMEX ! 🎉</Text>
        <Text style={styles.greeting}>Bonjour {firstName},</Text>
        <Text style={styles.paragraph}>
          Votre compte est créé avec succès ! Vous pouvez maintenant envoyer des colis depuis les États-Unis
          vers Haïti et la République Dominicaine.
        </Text>

        <Section style={{ ...styles.card, borderColor: '#F97316', borderWidth: '1px' }}>
          <Text style={{ color: '#F97316', fontSize: '13px', fontWeight: '700', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            📦 Votre adresse US personnalisée
          </Text>
          <Text style={{ color: '#FFFFFF', fontSize: '15px', margin: '0 0 4px' }}>15490 NW 7th Ave, Unit 207</Text>
          <Text style={{ color: '#F97316', fontSize: '18px', fontWeight: '800', margin: '0 0 4px' }}>Suite : {suiteCode}</Text>
          <Text style={{ color: '#FFFFFF', fontSize: '15px', margin: '0 0 4px' }}>Miami, FL 33169</Text>
          <Text style={{ color: '#FFFFFF', fontSize: '15px', margin: '0 0 12px' }}>USA</Text>
          <Text style={{ color: '#9CA3AF', fontSize: '13px', margin: '0 0 4px' }}>Téléphone : +1 (305) 600-9364</Text>
          <Text style={{ ...styles.paragraph, marginBottom: '0', marginTop: '12px' }}>
            Utilisez cette adresse sur Amazon, Shein, Nike et tout site américain. Nous réceptionnons vos colis
            et les expédions vers votre destination.
          </Text>
        </Section>

        <JJButton href="https://jjsimex.com">Accéder à mon compte</JJButton>
      </Section>
    </JJLayout>
  );
}

BienvenueEmail.subject = "Bienvenue chez JJ's IMEX 🎉";

export default BienvenueEmail;
