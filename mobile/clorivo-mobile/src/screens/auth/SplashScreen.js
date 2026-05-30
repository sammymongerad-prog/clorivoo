import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { COLORS } from '../../lib/tokens';
import { useSession } from '../../hooks/useSession';

export default function SplashScreen({ navigation }) {
  const session = useSession();
  const [dot, setDot] = useState(0);
  const [ready, setReady] = useState(false);

  // Animate dots
  useEffect(() => {
    const t = setInterval(() => setDot(d => (d + 1) % 3), 500);
    return () => clearInterval(t);
  }, []);

  // Wait at least 2.6s then redirect once session is known
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 2600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!ready || session === undefined) return;
    if (session) {
      navigation.replace('Tabs');
    } else {
      navigation.replace('Onboarding');
    }
  }, [ready, session]);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        width: 88, height: 88, borderRadius: 24,
        backgroundColor: COLORS.primary,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.28, shadowRadius: 32, elevation: 12,
        marginBottom: 20,
      }}>
        <Text style={{ fontWeight: '800', fontSize: 52, color: '#fff', letterSpacing: -2, lineHeight: 56 }}>c</Text>
      </View>

      <Text style={{ fontSize: 30, fontWeight: '800', color: COLORS.ink, letterSpacing: -1, marginBottom: 6 }}>clorivo</Text>
      <Text style={{ fontSize: 14, color: COLORS.mute, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 64 }}>
        shop · sell · ship
      </Text>

      <View style={{ flexDirection: 'row', gap: 6 }}>
        {[0, 1, 2].map(i => (
          <View key={i} style={{
            width: i === dot ? 22 : 6,
            height: 6,
            borderRadius: 9999,
            backgroundColor: i === dot ? COLORS.primary : COLORS.hairline,
          }} />
        ))}
      </View>
    </View>
  );
}
