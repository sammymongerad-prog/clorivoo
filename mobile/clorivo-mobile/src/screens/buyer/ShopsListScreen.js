import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, TextInput, Image, ActivityIndicator } from 'react-native';
import { COLORS, RADIUS, SHADOW } from '../../lib/tokens';
import { getShops } from '../../lib/supabase';

const FILTERS = ['Toutes', 'Vérifiées'];

export default function ShopsListScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState(0);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getShops(50);
        setShops(data ?? []);
      } catch (e) {
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = shops.filter(s => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase());
    let matchFilter = true;
    if (activeFilter === 1) matchFilter = !!s.is_verified;
    return matchSearch && matchFilter;
  });

  function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }

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

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12 }}>
          {filtered.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Text style={{ fontSize: 36 }}>🔍</Text>
              <Text style={{ fontSize: 16, color: COLORS.mute, marginTop: 12 }}>
                {shops.length === 0 ? 'Aucune boutique disponible' : 'Aucune boutique trouvée'}
              </Text>
            </View>
          )}
          {filtered.map(shop => (
            <View key={shop.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: 14, borderWidth: 1, borderColor: COLORS.hairline, ...SHADOW.sm }}>
              {/* Avatar */}
              <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: shop.brand_color || COLORS.primary, alignItems: 'center', justifyContent: 'center', marginRight: 12, overflow: 'hidden' }}>
                {shop.logo_url ? (
                  <Image source={{ uri: shop.logo_url }} style={{ width: 54, height: 54 }} resizeMode="cover" />
                ) : (
                  <Text style={{ fontSize: 20, fontWeight: '900', color: '#fff' }}>{getInitials(shop.name)}</Text>
                )}
              </View>

              {/* Info */}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.ink }}>{shop.name}</Text>
                  {shop.is_verified && (
                    <View style={{ backgroundColor: COLORS.primary, borderRadius: RADIUS.full, paddingHorizontal: 6, paddingVertical: 2 }}>
                      <Text style={{ fontSize: 9, fontWeight: '800', color: '#fff' }}>✓ Vérifié</Text>
                    </View>
                  )}
                </View>
                {shop.description ? (
                  <Text style={{ fontSize: 12, color: COLORS.mute, marginBottom: 4 }} numberOfLines={1}>{shop.description}</Text>
                ) : null}
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
      )}
    </SafeAreaView>
  );
}
