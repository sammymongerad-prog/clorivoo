import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, RADIUS, SHADOW } from '../../lib/tokens';
import { getProducts } from '../../lib/supabase';
import { useSession } from '../../hooks/useSession';
import Icon from '../../components/Icon';

export default function SellerProductsScreen({ navigation }) {
  const session = useSession();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    if (!session?.user) return;
    setLoading(true);
    getProducts({ seller_id: session.user.id, limit: 50 })
      .then(({ data }) => { setProducts(data ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [session]));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.paper }} edges={['top']}>
      <View style={{ backgroundColor: COLORS.white, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.hairline, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrowLeft" size={22} color={COLORS.ink} />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: COLORS.ink }}>Mes produits</Text>
        <Text style={{ fontSize: 13, color: COLORS.mute }}>{products.length} produits</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : products.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <Text style={{ fontSize: 40 }}>📦</Text>
          <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.ink }}>Aucun produit</Text>
          <Text style={{ fontSize: 14, color: COLORS.mute }}>Créez votre premier produit</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AddProduct')}
            style={{ backgroundColor: COLORS.primary, borderRadius: RADIUS.full, paddingHorizontal: 24, paddingVertical: 12, marginTop: 8 }}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>+ Ajouter un produit</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
          {products.map(p => {
            const img = Array.isArray(p.images) ? p.images[0] : null;
            const isActive = p.status === 'active';
            return (
              <TouchableOpacity key={p.id}
                onPress={() => navigation.navigate('AddProduct', { productId: p.id, product: p })}
                style={{ backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14, ...SHADOW.sm }}>
                <View style={{ width: 64, height: 64, borderRadius: RADIUS.sm, backgroundColor: COLORS.primarySoft, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
                  {img ? <Image source={{ uri: img }} style={{ width: 64, height: 64 }} resizeMode="cover" /> : <Text style={{ fontSize: 28 }}>🛍️</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.ink, marginBottom: 4 }} numberOfLines={1}>{p.title}</Text>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: COLORS.primary, marginBottom: 6 }}>${Number(p.price).toFixed(2)}</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View style={{ backgroundColor: '#F1F5FF', borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 2 }}>
                      <Text style={{ fontSize: 11, color: COLORS.primary, fontWeight: '600' }}>Stock: {p.stock ?? 0}</Text>
                    </View>
                    <View style={{ backgroundColor: isActive ? '#ECFDF5' : '#F3F4F6', borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 2 }}>
                      <Text style={{ fontSize: 11, color: isActive ? COLORS.success : COLORS.mute, fontWeight: '600' }}>{isActive ? 'Actif' : 'Inactif'}</Text>
                    </View>
                  </View>
                </View>
                <Icon name="chevronRight" size={18} color={COLORS.mute} />
              </TouchableOpacity>
            );
          })}
          <View style={{ height: 80 }} />
        </ScrollView>
      )}

      <TouchableOpacity onPress={() => navigation.navigate('AddProduct')}
        style={{ position: 'absolute', bottom: 32, right: 24, backgroundColor: COLORS.primary, borderRadius: RADIUS.full, width: 56, height: 56, alignItems: 'center', justifyContent: 'center', ...SHADOW.md }}>
        <Icon name="plus" size={24} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
