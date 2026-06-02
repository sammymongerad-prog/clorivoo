import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { COLORS, RADIUS, SHADOW } from '../../lib/tokens';

const FILTERS = ['Tout', 'Flash', '-50%', 'Nouveaux'];

const MOCK_OFFERS = [
  { id: '1', name: 'Sneakers Urban Pro', originalPrice: 89.99, promoPrice: 39.99, discount: 56, color: '#6C4DFF', emoji: '👟', badge: '-56%' },
  { id: '2', name: 'Sac à main Cuir', originalPrice: 149.00, promoPrice: 59.00, discount: 60, color: '#E67E22', emoji: '👜', badge: '-60%' },
  { id: '3', name: 'Écouteurs Bluetooth', originalPrice: 79.99, promoPrice: 34.99, discount: 56, color: '#4A6FD4', emoji: '🎧', badge: 'FLASH' },
  { id: '4', name: 'Montre Connectée', originalPrice: 199.00, promoPrice: 89.00, discount: 55, color: '#10B981', emoji: '⌚', badge: '-55%' },
  { id: '5', name: 'Parfum Luxe 50ml', originalPrice: 120.00, promoPrice: 49.00, discount: 59, color: '#9B59B6', emoji: '🌸', badge: 'NOUVEAU' },
  { id: '6', name: 'Chaussures Running', originalPrice: 110.00, promoPrice: 44.00, discount: 60, color: '#EF4444', emoji: '🏃', badge: '-60%' },
];

export default function OffersScreen({ navigation }) {
  const [activeFilter, setActiveFilter] = useState(0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.hairline }}>
        <TouchableOpacity onPress={() => navigation.goBack()}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
          <Text style={{ fontSize: 18, color: COLORS.primary }}>←</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '800', color: COLORS.ink, letterSpacing: -0.5, flex: 1 }}>Offres & Deals</Text>
        <View style={{ backgroundColor: COLORS.danger, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 }}>
          <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>HOT 🔥</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Filtre chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 16, paddingVertical: 14 }}>
          {FILTERS.map((f, i) => (
            <TouchableOpacity key={i} onPress={() => setActiveFilter(i)}
              style={{
                paddingHorizontal: 18, paddingVertical: 8, borderRadius: RADIUS.full,
                backgroundColor: activeFilter === i ? COLORS.primary : COLORS.white,
                borderWidth: 1.5, borderColor: activeFilter === i ? COLORS.primary : COLORS.hairline,
                ...SHADOW.sm,
              }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: activeFilter === i ? '#fff' : COLORS.ink }}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Promo banner */}
        <View style={{ marginHorizontal: 16, marginBottom: 16, borderRadius: 16, backgroundColor: COLORS.primary, padding: 18, overflow: 'hidden' }}>
          <View style={{ position: 'absolute', right: -20, top: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.1)' }} />
          <Text style={{ fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.5 }}>Jusqu'à -60%</Text>
          <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>Sur une sélection de produits</Text>
          <View style={{ marginTop: 10, backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, alignSelf: 'flex-start' }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.primary }}>Voir tout →</Text>
          </View>
        </View>

        {/* Cards */}
        <View style={{ paddingHorizontal: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingBottom: 24 }}>
          {MOCK_OFFERS.map(item => (
            <View key={item.id} style={{ width: '47%', backgroundColor: COLORS.white, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.hairline, ...SHADOW.sm }}>
              {/* Image placeholder */}
              <View style={{ height: 110, backgroundColor: item.color, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 44 }}>{item.emoji}</Text>
                {/* Badge */}
                <View style={{ position: 'absolute', top: 8, right: 8, backgroundColor: COLORS.danger, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 }}>
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>{item.badge}</Text>
                </View>
              </View>
              <View style={{ padding: 10 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.ink, marginBottom: 4 }} numberOfLines={1}>{item.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: COLORS.primary }}>{item.promoPrice.toFixed(2)}€</Text>
                  <Text style={{ fontSize: 11, color: COLORS.mute, textDecorationLine: 'line-through' }}>{item.originalPrice.toFixed(2)}€</Text>
                </View>
                <TouchableOpacity style={{ backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 7, alignItems: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Voir l'offre</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
