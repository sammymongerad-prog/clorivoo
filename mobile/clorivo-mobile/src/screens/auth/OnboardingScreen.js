import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { COLORS, RADIUS } from '../../lib/tokens';
import { getOnboardingSlides } from '../../lib/cms';

const FALLBACK_SLIDES = [
  {
    bg_color: '#6C4DFF',
    emoji: '🛍️',
    label: 'lifestyle · shopping',
    title: 'Bienvenue sur clorivo',
    subtitle: 'Des millions de produits, des vendeurs vérifiés, des prix justes — tout au même endroit.',
  },
  {
    bg_color: '#D97706',
    emoji: '⚡',
    label: 'lifestyle · découverte',
    title: 'Des offres toute la journée',
    subtitle: "Ventes flash renouvelées chaque heure. Jusqu'à -80% sur les meilleures sélections.",
  },
  {
    bg_color: '#059669',
    emoji: '🔒',
    label: 'lifestyle · confiance',
    title: 'Achetez en confiance',
    subtitle: 'Vendeurs certifiés, paiements 3D-secure, retours gratuits sous 30 jours.',
  },
];

export default function OnboardingScreen({ navigation }) {
  const [slides, setSlides] = useState([]);
  const [loadingSlides, setLoadingSlides] = useState(true);
  const [step, setStep] = useState(0);

  useEffect(() => {
    getOnboardingSlides()
      .then(data => {
        setSlides(data && data.length > 0 ? data : FALLBACK_SLIDES);
      })
      .catch(() => {
        setSlides(FALLBACK_SLIDES);
      })
      .finally(() => setLoadingSlides(false));
  }, []);

  if (loadingSlides) {
    return (
      <View style={{ flex: 1, backgroundColor: '#6C4DFF', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  const s = slides[step] ?? slides[0];
  const lastStep = slides.length - 1;

  function next() {
    if (step < lastStep) setStep(step + 1);
    else navigation.replace('Login');
  }

  return (
    <View style={{ flex: 1, overflow: 'hidden' }}>
      {/* Full-bleed gradient background */}
      <View style={{ ...StyleSheet_absoluteFill, backgroundColor: s.bg_color }}>
        {/* Decorative circles */}
        <View style={{ position: 'absolute', top: -60, right: -60, width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(255,255,255,0.08)' }} />
        <View style={{ position: 'absolute', top: 100, left: -80, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.05)' }} />
        <View style={{ position: 'absolute', bottom: 240, right: 40, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.06)' }} />
        {/* Big emoji illustration */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 300, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 120 }}>{s.emoji}</Text>
          <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 16, letterSpacing: 1 }}>{s.label}</Text>
        </View>
      </View>

      {/* Vignette */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 340, backgroundColor: 'rgba(14,11,31,0)' }} />

      {/* Skip button */}
      <TouchableOpacity onPress={() => navigation.replace('Login')}
        style={{ position: 'absolute', top: 56, right: 20, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 9999, paddingHorizontal: 16, paddingVertical: 7 }}>
        <Text style={{ fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.9)' }}>Passer</Text>
      </TouchableOpacity>

      {/* Step dots */}
      <View style={{ position: 'absolute', bottom: 306, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6, zIndex: 10 }}>
        {slides.map((_, i) => (
          <View key={i} style={{
            width: i === step ? 20 : 6, height: 6, borderRadius: 9999,
            backgroundColor: i === step ? '#fff' : 'rgba(255,255,255,0.4)',
          }} />
        ))}
      </View>

      {/* Bottom sheet */}
      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 20, borderTopRightRadius: 20,
        paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40,
        zIndex: 10,
      }}>
        {/* Handle */}
        <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.hairline, alignSelf: 'center', marginBottom: 18 }} />

        <Text style={{ fontSize: 24, fontWeight: '800', color: COLORS.ink, letterSpacing: -0.5, marginBottom: 8, lineHeight: 30 }}>
          {s.title}
        </Text>
        <Text style={{ fontSize: 15, color: COLORS.mute, lineHeight: 22, marginBottom: 24 }}>
          {s.subtitle}
        </Text>

        {/* CTA button */}
        <TouchableOpacity onPress={next}
          style={{ backgroundColor: COLORS.primary, borderRadius: RADIUS.full, height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>
            {step < lastStep ? 'Continuer' : 'Commencer'}
          </Text>
          <Text style={{ fontSize: 18, color: '#fff' }}>→</Text>
        </TouchableOpacity>

        {step === 0 && (
          <TouchableOpacity onPress={() => navigation.replace('Login')} style={{ marginTop: 14, alignItems: 'center' }}>
            <Text style={{ fontSize: 14, color: COLORS.mute }}>
              Déjà un compte ?{' '}
              <Text style={{ color: COLORS.primary, fontWeight: '600' }}>Se connecter</Text>
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// Minimal inline helper (no StyleSheet import needed)
const StyleSheet_absoluteFill = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 };
