import { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, ScrollView, GestureResponderEvent,
} from 'react-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    caption: 'colis  →  entrepôt Miami',
    title: 'Votre adresse US, gratuite',
    sub: 'Recevez vos achats Amazon, Shein et Nike directement à Miami.',
  },
  {
    caption: 'avion / bateau\nMiami → Haïti',
    title: 'On expédie pour vous',
    sub: 'Avion en 5-7 jours ou bateau en 3-4 semaines. Vous choisissez.',
  },
  {
    caption: 'retrait colis\nen succursale',
    title: 'Retirez près de chez vous',
    sub: '23+ villes en Haïti et en République Dominicaine.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const touchX = useRef(0);

  function goTo(i: number) {
    const next = Math.max(0, Math.min(SLIDES.length - 1, i));
    setIndex(next);
    scrollRef.current?.scrollTo({ x: next * width, animated: true });
  }

  function onTouchStart(e: GestureResponderEvent) {
    touchX.current = e.nativeEvent.pageX;
  }

  function onTouchEnd(e: GestureResponderEvent) {
    const dx = e.nativeEvent.pageX - touchX.current;
    if (dx < -45) goTo(index + 1);
    else if (dx > 45) goTo(index - 1);
  }

  const isLast = index === SLIDES.length - 1;

  return (
    <View style={styles.container}>
      {/* Barre haut — Passer */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => goTo(SLIDES.length - 1)}
          style={{ opacity: isLast ? 0 : 1 }}
          pointerEvents={isLast ? 'none' : 'auto'}
        >
          <Text style={styles.passerText}>Passer</Text>
        </TouchableOpacity>
      </View>

      {/* Zone slides */}
      <View style={styles.slidesArea} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          style={{ width: SLIDES.length * width }}
        >
          {SLIDES.map((slide, i) => (
            <View key={i} style={[styles.slide, { width }]}>
              {/* Illustration placeholder */}
              <View style={styles.illustration}>
                <View style={styles.illustrationBg} />
                <Text style={styles.illustrationLabel}>ILLUSTRATION</Text>
                <View style={styles.illustrationIcon}>
                  <View style={styles.illustrationDot} />
                </View>
                <Text style={styles.caption}>{slide.caption}</Text>
              </View>

              {/* Textes */}
              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.sub}>{slide.sub}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Bas : dots + CTA */}
      <View style={styles.bottom}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => goTo(i)}>
              <View style={[styles.dot, i === index && styles.dotActive]} />
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={styles.cta}
          onPress={() => {
            if (isLast) router.replace('/(auth)/login');
            else goTo(index + 1);
          }}
          activeOpacity={0.9}
        >
          <Text style={styles.ctaText}>{isLast ? 'Commencer' : 'Suivant'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  topBar: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 22,
  },
  passerText: { color: '#9CA3AF', fontSize: 14, fontWeight: '500' },
  slidesArea: { flex: 1, overflow: 'hidden' },
  slide: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 8,
  },
  illustration: {
    width: 280,
    height: 300,
    marginTop: 18,
    borderRadius: 24,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  illustrationBg: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'transparent',
  },
  illustrationLabel: {
    position: 'absolute',
    top: 14,
    left: 16,
    fontSize: 10,
    letterSpacing: 1,
    color: '#4B5563',
    fontFamily: 'monospace',
  },
  illustrationIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(249,115,22,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationDot: {
    width: 18,
    height: 18,
    borderRadius: 5,
    backgroundColor: '#F97316',
  },
  caption: {
    fontSize: 12,
    lineHeight: 18,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: 200,
    fontFamily: 'monospace',
  },
  title: {
    marginTop: 42,
    fontWeight: '700',
    fontSize: 27,
    letterSpacing: -0.6,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 33,
  },
  sub: {
    marginTop: 14,
    fontWeight: '400',
    fontSize: 15,
    lineHeight: 23,
    color: '#9CA3AF',
    textAlign: 'center',
    maxWidth: 290,
  },
  bottom: { paddingHorizontal: 28, paddingBottom: 40 },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 28,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  dotActive: {
    width: 22,
    backgroundColor: '#F97316',
  },
  cta: {
    marginTop: 22,
    width: '100%',
    height: 54,
    borderRadius: 12,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { color: '#0D0D0D', fontWeight: '700', fontSize: 16, letterSpacing: 0.2 },
});
