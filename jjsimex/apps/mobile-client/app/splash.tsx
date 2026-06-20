import { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions, Image, Easing,
} from 'react-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const ACCENT = '#F97316';
const LOGO_SIZE = 200;

const PARTICLES = Array.from({ length: 8 }, (_, i) => ({
  x: Math.random() * width,
  y: Math.random() * 800 + 100,
  size: Math.random() * 4 + 2,
  delay: Math.random() * 1500,
  duration: Math.random() * 2000 + 2000,
}));

export default function SplashScreen() {
  const router = useRouter();
  const fadeIn = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const glowPulse = useRef(new Animated.Value(0.4)).current;
  const floatY = useRef(new Animated.Value(0)).current;
  const tagFade = useRef(new Animated.Value(0)).current;
  const exitScale = useRef(new Animated.Value(1)).current;
  const exitFade = useRef(new Animated.Value(1)).current;
  const loadWidth = useRef(new Animated.Value(0)).current;
  const particleFades = useRef(PARTICLES.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Fade in + scale logo
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
    ]).start();

    // Glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 0.7, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0.4, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Float animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, { toValue: -6, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(floatY, { toValue: 6, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Tagline fade in
    setTimeout(() => {
      Animated.timing(tagFade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }, 400);

    // Loading bar
    Animated.timing(loadWidth, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: false }).start();

    // Particles
    particleFades.forEach((pf, i) => {
      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pf, { toValue: 0.6, duration: 800, useNativeDriver: true }),
            Animated.timing(pf, { toValue: 0, duration: 800, useNativeDriver: true }),
          ])
        ).start();
      }, PARTICLES[i].delay);
    });

    // Exit transition
    const exitTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(exitScale, { toValue: 1.15, duration: 400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(exitFade, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start(() => {
        router.replace('/onboarding');
      });
    }, 2200);

    return () => clearTimeout(exitTimer);
  }, []);

  return (
    <View style={s.container}>
      {/* Particles */}
      {PARTICLES.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            borderRadius: p.size / 2,
            backgroundColor: ACCENT,
            opacity: particleFades[i],
          }}
        />
      ))}

      {/* Glow */}
      <Animated.View style={[s.glow, { opacity: glowPulse }]} />

      {/* Logo + tagline */}
      <Animated.View style={[s.center, {
        opacity: Animated.multiply(fadeIn, exitFade),
        transform: [
          { scale: Animated.multiply(scale, exitScale) },
          { translateY: floatY },
        ],
      }]}>
        <Image
          source={require('../assets/images/splash/658637088_18072809270317234_4254461405920692302_n.jpg')}
          style={s.logo}
          resizeMode="contain"
        />
        <Animated.Text style={[s.tagline, { opacity: Animated.multiply(tagFade, exitFade) }]}>
          Expédiez partout, simplement.
        </Animated.Text>
      </Animated.View>

      {/* Loading bar */}
      <Animated.View style={[s.loadBar, { opacity: exitFade }]}>
        <Animated.View style={[s.loadFill, {
          width: loadWidth.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
        }]} />
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(249,115,22,0.15)',
  },
  center: {
    alignItems: 'center',
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  tagline: {
    marginTop: 24,
    fontSize: 16,
    fontWeight: '500',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  loadBar: {
    position: 'absolute',
    bottom: 64,
    width: 120,
    height: 3,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  loadFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    borderRadius: 99,
    backgroundColor: ACCENT,
  },
});
