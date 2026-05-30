import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, RADIUS, SHADOW } from '../../lib/tokens';
import { getSellerStats, getProducts, getSellerOrders } from '../../lib/supabase';
import { useSession } from '../../hooks/useSession';

function StatCard({ emoji, label, value, color }) {
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: 14, alignItems: 'flex-start', ...SHADOW.sm }}>
      <Text style={{ fontSize: 22, marginBottom: 6 }}>{emoji}</Text>
      <Text style={{ fontSize: 22, fontWeight: '800', color: color ?? COLORS.ink, letterSpacing: -0.5 }}>{value}</Text>
      <Text style={{ fontSize: 12, color: COLORS.mute, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

export default function SellerDashboardScreen({ navigation }) {
  const session = useSession();
  const [stats, setStats]     = useState(null);
  const [orders, setOrders]   = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    if (!session?.user) return;
    Promise.all([
      getSellerStats(session.user.id),
      getSellerOrders(session.user.id, 5),
      getProducts({ seller_id: session.user.id, limit: 5 }),
    ]).then(([s, o, { data: p }]) => {
      setStats(s);
      setOrders(o ?? []);
      setProducts(p ?? []);
      setLoading(false);
    });
  }, [session]));

  if (loading) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={COLORS.primary} size="large" />
    </View>
  );

  const STATUS_COLOR = { pending: '#F59E0B', confirmed: COLORS.primary, shipped: '#3B82F6', delivered: COLORS.success };
  const STATUS_LABEL = { pending: 'En attente', confirmed: 'Confirmée', shipped: 'Expédiée', delivered: 'Livrée' };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.paper }} edges={['top']}>
      <View style={{ backgroundColor: COLORS.white, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.hairline, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 20, fontWeight: '800', color: COLORS.ink, letterSpacing: -0.5 }}>Tableau de bord</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddProduct')}
          style={{ backgroundColor: COLORS.primary, borderRadius: RADIUS.full, paddingHorizontal: 14, paddingVertical: 8, flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 16 }}>+</Text>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Produit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 16 }}>
        {/* KPI cards */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <StatCard emoji="💰" label="Revenus (30j)" value={`$${(stats?.revenue_30d ?? 0).toFixed(0)}`} color={COLORS.primary} />
          <StatCard emoji="📦" label="Commandes" value={stats?.orders_count ?? 0} />
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <StatCard emoji="🛍️" label="Produits actifs" value={stats?.products_count ?? 0} />
          <StatCard emoji="⭐" label="Note moyenne" value={`${(stats?.avg_rating ?? 4.8).toFixed(1)}`} color="#F59E0B" />
        </View>

        {/* Recent orders */}
        <View style={{ backgroundColor: COLORS.white, borderRadius: RADIUS.md, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.hairline }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.ink }}>Dernières commandes</Text>
            <TouchableOpacity onPress={() => {}}>

              <Text style={{ fontSize: 13, color: COLORS.primary }}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          {orders.length === 0 ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: COLORS.mute }}>Aucune commande pour l'instant</Text>
            </View>
          ) : orders.map(o => (
            <View key={o.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: COLORS.hairline }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.ink }}>#{o.id.slice(0, 8).toUpperCase()}</Text>
                <Text style={{ fontSize: 12, color: COLORS.mute }}>{new Date(o.created_at).toLocaleDateString('fr-FR')}</Text>
              </View>
              <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.primary }}>${Number(o.total_amount).toFixed(2)}</Text>
              <View style={{ backgroundColor: STATUS_COLOR[o.status] + '20', borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: STATUS_COLOR[o.status] }}>{STATUS_LABEL[o.status] ?? o.status}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Products */}
        <View style={{ backgroundColor: COLORS.white, borderRadius: RADIUS.md, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.hairline }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.ink }}>Mes produits</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AddProduct')}>
              <Text style={{ fontSize: 13, color: COLORS.primary }}>+ Ajouter</Text>
            </TouchableOpacity>
          </View>
          {products.length === 0 ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: COLORS.mute }}>Aucun produit — créez votre premier produit !</Text>
            </View>
          ) : products.map(p => (
            <TouchableOpacity key={p.id} onPress={() => navigation.navigate('AddProduct', { product: p })}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: COLORS.hairline }}>
              <View style={{ width: 44, height: 44, borderRadius: RADIUS.sm, backgroundColor: COLORS.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 22 }}>🛍️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.ink }} numberOfLines={1}>{p.title}</Text>
                <Text style={{ fontSize: 12, color: COLORS.mute }}>Stock: {p.stock ?? 0}</Text>
              </View>
              <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.primary }}>${Number(p.price).toFixed(2)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
