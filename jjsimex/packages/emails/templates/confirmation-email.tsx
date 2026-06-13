import * as React from 'react';
import { Section, Text } from '@react-email/components';
import { JJLayout, JJButton, styles } from '../components';

export interface ConfirmationEmailProps {
  firstName: string;
  confirmLink: string;
}

export function ConfirmationEmailTemplate({ firstName, confirmLink }: ConfirmationEmailProps) {
  return (
    <JJLayout>
      <Section style={styles.body_section}>
        <Text style={styles.h1}>Confirmez votre adresse email ✉️</Text>
        <Text style={styles.greeting}>Bonjour {firstName},</Text>
        <Text style={styles.paragraph}>
          Merci de vous être inscrit chez JJ's IMEX. Pour activer votre compte et accéder à
          toutes nos fonctionnalités, veuillez confirmer votre adresse email.
        </Text>

        <JJButton href={confirmLink}>Confirmer mon email</JJButton>

        <Text style={styles.noteSmall}>
          Ce lien est valide pendant <strong style={{ color: '#FFFFFF' }}>24 heures</strong>.
          Si vous n'avez pas créé de compte chez JJ's IMEX, ignorez cet email.
        </Text>
      </Section>
    </JJLayout>
  );
}

ConfirmationEmailTemplate.subject = 'Confirmez votre adresse email — JJ\'s IMEX';

export default ConfirmationEmailTemplate;
