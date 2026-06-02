import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, TextInput } from 'react-native';
import { COLORS, RADIUS, SHADOW } from '../../lib/tokens';

const FILTERS = ['Toutes', 'Vérifiées', 'Nouvelles', 'Top ventes'];

const MOCK_SHOPS = [
  { id: 's1', name: 'UrbanStyle', initials: 'US', color: '#6C4DFF', category: 'Mode & Vêtements', rating: 4.8, products: 142, verified: true, top: true },
  { id: 's2', name: 'TechZone', initials: 'TZ', color: '#4A6FD4', category: 'Tech & Gadgets', rating: 4.6, products: 87, verified: true, top: true },
  { id: 's3', name: 'Maison & Co', initials: 'MC', color: '#C97B5A', category: 'Maison & Déco', rating: 4.9, products: 213, verified: true, top: false },
  { id: 's4', name: 'BeautyBox', initials: 'BB', color: '#E67E22', category: 'Beauté & Soin', rating: 4.5, products: 64, verified: false, top: false, isNew: true },
  { id: 's5', name: 'KidsWorld', initials: 'KW', color: '#F59E0B', category: 'Enfants & Jouets', rating: 4.7, products: 95, verified: true, top: false },
  { id: 's6', name: 'SportPro', initials: 'SP', color: '#10B981', category: 'Sport & Fitness', rating: 4.4, products: 110, verified: false, top: false, isNew: true },
  { id: 's7', name: 'Luxuria', initials: 'LX', color: '#9B59B6', category: 'Luxe & Prestige', rating: 5.0, products: 38, verified: true, top: true },
  { id: 's8', name: 'EcoShop', initials: 'ES', color: '#27AE60', category: 'Bio & Écologique', rating: 4.3, products: 57, verified: false, top: false, isNew: true },
];

function Stars({ rating }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Text key={i} style={{ fontSize: 11, color: i <= full ? '#F59E0B' : (i === full + 1 && half ? '#F59E0B' : COLORS.hairline) }}>
          {i <= full ? '★' : (i === full + 1 && half ? '⯨' : '★')}
        </Text>
      ))}
      <Text style={{ fontSize: 11, fontWeight: '600', color: COLORS.mute, marginLeft: 4 }}>{rating.toFixed(1)}</Text>
    </View>
  );
}

export default function ShopsListScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState(0);

  const filtered = MOCK_SHOPS.filter(s => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.category.toLowerCase().includes(search.toLowerCase());
    let matchFilter = true;
    if (activeFilter === 1) matchFilter = s.verified;
    if (activeFilter === 2) matchFilter = !!s.isNew;
    if (activeFilter === 3) matchFilter = s.top;
    return matchSearch && matchFilter;
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 0, borderBottomWidth: 1, borderBottomColor: COLORS.hairline }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <TouchableOpacity onPress={() => navigation.goBack()}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
            <Text style={{ fontSize: 18, color: COLORS.primary }}>←</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: '800', color: COLORS.ink, letterSpacing: -0.5, flex: 1 }}>Boutiques</Text>
          <Text style={{ fontSize: 20 }}>🏪</Text>
        </View>

        {/* Search bar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.paper, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.hairline, paddingHorizontal: 14, height: 42, marginBottom: 12, gap: 8 }}>
          <Text style={{ fontSize: 16, color: COLORS.mute }}>🔍</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher une boutique…"
            placeholderTextColor={COLORS.mute}
            style={{ flex: 1, fontSize: 14, color: COLORS.ink }}
          />
        </View>

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 12 }}>
          {FILTERS.map((f, i) => (
            <TouchableOpacity key={i} onPress={() => setActiveFilter(i)}
              style={{ paddingHorizontal: 16, paddingVertical: 7, borderRadius: RADIUS.full, backgroundColor: activeFilter === i ? COLORS.primary : COLORS.white, borderWidth: 1.5, borderColor: activeFilter === i ? COLORS.primary : COLORS.hairline }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: activeFilter === i ? '#fff' : COLORS.ink }}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12 }}>
        {filtered.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Text style={{ fontSize: 36 }}>🔍</Text>
            <Text style={{ fontSize: 16, color: COLORS.mute, marginTop: 12 }}>Aucune boutique trouvée</Text>
          </View>
        )}
        {filtered.map(shop => (
          <View key={shop.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: 14, borderWidth: 1, borderColor: COLORS.hairline, ...SHADOW.sm }}>
            {/* Avatar */}
            <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: shop.color, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: '#fff' }}>{shop.initials}</Text>
            </View>

            {/* Info */}
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.ink }}>{shop.name}</Text>
                {shop.verified && (
                  <View style={{ backgroundColor: COLORS.primary, borderRadius: RADIUS.full, paddingHorizontal: 6, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 9, fontWeight: '800', color: '#fff' }}>✓ Vérifié</Text>
                  </View>
                )}
                {shop.isNew && (
                  <View style={{ backgroundColor: COLORS.success + '22', borderRadius: RADIUS.full, paddingHorizontal: 6, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 9, fontWeight: '800', color: COLORS.success }}>NOUVEAU</Text>
                  </View>
                )}
              </View>
              <Text style={{ fontSize: 12, color: COLORS.mute, marginBottom: 4 }}>{shop.category}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Stars rating={shop.rating} />
                <Text style={{ fontSize: 11, color: COLORS.mute }}>{shop.products} produits</Text>
              </View>
            </View>

            {/* Button */}
            <TouchableOpacity
              onPress={() => navigation.navigate('Shop', { shopId: shop.id })}
              style={{ backgroundColor: COLORS.primarySoft, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 9 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.primary }}>Visiter</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
