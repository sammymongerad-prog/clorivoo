import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, RADIUS } from '../../lib/tokens';
import { Btn } from '../../components/UI';
import { getOrder } from '../../lib/supabase';

const STATUS_STEPS = [
  { key: 'pending',    label: 'Commande reçue',    emoji: '📋' },
  { key: 'confirmed',  label: 'Confirmée',          emoji: '✅' },
  { key: 'shipped',    label: 'Expédiée',           emoji: '📦' },
  { key: 'delivered',  label: 'Livrée',             emoji: '🎉' },
];

export default function TrackingScreen({ route, navigation }) {
  const { orderId } = route.params ?? {};
  const [order, setOrder]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) getOrder(orderId).then(o => { setOrder(o); setLoading(false); });
    else setLoading(false);
  }, [orderId]);

  const currentIdx = STATUS_STEPS.findIndex(s => s.key === (order?.status ?? 'pending'));
  const activeIdx  = currentIdx === -1 ? 0 : currentIdx;

  if (loading) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={COLORS.primary} size="large" />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.paper }} edges={['top']}>
      <View style={{ backgroundColor: COLORS.white, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.hairline }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.ink }}>Suivi de commande</Text>
        {order && <Text style={{ fontSize: 12, color: COLORS.mute, marginTop: 2 }}>#{order.id.slice(0, 8).toUpperCase()}</Text>}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 20 }}>
        {/* Status tracker */}
        <View style={{ backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: 20 }}>
          {STATUS_STEPS.map((step, i) => {
            const done    = i <= activeIdx;
            const current = i === activeIdx;
            return (
              <View key={step.key} style={{ flexDirection: 'row', gap: 14, marginBottom: i < STATUS_STEPS.length - 1 ? 0 : 0 }}>
                <View style={{ alignItems: 'center' }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: done ? COLORS.primary : COLORS.hairline, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: done ? 18 : 16 }}>{done ? step.emoji : '·'}</Text>
                  </View>
                  {i < STATUS_STEPS.length - 1 && (
                    <View style={{ width: 2, height: 36, backgroundColor: i < activeIdx ? COLORS.primary : COLORS.hairline, marginVertical: 2 }} />
                  )}
                </View>
                <View style={{ flex: 1, paddingTop: 6, paddingBottom: i < STATUS_STEPS.length - 1 ? 36 : 0 }}>
                  <Text style={{ fontSize: 14, fontWeight: current ? '700' : '500', color: done ? COLORS.ink : COLORS.mute }}>{step.label}</Text>
                  {current && <Text style={{ fontSize: 12, color: COLORS.primary, marginTop: 2 }}>Statut actuel</Text>}
                </View>
              </View>
            );
          })}
        </View>

        {/* Order details */}
        {order && (
          <View style={{ backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: 16, gap: 10 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.ink }}>Détails</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: COLORS.mute }}>Total payé</Text>
              <Text style={{ fontWeight: '700', color: COLORS.primary }}>${Number(order.total_amount).toFixed(2)}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: COLORS.mute }}>Livraison</Text>
              <Text style={{ color: COLORS.ink }}>{order.shipping_method === 'express' ? 'Express (2-3j)' : 'Standard (5-8j)'}</Text>
            </View>
            {order.shipping_address?.city && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: COLORS.mute }}>Adresse</Text>
                <Text style={{ color: COLORS.ink, flex: 1, textAlign: 'right' }}>{order.shipping_address.line1}, {order.shipping_address.city}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <View style={{ padding: 20, paddingBottom: 32, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.hairline }}>
        <Btn variant="ghost" onPress={() => navigation.navigate('Home')}>Retour à l'accueil</Btn>
      </View>
    </SafeAreaView>
  );
}
