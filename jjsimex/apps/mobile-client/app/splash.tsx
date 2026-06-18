import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';

export default function SplashScreen() {
  const router = useRouter();

  // Lueur orange — pulse
  const glowOpacity = useRef(new Animated.Value(0.55)).current;
  const glowScale = useRef(new Animated.Value(1)).current;

  // Logo — apparition
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoY = useRef(new Animated.Value(8)).current;

  // Barre de chargement
  const barX = useRef(new Animated.Value(-38)).current;

  useEffect(() => {
    // Glow pulse 4.5s
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(glowOpacity, { toValue: 0.85, duration: 2250, useNativeDriver: true }),
          Animated.timing(glowScale, { toValue: 1.08, duration: 2250, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(glowOpacity, { toValue: 0.55, duration: 2250, useNativeDriver: true }),
          Animated.timing(glowScale, { toValue: 1, duration: 2250, useNativeDriver: true }),
        ]),
      ]),
    ).start();

    // Logo apparition 1s
    Animated.parallel([
      Animated.timing(logoOpacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.timing(logoY, { toValue: 0, duration: 1000, useNativeDriver: true }),
    ]).start();

    // Loading bar slide
    Animated.loop(
      Animated.timing(barX, { toValue: 100, duration: 1400, useNativeDriver: false }),
    ).start();

    const timer = setTimeout(() => router.replace('/onboarding'), 2600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* Lueur radiale orange derrière le logo */}
      <Animated.View
        style={[
          styles.glow,
          { opacity: glowOpacity, transform: [{ scale: glowScale }] },
        ]}
      />

      {/* Bloc logo */}
      <Animated.View
        style={[styles.logoBlock, { opacity: logoOpacity, transform: [{ translateY: logoY }] }]}
      >
        <View style={styles.logoRow}>
          <Text style={styles.logoWhite}>JJ</Text>
          <Text style={styles.logoOrange}>'s</Text>
          <Text style={styles.logoWhite}> IMEX</Text>
        </View>
        <Text style={styles.tagline}>Beyond Just Shipping</Text>
      </Animated.View>

      {/* Barre de chargement fine */}
      <View style={styles.loadBar}>
        <Animated.View style={[styles.loadFill, { left: barX.interpolate({ inputRange: [-38, 100], outputRange: ['-38%', '100%'] }) }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 460,
    height: 460,
    borderRadius: 230,
    backgroundColor: 'rgba(249,115,22,0.28)',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 80,
    elevation: 0,
  },
  logoBlock: {
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  logoWhite: {
    color: '#FFFFFF',
    fontSize: 52,
    fontWeight: '800',
    letterSpacing: -1.5,
    lineHeight: 56,
  },
  logoOrange: {
    color: '#F97316',
    fontSize: 52,
    fontWeight: '800',
    letterSpacing: -1.5,
    lineHeight: 56,
  },
  tagline: {
    marginTop: 18,
    fontWeight: '600',
    fontSize: 15,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: '#F97316',
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
    width: '38%',
    height: '100%',
    borderRadius: 99,
    backgroundColor: '#F97316',
  },
});
