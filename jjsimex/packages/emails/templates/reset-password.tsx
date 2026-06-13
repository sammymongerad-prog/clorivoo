import * as React from 'react';
import { Section, Text } from '@react-email/components';
import { JJLayout, JJButton, styles } from '../components';

export interface ResetPasswordProps {
  firstName: string;
  resetLink: string;
}

export function ResetPasswordEmail({ firstName, resetLink }: ResetPasswordProps) {
  return (
    <JJLayout>
      <Section style={styles.body_section}>
        <Text style={styles.h1}>Réinitialisation du mot de passe 🔑</Text>
        <Text style={styles.greeting}>Bonjour {firstName},</Text>
        <Text style={styles.paragraph}>
          Vous avez demandé la réinitialisation de votre mot de passe JJ's IMEX.
          Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.
        </Text>

        <JJButton href={resetLink}>Réinitialiser mon mot de passe</JJButton>

        <Text style={styles.noteSmall}>
          Ce lien est valide pendant <strong style={{ color: '#FFFFFF' }}>1 heure</strong>.
        </Text>
        <Text style={{ ...styles.noteSmall, marginTop: '8px' }}>
          Si vous n'avez pas fait cette demande, ignorez cet email — votre mot de passe ne sera pas modifié.
        </Text>
      </Section>
    </JJLayout>
  );
}

ResetPasswordEmail.subject = 'Réinitialisation de votre mot de passe — JJ\'s IMEX';

export default ResetPasswordEmail;
