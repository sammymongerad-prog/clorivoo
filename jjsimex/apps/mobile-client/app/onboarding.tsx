import { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, GestureResponderEvent, Image,
  ImageSourcePropType, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

const ACCENT = '#F97316';
const TITLE_DARK = '#111';
const SUB_GRAY = '#6B7280';
const DOT_INACTIVE = '#D1D5DB';
const DOT_SIZE = 8;
const DOT_ACTIVE_W = 28;
const DOT_FILL_MS = 5000;

interface Segment { text: string; accent?: boolean }
interface Slide {
  image: ImageSourcePropType;
  title: Segment[];
  sub: string;
}

const SLIDES: Slide[] = [
  {
    image: require('../assets/images/onboarding/onboarding1.jpg'),
    title: [{ text: 'Votre adresse US ' }, { text: 'gratuite', accent: true }],
    sub: 'Recevez vos achats Amazon, Shein et Nike directement à notre entrepôt de Miami.',
  },
  {
    image: require('../assets/images/onboarding/onboarding2.jpeg'),
    title: [{ text: 'On ' }, { text: 'expédie', accent: true }, { text: ' pour vous' }],
    sub: 'Par avion en 5 à 7 jours ou par bateau en 3 à 4 semaines. À vous de choisir.',
  },
  {
    image: require('../assets/images/onboarding/onboarding3.jpg'),
    title: [{ text: 'Suivez vos ' }, { text: 'colis', accent: true }, { text: ' en direct' }],
    sub: 'Des notifications à chaque étape, de Miami jusqu\'à votre ville.',
  },
  {
    image: require('../assets/images/onboarding/onboarding4.jpeg'),
    title: [{ text: 'Retirez ' }, { text: 'près de chez vous', accent: true }],
    sub: '23+ points de retrait en Haïti et en République Dominicaine.',
  },
];

function ProgressDot({ active, onPress }: { active: boolean; onPress: () => void }) {
  const fill = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (active) {
      fill.setValue(0);
      Animated.timing(fill, { toValue: 1, duration: DOT_FILL_MS, useNativeDriver: false }).start();
    } else {
      fill.stopAnimation();
      fill.setValue(0);
    }
  }, [active]);
  const fillW = fill.interpolate({ inputRange: [0, 1], outputRange: [0, DOT_ACTIVE_W] });
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View style={[s.dot, { width: active ? DOT_ACTIVE_W : DOT_SIZE }]}>
        {active && <Animated.View style={[s.dotFill, { width: fillW }]} />}
      </View>
    </TouchableOpacity>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const touchX = useRef(0);
  const fade = useRef(new Animated.Value(1)).current;

  function goTo(i: number) {
    const next = Math.max(0, Math.min(SLIDES.length - 1, i));
    if (next === index) return;
    Animated.timing(fade, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      setIndex(next);
      Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    });
  }

  function onTouchStart(e: GestureResponderEvent) { touchX.current = e.nativeEvent.pageX; }
  function onTouchEnd(e: GestureResponderEvent) {
    const dx = e.nativeEvent.pageX - touchX.current;
    if (dx < -45) goTo(index + 1);
    else if (dx > 45) goTo(index - 1);
  }

  const isLast = index === SLIDES.length - 1;
  const current = SLIDES[index];

  return (
    <View style={s.container}>
      <StatusBar style="light" />

      {/* Image full-bleed : position absolute, remplit tout l'écran derrière la carte */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: fade }]}>
        <Image source={current.image} style={s.image} resizeMode="cover" />
      </Animated.View>

      {/* Spacer swipeable qui pousse la carte en bas */}
      <View style={s.swipeZone} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {/* Gradient blanc en bas de l'image pour transition douce */}
        <View style={s.gradientWrap} pointerEvents="none">
          <View style={[s.gradientStep, { opacity: 0.05 }]} />
          <View style={[s.gradientStep, { opacity: 0.12 }]} />
          <View style={[s.gradientStep, { opacity: 0.25 }]} />
          <View style={[s.gradientStep, { opacity: 0.4 }]} />
          <View style={[s.gradientStep, { opacity: 0.6 }]} />
          <View style={[s.gradientStep, { opacity: 0.78 }]} />
          <View style={[s.gradientStep, { opacity: 0.92 }]} />
          <View style={[s.gradientStep, { opacity: 1 }]} />
        </View>
      </View>

      {/* Carte blanche */}
      <View style={s.card}>
        <Text style={s.title}>
          {current.title.map((seg, i) => (
            <Text key={i} style={seg.accent ? s.titleAccent : undefined}>{seg.text}</Text>
          ))}
        </Text>
        <Text style={s.sub}>{current.sub}</Text>

        <View style={s.dots}>
          {SLIDES.map((_, i) => (
            <ProgressDot key={i} active={i === index} onPress={() => goTo(i)} />
          ))}
        </View>

        {isLast ? (
          <TouchableOpacity
            style={s.cta}
            activeOpacity={0.9}
            onPress={() => router.replace('/(auth)/login')}
          >
            <Text style={s.ctaText}>Commencer</Text>
          </TouchableOpacity>
        ) : (
          <View style={s.actions}>
            <TouchableOpacity style={s.pill} activeOpacity={0.85} onPress={() => goTo(index + 1)}>
              <Text style={s.pillText}>Next</Text>
              <Text style={s.pillArrow}>→</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.replace('/(auth)/login')}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={s.skipText}>Skip</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  // Container blanc → coins arrondis de la carte ne montrent jamais du noir
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  // Image absolue, couvre tout l'écran dès y=0
  image: { width: '100%', height: '100%' },

  gradientWrap: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: 120,
  },
  gradientStep: {
    flex: 1, backgroundColor: '#FFFFFF',
  },

  // Zone swipeable invisible qui prend tout l'espace au-dessus de la carte
  swipeZone: { flex: 1 },

  card: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 26,
    paddingTop: 26,
    paddingBottom: 36,
  },
  title: {
    fontWeight: '800', fontSize: 25, letterSpacing: -0.5,
    color: TITLE_DARK, textAlign: 'center', lineHeight: 32,
  },
  titleAccent: { color: ACCENT },
  sub: {
    marginTop: 10, fontSize: 14, lineHeight: 21,
    color: SUB_GRAY, textAlign: 'center', maxWidth: 300, alignSelf: 'center',
  },
  dots: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginTop: 22, height: 20,
  },
  dot: {
    height: DOT_SIZE, borderRadius: 99,
    backgroundColor: DOT_INACTIVE, overflow: 'hidden',
  },
  dotFill: {
    position: 'absolute', top: 0, left: 0,
    height: DOT_SIZE, borderRadius: 99, backgroundColor: ACCENT,
  },
  actions: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 24,
  },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    height: 46, paddingHorizontal: 24, borderRadius: 99, backgroundColor: ACCENT,
  },
  pillText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  pillArrow: { color: '#fff', fontWeight: '600', fontSize: 16 },
  skipText: { color: SUB_GRAY, fontWeight: '500', fontSize: 15, paddingHorizontal: 8 },
  cta: {
    marginTop: 24, width: '100%', height: 52, borderRadius: 14,
    backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center',
  },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
