import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, RADIUS, SHADOW } from '../../lib/tokens';
import { EmptyState } from '../../components/UI';
import { getSellerOrders, supabase } from '../../lib/supabase';
import { useSession } from '../../hooks/useSession';

const STATUS_COLOR = { pending: '#F59E0B', confirmed: COLORS.primary, shipped: '#3B82F6', delivered: '#10B981' };
const STATUS_LABEL = { pending: 'En attente', confirmed: 'Confirmée', shipped: 'Expédiée', delivered: 'Livrée' };
const NEXT_STATUS  = { pending: 'confirmed', confirmed: 'shipped', shipped: 'delivered' };
const NEXT_LABEL   = { pending: 'Confirmer', confirmed: 'Marquer expédiée', shipped: 'Marquer livrée' };

export default function SellerOrdersScreen({ navigation }) {
  const session = useSession();
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    if (!session?.user) return;
    getSellerOrders(session.user.id, 50).then(data => { setOrders(data ?? []); setLoading(false); });
  }, [session]));

  async function advanceStatus(order) {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    Alert.alert(NEXT_LABEL[order.status], `Passer la commande #${order.id.slice(0,8).toUpperCase()} à "${STATUS_LABEL[next]}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Confirmer', onPress: async () => {
        await supabase.from('orders').update({ status: next }).eq('id', order.id);
        setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: next } : o));
      }},
    ]);
  }

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
        <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.ink }}>Commandes reçues</Text>
      </View>

      {orders.length === 0 ? (
        <EmptyState icon="📦" title="Aucune commande" subtitle="Les commandes de vos clients apparaîtront ici" />
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
          {orders.map(order => {
            const status = order.status ?? 'pending';
            const color  = STATUS_COLOR[status] ?? COLORS.mute;
            const canAdvance = !!NEXT_STATUS[status];
            return (
              <View key={order.id} style={{ backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: 16, ...SHADOW.sm }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.ink }}>#{order.id.slice(0, 8).toUpperCase()}</Text>
                  <View style={{ backgroundColor: color + '20', borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color }}>{STATUS_LABEL[status] ?? status}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: canAdvance ? 12 : 0 }}>
                  <Text style={{ fontSize: 13, color: COLORS.mute }}>
                    {new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </Text>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: COLORS.primary }}>${Number(order.total_amount).toFixed(2)}</Text>
                </View>
                {canAdvance && (
                  <TouchableOpacity onPress={() => advanceStatus(order)}
                    style={{ backgroundColor: COLORS.primarySoft, borderRadius: RADIUS.sm, paddingVertical: 10, alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.primary }}>{NEXT_LABEL[status]} →</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
