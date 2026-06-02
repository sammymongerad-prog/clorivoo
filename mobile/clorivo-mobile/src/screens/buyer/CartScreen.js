import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, RADIUS, SHADOW } from '../../lib/tokens';
import { Btn, EmptyState } from '../../components/UI';
import { getCart, upsertCartItem, supabase } from '../../lib/supabase';
import { useSession } from '../../hooks/useSession';

export default function CartScreen({ navigation }) {
  const session = useSession();
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!session?.user) { setLoading(false); return; }
    setLoading(true);
    const data = await getCart(session.user.id);
    setItems(data ?? []);
    setLoading(false);
  }

  useFocusEffect(useCallback(() => { load(); }, [session]));

  async function changeQty(item, delta) {
    const newQty = (item.quantity ?? 1) + delta;
    if (newQty <= 0) {
      await supabase.from('cart_items').delete().eq('id', item.id);
      setItems(prev => prev.filter(i => i.id !== item.id));
      return;
    }
    await upsertCartItem(session.user.id, item.product_id, item.variant ?? {}, delta, item.unit_price);
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, quantity: newQty } : i));
  }

  const subtotal = items.reduce((s, i) => s + (i.unit_price ?? 0) * (i.quantity ?? 1), 0);

  if (loading) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={COLORS.primary} size="large" />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.paper }} edges={['top']}>
      <View style={{ backgroundColor: COLORS.white, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.hairline }}>
        <Text style={{ fontSize: 20, fontWeight: '800', color: COLORS.ink, letterSpacing: -0.5 }}>Panier</Text>
      </View>

      {!session?.user ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🛒</Text>
          <Text style={{ fontSize: 17, fontWeight: '700', color: COLORS.ink, marginBottom: 8 }}>Connectez-vous</Text>
          <Text style={{ fontSize: 14, color: COLORS.mute, textAlign: 'center', marginBottom: 24 }}>Créez un compte pour accéder à votre panier</Text>
          <Btn onPress={() => navigation.navigate('Login')}>Se connecter</Btn>
        </View>
      ) : items.length === 0 ? (
        <EmptyState icon="🛒" title="Panier vide" subtitle="Ajoutez des produits pour commencer vos achats" />
      ) : (
        <>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
            {items.map(item => {
              const img = item.products?.images?.[0];
              return (
                <View key={item.id} style={{ backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: 12, flexDirection: 'row', gap: 12, ...SHADOW.sm }}>
                  <View style={{ width: 80, height: 80, borderRadius: RADIUS.sm, backgroundColor: COLORS.primarySoft, overflow: 'hidden' }}>
                    {img
                      ? <Image source={{ uri: img }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                      : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 28 }}>🛍️</Text></View>}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.ink, marginBottom: 4 }} numberOfLines={2}>{item.products?.title ?? 'Produit'}</Text>
                    {item.variant?.size && <Text style={{ fontSize: 12, color: COLORS.mute, marginBottom: 8 }}>Taille: {item.variant.size}</Text>}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.primary }}>${Number(item.unit_price).toFixed(2)}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <TouchableOpacity onPress={() => changeQty(item, -1)}
                          style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.hairline, alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ fontSize: 16, color: COLORS.ink }}>−</Text>
                        </TouchableOpacity>
                        <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.ink, minWidth: 20, textAlign: 'center' }}>{item.quantity ?? 1}</Text>
                        <TouchableOpacity onPress={() => changeQty(item, 1)}
                          style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ fontSize: 16, color: '#fff' }}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <View style={{ backgroundColor: COLORS.white, padding: 20, paddingBottom: 32, borderTopWidth: 1, borderTopColor: COLORS.hairline, gap: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 15, color: COLORS.mute }}>Sous-total ({items.length} articles)</Text>
              <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.ink }}>${subtotal.toFixed(2)}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 15, color: COLORS.mute }}>Livraison</Text>
              <Text style={{ fontSize: 15, color: COLORS.success, fontWeight: '600' }}>{subtotal >= 30 ? 'Gratuite' : '$3.99'}</Text>
            </View>
            <View style={{ height: 1, backgroundColor: COLORS.hairline }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 17, fontWeight: '700', color: COLORS.ink }}>Total</Text>
              <Text style={{ fontSize: 17, fontWeight: '800', color: COLORS.primary }}>${(subtotal + (subtotal >= 30 ? 0 : 3.99)).toFixed(2)}</Text>
            </View>
            <Btn size="lg" onPress={() => navigation.navigate('Checkout', { items, subtotal })}>
              Commander →
            </Btn>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
