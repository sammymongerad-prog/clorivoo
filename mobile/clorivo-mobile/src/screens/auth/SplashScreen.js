import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import { COLORS } from '../../lib/tokens';
import { useSession } from '../../hooks/useSession';

export default function SplashScreen({ navigation }) {
  const session = useSession();

  // Progress bar animation
  const progress = useRef(new Animated.Value(0)).current;
  // Dot pulse animations
  const pulses = [useRef(new Animated.Value(0.3)).current,
                  useRef(new Animated.Value(0.3)).current,
                  useRef(new Animated.Value(0.3)).current];

  useEffect(() => {
    // Fill bar over 2.8s then ease into 100%
    Animated.timing(progress, {
      toValue: 1,
      duration: 2800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    // Staggered pulse on dots
    function pulseDot(anim, delay) {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1,   duration: 400, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.3, duration: 400, useNativeDriver: true }),
          Animated.delay(600),
        ])
      ).start();
    }
    pulses.forEach((a, i) => pulseDot(a, i * 220));
  }, []);

  // Navigate once session is resolved (with 2.8s minimum)
  const ready = useRef(false);
  const sessionRef = useRef(session);
  sessionRef.current = session;

  useEffect(() => {
    const minWait = setTimeout(() => {
      ready.current = true;
      redirect();
    }, 2800);
    return () => clearTimeout(minWait);
  }, []);

  useEffect(() => {
    if (ready.current) redirect();
  }, [session]);

  function redirect() {
    const s = sessionRef.current;
    if (s === undefined) {
      // Fallback: if session still unknown after 5s total, go to Onboarding
      setTimeout(() => navigation.replace('Onboarding'), 2200);
      return;
    }
    navigation.replace(s ? 'Tabs' : 'Onboarding');
  }

  const barWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={{ flex: 1, backgroundColor: '#FAFAFA', alignItems: 'center', justifyContent: 'center' }}>

      {/* Logo text */}
      <Text style={{
        fontSize: 42, fontWeight: '800', color: COLORS.ink,
        letterSpacing: -2, marginBottom: 8,
      }}>
        clorivo
      </Text>
      <Text style={{
        fontSize: 11, color: COLORS.mute,
        letterSpacing: 4, textTransform: 'uppercase',
        marginBottom: 72,
      }}>
        shop · sell · ship
      </Text>

      {/* Progress bar */}
      <View style={{
        width: 160, height: 3, borderRadius: 99,
        backgroundColor: '#E8E8EE', overflow: 'hidden',
        marginBottom: 28,
      }}>
        <Animated.View style={{
          height: '100%', width: barWidth, borderRadius: 99,
          backgroundColor: COLORS.primary,
        }} />
      </View>

      {/* Pulse dots */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {pulses.map((anim, i) => (
          <Animated.View key={i} style={{
            width: 6, height: 6, borderRadius: 99,
            backgroundColor: COLORS.primary,
            opacity: anim,
          }} />
        ))}
      </View>

    </View>
  );
}
