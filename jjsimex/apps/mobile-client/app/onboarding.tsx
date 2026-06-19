import { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, ScrollView, GestureResponderEvent, Image,
  ImageSourcePropType,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

// ── Couleurs du thème ───────────────────────────────────────────────
const ACCENT = '#F97316';        // orange de marque
const ACCENT_SOFT = '#FFF3E9';   // teinte douce pour le fond de l'image
const CARD = '#FFFFFF';
const TITLE_DARK = '#0D0D0D';
const SUB_GRAY = '#6B7280';

interface Segment { text: string; accent?: boolean; }
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
    sub: 'Des notifications à chaque étape, de Miami jusqu’à votre ville.',
  },
  {
    image: require('../assets/images/onboarding/onboarding4.jpeg'),
    title: [{ text: 'Retirez ' }, { text: 'près de chez vous', accent: true }],
    sub: '23+ points de retrait en Haïti et en République Dominicaine.',
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
      <StatusBar style="dark" />
      {/* Zone image (haut) */}
      <View style={styles.imageArea} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          style={{ width: SLIDES.length * width }}
        >
          {SLIDES.map((slide, i) => (
            <View key={i} style={[styles.imageSlide, { width }]}>
              <Image source={slide.image} style={styles.image} resizeMode="contain" />
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Carte (bas) */}
      <View style={styles.card}>
        <Text style={styles.title}>
          {SLIDES[index].title.map((seg, i) => (
            <Text key={i} style={seg.accent ? styles.titleAccent : undefined}>
              {seg.text}
            </Text>
          ))}
        </Text>
        <Text style={styles.sub}>{SLIDES[index].sub}</Text>

        {/* Dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => goTo(i)}>
              <View style={[styles.dot, i === index && styles.dotActive]} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Boutons : pilule à gauche + lien à droite */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.pill}
            activeOpacity={0.9}
            onPress={() => {
              if (isLast) router.replace('/(auth)/register');
              else goTo(index + 1);
            }}
          >
            <Text style={styles.pillText}>{isLast ? 'Commencer' : 'Suivant'}</Text>
            <Text style={styles.pillArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              if (isLast) router.replace('/(auth)/login');
              else goTo(SLIDES.length - 1);
            }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.skipText}>{isLast ? 'Se connecter' : 'Passer'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ACCENT_SOFT },
  imageArea: { flex: 1, overflow: 'hidden' },
  imageSlide: { alignItems: 'center', justifyContent: 'center', paddingTop: 40 },
  image: { width: width * 0.82, height: '88%' },

  card: {
    backgroundColor: CARD,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 28,
    paddingTop: 30,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  title: {
    fontWeight: '800',
    fontSize: 26,
    letterSpacing: -0.6,
    color: TITLE_DARK,
    textAlign: 'center',
    lineHeight: 33,
  },
  titleAccent: { color: ACCENT },
  sub: {
    marginTop: 12,
    fontSize: 14.5,
    lineHeight: 22,
    color: SUB_GRAY,
    textAlign: 'center',
    alignSelf: 'center',
    maxWidth: 300,
  },

  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 22,
    height: 20,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 99,
    backgroundColor: 'rgba(13,13,13,0.15)',
  },
  dotActive: { width: 22, backgroundColor: ACCENT },

  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 26,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 52,
    paddingHorizontal: 28,
    borderRadius: 99,
    backgroundColor: ACCENT,
  },
  pillText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15.5 },
  pillArrow: { color: '#FFFFFF', fontWeight: '700', fontSize: 17 },
  skipText: { color: SUB_GRAY, fontWeight: '600', fontSize: 15, paddingHorizontal: 8 },
});
