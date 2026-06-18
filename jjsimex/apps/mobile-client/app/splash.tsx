import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => router.replace('/onboarding'), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.glow} />

      <View style={styles.logoBlock}>
        <View style={styles.logoRow}>
          <Text style={styles.logoWhite}>JJ</Text>
          <Text style={styles.logoOrange}>'s</Text>
          <Text style={styles.logoWhite}> IMEX</Text>
        </View>
        <Text style={styles.tagline}>Beyond Just Shipping</Text>
      </View>

      <View style={styles.loadBar}>
        <View style={styles.loadFill} />
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
    backgroundColor: 'rgba(249,115,22,0.18)',
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
    left: 0,
    width: '40%',
    height: '100%',
    borderRadius: 99,
    backgroundColor: '#F97316',
  },
});
