import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { BackButton } from '@/components/layout/BackButton';
import { useToast } from '@/components/ui/Toast';

// ─── Types ────────────────────────────────────────────────────────────────────

type TransportType = 'avion' | 'bateau';

type DepartureStatus = 'upcoming' | 'active' | 'completed';

interface Departure {
  id: string;
  transport_type: TransportType;
  route: string;
  departure_date: string;
  max_capacity_lbs: number;
  current_weight_lbs: number;
  status: DepartureStatus;
  packages?: { count: number }[];
}

type TabKey = 'upcoming' | 'active' | 'completed';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'upcoming', label: 'À venir' },
  { key: 'active', label: 'En cours' },
  { key: 'completed', label: 'Terminés' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function capacityColor(pct: number): string {
  if (pct < 70) return '#16A34A';
  if (pct < 90) return '#F97316';
  return '#DC2626';
}

function statusLabel(pct: number): string {
  if (pct >= 100) return 'Complet';
  if (pct >= 70) return 'Bientôt complet';
  return 'Places disponibles';
}

function statusBadgeColor(pct: number): string {
  if (pct >= 100) return '#DC2626';
  if (pct >= 70) return '#F97316';
  return '#16A34A';
}

function topBorderColor(dep: Departure): string {
  const pct = dep.max_capacity_lbs > 0
    ? (dep.current_weight_lbs / dep.max_capacity_lbs) * 100
    : 0;
  if (dep.status === 'active') return '#F97316';
  if (pct < 70) return '#16A34A';
  return '#DC2626';
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

// ─── DepartureCard ────────────────────────────────────────────────────────────

interface DepartureCardProps {
  departure: Departure;
  activeTab: TabKey;
  onManagePackages: (dep: Departure) => void;
  onClose: (dep: Departure) => void;
}

function DepartureCard({ departure, activeTab, onManagePackages, onClose }: DepartureCardProps) {
  const pct = departure.max_capacity_lbs > 0
    ? Math.min(100, (departure.current_weight_lbs / departure.max_capacity_lbs) * 100)
    : 0;

  return (
    <View style={[styles.card, { borderTopColor: topBorderColor(departure), borderTopWidth: 3 }]}>
      {/* Header row */}
      <View style={styles.cardHeader}>
        <Text style={styles.transportIcon}>
          {departure.transport_type === 'avion' ? '✈️' : '🚢'}
        </Text>
        <View style={styles.cardHeaderText}>
          <Text style={styles.routeText}>{departure.route}</Text>
          <Text style={styles.dateText}>{formatDate(departure.departure_date)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusBadgeColor(pct) + '22', borderColor: statusBadgeColor(pct) }]}>
          <Text style={[styles.statusBadgeText, { color: statusBadgeColor(pct) }]}>
            {statusLabel(pct)}
          </Text>
        </View>
      </View>

      {/* Weight stats */}
      <View style={styles.weightRow}>
        <Text style={styles.weightLabel}>Poids</Text>
        <Text style={styles.weightValue}>
          {departure.current_weight_lbs} / {departure.max_capacity_lbs} lbs
        </Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBg}>
        <View
          style={[
            styles.progressFill,
            { width: `${pct}%` as any, backgroundColor: capacityColor(pct) },
          ]}
        />
      </View>
      <Text style={[styles.pctText, { color: capacityColor(pct) }]}>
        {pct.toFixed(0)}% de capacité utilisée
      </Text>

      {/* Action buttons */}
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.manageBtn}
          onPress={() => onManagePackages(departure)}
          activeOpacity={0.7}
        >
          <Text style={styles.manageBtnText}>Gérer les colis</Text>
        </TouchableOpacity>

        {activeTab === 'upcoming' && (
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => onClose(departure)}
            activeOpacity={0.7}
          >
            <Text style={styles.closeBtnText}>Clôturer</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function DepartsScreen() {
  const router = useRouter();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<TabKey>('upcoming');
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // New departure form state
  const [transportType, setTransportType] = useState<TransportType>('avion');
  const [route, setRoute] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [maxCapacity, setMaxCapacity] = useState('');
  const [creating, setCreating] = useState(false);

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchDepartures = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('departures')
        .select('*, packages(count)')
        .order('departure_date', { ascending: true });

      if (error) throw error;
      setDepartures((data as Departure[]) ?? []);
    } catch (err: any) {
      showToast('Erreur lors du chargement des départs', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartures();
  }, [fetchDepartures]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDepartures();
  }, [fetchDepartures]);

  // ── Filtering ──────────────────────────────────────────────────────────────

  const statusMap: Record<TabKey, DepartureStatus> = {
    upcoming: 'upcoming',
    active: 'active',
    completed: 'completed',
  };

  const filtered = departures.filter(d => d.status === statusMap[activeTab]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleManagePackages = (dep: Departure) => {
    router.push({ pathname: '/colis', params: { departure_id: dep.id } } as any);
  };

  const handleClose = (dep: Departure) => {
    Alert.alert(
      'Clôturer le départ',
      `Voulez-vous clôturer le départ ${dep.route} du ${formatDate(dep.departure_date)} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Clôturer',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('departures')
                .update({ status: 'completed' })
                .eq('id', dep.id);
              if (error) throw error;
              showToast('Départ clôturé avec succès', 'success');
              fetchDepartures();
            } catch {
              showToast('Erreur lors de la clôture', 'error');
            }
          },
        },
      ]
    );
  };

  // ── Create departure ───────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!route.trim() || !departureDate.trim() || !maxCapacity.trim()) {
      showToast('Veuillez remplir tous les champs', 'error');
      return;
    }

    // Parse date: DD/MM/YYYY → YYYY-MM-DD
    const parts = departureDate.split('/');
    let isoDate = departureDate;
    if (parts.length === 3) {
      isoDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }

    setCreating(true);
    try {
      const { error } = await supabase.from('departures').insert({
        transport_type: transportType,
        route: route.trim(),
        departure_date: isoDate,
        max_capacity_lbs: parseFloat(maxCapacity),
        current_weight_lbs: 0,
        status: 'upcoming',
      });
      if (error) throw error;
      showToast('Départ créé avec succès', 'success');
      setModalVisible(false);
      setRoute('');
      setDepartureDate('');
      setMaxCapacity('');
      setTransportType('avion');
      fetchDepartures();
    } catch (err: any) {
      showToast('Erreur lors de la création', 'error');
    } finally {
      setCreating(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>{activeTab === 'upcoming' ? '📅' : activeTab === 'active' ? '✈️' : '✅'}</Text>
      <Text style={styles.emptyText}>Aucun départ {TABS.find(t => t.key === activeTab)?.label.toLowerCase()}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Gestion Départs</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {loading ? (
        <ActivityIndicator color="#F97316" size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <DepartureCard
              departure={item}
              activeTab={activeTab}
              onManagePackages={handleManagePackages}
              onClose={handleClose}
            />
          )}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#F97316"
            />
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>＋ Nouveau départ</Text>
      </TouchableOpacity>

      {/* Create Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalSheetWrapper}
          >
            <Pressable onPress={() => {}} style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Nouveau départ</Text>

              {/* Transport type selector */}
              <Text style={styles.fieldLabel}>Type de transport</Text>
              <View style={styles.transportSelector}>
                <TouchableOpacity
                  style={[styles.transportOption, transportType === 'avion' && styles.transportOptionActive]}
                  onPress={() => setTransportType('avion')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.transportOptionIcon}>✈️</Text>
                  <Text style={[styles.transportOptionText, transportType === 'avion' && styles.transportOptionTextActive]}>
                    Avion
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.transportOption, transportType === 'bateau' && styles.transportOptionActive]}
                  onPress={() => setTransportType('bateau')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.transportOptionIcon}>🚢</Text>
                  <Text style={[styles.transportOptionText, transportType === 'bateau' && styles.transportOptionTextActive]}>
                    Bateau
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Route */}
              <Text style={styles.fieldLabel}>Route</Text>
              <TextInput
                style={styles.input}
                value={route}
                onChangeText={setRoute}
                placeholder="Miami → Port-au-Prince"
                placeholderTextColor="#4B5563"
                selectionColor="#F97316"
              />

              {/* Date */}
              <Text style={styles.fieldLabel}>Date de départ</Text>
              <TextInput
                style={styles.input}
                value={departureDate}
                onChangeText={setDepartureDate}
                placeholder="JJ/MM/AAAA"
                placeholderTextColor="#4B5563"
                keyboardType="numeric"
                selectionColor="#F97316"
              />

              {/* Capacity */}
              <Text style={styles.fieldLabel}>Capacité maximale (lbs)</Text>
              <TextInput
                style={styles.input}
                value={maxCapacity}
                onChangeText={setMaxCapacity}
                placeholder="500"
                placeholderTextColor="#4B5563"
                keyboardType="numeric"
                selectionColor="#F97316"
              />

              <TouchableOpacity
                style={[styles.createBtn, creating && styles.createBtnDisabled]}
                onPress={handleCreate}
                disabled={creating}
                activeOpacity={0.8}
              >
                {creating ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.createBtnText}>Créer le départ</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#FFFFFF', flex: 1, textAlign: 'center', marginHorizontal: 8 },
  addBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#F97316', alignItems: 'center', justifyContent: 'center',
  },
  addBtnText: { fontSize: 22, color: '#FFFFFF', fontWeight: '700', lineHeight: 26 },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    flex: 1, paddingVertical: 8, borderRadius: 10,
    backgroundColor: '#1A1A1A', alignItems: 'center',
    borderWidth: 1, borderColor: '#2A2A2A',
  },
  tabActive: { backgroundColor: '#F97316', borderColor: '#F97316' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#9CA3AF' },
  tabTextActive: { color: '#FFFFFF' },

  // List
  listContent: { padding: 16, paddingBottom: 100 },

  // Card
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    padding: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  transportIcon: { fontSize: 24 },
  cardHeaderText: { flex: 1 },
  routeText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', marginBottom: 2 },
  dateText: { fontSize: 12, color: '#9CA3AF' },

  statusBadge: {
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8, borderWidth: 1,
  },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },

  // Weight
  weightRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  weightLabel: { fontSize: 12, color: '#9CA3AF' },
  weightValue: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },

  // Progress
  progressBg: {
    height: 6, backgroundColor: '#2A2A2A', borderRadius: 3,
    overflow: 'hidden', marginBottom: 4,
  },
  progressFill: { height: '100%', borderRadius: 3 },
  pctText: { fontSize: 11, fontWeight: '600', marginBottom: 12 },

  // Card actions
  cardActions: { flexDirection: 'row', gap: 8 },
  manageBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    backgroundColor: '#F9731622', borderWidth: 1, borderColor: '#F97316',
    alignItems: 'center',
  },
  manageBtnText: { fontSize: 13, fontWeight: '700', color: '#F97316' },
  closeBtn: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10,
    backgroundColor: '#DC262622', borderWidth: 1, borderColor: '#DC2626',
    alignItems: 'center',
  },
  closeBtnText: { fontSize: 13, fontWeight: '700', color: '#DC2626' },

  // FAB
  fab: {
    position: 'absolute', bottom: 24, left: 16, right: 16,
    backgroundColor: '#F97316', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
    shadowColor: '#F97316', shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  fabText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalSheetWrapper: { justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  modalHandle: {
    width: 40, height: 4, backgroundColor: '#3A3A3A',
    borderRadius: 2, alignSelf: 'center', marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 20 },

  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#9CA3AF', marginBottom: 6, textTransform: 'uppercase' },

  transportSelector: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  transportOption: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12, borderRadius: 12,
    backgroundColor: '#252525', borderWidth: 1, borderColor: '#3A3A3A',
  },
  transportOptionActive: { borderColor: '#F97316', backgroundColor: '#F9731622' },
  transportOptionIcon: { fontSize: 20 },
  transportOptionText: { fontSize: 14, fontWeight: '600', color: '#9CA3AF' },
  transportOptionTextActive: { color: '#F97316' },

  input: {
    backgroundColor: '#252525', borderWidth: 1, borderColor: '#3A3A3A',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: '#FFFFFF', marginBottom: 16,
  },

  createBtn: {
    backgroundColor: '#F97316', borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', marginBottom: 10,
  },
  createBtnDisabled: { opacity: 0.6 },
  createBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },

  cancelBtn: {
    borderRadius: 12, paddingVertical: 12, alignItems: 'center',
    borderWidth: 1, borderColor: '#3A3A3A',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#9CA3AF' },
});
