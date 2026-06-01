import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, RADIUS, SHADOW } from '../../lib/tokens';
import { supabase } from '../../lib/supabase';
import { useSession } from '../../hooks/useSession';
import Icon from '../../components/Icon';

const STATUS_COLOR = { completed: COLORS.success, pending: '#F59E0B', failed: COLORS.danger };
const STATUS_LABEL = { completed: 'Complété', pending: 'En attente', failed: 'Échoué' };

export default function PaymentHistoryScreen({ navigation }) {
  const session = useSession();
  const [payments, setPayments] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    if (!session?.user) return;
    (async () => {
      try {
        const { data: p1 } = await supabase.from('payouts').select('*').eq('seller_id', session.user.id).order('created_at', { ascending: false }).limit(50);
        if (p1 && p1.length > 0) {
          setPayments(p1);
          setBalance(p1.filter(p => p.status === 'completed').reduce((s, p) => s + (p.amount ?? 0), 0));
        } else {
          const { data: p2 } = await supabase.from('payment_history').select('*').eq('seller_id', session.user.id).order('created_at', { ascending: false }).limit(50);
          setPayments(p2 ?? []);
          setBalance((p2 ?? []).filter(p => p.status === 'completed').reduce((s, p) => s + (p.amount ?? 0), 0));
        }
      } catch {
        setPayments([]);
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
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: COLORS.ink }}>Historique des paiements</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 16 }}>
          <View style={{ backgroundColor: COLORS.primary, borderRadius: RADIUS.md, padding: 24, alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '600' }}>Solde disponible</Text>
            <Text style={{ fontSize: 36, fontWeight: '900', color: '#fff', letterSpacing: -1 }}>${balance.toFixed(2)}</Text>
          </View>

          {payments.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 48, gap: 12 }}>
              <Text style={{ fontSize: 48 }}>💳</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.ink }}>Aucun paiement pour l'instant</Text>
              <Text style={{ fontSize: 14, color: COLORS.mute, textAlign: 'center' }}>Vos paiements apparaîtront ici une fois que vous aurez des ventes.</Text>
            </View>
          ) : (
            <View style={{ backgroundColor: COLORS.white, borderRadius: RADIUS.md, overflow: 'hidden', ...SHADOW.sm }}>
              {payments.map((p, i) => {
                const color = STATUS_COLOR[p.status] ?? COLORS.mute;
                return (
                  <View key={p.id ?? i} style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: i < payments.length - 1 ? 1 : 0, borderBottomColor: COLORS.hairline }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.ink }}>{p.description ?? p.method ?? 'Paiement'}</Text>
                      <Text style={{ fontSize: 12, color: COLORS.mute }}>{new Date(p.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                    </View>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: COLORS.primary, marginRight: 10 }}>${Number(p.amount ?? 0).toFixed(2)}</Text>
                    <View style={{ backgroundColor: color + '20', borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color }}>{STATUS_LABEL[p.status] ?? p.status}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
