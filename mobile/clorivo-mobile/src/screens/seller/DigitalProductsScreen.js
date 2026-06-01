import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, RADIUS, SHADOW } from '../../lib/tokens';
import { supabase } from '../../lib/supabase';
import { useSession } from '../../hooks/useSession';
import Icon from '../../components/Icon';

export default function DigitalProductsScreen({ navigation }) {
  const session = useSession();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    if (!session?.user) return;
    (async () => {
      const { data } = await supabase.from('products')
        .select('*')
        .eq('seller_id', session.user.id)
        .eq('type', 'digital')
        .order('created_at', { ascending: false })
        .limit(50)
        .catch(() => ({ data: [] }));
      setProducts(data ?? []);
      setLoading(false);
    })();
  }, [session]));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.paper }} edges={['top']}>
      <View style={{ backgroundColor: COLORS.white, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.hairline, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrowLeft" size={22} color={COLORS.ink} />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: COLORS.ink }}>Produits digitaux</Text>
        <Text style={{ fontSize: 13, color: COLORS.mute }}>{products.length}</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : products.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 }}>
          <Text style={{ fontSize: 48 }}>💾</Text>
          <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.ink }}>Aucun produit digital</Text>
          <Text style={{ fontSize: 14, color: COLORS.mute, textAlign: 'center' }}>
            Vendez des ebooks, licences, fichiers téléchargeables et plus encore.
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('AddProduct', { digital: true })}
            style={{ backgroundColor: COLORS.primary, borderRadius: RADIUS.full, paddingHorizontal: 24, paddingVertical: 12, marginTop: 8 }}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>+ Ajouter produit digital</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
          {products.map(p => (
            <TouchableOpacity key={p.id}
              onPress={() => navigation.navigate('AddProduct', { productId: p.id, product: p, digital: true })}
              style={{ backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, ...SHADOW.sm }}>
              <View style={{ width: 52, height: 52, borderRadius: RADIUS.sm, backgroundColor: '#F1ECFF', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 26 }}>💾</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.ink, marginBottom: 4 }} numberOfLines={1}>{p.title}</Text>
                <Text style={{ fontSize: 15, fontWeight: '800', color: COLORS.primary, marginBottom: 4 }}>${Number(p.price).toFixed(2)}</Text>
                {p.download_count != null && (
                  <Text style={{ fontSize: 12, color: COLORS.mute }}>{p.download_count} téléchargements</Text>
                )}
              </View>
              <Icon name="chevronRight" size={18} color={COLORS.mute} />
            </TouchableOpacity>
          ))}
          <View style={{ height: 80 }} />
        </ScrollView>
      )}

      <TouchableOpacity onPress={() => navigation.navigate('AddProduct', { digital: true })}
        style={{ position: 'absolute', bottom: 32, right: 24, backgroundColor: COLORS.primary, borderRadius: RADIUS.full, width: 56, height: 56, alignItems: 'center', justifyContent: 'center', ...SHADOW.md }}>
        <Icon name="plus" size={24} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
