import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator,
  RefreshControl, StyleSheet, Alert, Modal, TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { getAllPackages, updatePackageStatus } from '@jjsimex/supabase/packages';
import type { PackageStatus, PackageFilters } from '@jjsimex/supabase/packages';

const STATUS_LABELS: Record<PackageStatus, string> = {
  pending: 'En attente',
  received_usa: 'Reçu USA',
  in_transit: 'En transit',
  arrived: 'Arrivé',
  ready_pickup: 'Prêt à retirer',
  delivered: 'Livré',
};

const STATUS_COLORS: Record<PackageStatus, string> = {
  pending: '#EAB308',
  received_usa: '#3B82F6',
  in_transit: '#F97316',
  arrived: '#A855F7',
  ready_pickup: '#06B6D4',
  delivered: '#22C55E',
};

const STATUS_NEXT: Partial<Record<PackageStatus, PackageStatus[]>> = {
  pending: ['received_usa'],
  received_usa: ['in_transit'],
  in_transit: ['arrived'],
  arrived: ['ready_pickup'],
  ready_pickup: ['delivered'],
};

const FILTERS: { label: string; value: PackageStatus | 'all' }[] = [
  { label: 'Tous', value: 'all' },
  { label: 'USA', value: 'received_usa' },
  { label: 'Transit', value: 'in_transit' },
  { label: 'Arrivé', value: 'arrived' },
  { label: 'Prêt', value: 'ready_pickup' },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PackageRow = any;

export default function ColisAdminScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [activeFilter, setActiveFilter] = useState<PackageStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedPkg, setSelectedPkg] = useState<PackageRow>(null);
  const [statusNote, setStatusNote] = useState('');
  const [newStatus, setNewStatus] = useState<PackageStatus | ''>('');
  const [statusLoading, setStatusLoading] = useState(false);

  const load = useCallback(async (p: number, filter: PackageStatus | 'all', replace = false) => {
    const f: PackageFilters = {
      status: filter === 'all' ? undefined : filter,
      page: p,
    };
    try {
      const result = await getAllPackages(f);
      if (replace) {
        setPackages(result.data);
      } else {
        setPackages((prev) => [...prev, ...result.data]);
      }
      setHasMore(result.data.length === 20);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors du chargement.');
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    setPage(1);
    setPackages([]);
    load(1, activeFilter, true).finally(() => setLoading(false));
  }, [activeFilter, load]);

  async function onRefresh() {
    setRefreshing(true);
    setPage(1);
    await load(1, activeFilter, true);
    setRefreshing(false);
  }

  function loadMore() {
    if (!hasMore || loading) return;
    const next = page + 1;
    setPage(next);
    load(next, activeFilter, false);
  }

  async function handleStatusChange() {
    if (!newStatus || !selectedPkg || !session?.user.id) return;
    setStatusLoading(true);
    try {
      await updatePackageStatus(selectedPkg.id, newStatus, statusNote || undefined, session.user.id);
      setSelectedPkg(null);
      setNewStatus('');
      setStatusNote('');
      setPage(1);
      await load(1, activeFilter, true);
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Erreur lors du changement.');
    } finally {
      setStatusLoading(false);
    }
  }

  function renderItem({ item }: { item: PackageRow }) {
    const color = STATUS_COLORS[item.status as PackageStatus] ?? '#9CA3AF';
    const nextStatuses = STATUS_NEXT[item.status as PackageStatus] ?? [];

    return (
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <Text style={styles.tracking}>{item.tracking_number}</Text>
          <View style={[styles.badge, { backgroundColor: `${color}20` }]}>
            <Text style={[styles.badgeText, { color }]}>{STATUS_LABELS[item.status as PackageStatus]}</Text>
          </View>
        </View>
        <Text style={styles.meta}>
          {item.users ? `${item.users.first_name} ${item.users.last_name}` : '—'} · {item.destination_city}
        </Text>
        <View style={styles.cardRow}>
          <Text style={styles.weight}>{item.weight_billed?.toFixed(2)} lbs</Text>
          <Text style={styles.price}>${item.price?.toFixed(2)}</Text>
        </View>
        {nextStatuses.length > 0 && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => {
              setSelectedPkg(item);
              setNewStatus(nextStatuses[0]);
            }}
          >
            <Text style={styles.actionBtnText}>Changer statut → {STATUS_LABELS[nextStatuses[0]]}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Gestion colis</Text>
      </View>

      <FlatList
        horizontal
        data={FILTERS}
        keyExtractor={(f) => f.value}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setActiveFilter(item.value)}
            style={[styles.filterBtn, activeFilter === item.value && styles.filterBtnActive]}
          >
            <Text style={[styles.filterText, activeFilter === item.value && styles.filterTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#F97316" />
        </View>
      ) : packages.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.empty}>Aucun colis trouvé.</Text>
        </View>
      ) : (
        <FlatList
          data={packages}
          keyExtractor={(p) => p.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F97316" />}
        />
      )}

      {/* Modal changement statut */}
      <Modal visible={!!selectedPkg} transparent animationType="slide" onRequestClose={() => setSelectedPkg(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Changer le statut</Text>
            {selectedPkg && (
              <Text style={styles.modalTracking}>{selectedPkg.tracking_number}</Text>
            )}

            <View style={{ gap: 8, marginBottom: 16 }}>
              {(STATUS_NEXT[selectedPkg?.status as PackageStatus] ?? []).map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setNewStatus(s)}
                  style={[styles.statusOption, newStatus === s && styles.statusOptionActive]}
                >
                  <Text style={[styles.statusOptionText, newStatus === s && { color: '#fff' }]}>
                    {STATUS_LABELS[s]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.noteInput}
              value={statusNote}
              onChangeText={setStatusNote}
              placeholder="Note (optionnelle)..."
              placeholderTextColor="#6B7280"
              multiline
              numberOfLines={3}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => { setSelectedPkg(null); setNewStatus(''); setStatusNote(''); }}
              >
                <Text style={{ color: '#9CA3AF', fontSize: 15 }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, (!newStatus || statusLoading) && { opacity: 0.5 }]}
                onPress={handleStatusChange}
                disabled={!newStatus || statusLoading}
              >
                {statusLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>Confirmer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 4 },
  title: { color: '#fff', fontSize: 24, fontWeight: '700' },
  filterBtn: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 999, borderWidth: 1, borderColor: '#2A2A2A', backgroundColor: '#1A1A1A',
  },
  filterBtnActive: { borderColor: '#F97316', backgroundColor: '#F9731620' },
  filterText: { color: '#9CA3AF', fontSize: 13, fontWeight: '500' },
  filterTextActive: { color: '#F97316' },
  card: {
    backgroundColor: '#1A1A1A', borderRadius: 16, borderWidth: 1,
    borderColor: '#2A2A2A', padding: 14, gap: 6,
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tracking: { color: '#F97316', fontSize: 15, fontWeight: '700' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  meta: { color: '#9CA3AF', fontSize: 13 },
  weight: { color: '#9CA3AF', fontSize: 13 },
  price: { color: '#22C55E', fontSize: 14, fontWeight: '700' },
  actionBtn: {
    backgroundColor: '#F9731615', borderRadius: 8, borderWidth: 1,
    borderColor: '#F9731640', padding: 10, alignItems: 'center', marginTop: 4,
  },
  actionBtnText: { color: '#F97316', fontSize: 13, fontWeight: '600' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { color: '#9CA3AF', fontSize: 14 },
  errorBox: { margin: 16, backgroundColor: '#EF444420', borderRadius: 12, borderWidth: 1, borderColor: '#EF444450', padding: 16 },
  errorText: { color: '#EF4444', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: '#000000AA', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#1A1A1A', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderWidth: 1, borderColor: '#2A2A2A', padding: 24,
  },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 4 },
  modalTracking: { color: '#F97316', fontSize: 15, fontWeight: '600', marginBottom: 16 },
  statusOption: {
    backgroundColor: '#0D0D0D', borderRadius: 10, borderWidth: 1,
    borderColor: '#2A2A2A', padding: 14,
  },
  statusOptionActive: { borderColor: '#F97316', backgroundColor: '#F9731620' },
  statusOptionText: { color: '#9CA3AF', fontSize: 14, fontWeight: '500' },
  noteInput: {
    backgroundColor: '#0D0D0D', borderWidth: 1, borderColor: '#2A2A2A',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    color: '#fff', fontSize: 14, marginBottom: 16,
  },
  cancelBtn: { flex: 1, padding: 14, alignItems: 'center', borderRadius: 12, backgroundColor: '#0D0D0D' },
  confirmBtn: { flex: 1, padding: 14, alignItems: 'center', borderRadius: 12, backgroundColor: '#F97316' },
});
