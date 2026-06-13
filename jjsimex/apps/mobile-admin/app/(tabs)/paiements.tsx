import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput } from 'react-native';
import { getAllPayments, confirmPayment, refusePayment, getPaymentStats, type Payment, type PaymentStats } from '@jjsimex/supabase/payments';
import { useAuth } from '@/contexts/AuthContext';

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  header: { padding: 20, paddingTop: 16, borderBottomWidth: 1, borderBottomColor: '#1A1A1A' },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
  headerSub: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },
  kpiScroll: { paddingVertical: 16, paddingHorizontal: 14 },
  kpiCard: { width: 140, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#222', borderRadius: 12, padding: 12, marginRight: 10 },
  kpiLabel: { fontSize: 11, color: '#9CA3AF', marginBottom: 6 },
  kpiValue: { fontSize: 18, fontWeight: '700', color: '#fff' },
  kpiTrend: { fontSize: 11, fontWeight: '600', marginTop: 6, color: '#22C55E' },
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 12, gap: 8 },
  tab: { height: 36, paddingHorizontal: 14, backgroundColor: '#1A1A1A', borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2A2A2A' },
  tabActive: { backgroundColor: 'rgba(249,115,22,0.12)', borderColor: '#F97316' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#9CA3AF' },
  tabTextActive: { color: '#F97316' },
  listContainer: { padding: 12, paddingBottom: 40 },
  card: { backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#222', borderRadius: 12, padding: 14, marginBottom: 10 },
  cardSelected: { borderColor: '#F97316', backgroundColor: '#1F1F1F' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F97316', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  avatarText: { fontSize: 12, fontWeight: '700', color: '#0D0D0D' },
  cardTitle: { fontSize: 13, fontWeight: '700', color: '#fff', flex: 1 },
  cardAmount: { fontSize: 14, fontWeight: '700', color: '#22C55E' },
  cardInfo: { fontSize: 11, color: '#9CA3AF', marginBottom: 6 },
  status: { fontSize: 10, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 8, alignSelf: 'flex-start', fontWeight: '600' },
  button: { height: 40, backgroundColor: '#F97316', borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  buttonSecondary: { height: 40, backgroundColor: '#2A2A2A', borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  buttonText: { color: '#0D0D0D', fontWeight: '700', fontSize: 13 },
  buttonTextSecondary: { color: '#fff', fontWeight: '700', fontSize: 13 },
});

function getMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    moncash: 'MonCash',
    zelle: 'Zelle',
    wire: 'Virement',
    cash: 'Espèces',
    visa_mc: 'Carte',
  };
  return labels[method] || method;
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'En attente',
    confirmed: 'Confirmé ✅',
    failed: 'Échoué',
    refunded: 'Remboursé',
  };
  return labels[status] || status;
}

function getStatusStyle(status: string): { color: string; bgColor: string } {
  const styles: Record<string, { color: string; bgColor: string }> = {
    pending: { color: '#F97316', bgColor: 'rgba(249,115,22,0.12)' },
    confirmed: { color: '#22C55E', bgColor: 'rgba(34,197,94,0.12)' },
    failed: { color: '#EF4444', bgColor: 'rgba(239,68,68,0.12)' },
    refunded: { color: '#8B5CF6', bgColor: 'rgba(139,92,246,0.12)' },
  };
  return styles[status] || styles.pending;
}

export default function PaiementsTab() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showRefuseModal, setShowRefuseModal] = useState(false);
  const [refuseReason, setRefuseReason] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [paymentsData, statsData] = await Promise.all([
        getAllPayments(),
        getPaymentStats('month'),
      ]);
      setPayments(paymentsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(paymentId: string) {
    if (!user) return;
    try {
      setActionLoading(paymentId);
      await confirmPayment(paymentId, user.id);
      await loadData();
      setSelectedId(null);
    } catch (error) {
      alert('Erreur: ' + (error instanceof Error ? error.message : 'Impossible de confirmer'));
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRefuse(paymentId: string) {
    if (!user || !refuseReason) return;
    try {
      setActionLoading(paymentId);
      await refusePayment(paymentId, refuseReason, user.id);
      await loadData();
      setSelectedId(null);
      setShowRefuseModal(false);
      setRefuseReason('');
    } catch (error) {
      alert('Erreur: ' + (error instanceof Error ? error.message : 'Impossible de refuser'));
    } finally {
      setActionLoading(null);
    }
  }

  const filteredPayments = payments.filter(p => {
    if (activeTab === 'pending') return p.status === 'pending';
    if (activeTab === 'confirmed') return p.status === 'confirmed';
    if (activeTab === 'failed') return p.status === 'failed' || p.status === 'refunded';
    return true;
  });

  const selected = payments.find(p => p.id === selectedId);
  const statusCounts = {
    pending: payments.filter(p => p.status === 'pending').length,
    confirmed: payments.filter(p => p.status === 'confirmed').length,
    failed: payments.filter(p => p.status === 'failed' || p.status === 'refunded').length,
  };

  return (
    <View style={S.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={S.header}>
          <Text style={S.headerTitle}>Paiements</Text>
          <Text style={S.headerSub}>Transactions et confirmations</Text>
        </View>

        {/* KPI Cards */}
        {stats && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={S.kpiScroll}>
            {[
              { label: 'Revenu', value: `$${stats.total_revenue.toFixed(0)}`, trend: `${stats.period_comparison.percentage_change >= 0 ? '+' : ''}${stats.period_comparison.percentage_change.toFixed(0)}%` },
              { label: 'En attente', value: `$${stats.pending_amount.toFixed(0)}`, trend: `${statusCounts.pending} tx` },
              { label: 'Confirmés', value: `$${stats.confirmed_amount.toFixed(0)}`, trend: `${statusCounts.confirmed} tx` },
              { label: 'Échoués', value: `$${stats.failed_amount.toFixed(0)}`, trend: `${statusCounts.failed} tx` },
            ].map((kpi, i) => (
              <View key={i} style={S.kpiCard}>
                <Text style={S.kpiLabel}>{kpi.label}</Text>
                <Text style={S.kpiValue}>{kpi.value}</Text>
                <Text style={S.kpiTrend}>{kpi.trend}</Text>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={S.tabsContainer}>
          {[
            { id: 'pending', label: `En attente (${statusCounts.pending})` },
            { id: 'confirmed', label: `Confirmés (${statusCounts.confirmed})` },
            { id: 'failed', label: `Échoués (${statusCounts.failed})` },
          ].map(tab => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={[S.tab, activeTab === tab.id && S.tabActive]}
            >
              <Text style={[S.tabText, activeTab === tab.id && S.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Payments List */}
        <View style={S.listContainer}>
          {loading ? (
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
              <ActivityIndicator color="#F97316" size="large" />
            </View>
          ) : filteredPayments.length === 0 ? (
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
              <Text style={{ fontSize: 14, color: '#9CA3AF' }}>Aucun paiement</Text>
            </View>
          ) : (
            filteredPayments.map(payment => {
              const isSelected = selectedId === payment.id;
              const statusStyle = getStatusStyle(payment.status);
              const initials = payment.user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'UN';
              return (
                <TouchableOpacity
                  key={payment.id}
                  onPress={() => setSelectedId(isSelected ? null : payment.id)}
                  style={[S.card, isSelected && S.cardSelected]}
                >
                  <View style={S.cardHeader}>
                    <View style={S.avatar}>
                      <Text style={S.avatarText}>{initials}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={S.cardTitle}>{payment.user?.full_name || 'Client'}</Text>
                    </View>
                    <Text style={S.cardAmount}>${payment.amount.toFixed(2)}</Text>
                  </View>
                  <Text style={S.cardInfo}>TXN: {payment.transaction_number}</Text>
                  <Text style={S.cardInfo}>💳 {getMethodLabel(payment.method)}</Text>
                  {payment.reference && (
                    <Text style={S.cardInfo}>Réf: {payment.reference}</Text>
                  )}
                  <Text style={[S.status, { backgroundColor: statusStyle.bgColor, color: statusStyle.color }]}>
                    {getStatusLabel(payment.status)}
                  </Text>

                  {isSelected && (
                    <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#222' }}>
                      {payment.status === 'pending' && (
                        <>
                          <TouchableOpacity
                            onPress={() => handleConfirm(payment.id)}
                            disabled={actionLoading === payment.id}
                            style={S.button}
                          >
                            <Text style={S.buttonText}>
                              {actionLoading === payment.id ? 'Confirmation...' : 'Confirmer'}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => { setShowRefuseModal(true); setRefuseReason(''); }}
                            style={S.buttonSecondary}
                          >
                            <Text style={S.buttonTextSecondary}>Refuser</Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Refuse Modal */}
      {showRefuseModal && selectedId && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end', zIndex: 1000 }}>
          <View style={{ backgroundColor: '#1A1A1A', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 12, color: '#fff' }}>Raison du refus</Text>
            <TextInput
              style={{ backgroundColor: '#111', borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 8, color: '#fff', padding: 10, marginBottom: 16, fontSize: 13, minHeight: 80, textAlignVertical: 'top' }}
              placeholder="Décrire la raison..."
              placeholderTextColor="#5B6470"
              value={refuseReason}
              onChangeText={setRefuseReason}
              multiline
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => setShowRefuseModal(false)}
                style={[S.button, { flex: 1, backgroundColor: '#2A2A2A', height: 38 }]}
              >
                <Text style={[S.buttonText, { color: '#fff' }]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleRefuse(selectedId)}
                disabled={!refuseReason || actionLoading === selectedId}
                style={[S.button, { flex: 1, backgroundColor: '#EF4444', height: 38, opacity: !refuseReason || actionLoading === selectedId ? 0.5 : 1 }]}
              >
                <Text style={S.buttonText}>{actionLoading === selectedId ? '...' : 'Refuser'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
