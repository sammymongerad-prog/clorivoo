import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Row,
  Column,
  Text,
  Link,
  Hr,
  Button,
} from '@react-email/components';

// ─── Shared styles ────────────────────────────────────────────────────────────

export const styles = {
  body: {
    backgroundColor: '#0D0D0D',
    margin: '0',
    padding: '32px 16px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  container: {
    maxWidth: '560px',
    margin: '0 auto',
    backgroundColor: '#111111',
    borderRadius: '16px',
    border: '1px solid #2A2A2A',
    overflow: 'hidden',
  },
  headerSection: {
    backgroundColor: '#0D0D0D',
    padding: '28px 40px',
    textAlign: 'center' as const,
    borderBottom: '2px solid #F97316',
  },
  logoText: {
    color: '#F97316',
    fontSize: '28px',
    fontWeight: '700',
    margin: '0',
    lineHeight: '1',
  },
  logoTagline: {
    color: '#9CA3AF',
    fontSize: '12px',
    margin: '6px 0 0',
    letterSpacing: '0.5px',
  },
  body_section: {
    padding: '36px 40px',
  },
  h1: {
    color: '#FFFFFF',
    fontSize: '22px',
    fontWeight: '700',
    margin: '0 0 8px',
    lineHeight: '1.3',
  },
  greeting: {
    color: '#9CA3AF',
    fontSize: '14px',
    margin: '0 0 20px',
  },
  paragraph: {
    color: '#D1D5DB',
    fontSize: '14px',
    lineHeight: '1.6',
    margin: '0 0 20px',
  },
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #2A2A2A',
    marginBottom: '24px',
  },
  cardLabel: {
    color: '#9CA3AF',
    fontSize: '12px',
    margin: '0',
    paddingBottom: '6px',
    paddingTop: '6px',
  },
  cardValue: {
    color: '#FFFFFF',
    fontSize: '14px',
    margin: '0',
    fontWeight: '500',
    textAlign: 'right' as const,
    paddingBottom: '6px',
    paddingTop: '6px',
  },
  cardValueOrange: {
    color: '#F97316',
    fontSize: '15px',
    fontWeight: '700',
    margin: '0',
    textAlign: 'right' as const,
    paddingBottom: '6px',
    paddingTop: '6px',
  },
  cardValueGreen: {
    color: '#22C55E',
    fontSize: '16px',
    fontWeight: '700',
    margin: '0',
    textAlign: 'right' as const,
    paddingBottom: '6px',
    paddingTop: '6px',
  },
  divider: {
    borderColor: '#2A2A2A',
    margin: '0',
  },
  button: {
    backgroundColor: '#F97316',
    borderRadius: '8px',
    color: '#FFFFFF',
    display: 'inline-block',
    fontSize: '14px',
    fontWeight: '700',
    padding: '14px 28px',
    textDecoration: 'none',
    textAlign: 'center' as const,
  },
  buttonGreen: {
    backgroundColor: '#22C55E',
    borderRadius: '8px',
    color: '#052E14',
    display: 'inline-block',
    fontSize: '14px',
    fontWeight: '700',
    padding: '14px 28px',
    textDecoration: 'none',
    textAlign: 'center' as const,
  },
  buttonGray: {
    backgroundColor: '#2A2A2A',
    borderRadius: '8px',
    color: '#FFFFFF',
    display: 'inline-block',
    fontSize: '14px',
    fontWeight: '600',
    padding: '14px 28px',
    textDecoration: 'none',
    textAlign: 'center' as const,
  },
  footerSection: {
    backgroundColor: '#0D0D0D',
    padding: '24px 40px',
    borderTop: '1px solid #1A1A1A',
    textAlign: 'center' as const,
  },
  footerBrand: {
    color: '#F97316',
    fontSize: '13px',
    fontWeight: '700',
    margin: '0 0 8px',
  },
  footerAddress: {
    color: '#6B7280',
    fontSize: '11px',
    lineHeight: '1.6',
    margin: '0 0 10px',
  },
  footerLinks: {
    color: '#9CA3AF',
    fontSize: '11px',
    margin: '0 0 12px',
  },
  footerLink: {
    color: '#9CA3AF',
    textDecoration: 'underline',
  },
  footerNote: {
    color: '#4B5563',
    fontSize: '10px',
    margin: '0',
    lineHeight: '1.5',
  },
  noteSmall: {
    color: '#6B7280',
    fontSize: '12px',
    margin: '16px 0 0',
  },
};

// ─── JJHeader ─────────────────────────────────────────────────────────────────

export function JJHeader() {
  return (
    <Section style={styles.headerSection}>
      <Text style={styles.logoText}>JJ's IMEX</Text>
      <Text style={styles.logoTagline}>Beyond Just Shipping</Text>
    </Section>
  );
}

// ─── JJFooter ─────────────────────────────────────────────────────────────────

export function JJFooter() {
  return (
    <Section style={styles.footerSection}>
      <Text style={styles.footerBrand}>JJ's IMEX — Beyond Just Shipping</Text>
      <Text style={styles.footerAddress}>
        15490 NW 7th Ave, Unit 207{'\n'}
        Miami, FL 33169, USA{'\n'}
        +1 (305) 600-9364
      </Text>
      <Text style={styles.footerLinks}>
        <Link href="https://jjsimex.com/conditions" style={styles.footerLink}>Conditions</Link>
        {'  ·  '}
        <Link href="https://jjsimex.com/confidentialite" style={styles.footerLink}>Confidentialité</Link>
      </Text>
      <Text style={styles.footerNote}>
        Vous recevez cet email car vous avez un compte JJ's IMEX.
      </Text>
    </Section>
  );
}

// ─── JJButton ─────────────────────────────────────────────────────────────────

export function JJButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Section style={{ marginBottom: '20px' }}>
      <Link href={href} style={styles.button}>{children}</Link>
    </Section>
  );
}

// ─── JJDivider ────────────────────────────────────────────────────────────────

export function JJDivider() {
  return <Hr style={styles.divider} />;
}

// ─── JJCard ───────────────────────────────────────────────────────────────────

export interface CardRow {
  label: string;
  value: string;
  variant?: 'default' | 'orange' | 'green';
}

export function JJCard({ rows }: { rows: CardRow[] }) {
  return (
    <Section style={styles.card}>
      {rows.map((row, i) => (
        <React.Fragment key={row.label}>
          {i > 0 && <JJDivider />}
          <Row>
            <Column>
              <Text style={styles.cardLabel}>{row.label}</Text>
            </Column>
            <Column align="right">
              <Text
                style={
                  row.variant === 'orange'
                    ? styles.cardValueOrange
                    : row.variant === 'green'
                    ? styles.cardValueGreen
                    : styles.cardValue
                }
              >
                {row.value}
              </Text>
            </Column>
          </Row>
        </React.Fragment>
      ))}
    </Section>
  );
}

// ─── Base email layout ────────────────────────────────────────────────────────

export function JJLayout({ children }: { children: React.ReactNode }) {
  return (
    <Html lang="fr">
      <Head />
      <Body style={styles.body}>
        <Container style={styles.container}>
          <JJHeader />
          {children}
          <JJFooter />
        </Container>
      </Body>
    </Html>
  );
}
