import { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions,
  ScrollView, Platform, StatusBar, GestureResponderEvent,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path, Polyline, Rect, Line, Circle } from 'react-native-svg';

const { width, height } = Dimensions.get('window');
const ACCENT = '#F97316';
const statusBarH = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 44;

/* ── Mini SVG Icons for mockups ── */
function MiniTag({ size = 14, color = ACCENT }: { size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><Line x1="7" y1="7" x2="7.01" y2="7" /></Svg>;
}
function MiniPlane({ size = 14, color = ACCENT }: { size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" /></Svg>;
}
function MiniBook({ size = 14, color = ACCENT }: { size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><Path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></Svg>;
}
function MiniPackage({ size = 14, color = ACCENT }: { size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><Path d="m3.27 6.96 8.73 5.05 8.73-5.05" /><Path d="M12 22.08V12" /></Svg>;
}
function MiniCart({ size = 14, color = ACCENT }: { size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Circle cx="9" cy="21" r="1" /><Circle cx="20" cy="21" r="1" /><Path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></Svg>;
}
function MiniHome({ size = 14, color = ACCENT }: { size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><Polyline points="9 22 9 12 15 12 15 22" /></Svg>;
}
function MiniArrowLeft({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><Line x1="19" y1="12" x2="5" y2="12" /><Polyline points="12 19 5 12 12 5" /></Svg>;
}
function MiniArrowRight({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><Line x1="5" y1="12" x2="19" y2="12" /><Polyline points="12 5 19 12 12 19" /></Svg>;
}
function MiniLink({ size = 14, color = '#6B7280' }: { size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><Path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></Svg>;
}
function MiniChevronDown({ size = 10, color = '#6B7280' }: { size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><Polyline points="6 9 12 15 18 9" /></Svg>;
}

/* ── Mockup 1: Dashboard ── */
function MockupDashboard() {
  const stories = [
    { Icon: MiniTag, label: 'Offres', active: true },
    { Icon: MiniPlane, label: 'Départs', active: true },
    { Icon: MiniBook, label: 'Guide', active: true },
  ];
  return (
    <View style={m.phone}>
      {/* Stories */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 14, marginBottom: 12, marginTop: 8 }}>
        {stories.map((s, i) => (
          <View key={i} style={{ alignItems: 'center', gap: 4 }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: s.active ? ACCENT : '#2A2A2A', backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center' }}>
              <s.Icon size={16} color={s.active ? ACCENT : '#6B7280'} />
            </View>
            <Text style={{ fontSize: 8, color: '#9CA3AF' }}>{s.label}</Text>
          </View>
        ))}
      </View>
      {/* Banner */}
      <View style={{ backgroundColor: '#1E1B4B', borderRadius: 10, padding: 12, marginBottom: 10 }}>
        <Text style={{ fontSize: 11, fontWeight: '800', color: '#FFFFFF', marginBottom: 3 }}>{'15% de réduction\nsur le mode bateau'}</Text>
        <Text style={{ fontSize: 7, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>Offre limitée — expire bientôt</Text>
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' }}>
          <Text style={{ fontSize: 8, fontWeight: '700', color: '#1E1B4B' }}>En profiter</Text>
        </View>
      </View>
      {/* Quick actions */}
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {[{ Icon: MiniPackage, label: 'Tracker' }, { Icon: MiniCart, label: 'Shopper' }].map((a, i) => (
          <View key={i} style={{ flex: 1, backgroundColor: '#1A1A1A', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#242424' }}>
            <View style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: 'rgba(249,115,22,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
              <a.Icon size={12} />
            </View>
            <Text style={{ fontSize: 8, fontWeight: '700', color: '#FFFFFF' }}>{a.label}</Text>
          </View>
        ))}
      </View>
      {/* Bottom nav mini */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 12, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#2A2A2A' }}>
        <MiniHome size={12} color={ACCENT} />
        <MiniPackage size={12} color="#666" />
        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#0D0D0D" strokeWidth="2.5"><Rect x="3" y="3" width="7" height="7" rx="1" /><Rect x="14" y="3" width="7" height="7" rx="1" /><Rect x="3" y="14" width="7" height="7" rx="1" /></Svg>
        </View>
        <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2"><Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /></Svg>
        <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2"><Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><Circle cx="12" cy="7" r="4" /></Svg>
      </View>
    </View>
  );
}

/* ── Mockup 2: Calculateur ── */
function MockupCalculateur() {
  return (
    <View style={m.phone}>
      {/* Weight section */}
      <Text style={{ fontSize: 9, fontWeight: '600', color: '#9CA3AF', marginBottom: 4 }}>Poids estimé</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <View style={{ height: 4, flex: 1, backgroundColor: '#2A2A2A', borderRadius: 2, marginRight: 8 }}>
          <View style={{ width: '35%', height: '100%', backgroundColor: ACCENT, borderRadius: 2 }} />
        </View>
        <Text style={{ fontSize: 11, fontWeight: '700', color: ACCENT }}>3.5 lbs</Text>
      </View>
      {/* Value section */}
      <Text style={{ fontSize: 9, fontWeight: '600', color: '#9CA3AF', marginBottom: 4 }}>Valeur du colis</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <View style={{ height: 4, flex: 1, backgroundColor: '#2A2A2A', borderRadius: 2, marginRight: 8 }}>
          <View style={{ width: '9%', height: '100%', backgroundColor: ACCENT, borderRadius: 2 }} />
        </View>
        <Text style={{ fontSize: 11, fontWeight: '700', color: ACCENT }}>$45</Text>
      </View>
      {/* Result card */}
      <View style={{ backgroundColor: '#1A1A1A', borderRadius: 12, borderWidth: 1.5, borderColor: ACCENT, padding: 14, alignItems: 'center' }}>
        <Text style={{ fontSize: 9, color: '#9CA3AF', marginBottom: 2 }}>Votre estimation</Text>
        <Text style={{ fontSize: 28, fontWeight: '900', color: '#FFFFFF' }}>$12.50</Text>
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
          <View style={{ backgroundColor: '#2A2A2A', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Text style={{ fontSize: 8, fontWeight: '600', color: '#FFFFFF' }}>3.5 lbs facturés</Text>
          </View>
          <View style={{ backgroundColor: ACCENT, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Text style={{ fontSize: 8, fontWeight: '700', color: '#FFFFFF' }}>✈ Avion</Text>
          </View>
        </View>
        <View style={{ backgroundColor: '#2A2A2A', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginTop: 6 }}>
          <Text style={{ fontSize: 8, fontWeight: '600', color: '#FFFFFF' }}>Port-au-Prince</Text>
        </View>
      </View>
    </View>
  );
}

/* ── Mockup 3: Personal Shopper ── */
function MockupShopper() {
  return (
    <View style={m.phone}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFFFFF' }}>Personal Shopper</Text>
      </View>
      {/* Info card */}
      <View style={{ backgroundColor: '#1A1A1A', borderRadius: 10, padding: 12, borderLeftWidth: 3, borderLeftColor: ACCENT, marginBottom: 12 }}>
        <Text style={{ fontSize: 10, fontWeight: '700', color: '#FFFFFF', marginBottom: 3 }}>Pas de carte internationale ?</Text>
        <Text style={{ fontSize: 8, color: '#9CA3AF', lineHeight: 12 }}>Envoyez-nous le lien du produit, nous achetons pour vous et livrons à votre porte.</Text>
      </View>
      {/* Form */}
      <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFFFFF', marginBottom: 8 }}>Nouvelle demande</Text>
      <Text style={{ fontSize: 8, color: '#9CA3AF', marginBottom: 4 }}>Lien du produit</Text>
      <View style={{ backgroundColor: '#1A1A1A', borderRadius: 8, borderWidth: 1, borderColor: '#2A2A2A', height: 30, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, marginBottom: 8, justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 8, color: '#6B7280' }}>https://amazon.com/...</Text>
        <MiniLink size={10} />
      </View>
      <Text style={{ fontSize: 8, color: '#9CA3AF', marginBottom: 4 }}>Site marchand</Text>
      <View style={{ backgroundColor: '#1A1A1A', borderRadius: 8, borderWidth: 1, borderColor: '#2A2A2A', height: 30, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 9, color: '#FFFFFF' }}>Amazon</Text>
        <MiniChevronDown />
      </View>
    </View>
  );
}

const SLIDES = [
  {
    Mockup: MockupDashboard,
    titleParts: [{ text: 'Tout gérer depuis un ' }, { text: 'seul endroit', accent: true }],
    desc: 'Suivez vos colis, calculez vos tarifs et gérez vos envois en quelques taps.',
  },
  {
    Mockup: MockupCalculateur,
    titleParts: [{ text: 'Connaissez votre ' }, { text: 'prix', accent: true }, { text: ' à l\'avance' }],
    desc: 'Calculez le coût exact de votre envoi selon le poids et la destination, instantanément.',
  },
  {
    Mockup: MockupShopper,
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

      {/* Mockup */}
      <Animated.View style={[s.mockupWrap, { opacity: fade }]}>
        <current.Mockup />
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

      {/* Bottom: dots + arrows */}
      <View style={s.bottom}>
        {index > 0 ? (
          <TouchableOpacity onPress={() => goTo(index - 1)} style={s.arrowBtnGray} activeOpacity={0.7}>
            <MiniArrowLeft size={18} color="#9CA3AF" />
          </TouchableOpacity>
        ) : <View style={{ width: 44 }} />}

        <View style={s.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[s.dot, i === index && s.dotActive]} />
          ))}
        </View>

        {isLast ? (
          <TouchableOpacity onPress={skip} style={s.arrowBtn} activeOpacity={0.85}>
            <MiniArrowRight size={18} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => goTo(index + 1)} style={s.arrowBtn} activeOpacity={0.85}>
            <MiniArrowRight size={18} color="#FFFFFF" />
          </TouchableOpacity>
        )}
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

const m = StyleSheet.create({
  phone: {
    width: width * 0.65,
    backgroundColor: '#0D0D0D',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    padding: 16,
    overflow: 'hidden',
  },
});

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D', paddingTop: statusBarH },
  skipBtn: { position: 'absolute', top: statusBarH + 10, right: 24, zIndex: 10 },
  skipText: { fontSize: 15, fontWeight: '500', color: '#9CA3AF' },
  mockupWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 20 },
  textWrap: { paddingHorizontal: 30, alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', textAlign: 'center', lineHeight: 30, marginBottom: 10 },
  titleAccent: { color: ACCENT },
  desc: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 21, maxWidth: 300 },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 30, marginBottom: 16 },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2A2A2A' },
  dotActive: { width: 24, backgroundColor: ACCENT },
  arrowBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' },
  arrowBtnGray: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2A2A2A' },
  cta: { marginHorizontal: 24, height: 52, borderRadius: 14, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center', marginBottom: 30 },
  ctaText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
