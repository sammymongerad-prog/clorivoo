import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Image, ActivityIndicator } from 'react-native';
import { COLORS, RADIUS, SHADOW } from '../../lib/tokens';
import { getProducts } from '../../lib/supabase';

const FILTERS = ['Tout', 'Flash', '-50%', 'Nouveaux'];

export default function OffersScreen({ navigation }) {
  const [activeFilter, setActiveFilter] = useState(0);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const result = await getProducts({ limit: 50 });
        const promos = (result.data ?? []).filter(p => p.compare_price && p.compare_price > p.price);
        setOffers(promos);
      } catch (e) {
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

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

        {/* Loading */}
        {loading && (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        )}

        {/* Empty state */}
        {!loading && offers.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Text style={{ fontSize: 36 }}>🏷️</Text>
            <Text style={{ fontSize: 16, color: COLORS.mute, marginTop: 12 }}>Aucune offre disponible pour le moment</Text>
          </View>
        )}

        {/* Cards */}
        {!loading && offers.length > 0 && (
          <View style={{ paddingHorizontal: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingBottom: 24 }}>
            {offers.map(item => {
              const discount = Math.round((1 - item.price / item.compare_price) * 100);
              return (
                <View key={item.id} style={{ width: '47%', backgroundColor: COLORS.white, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.hairline, ...SHADOW.sm }}>
                  {/* Image */}
                  <View style={{ height: 110, backgroundColor: COLORS.paper, alignItems: 'center', justifyContent: 'center' }}>
                    {item.images?.[0] ? (
                      <Image source={{ uri: item.images[0] }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    ) : (
                      <Text style={{ fontSize: 44 }}>🛍️</Text>
                    )}
                    {/* Badge */}
                    <View style={{ position: 'absolute', top: 8, right: 8, backgroundColor: COLORS.danger, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 }}>
                      <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>-{discount}%</Text>
                    </View>
                  </View>
                  <View style={{ padding: 10 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.ink, marginBottom: 4 }} numberOfLines={1}>{item.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <Text style={{ fontSize: 15, fontWeight: '800', color: COLORS.primary }}>{Number(item.price).toFixed(2)}€</Text>
                      <Text style={{ fontSize: 11, color: COLORS.mute, textDecorationLine: 'line-through' }}>{Number(item.compare_price).toFixed(2)}€</Text>
                    </View>
                    <TouchableOpacity style={{ backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 7, alignItems: 'center' }}>
                      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Voir l'offre</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
