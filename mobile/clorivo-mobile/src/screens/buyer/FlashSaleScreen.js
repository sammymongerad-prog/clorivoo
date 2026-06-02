import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Animated } from 'react-native';
import { COLORS, RADIUS, SHADOW } from '../../lib/tokens';

const INITIAL_SECONDS = 2 * 3600; // 2h

const FLASH_PRODUCTS = [
  { id: '1', name: 'AirPods Pro Clone', originalPrice: 149.99, flashPrice: 39.99, saved: 73, color: '#4A6FD4', emoji: '🎧', stock: 2, totalStock: 10 },
  { id: '2', name: 'Montre Sport X9', originalPrice: 299.00, flashPrice: 79.00, saved: 74, color: '#6C4DFF', emoji: '⌚', stock: 5, totalStock: 15 },
  { id: '3', name: 'Sac à dos Urban', originalPrice: 89.00, flashPrice: 29.00, saved: 67, color: '#E67E22', emoji: '🎒', stock: 3, totalStock: 8 },
  { id: '4', name: 'Sneakers Limited', originalPrice: 179.00, flashPrice: 59.00, saved: 67, color: '#EF4444', emoji: '👟', stock: 1, totalStock: 5 },
  { id: '5', name: 'Lunettes de soleil', originalPrice: 120.00, flashPrice: 34.99, saved: 71, color: '#10B981', emoji: '🕶️', stock: 7, totalStock: 20 },
  { id: '6', name: 'Parfum Prestige', originalPrice: 199.00, flashPrice: 49.00, saved: 75, color: '#9B59B6', emoji: '🌸', stock: 4, totalStock: 12 },
];

function useCountdown(seconds) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    const t = setInterval(() => setLeft(s => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);
  const h = String(Math.floor(left / 3600)).padStart(2, '0');
  const m = String(Math.floor((left % 3600) / 60)).padStart(2, '0');
  const s = String(left % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function StockBar({ stock, total }) {
  const pct = Math.max(0, Math.min(1, stock / total));
  const color = pct <= 0.3 ? COLORS.danger : pct <= 0.6 ? '#F59E0B' : COLORS.success;
  return (
    <View style={{ marginTop: 6 }}>
      <View style={{ height: 6, backgroundColor: COLORS.hairline, borderRadius: 3, overflow: 'hidden' }}>
        <View style={{ height: 6, width: `${pct * 100}%`, backgroundColor: color, borderRadius: 3 }} />
      </View>
      <Text style={{ fontSize: 10, color: color, fontWeight: '600', marginTop: 3 }}>{stock} restant{stock > 1 ? 's' : ''} sur {total}</Text>
    </View>
  );
}

export default function FlashSaleScreen({ navigation }) {
  const countdown = useCountdown(INITIAL_SECONDS);
  const blinkAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
        Animated.timing(blinkAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const [hh, mm, ss] = countdown.split(':');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.hairline, backgroundColor: '#111827' }}>
        <TouchableOpacity onPress={() => navigation.goBack()}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
          <Text style={{ fontSize: 18, color: '#fff' }}>←</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.5, flex: 1 }}>Ventes Flash ⚡</Text>
        <Animated.View style={{ opacity: blinkAnim, backgroundColor: COLORS.danger, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#fff' }} />
          <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>LIVE</Text>
        </Animated.View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Timer */}
        <View style={{ backgroundColor: '#111827', paddingHorizontal: 20, paddingBottom: 20, paddingTop: 8, alignItems: 'center' }}>
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 10 }}>Offres valables encore</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {[hh, mm, ss].map((unit, i) => (
              <React.Fragment key={i}>
                <View style={{ backgroundColor: COLORS.primary, borderRadius: 12, width: 72, height: 72, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 36, fontWeight: '900', color: '#fff', fontFamily: 'monospace' }}>{unit}</Text>
                </View>
                {i < 2 && <Text style={{ fontSize: 30, fontWeight: '900', color: COLORS.danger }}>:</Text>}
              </React.Fragment>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
            {['Heures', 'Minutes', 'Secondes'].map((l, i) => (
              <Text key={i} style={{ width: 72, textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '500' }}>{l}</Text>
            ))}
          </View>
        </View>

        {/* Products */}
        <View style={{ padding: 16, gap: 12 }}>
          {FLASH_PRODUCTS.map(item => (
            <View key={item.id} style={{ flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.hairline, ...SHADOW.sm }}>
              {/* Image placeholder */}
              <View style={{ width: 100, backgroundColor: item.color, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 40 }}>{item.emoji}</Text>
                <View style={{ position: 'absolute', top: 8, left: 8, backgroundColor: COLORS.danger, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                  <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>-{item.saved}%</Text>
                </View>
              </View>
              {/* Info */}
              <View style={{ flex: 1, padding: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.ink, marginBottom: 4 }} numberOfLines={1}>{item.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: COLORS.primary }}>{item.flashPrice.toFixed(2)}€</Text>
                  <Text style={{ fontSize: 13, color: COLORS.mute, textDecorationLine: 'line-through' }}>{item.originalPrice.toFixed(2)}€</Text>
                </View>
                <StockBar stock={item.stock} total={item.totalStock} />
                <TouchableOpacity style={{ marginTop: 10, backgroundColor: item.stock <= 2 ? COLORS.danger : COLORS.primary, borderRadius: 10, paddingVertical: 8, alignItems: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>
                    {item.stock <= 2 ? '⚡ Acheter vite !' : 'Acheter'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
