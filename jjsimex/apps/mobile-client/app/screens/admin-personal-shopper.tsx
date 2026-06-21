import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Platform, StatusBar, ActivityIndicator, RefreshControl, Alert, Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowLeft, ShoppingCart, ExternalLink, MapPin, Truck,
  DollarSign, Clock, CheckCircle, XCircle, Package,
} from 'lucide-react-native';
import {
  getAllShopperRequests, sendQuote, markAsPurchased, markAsShipped,
  cancelRequest, subscribeToRequests,
} from '@jjsimex/supabase';
import type { ShopperRequest, ShopperStatus } from '@jjsimex/supabase';

const statusBarH = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 44;
const ACCENT = '#F97316';

const TABS: { key: ShopperStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'Toutes' },
  { key: 'pending', label: 'En attente' },
  { key: 'quoted', label: 'Devis envoyé' },
  { key: 'confirmed', label: 'Confirmées' },
  { key: 'purchased', label: 'Achetées' },
  { key: 'shipped', label: 'Expédiées' },
  { key: 'cancelled', label: 'Annulées' },
];

const STATUS_STYLE: Record<string, { label: string; bg: string; color: string }> = {
  pending: { label: 'En attente', bg: 'rgba(249,115,22,0.14)', color: ACCENT },
  quoted: { label: 'Devis envoyé', bg: 'rgba(59,130,246,0.14)', color: '#3B82F6' },
  confirmed: { label: 'Confirmée', bg: 'rgba(168,85,247,0.14)', color: '#A855F7' },
  purchased: { label: 'Achetée', bg: 'rgba(34,197,94,0.14)', color: '#22C55E' },
  shipped: { label: 'Expédiée', bg: 'rgba(6,182,212,0.14)', color: '#06B6D4' },
  cancelled: { label: 'Annulée', bg: 'rgba(239,68,68,0.14)', color: '#EF4444' },
};

export default function AdminPersonalShopper() {
  const router = useRouter();
  const { profile } = useAuth();
  const [tab, setTab] = useState<ShopperStatus | 'all'>('all');
  const [requests, setRequests] = useState<ShopperRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      const filters = tab === 'all' ? {} : { status: tab as ShopperStatus };
      const data = await getAllShopperRequests(filters);
      setRequests(data);
    } catch {}
    setLoading(false);
  }, [tab]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  useEffect(() => {
    const unsub = subscribeToRequests(() => fetchRequests());
    return unsub;
  }, [fetchRequests]);

  async function onRefresh() {
    setRefreshing(true);
    await fetchRequests();
    setRefreshing(false);
  }

  function handleSendQuote(r: ShopperRequest) {
    Alert.prompt('Envoyer un devis', `Prix final pour ${r.request_number}:`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Envoyer',
        onPress: async (price) => {
          if (!price || isNaN(Number(price))) return;
          try {
            await sendQuote(r.id, Number(price), profile!.id);
            fetchRequests();
          } catch (e: any) { Alert.alert('Erreur', e.message); }
        },
      },
    ], 'plain-text', '', 'decimal-pad');
  }

  function handlePurchased(r: ShopperRequest) {
    Alert.alert('Marquer acheté', `Confirmer l'achat de ${r.request_number} ?`, [
      { text: 'Non', style: 'cancel' },
      {
        text: 'Oui', onPress: async () => {
          try {
            await markAsPurchased(r.id, profile!.id);
            fetchRequests();
          } catch (e: any) { Alert.alert('Erreur', e.message); }
        },
      },
    ]);
  }

  function handleShipped(r: ShopperRequest) {
    Alert.prompt('Expédier', `Numéro de suivi pour ${r.request_number}:`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Expédier',
        onPress: async (tracking) => {
          if (!tracking?.trim()) return;
          try {
            await markAsShipped(r.id, tracking.trim(), profile!.id);
            fetchRequests();
          } catch (e: any) { Alert.alert('Erreur', e.message); }
        },
      },
    ], 'plain-text');
  }

  function handleCancel(r: ShopperRequest) {
    Alert.prompt('Annuler la demande', `Raison d'annulation pour ${r.request_number}:`, [
      { text: 'Non', style: 'cancel' },
      {
        text: 'Annuler',
        style: 'destructive',
        onPress: async (reason) => {
          if (!reason?.trim()) return;
          try {
            await cancelRequest(r.id, reason.trim(), profile!.id);
            fetchRequests();
          } catch (e: any) { Alert.alert('Erreur', e.message); }
        },
      },
    ], 'plain-text');
  }

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={20} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Personal Shopper</Text>
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
        ) : requests.length === 0 ? (
          <Text style={s.emptyText}>Aucune demande trouvée.</Text>
        ) : (
          <View style={{ paddingHorizontal: 18, gap: 14 }}>
            {requests.map((r) => {
              const badge = STATUS_STYLE[r.status] ?? STATUS_STYLE.pending;
              return (
                <View key={r.id} style={s.card}>
                  <View style={s.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.cardNum}>{r.request_number}</Text>
                      <Text style={s.cardClient}>{r.client?.full_name ?? '—'}</Text>
                    </View>
                    <View style={[s.statusBadge, { backgroundColor: badge.bg }]}>
                      <Text style={[s.statusText, { color: badge.color }]}>{badge.label}</Text>
                    </View>
                  </View>

                  <View style={s.cardBody}>
                    <View style={s.detailRow}>
                      <ShoppingCart size={13} color="#6B7280" strokeWidth={1.8} />
                      <Text style={s.detailText}>{r.merchant}</Text>
                    </View>
                    <View style={s.detailRow}>
                      <MapPin size={13} color="#6B7280" strokeWidth={1.8} />
                      <Text style={s.detailText}>{r.destination_city}, {r.destination_country === 'haiti' ? 'Haïti' : 'RD'}</Text>
                    </View>
                    <View style={s.detailRow}>
                      <Truck size={13} color="#6B7280" strokeWidth={1.8} />
                      <Text style={s.detailText}>{r.transport_mode === 'air' ? 'Aérien' : 'Maritime'} — Qté: {r.quantity}</Text>
                    </View>
                    {r.final_price != null && (
                      <View style={s.detailRow}>
                        <DollarSign size={13} color="#22C55E" strokeWidth={1.8} />
                        <Text style={[s.detailText, { color: '#22C55E' }]}>
                          ${r.final_price.toFixed(2)} + ${(r.shipping_cost ?? 0).toFixed(2)} = ${(r.total_price ?? 0).toFixed(2)}
                        </Text>
                      </View>
                    )}
                    {r.notes && (
                      <Text style={s.notes} numberOfLines={2}>Note: {r.notes}</Text>
                    )}
                  </View>

                  {r.product_url && (
                    <TouchableOpacity style={s.linkBtn} onPress={() => Linking.openURL(r.product_url)} activeOpacity={0.7}>
                      <ExternalLink size={13} color={ACCENT} strokeWidth={2} />
                      <Text style={s.linkText}>Voir le produit</Text>
                    </TouchableOpacity>
                  )}

                  <View style={s.cardActions}>
                    {r.status === 'pending' && (
                      <>
                        <TouchableOpacity style={s.actionBtn} onPress={() => handleSendQuote(r)} activeOpacity={0.7}>
                          <DollarSign size={14} color="#FFFFFF" strokeWidth={2} />
                          <Text style={s.actionText}>Devis</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={s.cancelBtn} onPress={() => handleCancel(r)} activeOpacity={0.7}>
                          <XCircle size={14} color="#EF4444" strokeWidth={2} />
                          <Text style={s.cancelText}>Annuler</Text>
                        </TouchableOpacity>
                      </>
                    )}
                    {r.status === 'confirmed' && (
                      <TouchableOpacity style={s.actionBtn} onPress={() => handlePurchased(r)} activeOpacity={0.7}>
                        <CheckCircle size={14} color="#FFFFFF" strokeWidth={2} />
                        <Text style={s.actionText}>Marquer acheté</Text>
                      </TouchableOpacity>
                    )}
                    {r.status === 'purchased' && (
                      <TouchableOpacity style={s.actionBtn} onPress={() => handleShipped(r)} activeOpacity={0.7}>
                        <Package size={14} color="#FFFFFF" strokeWidth={2} />
                        <Text style={s.actionText}>Expédier</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <Text style={s.cardDate}>
                    {new Date(r.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </Text>
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
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', padding: 14, paddingBottom: 10,
  },
  cardNum: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  cardClient: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  statusText: { fontSize: 10, fontWeight: '700' },

  cardBody: { paddingHorizontal: 14, gap: 6, paddingBottom: 10 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { fontSize: 12, color: '#9CA3AF' },
  notes: { fontSize: 11, color: '#6B7280', fontStyle: 'italic', marginTop: 2 },

  linkBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginHorizontal: 14, marginBottom: 10, paddingVertical: 6, paddingHorizontal: 10,
    backgroundColor: 'rgba(249,115,22,0.08)', borderRadius: 8, alignSelf: 'flex-start',
  },
  linkText: { fontSize: 11, fontWeight: '600', color: ACCENT },

  cardActions: {
    flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingBottom: 10,
  },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: ACCENT, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
  },
  actionText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  cancelBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
  },
  cancelText: { fontSize: 12, fontWeight: '700', color: '#EF4444' },

  cardDate: { fontSize: 10, color: '#4B5563', paddingHorizontal: 14, paddingBottom: 10 },
});
