import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, RADIUS, SHADOW } from '../../lib/tokens';
import { EmptyState } from '../../components/UI';
import { getOrders } from '../../lib/supabase';
import { useSession } from '../../hooks/useSession';

const STATUS_COLOR = { pending: '#F59E0B', confirmed: COLORS.primary, shipped: '#3B82F6', delivered: '#10B981', cancelled: '#EF4444' };
const STATUS_LABEL = { pending: 'En attente', confirmed: 'Confirmée', shipped: 'Expédiée', delivered: 'Livrée', cancelled: 'Annulée' };
const STATUS_EMOJI = { pending: '📋', confirmed: '✅', shipped: '📦', delivered: '🎉', cancelled: '❌' };

export default function OrdersScreen({ navigation }) {
  const session = useSession();
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    if (!session?.user) { setLoading(false); return; }
    getOrders(session.user.id).then(data => { setOrders(data ?? []); setLoading(false); });
  }, [session]));

  if (loading) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={COLORS.primary} size="large" />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.paper }} edges={['top']}>
      <View style={{ backgroundColor: COLORS.white, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.hairline, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 22, color: COLORS.ink }}>←</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.ink }}>Mes commandes</Text>
      </View>

      {orders.length === 0 ? (
        <EmptyState icon="📦" title="Aucune commande" subtitle="Vos commandes passées apparaîtront ici" />
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
          {orders.map(order => {
            const status = order.status ?? 'pending';
            const color  = STATUS_COLOR[status] ?? COLORS.mute;
            return (
              <TouchableOpacity key={order.id}
                onPress={() => navigation.navigate('Tracking', { orderId: order.id })}
                style={{ backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: 16, ...SHADOW.sm }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.ink }}>#{order.id.slice(0, 8).toUpperCase()}</Text>
                  <View style={{ backgroundColor: color + '20', borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontSize: 12 }}>{STATUS_EMOJI[status]}</Text>
                    <Text style={{ fontSize: 11, fontWeight: '700', color }}>{STATUS_LABEL[status] ?? status}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 13, color: COLORS.mute }}>
                    {new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </Text>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: COLORS.primary }}>${Number(order.total_amount).toFixed(2)}</Text>
                </View>
                {order.order_items?.length > 0 && (
                  <Text style={{ fontSize: 12, color: COLORS.mute, marginTop: 8 }}>
                    {order.order_items.length} article{order.order_items.length > 1 ? 's' : ''} · {order.shipping_method === 'express' ? 'Express' : 'Standard'}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
