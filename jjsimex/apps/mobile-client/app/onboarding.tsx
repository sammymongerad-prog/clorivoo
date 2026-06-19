import { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, GestureResponderEvent, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Svg, {
  Defs, LinearGradient, Stop, Rect, Circle, Path, G,
  Ellipse, Line,
} from 'react-native-svg';

const { width } = Dimensions.get('window');

const ACCENT = '#F97316';
const DARK = '#1F2937';
const CARD = '#FFFFFF';
const TITLE_DARK = '#111';
const SUB_GRAY = '#6B7280';
const DOT_INACTIVE = '#D1D5DB';
const DOT_SIZE = 8;
const DOT_ACTIVE_W = 28;
const DOT_FILL_MS = 5000;

const VB_W = 300;
const VB_H = 380;

// Dégradé bas → blanc (transition douce vers la carte), commun à toutes les scènes
function FadeToWhite() {
  return (
    <>
      <Defs>
        <LinearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0.7" stopColor="#FFFFFF" stopOpacity="0" />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity="1" />
        </LinearGradient>
      </Defs>
      <Rect x="0" y={VB_H * 0.6} width={VB_W} height={VB_H * 0.4} fill="url(#fade)" />
    </>
  );
}

// ── Scène 1 : Adresse US gratuite (entrepôt + pin) ──────────────────
function Scene1() {
  return (
    <Svg width="100%" height="100%" viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMidYMid slice">
      <Rect x="0" y="0" width={VB_W} height={VB_H} fill="#FFF3E9" />
      {/* sol */}
      <Ellipse cx="150" cy="285" rx="120" ry="22" fill="#FCE3CE" />
      {/* entrepôt */}
      <Rect x="80" y="170" width="140" height="100" rx="6" fill="#FFFFFF" stroke={DARK} strokeWidth="3" />
      <Path d="M75 172 L150 130 L225 172 Z" fill={ACCENT} stroke={DARK} strokeWidth="3" strokeLinejoin="round" />
      <Rect x="100" y="210" width="45" height="60" rx="3" fill="#FFEAD7" stroke={DARK} strokeWidth="2.5" />
      <Rect x="160" y="210" width="40" height="34" rx="3" fill="#FFEAD7" stroke={DARK} strokeWidth="2.5" />
      {/* colis */}
      <Rect x="160" y="244" width="40" height="26" fill="#FDBA74" stroke={DARK} strokeWidth="2.5" />
      <Line x1="180" y1="244" x2="180" y2="270" stroke={DARK} strokeWidth="2" />
      {/* pin localisation */}
      <G>
        <Path d="M150 70 C128 70 112 86 112 108 C112 138 150 175 150 175 C150 175 188 138 188 108 C188 86 172 70 150 70 Z"
          fill={ACCENT} stroke={DARK} strokeWidth="3" strokeLinejoin="round" />
        <Circle cx="150" cy="108" r="16" fill="#FFFFFF" stroke={DARK} strokeWidth="3" />
      </G>
      <FadeToWhite />
    </Svg>
  );
}

// ── Scène 2 : Expédition avion / bateau ─────────────────────────────
function Scene2() {
  return (
    <Svg width="100%" height="100%" viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMidYMid slice">
      <Rect x="0" y="0" width={VB_W} height={VB_H} fill="#E0F2FE" />
      {/* nuages */}
      <Ellipse cx="70" cy="90" rx="34" ry="20" fill="#FFFFFF" />
      <Ellipse cx="100" cy="95" rx="26" ry="16" fill="#FFFFFF" />
      <Ellipse cx="235" cy="130" rx="30" ry="18" fill="#FFFFFF" />
      {/* avion */}
      <G>
        <Path d="M90 150 L210 130 C222 128 230 138 222 146 L150 175 L120 170 L132 152 L108 156 L96 168 L86 166 L94 150 Z"
          fill={ACCENT} stroke={DARK} strokeWidth="3" strokeLinejoin="round" />
        <Path d="M150 138 L175 118 L182 120 L168 142 Z" fill="#FDBA74" stroke={DARK} strokeWidth="2.5" strokeLinejoin="round" />
        <Circle cx="135" cy="150" r="3.5" fill="#FFFFFF" stroke={DARK} strokeWidth="1.5" />
        <Circle cx="150" cy="148" r="3.5" fill="#FFFFFF" stroke={DARK} strokeWidth="1.5" />
      </G>
      {/* trajectoire pointillée */}
      <Path d="M60 200 Q150 150 250 195" stroke={ACCENT} strokeWidth="3" strokeDasharray="2 9" strokeLinecap="round" fill="none" />
      {/* mer + bateau */}
      <Path d={`M0 250 Q75 238 150 250 T300 250 L300 ${VB_H} L0 ${VB_H} Z`} fill="#7DD3FC" />
      <Path d={`M0 264 Q75 252 150 264 T300 264 L300 ${VB_H} L0 ${VB_H} Z`} fill="#38BDF8" opacity="0.6" />
      <G>
        <Path d="M118 250 L182 250 L172 272 L128 272 Z" fill="#FFFFFF" stroke={DARK} strokeWidth="3" strokeLinejoin="round" />
        <Rect x="138" y="234" width="24" height="16" fill={ACCENT} stroke={DARK} strokeWidth="2.5" />
        <Line x1="150" y1="216" x2="150" y2="234" stroke={DARK} strokeWidth="2.5" />
      </G>
      <FadeToWhite />
    </Svg>
  );
}

// ── Scène 3 : Suivi de colis (téléphone + itinéraire) ───────────────
function Scene3() {
  return (
    <Svg width="100%" height="100%" viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMidYMid slice">
      <Rect x="0" y="0" width={VB_W} height={VB_H} fill="#FFF7ED" />
      <Ellipse cx="150" cy="300" rx="120" ry="20" fill="#FCE3CE" />
      {/* téléphone */}
      <Rect x="95" y="70" width="110" height="210" rx="20" fill="#FFFFFF" stroke={DARK} strokeWidth="3.5" />
      <Rect x="105" y="92" width="90" height="120" rx="8" fill="#FFF3E9" />
      {/* itinéraire dans l'écran */}
      <Path d="M120 195 Q120 150 150 150 Q180 150 165 115" stroke={ACCENT} strokeWidth="3.5" strokeDasharray="2 7" strokeLinecap="round" fill="none" />
      <Circle cx="120" cy="195" r="7" fill="#FDBA74" stroke={DARK} strokeWidth="2.5" />
      {/* pin destination */}
      <Path d="M165 95 C156 95 150 101 150 110 C150 122 165 135 165 135 C165 135 180 122 180 110 C180 101 174 95 165 95 Z"
        fill={ACCENT} stroke={DARK} strokeWidth="2.5" strokeLinejoin="round" />
      <Circle cx="165" cy="110" r="5" fill="#FFFFFF" />
      {/* barre de progression + statut */}
      <Rect x="108" y="228" width="84" height="8" rx="4" fill="#FDE3CC" />
      <Rect x="108" y="228" width="48" height="8" rx="4" fill={ACCENT} />
      <Circle cx="120" cy="255" r="5" fill={ACCENT} />
      <Circle cx="150" cy="255" r="5" fill={ACCENT} />
      <Circle cx="180" cy="255" r="5" fill="#E5E7EB" />
      {/* colis flottant */}
      <G>
        <Rect x="200" y="150" width="46" height="40" rx="4" fill={ACCENT} stroke={DARK} strokeWidth="3" />
        <Path d="M200 162 L246 162" stroke={DARK} strokeWidth="2.5" />
        <Path d="M223 150 L223 190" stroke={DARK} strokeWidth="2.5" />
      </G>
      <FadeToWhite />
    </Svg>
  );
}

// ── Scène 4 : Points de retrait (carte + pins) ──────────────────────
function Scene4() {
  return (
    <Svg width="100%" height="100%" viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMidYMid slice">
      <Rect x="0" y="0" width={VB_W} height={VB_H} fill="#ECFDF5" />
      {/* carte */}
      <Rect x="55" y="80" width="190" height="180" rx="14" fill="#FFFFFF" stroke={DARK} strokeWidth="3" />
      {/* routes */}
      <Path d="M55 150 Q120 130 150 160 T245 150" stroke="#A7F3D0" strokeWidth="6" fill="none" />
      <Path d="M110 80 L120 160 L100 260" stroke="#D1FAE5" strokeWidth="6" fill="none" />
      <Path d="M55 210 Q140 200 245 220" stroke="#A7F3D0" strokeWidth="6" fill="none" />
      {/* pins */}
      <Pin x={105} y={120} />
      <Pin x={180} y={150} />
      <Pin x={140} y={205} />
      <FadeToWhite />
    </Svg>
  );
}
function Pin({ x, y }: { x: number; y: number }) {
  return (
    <G>
      <Path d={`M${x} ${y} C${x - 14} ${y} ${x - 24} ${y + 10} ${x - 24} ${y + 24} C${x - 24} ${y + 42} ${x} ${y + 64} ${x} ${y + 64} C${x} ${y + 64} ${x + 24} ${y + 42} ${x + 24} ${y + 24} C${x + 24} ${y + 10} ${x + 14} ${y} ${x} ${y} Z`}
        fill={ACCENT} stroke={DARK} strokeWidth="3" strokeLinejoin="round" />
      <Circle cx={x} cy={y + 24} r="9" fill="#FFFFFF" stroke={DARK} strokeWidth="2.5" />
    </G>
  );
}

const SCENES = [Scene1, Scene2, Scene3, Scene4];

interface Segment { text: string; accent?: boolean }
const SLIDE_TEXT: { title: Segment[]; sub: string }[] = [
  {
    title: [{ text: 'Votre adresse US ' }, { text: 'gratuite', accent: true }],
    sub: 'Recevez vos achats en ligne directement à notre entrepôt de Miami.',
  },
  {
    title: [{ text: 'On ' }, { text: 'expédie', accent: true }, { text: ' pour vous' }],
    sub: 'Par avion en 5 à 7 jours ou par bateau en 3 à 4 semaines. À vous de choisir.',
  },
  {
    title: [{ text: 'Suivez vos ' }, { text: 'colis', accent: true }, { text: ' en direct' }],
    sub: 'Des notifications à chaque étape, de Miami jusqu\'à votre ville.',
  },
  {
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
    const next = Math.max(0, Math.min(SCENES.length - 1, i));
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

  const isLast = index === SCENES.length - 1;
  const Scene = SCENES[index];
  const text = SLIDE_TEXT[index];

  return (
    <View style={s.container}>
      <StatusBar style="dark" />

      {/* Illustration full-bleed dès y=0 */}
      <Animated.View
        style={[s.imageArea, { opacity: fade }]}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <Scene />
      </Animated.View>

      {/* Carte blanche bas */}
      <View style={s.card}>
        <Text style={s.title}>
          {text.title.map((seg, i) => (
            <Text key={i} style={seg.accent ? s.titleAccent : undefined}>{seg.text}</Text>
          ))}
        </Text>
        <Text style={s.sub}>{text.sub}</Text>

        <View style={s.dots}>
          {SCENES.map((_, i) => (
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
  container: { flex: 1, backgroundColor: CARD },
  imageArea: { flex: 1, overflow: 'hidden' },

  card: {
    backgroundColor: CARD,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -28,
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
