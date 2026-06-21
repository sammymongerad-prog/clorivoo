import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Platform, StatusBar, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowLeft, DollarSign, CheckCircle, XCircle, Clock,
  CreditCard, TrendingUp, AlertTriangle,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

type PaymentStatus = 'pending' | 'confirmed' | 'failed' | 'refunded';

interface Payment {
  id: string;
  transaction_number: string;
  user_id: string;
  package_id: string;
  amount: number;
  method: string;
  reference: string;
  status: PaymentStatus;
  confirmed_by?: string | null;
  created_at: string;
  user?: { full_name?: string; email?: string };
  package?: { tracking_number?: string; destination_city?: string; total_price?: number };
}

interface PaymentStats {
  total_revenue: number;
  pending_amount: number;
  confirmed_amount: number;
}

const statusBarH = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 44;
const ACCENT = '#F97316';

const TABS: { key: PaymentStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'Tous' },
  { key: 'pending', label: 'En attente' },
  { key: 'confirmed', label: 'Confirmés' },
  { key: 'failed', label: 'Refusés' },
  { key: 'refunded', label: 'Remboursés' },
];

const STATUS_STYLE: Record<string, { label: string; bg: string; color: string; icon: any }> = {
  pending: { label: 'En attente', bg: 'rgba(249,115,22,0.14)', color: ACCENT, icon: Clock },
  confirmed: { label: 'Confirmé', bg: 'rgba(34,197,94,0.14)', color: '#22C55E', icon: CheckCircle },
  failed: { label: 'Refusé', bg: 'rgba(239,68,68,0.14)', color: '#EF4444', icon: XCircle },
  refunded: { label: 'Remboursé', bg: 'rgba(168,85,247,0.14)', color: '#A855F7', icon: AlertTriangle },
};

const METHOD_LABELS: Record<string, string> = {
  moncash: 'MonCash',
  zelle: 'Zelle',
  wire: 'Virement',
  cash: 'Espèces',
  visa_mc: 'Carte',
};

export default function AdminPaiements() {
  const router = useRouter();
  const { profile } = useAuth();
  const [tab, setTab] = useState<PaymentStatus | 'all'>('all');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      let query = supabase
        .from('payments')
        .select('*, user:user_id(full_name, email), package:package_id(tracking_number, destination_city, total_price)')
        .order('created_at', { ascending: false });

      if (tab !== 'all') query = query.eq('status', tab);

      const { data } = await query;
      const all = (data ?? []) as Payment[];
      setPayments(all);

      const confirmed = all.filter(p => p.status === 'confirmed');
      const pending = all.filter(p => p.status === 'pending');
      setStats({
        total_revenue: confirmed.reduce((s, p) => s + p.amount, 0),
        pending_amount: pending.reduce((s, p) => s + p.amount, 0),
        confirmed_amount: confirmed.reduce((s, p) => s + p.amount, 0),
      });
    } catch {}
    setLoading(false);
  }, [tab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const channel = supabase
      .channel('payments_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  async function onRefresh() {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }

  function handleConfirm(p: Payment) {
    Alert.alert('Confirmer le paiement', `Confirmer $${p.amount.toFixed(2)} de ${p.user?.full_name ?? 'client'} ?`, [
      { text: 'Non', style: 'cancel' },
      {
        text: 'Confirmer', onPress: async () => {
          try {
            await supabase.from('payments').update({ status: 'confirmed', confirmed_by: profile!.id, confirmed_at: new Date().toISOString() }).eq('id', p.id);
            fetchData();
          } catch (e: any) { Alert.alert('Erreur', e.message); }
        },
      },
    ]);
  }

  function handleRefuse(p: Payment) {
    Alert.prompt('Refuser le paiement', `Raison du refus pour ${p.transaction_number}:`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Refuser',
        style: 'destructive',
        onPress: async (reason) => {
          if (!reason?.trim()) return;
          try {
            await supabase.from('payments').update({ status: 'failed', refused_reason: reason.trim() }).eq('id', p.id);
            fetchData();
          } catch (e: any) { Alert.alert('Erreur', e.message); }
        },
      },
    ], 'plain-text');
  }

  const pendingCount = payments.filter(p => p.status === 'pending').length;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={20} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Paiements</Text>
        {pendingCount > 0 && (
          <View style={s.headerBadge}>
            <Text style={s.headerBadgeText}>{pendingCount}</Text>
          </View>
        )}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />}
      >
        {stats && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 18, gap: 10, paddingTop: 14 }}>
            <View style={s.kpiCard}>
              <TrendingUp size={16} color="#22C55E" strokeWidth={2} />
              <Text style={s.kpiLabel}>Revenus ce mois</Text>
              <Text style={s.kpiValue}>${stats.total_revenue.toLocaleString('en', { minimumFractionDigits: 2 })}</Text>
            </View>
            <View style={s.kpiCard}>
              <Clock size={16} color={ACCENT} strokeWidth={2} />
              <Text style={s.kpiLabel}>En attente</Text>
              <Text style={s.kpiValue}>${stats.pending_amount.toLocaleString('en', { minimumFractionDigits: 2 })}</Text>
            </View>
            <View style={s.kpiCard}>
              <CreditCard size={16} color="#3B82F6" strokeWidth={2} />
              <Text style={s.kpiLabel}>Confirmés</Text>
              <Text style={s.kpiValue}>${stats.confirmed_amount.toLocaleString('en', { minimumFractionDigits: 2 })}</Text>
            </View>
          </ScrollView>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 18, gap: 8, paddingVertical: 14 }}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[s.tabBtn, tab === t.key && s.tabBtnActive]}
              onPress={() => { setTab(t.key); setLoading(true); }}
              activeOpacity={0.8}
            >
              <Text style={[s.tabText, tab === t.key && s.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <ActivityIndicator color={ACCENT} style={{ marginTop: 40 }} />
        ) : payments.length === 0 ? (
          <Text style={s.emptyText}>Aucun paiement trouvé.</Text>
        ) : (
          <View style={{ paddingHorizontal: 18, gap: 12 }}>
            {payments.map((p) => {
              const badge = STATUS_STYLE[p.status] ?? STATUS_STYLE.pending;
              const BadgeIcon = badge.icon;
              return (
                <View key={p.id} style={s.card}>
                  <View style={s.cardTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.cardTxn}>{p.transaction_number}</Text>
                      <Text style={s.cardClient}>{p.user?.full_name ?? '—'}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={s.cardAmount}>${p.amount.toFixed(2)}</Text>
                      <View style={[s.statusBadge, { backgroundColor: badge.bg }]}>
                        <BadgeIcon size={10} color={badge.color} strokeWidth={2} />
                        <Text style={[s.statusText, { color: badge.color }]}>{badge.label}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={s.cardMeta}>
                    <Text style={s.metaText}>
                      {METHOD_LABELS[p.method] ?? p.method} — Réf: {p.reference}
                    </Text>
                    {p.package?.tracking_number && (
                      <Text style={s.metaText}>Colis: {p.package.tracking_number}</Text>
                    )}
                    <Text style={s.metaText}>
                      {new Date(p.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>

                  {p.status === 'pending' && (
                    <View style={s.cardActions}>
                      <TouchableOpacity style={s.confirmBtn} onPress={() => handleConfirm(p)} activeOpacity={0.7}>
                        <CheckCircle size={14} color="#FFFFFF" strokeWidth={2} />
                        <Text style={s.confirmText}>Confirmer</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={s.refuseBtn} onPress={() => handleRefuse(p)} activeOpacity={0.7}>
                        <XCircle size={14} color="#EF4444" strokeWidth={2} />
                        <Text style={s.refuseText}>Refuser</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 18, paddingTop: statusBarH + 10, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: '#1A1A1A',
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', flex: 1 },
  headerBadge: { backgroundColor: ACCENT, borderRadius: 12, paddingHorizontal: 9, paddingVertical: 3 },
  headerBadgeText: { fontSize: 11, fontWeight: '800', color: '#0D0D0D' },

  kpiCard: {
    width: 150, backgroundColor: '#1A1A1A', borderRadius: 14,
    borderWidth: 1, borderColor: '#1F1F1F', padding: 14, gap: 6,
  },
  kpiLabel: { fontSize: 11, color: '#6B7280' },
  kpiValue: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },

  tabBtn: {
    height: 34, borderRadius: 99, paddingHorizontal: 14,
    backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2A2A2A',
    alignItems: 'center', justifyContent: 'center',
  },
  tabBtnActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  tabText: { fontSize: 12, fontWeight: '500', color: '#9CA3AF' },
  tabTextActive: { fontWeight: '700', color: '#0D0D0D' },

  emptyText: { fontSize: 13, color: '#666', textAlign: 'center', marginTop: 40 },

  card: {
    backgroundColor: '#1A1A1A', borderRadius: 14, borderWidth: 1, borderColor: '#1F1F1F',
    overflow: 'hidden',
  },
  cardTop: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    padding: 14, paddingBottom: 8,
  },
  cardTxn: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  cardClient: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  cardAmount: { fontSize: 16, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 },

  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99,
  },
  statusText: { fontSize: 10, fontWeight: '700' },

  cardMeta: { paddingHorizontal: 14, paddingBottom: 10, gap: 3 },
  metaText: { fontSize: 11, color: '#6B7280' },

  cardActions: {
    flexDirection: 'row', gap: 8, padding: 14, paddingTop: 4,
    borderTopWidth: 1, borderTopColor: '#222222',
  },
  confirmBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#22C55E', borderRadius: 8, paddingVertical: 9,
  },
  confirmText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  refuseBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 8, paddingVertical: 9,
  },
  refuseText: { fontSize: 12, fontWeight: '700', color: '#EF4444' },
});
