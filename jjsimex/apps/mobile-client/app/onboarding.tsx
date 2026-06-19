import { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, GestureResponderEvent, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

const ACCENT = '#F97316';
const ACCENT_LIGHT = '#FFF7ED';
const BG = '#FAFAFA';
const CARD = '#FFFFFF';
const TITLE_DARK = '#111';
const SUB_GRAY = '#6B7280';
const BORDER = '#E5E7EB';
const DOT_INACTIVE = '#D1D5DB';
const DOT_SIZE = 8;
const DOT_ACTIVE_W = 28;
const DOT_FILL_MS = 5000;

// ── Phone Mockup ────────────────────────────────────────────────────
function PhoneMockup({ children }: { children: React.ReactNode }) {
  return (
    <View style={phone.outer}>
      <View style={phone.frame}>
        {/* Notch */}
        <View style={phone.notch} />
        {/* Screen */}
        <View style={phone.screen}>
          {children}
        </View>
      </View>
    </View>
  );
}

const PHONE_W = width * 0.52;
const PHONE_H = PHONE_W * 2;
const PHONE_R = 28;
const phone = StyleSheet.create({
  outer: { alignItems: 'center', justifyContent: 'center', height: PHONE_H + 20 },
  frame: {
    width: PHONE_W,
    height: PHONE_H,
    borderRadius: PHONE_R,
    borderWidth: 2.5,
    borderColor: '#1A1A1A',
    backgroundColor: '#F5F5F5',
    overflow: 'hidden',
    position: 'relative',
  },
  notch: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    width: PHONE_W * 0.35,
    height: 20,
    backgroundColor: '#1A1A1A',
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    zIndex: 10,
    left: PHONE_W * 0.5 - (PHONE_W * 0.35) / 2 - 2.5,
  },
  screen: { flex: 1, paddingTop: 30, paddingHorizontal: 8, paddingBottom: 8 },
});

// ── Floating Card ───────────────────────────────────────────────────
function FloatingCard({ style, children }: { style?: any; children: React.ReactNode }) {
  return (
    <View style={[fc.card, style]}>
      {children}
    </View>
  );
}
const fc = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
});

// ── Slide 1: Adresse US ─────────────────────────────────────────────
function Slide1() {
  return (
    <PhoneMockup>
      <View style={{ flex: 1, justifyContent: 'center', gap: 12, paddingHorizontal: 4 }}>
        <FloatingCard>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={[ui.iconCircle, { backgroundColor: ACCENT_LIGHT }]}>
              <Text style={{ fontSize: 18 }}>📍</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={ui.cardLabel}>Votre adresse US</Text>
              <Text style={ui.cardValue}>15490 NW 7th Ave</Text>
              <Text style={ui.cardSub}>Miami, FL 33169</Text>
            </View>
          </View>
        </FloatingCard>
        <FloatingCard>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={[ui.iconCircle, { backgroundColor: '#EFF6FF' }]}>
              <Text style={{ fontSize: 18 }}>📦</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={ui.cardLabel}>Suite personnelle</Text>
              <Text style={[ui.cardValue, { color: ACCENT }]}>JJUS-84291</Text>
            </View>
            <View style={ui.badge}><Text style={ui.badgeText}>Gratuit</Text></View>
          </View>
        </FloatingCard>
      </View>
    </PhoneMockup>
  );
}

// ── Slide 2: Expédition ─────────────────────────────────────────────
function Slide2() {
  return (
    <PhoneMockup>
      <View style={{ flex: 1, justifyContent: 'center', gap: 12, paddingHorizontal: 4 }}>
        <FloatingCard>
          <Text style={[ui.cardLabel, { marginBottom: 10 }]}>Mode d'expédition</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={[ui.optionBox, ui.optionActive]}>
              <Text style={{ fontSize: 20 }}>✈️</Text>
              <Text style={[ui.optionLabel, { color: ACCENT }]}>Avion</Text>
              <Text style={ui.optionSub}>5-7 jours</Text>
            </View>
            <View style={ui.optionBox}>
              <Text style={{ fontSize: 20 }}>🚢</Text>
              <Text style={ui.optionLabel}>Bateau</Text>
              <Text style={ui.optionSub}>3-4 sem.</Text>
            </View>
          </View>
        </FloatingCard>
        <FloatingCard>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={ui.cardLabel}>Estimation</Text>
              <Text style={[ui.cardValue, { fontSize: 18, color: ACCENT }]}>$8.50</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={ui.cardSub}>2.3 lbs</Text>
              <Text style={ui.cardSub}>Miami → PAP</Text>
            </View>
          </View>
        </FloatingCard>
      </View>
    </PhoneMockup>
  );
}

// ── Slide 3: Suivi de colis ─────────────────────────────────────────
function Slide3() {
  const steps = [
    { label: 'Entrepôt', done: true },
    { label: 'En transit', done: true },
    { label: 'Douane', done: false },
    { label: 'Livré', done: false },
  ];
  return (
    <PhoneMockup>
      <View style={{ flex: 1, justifyContent: 'center', gap: 12, paddingHorizontal: 4 }}>
        <FloatingCard>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <View style={[ui.iconCircle, { backgroundColor: '#ECFDF5' }]}>
              <Text style={{ fontSize: 18 }}>📦</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={ui.cardLabel}>JJPK-29401</Text>
              <Text style={ui.cardSub}>Amazon — 2.3 lbs</Text>
            </View>
            <View style={[ui.badge, { backgroundColor: '#FFF3E9' }]}>
              <Text style={[ui.badgeText, { color: ACCENT }]}>En transit</Text>
            </View>
          </View>
          {/* Progress bar */}
          <View style={ui.progressTrack}>
            <View style={[ui.progressFill, { width: '50%' }]} />
          </View>
          {/* Steps */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            {steps.map((s, i) => (
              <View key={i} style={{ alignItems: 'center', flex: 1 }}>
                <View style={[ui.stepDot, s.done && ui.stepDotDone]} />
                <Text style={[ui.stepLabel, s.done && { color: TITLE_DARK }]}>{s.label}</Text>
              </View>
            ))}
          </View>
        </FloatingCard>
      </View>
    </PhoneMockup>
  );
}

// ── Slide 4: Points de retrait ──────────────────────────────────────
function Slide4() {
  const cities = [
    { name: 'Port-au-Prince', flag: '🇭🇹' },
    { name: 'Cap-Haïtien', flag: '🇭🇹' },
    { name: 'Santo Domingo', flag: '🇩🇴' },
  ];
  return (
    <PhoneMockup>
      <View style={{ flex: 1, justifyContent: 'center', gap: 10, paddingHorizontal: 4 }}>
        <FloatingCard>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <View style={[ui.iconCircle, { backgroundColor: '#FFF3E9' }]}>
              <Text style={{ fontSize: 18 }}>🏪</Text>
            </View>
            <View>
              <Text style={ui.cardLabel}>Points de retrait</Text>
              <Text style={[ui.cardValue, { color: ACCENT }]}>23+ villes</Text>
            </View>
          </View>
          {cities.map((c, i) => (
            <View key={i} style={[ui.cityRow, i < cities.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }]}>
              <Text style={{ fontSize: 16 }}>{c.flag}</Text>
              <Text style={ui.cityName}>{c.name}</Text>
              <Text style={{ color: '#10B981', fontSize: 11, fontWeight: '600' }}>Ouvert</Text>
            </View>
          ))}
        </FloatingCard>
      </View>
    </PhoneMockup>
  );
}

const ui = StyleSheet.create({
  iconCircle: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  cardLabel: { fontSize: 12, fontWeight: '600', color: SUB_GRAY, letterSpacing: 0.2 },
  cardValue: { fontSize: 14, fontWeight: '700', color: TITLE_DARK, marginTop: 1 },
  cardSub: { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
  badge: {
    backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#059669' },
  optionBox: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: BORDER,
    backgroundColor: '#FAFAFA',
  },
  optionActive: { borderColor: ACCENT, backgroundColor: '#FFF7ED' },
  optionLabel: { fontSize: 13, fontWeight: '700', color: TITLE_DARK },
  optionSub: { fontSize: 10, color: SUB_GRAY },
  progressTrack: {
    height: 5, borderRadius: 99, backgroundColor: '#E5E7EB', overflow: 'hidden',
  },
  progressFill: { height: 5, borderRadius: 99, backgroundColor: ACCENT },
  stepDot: {
    width: 8, height: 8, borderRadius: 99,
    backgroundColor: '#E5E7EB', marginBottom: 4,
  },
  stepDotDone: { backgroundColor: ACCENT },
  stepLabel: { fontSize: 8, color: '#9CA3AF', textAlign: 'center' },
  cityRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 9,
  },
  cityName: { flex: 1, fontSize: 13, fontWeight: '600', color: TITLE_DARK },
});

// ── Slide content & data ────────────────────────────────────────────
const SLIDE_COMPONENTS = [Slide1, Slide2, Slide3, Slide4];

interface Segment { text: string; accent?: boolean }
const SLIDE_TEXT: { title: Segment[]; sub: string }[] = [
  {
    title: [{ text: 'Votre adresse US ' }, { text: 'gratuite', accent: true }],
    sub: 'Recevez vos achats en ligne directement à notre entrepôt de Miami.',
  },
  {
    title: [{ text: 'On ' }, { text: 'expédie', accent: true }, { text: ' pour vous' }],
    sub: 'Choisissez avion ou bateau, on s\'occupe du reste.',
  },
  {
    title: [{ text: 'Suivez vos ' }, { text: 'colis', accent: true }, { text: ' en direct' }],
    sub: 'Notifications à chaque étape, de Miami jusqu\'à chez vous.',
  },
  {
    title: [{ text: 'Retirez ' }, { text: 'près de chez vous', accent: true }],
    sub: '23+ points de retrait en Haïti et en République Dominicaine.',
  },
];

// ── Progress Dot ────────────────────────────────────────────────────
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

// ── Main ────────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const touchX = useRef(0);
  const fade = useRef(new Animated.Value(1)).current;

  function goTo(i: number) {
    const next = Math.max(0, Math.min(SLIDE_COMPONENTS.length - 1, i));
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

  const isLast = index === SLIDE_COMPONENTS.length - 1;
  const SlideComponent = SLIDE_COMPONENTS[index];
  const text = SLIDE_TEXT[index];

  return (
    <View style={s.container}>
      <StatusBar style="dark" />

      {/* Phone illustration */}
      <Animated.View
        style={[s.phoneArea, { opacity: fade }]}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <SlideComponent />
      </Animated.View>

      {/* Bottom text + dots + button */}
      <View style={s.bottom}>
        <Text style={s.title}>
          {text.title.map((seg, i) => (
            <Text key={i} style={seg.accent ? s.titleAccent : undefined}>{seg.text}</Text>
          ))}
        </Text>
        <Text style={s.sub}>{text.sub}</Text>

        <View style={s.dots}>
          {SLIDE_COMPONENTS.map((_, i) => (
            <ProgressDot key={i} active={i === index} onPress={() => goTo(i)} />
          ))}
        </View>

        <TouchableOpacity
          style={s.cta}
          activeOpacity={0.9}
          onPress={() => {
            if (isLast) router.replace('/(auth)/login');
            else goTo(index + 1);
          }}
        >
          <Text style={s.ctaText}>{isLast ? 'Commencer' : 'Suivant'}</Text>
        </TouchableOpacity>

        {!isLast && (
          <TouchableOpacity
            onPress={() => router.replace('/(auth)/login')}
            style={s.skipBtn}
            hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }}
          >
            <Text style={s.skipText}>Passer</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  phoneArea: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 20 },

  bottom: { paddingHorizontal: 28, paddingBottom: 34 },
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
  cta: {
    marginTop: 24, width: '100%', height: 52, borderRadius: 14,
    backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center',
  },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  skipBtn: { marginTop: 14, alignSelf: 'center' },
  skipText: { color: SUB_GRAY, fontWeight: '500', fontSize: 14 },
});
