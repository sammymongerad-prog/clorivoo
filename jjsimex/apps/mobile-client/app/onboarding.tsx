import { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions,
  Platform, StatusBar, GestureResponderEvent, Animated, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Line, Polyline } from 'react-native-svg';

const { width, height } = Dimensions.get('window');
const ACCENT = '#F97316';
const statusBarH = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 44;

const PHONE_W = width * 0.62;
const PHONE_H = PHONE_W * 1.95;
const BEZEL = 8;
const SCREEN_RADIUS = 28;

function ArrowLeft() {
  return <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><Line x1="19" y1="12" x2="5" y2="12" /><Polyline points="12 19 5 12 12 5" /></Svg>;
}
function ArrowRight({ color = '#FFFFFF' }: { color?: string }) {
  return <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><Line x1="5" y1="12" x2="19" y2="12" /><Polyline points="12 5 19 12 12 19" /></Svg>;
}

const SLIDES = [
  {
    image: require('../assets/images/onboarding/onboarding1.png'),
    titleParts: [{ text: 'Tout gérer depuis un ' }, { text: 'seul endroit', accent: true }],
    desc: 'Suivez vos colis, calculez vos tarifs et gérez vos envois en quelques taps.',
  },
  {
    image: require('../assets/images/onboarding/onboarding2.png'),
    titleParts: [{ text: 'Connaissez votre ' }, { text: 'prix', accent: true }, { text: ' à l\'avance' }],
    desc: 'Calculez le coût exact de votre envoi selon le poids et la destination, instantanément.',
  },
  {
    image: require('../assets/images/onboarding/onboarding3.png'),
    titleParts: [{ text: 'On achète ' }, { text: 'pour vous', accent: true }],
    desc: 'Pas de carte internationale ? Envoyez-nous le lien, on achète et on livre à votre porte.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;
  const touchX = useRef(0);

  function goTo(i: number) {
    const next = Math.max(0, Math.min(SLIDES.length - 1, i));
    if (next === index) return;
    Animated.timing(fade, { toValue: 0, duration: 100, useNativeDriver: true }).start(() => {
      setIndex(next);
      Animated.timing(fade, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  }

  function skip() { router.replace('/(auth)/login'); }
  function onTouchStart(e: GestureResponderEvent) { touchX.current = e.nativeEvent.pageX; }
  function onTouchEnd(e: GestureResponderEvent) {
    const dx = e.nativeEvent.pageX - touchX.current;
    if (dx < -45) goTo(index + 1);
    else if (dx > 45) goTo(index - 1);
  }

  const isLast = index === SLIDES.length - 1;
  const current = SLIDES[index];

  return (
    <View style={s.container} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {/* Skip */}
      <TouchableOpacity onPress={skip} style={s.skipBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
        <Text style={s.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Phone mockup */}
      <Animated.View style={[s.phoneOuter, { opacity: fade }]}>
        {/* Notch */}
        <View style={s.notch} />
        {/* Screen */}
        <View style={s.phoneScreen}>
          <Image source={current.image} style={s.screenImage} resizeMode="cover" />
        </View>
      </Animated.View>

      {/* Text */}
      <Animated.View style={[s.textWrap, { opacity: fade }]}>
        <Text style={s.title}>
          {current.titleParts.map((p, i) => (
            <Text key={i} style={p.accent ? s.titleAccent : undefined}>{p.text}</Text>
          ))}
        </Text>
        <Text style={s.desc}>{current.desc}</Text>
      </Animated.View>

      {/* Bottom: arrows + dots */}
      <View style={s.bottom}>
        {index > 0 ? (
          <TouchableOpacity onPress={() => goTo(index - 1)} style={s.arrowBtnGray} activeOpacity={0.7}>
            <ArrowLeft />
          </TouchableOpacity>
        ) : <View style={{ width: 48 }} />}

        <View style={s.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[s.dot, i === index && s.dotActive]} />
          ))}
        </View>

        <TouchableOpacity onPress={() => isLast ? skip() : goTo(index + 1)} style={s.arrowBtn} activeOpacity={0.85}>
          <ArrowRight />
        </TouchableOpacity>
      </View>

      {/* Last slide: full-width CTA */}
      {isLast && (
        <TouchableOpacity onPress={skip} style={s.cta} activeOpacity={0.9}>
          <Text style={s.ctaText}>Commencer</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D', paddingTop: statusBarH },
  skipBtn: { position: 'absolute', top: statusBarH + 10, right: 24, zIndex: 10 },
  skipText: { fontSize: 15, fontWeight: '500', color: '#9CA3AF' },

  phoneOuter: {
    width: PHONE_W + BEZEL * 2,
    height: PHONE_H + BEZEL * 2,
    backgroundColor: '#1A1A1A',
    borderRadius: SCREEN_RADIUS + BEZEL,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    padding: BEZEL,
    alignSelf: 'center',
    marginTop: statusBarH + 20,
    overflow: 'hidden',
  },
  notch: {
    position: 'absolute',
    top: BEZEL,
    alignSelf: 'center',
    left: (PHONE_W + BEZEL * 2 - 80) / 2,
    width: 80,
    height: 22,
    backgroundColor: '#1A1A1A',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    zIndex: 5,
  },
  phoneScreen: {
    flex: 1,
    borderRadius: SCREEN_RADIUS,
    overflow: 'hidden',
    backgroundColor: '#0D0D0D',
  },
  screenImage: {
    width: '100%',
    height: '100%',
  },

  textWrap: { paddingHorizontal: 30, alignItems: 'center', marginTop: 32 },
  title: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', textAlign: 'center', lineHeight: 30, marginBottom: 10 },
  titleAccent: { color: ACCENT },
  desc: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 21, maxWidth: 300 },

  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 30, marginTop: 'auto', marginBottom: 16 },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2A2A2A' },
  dotActive: { width: 24, backgroundColor: ACCENT },
  arrowBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' },
  arrowBtnGray: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2A2A2A' },

  cta: { marginHorizontal: 24, height: 52, borderRadius: 14, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center', marginBottom: 30 },
  ctaText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
