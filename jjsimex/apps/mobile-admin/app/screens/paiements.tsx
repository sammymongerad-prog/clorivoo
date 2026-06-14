import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { getAllPayments } from '@jjsimex/supabase';
import { supabase } from '@/lib/supabase';
import { BackButton } from '@/components/layout/BackButton';
import { useToast } from '@/components/ui/Toast';

// ─── Types ────────────────────────────────────────────────────────────────────

type PaymentStatus = 'pending' | 'confirmed' | 'refused' | 'refunded';
type PaymentMethod = 'moncash' | 'zelle' | 'paypal' | 'cash';

interface Payment {
  id: string;
  amount: number;
  currency: string;
  client_name: string;
  package_id: string;
  method: PaymentMethod;
  status: PaymentStatus;
  created_at: string;
  notes?: string;
  reference?: string;
}

type FilterTab = 'all' | PaymentStatus;

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'Tous' },
  { key: 'pending', label: 'En attente' },
  { key: 'confirmed', label: 'Confirmés' },
  { key: 'refused', label: 'Refusés' },
  { key: 'refunded', label: 'Remboursés' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const METHOD_COLORS: Record<PaymentMethod, { bg: string; text: string; label: string }> = {
  moncash: { bg: '#FEF3C722', text: '#FBBF24', label: 'MonCash' },
  zelle:   { bg: '#6D28D922', text: '#8B5CF6', label: 'Zelle' },
  paypal:  { bg: '#1D4ED822', text: '#3B82F6', label: 'PayPal' },
  cash:    { bg: '#16A34A22', text: '#22C55E', label: 'Cash' },
};

const STATUS_CONFIG: Record<PaymentStatus, { color: string; label: string; bg: string }> = {
  pending:   { color: '#FBBF24', label: 'En attente', bg: '#FBBF2422' },
  confirmed: { color: '#22C55E', label: 'Confirmé',   bg: '#22C55E22' },
  refused:   { color: '#EF4444', label: 'Refusé',     bg: '#EF444422' },
  refunded:  { color: '#8B5CF6', label: 'Remboursé',  bg: '#8B5CF622' },
};

function formatDateTime(iso: string): { date: string; time: string } {
  try {
    const d = new Date(iso);
    const date = d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return { date, time };
  } catch {
    return { date: iso, time: '' };
  }
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={kpiStyles.card}>
      <Text style={[kpiStyles.value, { color }]}>{value}</Text>
      <Text style={kpiStyles.label}>{label}</Text>
    </View>
  );
}

const kpiStyles = StyleSheet.create({
  card: {
    backgroundColor: '#1A1A1A', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    marginRight: 10, borderWidth: 1, borderColor: '#2A2A2A',
    minWidth: 100, alignItems: 'center',
  },
  value: { fontSize: 18, fontWeight: '800', marginBottom: 2 },
  label: { fontSize: 11, color: '#9CA3AF', fontWeight: '600' },
});

// ─── Payment Detail Bottom Sheet ──────────────────────────────────────────────

function PaymentDetailSheet({ payment, visible, onClose }: {
  payment: Payment | null;
  visible: boolean;
  onClose: () => void;
}) {
  if (!payment) return null;
  const { date, time } = formatDateTime(payment.created_at);
  const method = METHOD_COLORS[payment.method] ?? { bg: '#ffffff11', text: '#FFFFFF', label: payment.method };
  const status = STATUS_CONFIG[payment.status] ?? { color: '#9CA3AF', label: payment.status, bg: '#9CA3AF22' };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={detailStyles.overlay} onPress={onClose}>
        <Pressable onPress={() => {}} style={detailStyles.sheet}>
          <View style={detailStyles.handle} />
          <Text style={detailStyles.title}>Détail du paiement</Text>

          <View style={detailStyles.amountRow}>
            <Text style={detailStyles.amount}>
              {payment.amount.toFixed(2)} {payment.currency ?? 'USD'}
            </Text>
            <View style={[detailStyles.statusBadge, { backgroundColor: status.bg, borderColor: status.color }]}>
              <Text style={[detailStyles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
          </View>

          <View style={detailStyles.row}>
            <Text style={detailStyles.rowLabel}>Client</Text>
            <Text style={detailStyles.rowValue}>{payment.client_name}</Text>
          </View>
          <View style={detailStyles.row}>
            <Text style={detailStyles.rowLabel}>Colis #</Text>
            <Text style={detailStyles.rowValue}>{payment.package_id}</Text>
          </View>
          <View style={detailStyles.row}>
            <Text style={detailStyles.rowLabel}>Méthode</Text>
            <View style={[detailStyles.methodBadge, { backgroundColor: method.bg }]}>
              <Text style={[detailStyles.methodText, { color: method.text }]}>{method.label}</Text>
            </View>
          </View>
          {payment.reference && (
            <View style={detailStyles.row}>
              <Text style={detailStyles.rowLabel}>Référence</Text>
              <Text style={detailStyles.rowValue}>{payment.reference}</Text>
            </View>
          )}
          <View style={detailStyles.row}>
            <Text style={detailStyles.rowLabel}>Date</Text>
            <Text style={detailStyles.rowValue}>{date} à {time}</Text>
          </View>
          {payment.notes && (
            <View style={detailStyles.notesBlock}>
              <Text style={detailStyles.rowLabel}>Notes</Text>
              <Text style={detailStyles.notesText}>{payment.notes}</Text>
            </View>
          )}

          <TouchableOpacity style={detailStyles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <Text style={detailStyles.closeBtnText}>Fermer</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const detailStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#1A1A1A', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  handle: {
    width: 40, height: 4, backgroundColor: '#3A3A3A',
    borderRadius: 2, alignSelf: 'center', marginBottom: 20,
  },
  title: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 16 },
  amountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  amount: { fontSize: 28, fontWeight: '800', color: '#F97316' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  statusText: { fontSize: 12, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#252525' },
  rowLabel: { fontSize: 13, color: '#9CA3AF', fontWeight: '500' },
  rowValue: { fontSize: 13, color: '#FFFFFF', fontWeight: '600' },
  methodBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  methodText: { fontSize: 12, fontWeight: '700' },
  notesBlock: { marginTop: 12 },
  notesText: { fontSize: 13, color: '#D1D5DB', marginTop: 4, lineHeight: 18 },
  closeBtn: {
    marginTop: 20, borderRadius: 12, paddingVertical: 12,
    alignItems: 'center', borderWidth: 1, borderColor: '#3A3A3A',
  },
  closeBtnText: { fontSize: 14, fontWeight: '600', color: '#9CA3AF' },
});

// ─── Payment Card ─────────────────────────────────────────────────────────────

interface PaymentCardProps {
  payment: Payment;
  onConfirm: (id: string) => void;
  onRefuse: (id: string) => void;
  onPress: (payment: Payment) => void;
}

function PaymentCard({ payment, onConfirm, onRefuse, onPress }: PaymentCardProps) {
  const { date, time } = formatDateTime(payment.created_at);
  const method = METHOD_COLORS[payment.method] ?? { bg: '#ffffff11', text: '#FFFFFF', label: payment.method };
  const status = STATUS_CONFIG[payment.status] ?? { color: '#9CA3AF', label: payment.status, bg: '#9CA3AF22' };

  return (
    <TouchableOpacity
      style={styles.paymentCard}
      onPress={() => onPress(payment)}
      activeOpacity={0.8}
    >
      <View style={styles.pcTop}>
        <Text style={styles.pcAmount}>{payment.amount.toFixed(2)} {payment.currency ?? 'USD'}</Text>
        <View style={[styles.statusBadge, { backgroundColor: status.bg, borderColor: status.color }]}>
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>

      <View style={styles.pcMid}>
        <Text style={styles.pcClient}>{payment.client_name}</Text>
        <Text style={styles.pcPackage}>Colis #{payment.package_id}</Text>
      </View>

      <View style={styles.pcBottom}>
        <View style={[styles.methodBadge, { backgroundColor: method.bg }]}>
          <Text style={[styles.methodText, { color: method.text }]}>{method.label}</Text>
        </View>
        <Text style={styles.pcDateTime}>{date}  {time}</Text>
      </View>

      {payment.status === 'pending' && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={() => onConfirm(payment.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.confirmBtnText}>Confirmer ✓</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.refuseBtn}
            onPress={() => onRefuse(payment.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.refuseBtnText}>Refuser ✗</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function PaiementsScreen() {
  const { showToast } = useToast();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const subscriptionRef = useRef<any>(null);

  // ── Data ───────────────────────────────────────────────────────────────────

  const fetchPayments = useCallback(async () => {
    try {
      const data = await getAllPayments();
      setPayments((data as Payment[]) ?? []);
    } catch (err: any) {
      showToast('Erreur lors du chargement des paiements', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();

    subscriptionRef.current = supabase
      .channel('payments-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        fetchPayments();
      })
      .subscribe();

    return () => {
      subscriptionRef.current?.unsubscribe();
    };
  }, [fetchPayments]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPayments();
  }, [fetchPayments]);

  // ── KPIs ───────────────────────────────────────────────────────────────────

  const totalReceived = payments
    .filter(p => p.status === 'confirmed')
    .reduce((sum, p) => sum + p.amount, 0);
  const pendingCount = payments.filter(p => p.status === 'pending').length;
  const confirmedCount = payments.filter(p => p.status === 'confirmed').length;
  const refusedCount = payments.filter(p => p.status === 'refused').length;

  // ── Filtering ──────────────────────────────────────────────────────────────

  const filtered = activeFilter === 'all'
    ? payments
    : payments.filter(p => p.status === activeFilter);

  // ── Actions ────────────────────────────────────────────────────────────────

  const confirmPayment = async (paymentId: string) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({ status: 'confirmed' })
        .eq('id', paymentId);
      if (error) throw error;
      showToast('Paiement confirmé', 'success');
      fetchPayments();
    } catch {
      showToast('Erreur lors de la confirmation', 'error');
    }
  };

  const refusePayment = (paymentId: string) => {
    Alert.alert(
      'Refuser le paiement',
      'Êtes-vous sûr de vouloir refuser ce paiement ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Refuser',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('payments')
                .update({ status: 'refused' })
                .eq('id', paymentId);
              if (error) throw error;
              showToast('Paiement refusé', 'info');
              fetchPayments();
            } catch {
              showToast('Erreur lors du refus', 'error');
            }
          },
        },
      ]
    );
  };

  const openDetail = (payment: Payment) => {
    setSelectedPayment(payment);
    setDetailVisible(true);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>💳</Text>
      <Text style={styles.emptyText}>Aucun paiement trouvé</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Paiements</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* KPI Row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.kpiRow}
      >
        <KpiCard label="Total reçu" value={`$${totalReceived.toFixed(0)}`} color="#22C55E" />
        <KpiCard label="En attente" value={String(pendingCount)} color="#FBBF24" />
        <KpiCard label="Confirmés" value={String(confirmedCount)} color="#F97316" />
        <KpiCard label="Refusés" value={String(refusedCount)} color="#EF4444" />
      </ScrollView>

      {/* Filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {FILTER_TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.filterTab, activeFilter === tab.key && styles.filterTabActive]}
            onPress={() => setActiveFilter(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterTabText, activeFilter === tab.key && styles.filterTabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      {loading ? (
        <ActivityIndicator color="#F97316" size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <PaymentCard
              payment={item}
              onConfirm={confirmPayment}
              onRefuse={refusePayment}
              onPress={openDetail}
            />
          )}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F97316" />
          }
        />
      )}

      {/* Detail bottom sheet */}
      <PaymentDetailSheet
        payment={selectedPayment}
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#1A1A1A',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#FFFFFF', flex: 1, textAlign: 'center' },

  kpiRow: { paddingHorizontal: 16, paddingVertical: 14 },

  filterRow: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  filterTab: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2A2A2A', marginRight: 8,
  },
  filterTabActive: { backgroundColor: '#F97316', borderColor: '#F97316' },
  filterTabText: { fontSize: 13, fontWeight: '600', color: '#9CA3AF' },
  filterTabTextActive: { color: '#FFFFFF' },

  listContent: { padding: 16, paddingBottom: 40 },

  // Payment card
  paymentCard: {
    backgroundColor: '#1A1A1A', borderRadius: 14,
    borderWidth: 1, borderColor: '#2A2A2A',
    padding: 16, marginBottom: 12,
  },
  pcTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  pcAmount: { fontSize: 22, fontWeight: '800', color: '#F97316' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  statusText: { fontSize: 11, fontWeight: '700' },
  pcMid: { marginBottom: 10 },
  pcClient: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', marginBottom: 2 },
  pcPackage: { fontSize: 12, color: '#9CA3AF' },
  pcBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  methodBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  methodText: { fontSize: 12, fontWeight: '700' },
  pcDateTime: { fontSize: 11, color: '#9CA3AF' },

  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  confirmBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    backgroundColor: '#16A34A22', borderWidth: 1, borderColor: '#16A34A', alignItems: 'center',
  },
  confirmBtnText: { fontSize: 13, fontWeight: '700', color: '#22C55E' },
  refuseBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    backgroundColor: '#DC262622', borderWidth: 1, borderColor: '#DC2626', alignItems: 'center',
  },
  refuseBtnText: { fontSize: 13, fontWeight: '700', color: '#EF4444' },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },
});
