import * as React from 'react';
import { Section, Text, Img } from '@react-email/components';
import { JJLayout, JJButton, styles } from '../components';

export interface PromoMarketingProps {
  title: string;
  subtitle?: string;
  body: string;
  ctaText: string;
  ctaUrl: string;
  badge?: string;
  highlight?: string;
  imageUrl?: string;
  expiresAt?: string;
}

export function PromoMarketingEmail({
  title,
  subtitle,
  body,
  ctaText,
  ctaUrl,
  badge,
  highlight,
  imageUrl,
  expiresAt,
}: PromoMarketingProps) {
  return (
    <JJLayout>
      <Section style={styles.body_section}>
        {badge && (
          <Section style={{ marginBottom: '16px' }}>
            <Text style={{
              display: 'inline-block',
              backgroundColor: 'rgba(249,115,22,0.15)',
              color: '#F97316',
              fontSize: '11px',
              fontWeight: '700',
              padding: '4px 12px',
              borderRadius: '999px',
              border: '1px solid #F97316',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              margin: '0',
            }}>
              {badge}
            </Text>
          </Section>
        )}

        <Text style={styles.h1}>{title}</Text>

        {subtitle && (
          <Text style={{ color: '#9CA3AF', fontSize: '15px', margin: '0 0 20px' }}>
            {subtitle}
          </Text>
        )}

        {imageUrl && (
          <Section style={{ marginBottom: '20px', borderRadius: '12px', overflow: 'hidden' }}>
            <Img src={imageUrl} alt={title} width="480" style={{ borderRadius: '12px', maxWidth: '100%' }} />
          </Section>
        )}

        {highlight && (
          <Section style={{
            backgroundColor: 'rgba(249,115,22,0.1)',
            border: '1px solid rgba(249,115,22,0.3)',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '20px',
          }}>
            <Text style={{ color: '#F97316', fontSize: '22px', fontWeight: '800', margin: '0', textAlign: 'center' }}>
              {highlight}
            </Text>
          </Section>
        )}

        <Text style={styles.paragraph}>{body}</Text>

        <JJButton href={ctaUrl}>{ctaText}</JJButton>

        {expiresAt && (
          <Text style={{ ...styles.noteSmall, textAlign: 'center' }}>
            ⏰ Offre valable jusqu'au <strong style={{ color: '#FFFFFF' }}>{expiresAt}</strong>
          </Text>
        )}
      </Section>
    </JJLayout>
  );
}

export default PromoMarketingEmail;
