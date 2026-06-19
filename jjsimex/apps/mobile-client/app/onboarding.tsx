import { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, GestureResponderEvent, Image,
  ImageSourcePropType, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const { width, height: SCREEN_H } = Dimensions.get('window');

const ACCENT = '#F97316';
const CARD = '#FFFFFF';
const TITLE_DARK = '#0D0D0D';
const SUB_GRAY = '#6B7280';
const DOT_INACTIVE = 'rgba(13,13,13,0.15)';
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

function ProgressDot({ active, index, onPress }: { active: boolean; index: number; onPress: () => void }) {
  const fillAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (active) {
      fillAnim.setValue(0);
      Animated.timing(fillAnim, {
        toValue: 1,
        duration: DOT_FILL_MS,
        useNativeDriver: false,
      }).start();
    } else {
      fillAnim.stopAnimation();
      fillAnim.setValue(0);
    }
  }, [active]);

  const dotWidth = active ? DOT_ACTIVE_W : DOT_SIZE;
  const fillWidth = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, DOT_ACTIVE_W],
  });

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.dot, { width: dotWidth }]}>
        {active && (
          <Animated.View
            style={[styles.dotFill, { width: fillWidth }]}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const touchX = useRef(0);
  const imageAnim = useRef(new Animated.Value(1)).current;

  function goTo(i: number) {
    const next = Math.max(0, Math.min(SLIDES.length - 1, i));
    if (next === index) return;
    Animated.timing(imageAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setIndex(next);
      Animated.timing(imageAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });
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
      <StatusBar style="light" />

      {/* Image full-bleed */}
      <View
        style={styles.imageArea}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <Animated.View style={[styles.imageFull, { opacity: imageAnim }]}>
          <Image
            source={SLIDES[index].image}
            style={styles.image}
            resizeMode="cover"
          />
        </Animated.View>
      </View>

      {/* Carte blanche bas */}
      <View style={styles.card}>
        <Text style={styles.title}>
          {SLIDES[index].title.map((seg, i) => (
            <Text key={i} style={seg.accent ? styles.titleAccent : undefined}>
              {seg.text}
            </Text>
          ))}
        </Text>
        <Text style={styles.sub}>{SLIDES[index].sub}</Text>

        {/* Dots animés */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <ProgressDot key={i} index={i} active={i === index} onPress={() => goTo(i)} />
          ))}
        </View>

        {/* Boutons : pilule compacte + lien Skip */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.pill}
            activeOpacity={0.85}
            onPress={() => {
              if (isLast) router.replace('/(auth)/register');
              else goTo(index + 1);
            }}
          >
            <Text style={styles.pillText}>{isLast ? 'Commencer' : 'Next'}</Text>
            <Text style={styles.pillArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              if (isLast) router.replace('/(auth)/login');
              else goTo(SLIDES.length - 1);
            }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.skipText}>{isLast ? 'Se connecter' : 'Skip'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const CARD_H = 260;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  imageArea: {
    flex: 1,
    overflow: 'hidden',
  },
  imageFull: {
    ...StyleSheet.absoluteFillObject,
  },
  image: {
    width: '100%',
    height: '100%',
  },

  card: {
    backgroundColor: CARD,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 36,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 16,
  },
  title: {
    fontWeight: '800',
    fontSize: 24,
    letterSpacing: -0.5,
    color: TITLE_DARK,
    textAlign: 'center',
    lineHeight: 31,
  },
  titleAccent: { color: ACCENT },
  sub: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    color: SUB_GRAY,
    textAlign: 'center',
    alignSelf: 'center',
    maxWidth: 300,
  },

  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    height: 20,
  },
  dot: {
    height: DOT_SIZE,
    borderRadius: 99,
    backgroundColor: DOT_INACTIVE,
    overflow: 'hidden',
  },
  dotFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: DOT_SIZE,
    borderRadius: 99,
    backgroundColor: ACCENT,
  },

  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 22,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 44,
    paddingHorizontal: 22,
    borderRadius: 99,
    backgroundColor: ACCENT,
  },
  pillText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14.5 },
  pillArrow: { color: '#FFFFFF', fontWeight: '600', fontSize: 16 },
  skipText: { color: SUB_GRAY, fontWeight: '500', fontSize: 14.5 },
});
