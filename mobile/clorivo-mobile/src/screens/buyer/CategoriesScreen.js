import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SHADOW } from '../../lib/tokens';
import { ProductCard, SectionHeader } from '../../components/UI';
import { getProducts, getCategories } from '../../lib/supabase';

const CAT_EMOJIS = { maison: '🏠', mode: '👗', tech: '📱', beaute: '💄', sport: '⚽', enfants: '🧸', jardin: '🌱', autre: '📦' };

export default function CategoriesScreen({ route, navigation }) {
  const [categories, setCategories] = useState([]);
  const [products, setProducts]     = useState([]);
  const [activeSlug, setActiveSlug] = useState(route.params?.categorySlug ?? null);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    getCategories().then(cats => {
      setCategories(cats ?? []);
      if (!activeSlug && cats?.length) setActiveSlug(cats[0].slug);
    });
  }, []);

  useEffect(() => {
    if (!activeSlug) return;
    setLoading(true);
    getProducts({ categorySlug: activeSlug, limit: 20 }).then(({ data }) => {
      setProducts(data ?? []);
      setLoading(false);
    });
  }, [activeSlug]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.paper }} edges={['top']}>
      <View style={{ backgroundColor: COLORS.white, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.hairline, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 22, color: COLORS.ink }}>←</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.ink }}>Catégories</Text>
      </View>

      <View style={{ flex: 1, flexDirection: 'row' }}>
        {/* Sidebar */}
        <ScrollView style={{ width: 90, backgroundColor: COLORS.white, borderRightWidth: 1, borderRightColor: COLORS.hairline }}>
          {categories.map(cat => {
            const active = cat.slug === activeSlug;
            return (
              <TouchableOpacity key={cat.id} onPress={() => setActiveSlug(cat.slug)}
                style={{ paddingVertical: 16, paddingHorizontal: 10, alignItems: 'center', gap: 6, borderLeftWidth: 3, borderLeftColor: active ? COLORS.primary : 'transparent', backgroundColor: active ? COLORS.primarySoft : COLORS.white }}>
                <Text style={{ fontSize: 24 }}>{CAT_EMOJIS[cat.slug] ?? '📦'}</Text>
                <Text style={{ fontSize: 10, fontWeight: active ? '700' : '400', color: active ? COLORS.primary : COLORS.mute, textAlign: 'center' }} numberOfLines={2}>{cat.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Products */}
        <View style={{ flex: 1, padding: 12 }}>
          {loading ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator color={COLORS.primary} />
            </View>
          ) : products.length === 0 ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 36, marginBottom: 12 }}>📭</Text>
              <Text style={{ color: COLORS.mute, fontSize: 14 }}>Aucun produit dans cette catégorie</Text>
            </View>
          ) : (
            <FlatList
              data={products}
              keyExtractor={p => p.id}
              numColumns={2}
              columnWrapperStyle={{ gap: 10 }}
              contentContainerStyle={{ gap: 10 }}
              renderItem={({ item }) => (
                <View style={{ flex: 1 }}>
                  <ProductCard product={item} onPress={() => navigation.navigate('Product', { productId: item.id, product: item })} />
                </View>
              )}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
