import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, RADIUS, SHADOW } from '../../lib/tokens';
import { supabase } from '../../lib/supabase';
import { useSession } from '../../hooks/useSession';
import Icon from '../../components/Icon';

const COMMISSION_RATE = 0.10;

export default function CommissionHistoryScreen({ navigation }) {
  const session = useSession();
  const [items, setItems] = useState([]);
  const [totalSales, setTotalSales] = useState(0);
  const [totalCommission, setTotalCommission] = useState(0);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    if (!session?.user) return;
    (async () => {
      try {
        const { data: commissions } = await supabase.from('commissions').select('*').eq('seller_id', session.user.id).order('created_at', { ascending: false }).limit(100);
        if (commissions && commissions.length > 0) {
          setItems(commissions);
          setTotalSales(commissions.reduce((s, c) => s + (c.sale_amount ?? 0), 0));
          setTotalCommission(commissions.reduce((s, c) => s + (c.commission_amount ?? 0), 0));
        } else {
          const { data: orderItems } = await supabase.from('order_items')
            .select('id,title,unit_price,quantity,created_at,orders!inner(id,status,created_at)')
            .eq('seller_id', session.user.id)
            .order('created_at', { ascending: false })
            .limit(100);
          const rows = (orderItems ?? []).map(i => {
            const sale = (i.unit_price ?? 0) * (i.quantity ?? 1);
            const commission = sale * COMMISSION_RATE;
            return { id: i.id, order_id: i.orders?.id ?? '', title: i.title, sale_amount: sale, commission_rate: COMMISSION_RATE, commission_amount: commission, created_at: i.created_at };
          });
          setItems(rows);
          setTotalSales(rows.reduce((s, r) => s + r.sale_amount, 0));
          setTotalCommission(rows.reduce((s, r) => s + r.commission_amount, 0));
        }
      } catch {
        setItems([]);
      }
      setLoading(false);
    })();
  }, [session]));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.paper }} edges={['top']}>
      <View style={{ backgroundColor: COLORS.white, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.hairline, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrowLeft" size={22} color={COLORS.ink} />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: COLORS.ink }}>Historique des commissions</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 16 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1, backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: 16, alignItems: 'center', gap: 4, ...SHADOW.sm }}>
              <Text style={{ fontSize: 12, color: COLORS.mute, fontWeight: '600' }}>Ventes totales</Text>
              <Text style={{ fontSize: 22, fontWeight: '900', color: COLORS.primary }}>${totalSales.toFixed(2)}</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: 16, alignItems: 'center', gap: 4, ...SHADOW.sm }}>
              <Text style={{ fontSize: 12, color: COLORS.mute, fontWeight: '600' }}>Commissions</Text>
              <Text style={{ fontSize: 22, fontWeight: '900', color: COLORS.danger }}>${totalCommission.toFixed(2)}</Text>
            </View>
          </View>

          {items.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 60, gap: 12 }}>
              <Text style={{ fontSize: 48 }}>📊</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.ink }}>Aucune commission</Text>
              <Text style={{ fontSize: 14, color: COLORS.mute }}>Vos commissions apparaîtront ici après vos ventes.</Text>
            </View>
          ) : (
            <View style={{ backgroundColor: COLORS.white, borderRadius: RADIUS.md, overflow: 'hidden', ...SHADOW.sm }}>
              <View style={{ flexDirection: 'row', backgroundColor: COLORS.paper, padding: 12, borderBottomWidth: 1, borderBottomColor: COLORS.hairline }}>
                <Text style={{ flex: 2, fontSize: 11, fontWeight: '700', color: COLORS.mute }}>PRODUIT</Text>
                <Text style={{ flex: 1, fontSize: 11, fontWeight: '700', color: COLORS.mute, textAlign: 'right' }}>VENTE</Text>
                <Text style={{ flex: 1, fontSize: 11, fontWeight: '700', color: COLORS.mute, textAlign: 'right' }}>COMMISSION</Text>
              </View>
              {items.map((item, i) => (
                <View key={item.id ?? i} style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: i < items.length - 1 ? 1 : 0, borderBottomColor: COLORS.hairline }}>
                  <View style={{ flex: 2 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.ink }} numberOfLines={1}>{item.title ?? 'Produit'}</Text>
                    <Text style={{ fontSize: 11, color: COLORS.mute }}>
                      {item.order_id ? '#' + item.order_id.slice(0, 8).toUpperCase() + '  •  ' : ''}
                      {new Date(item.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </Text>
                  </View>
                  <Text style={{ flex: 1, fontSize: 13, fontWeight: '700', color: COLORS.ink, textAlign: 'right' }}>${Number(item.sale_amount ?? 0).toFixed(2)}</Text>
                  <Text style={{ flex: 1, fontSize: 13, fontWeight: '700', color: COLORS.danger, textAlign: 'right' }}>-${Number(item.commission_amount ?? 0).toFixed(2)}</Text>
                </View>
              ))}
            </View>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
