import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator,
  RefreshControl, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { getMyPackages } from '@jjsimex/supabase/packages';
import type { PackageStatus } from '@jjsimex/supabase/packages';

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

const FILTERS: { label: string; value: PackageStatus | 'all' }[] = [
  { label: 'Tous', value: 'all' },
  { label: 'En transit', value: 'in_transit' },
  { label: 'Arrivé', value: 'arrived' },
  { label: 'Prêt', value: 'ready_pickup' },
  { label: 'Livré', value: 'delivered' },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PackageRow = any;

export default function ColisScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [activeFilter, setActiveFilter] = useState<PackageStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const load = useCallback(async (p: number, filter: PackageStatus | 'all', replace = false) => {
    if (!session?.user.id) return;
    try {
      const result = await getMyPackages(session.user.id, {
        status: filter === 'all' ? undefined : filter,
        page: p,
      });
      if (replace) {
        setPackages(result.data);
      } else {
        setPackages((prev) => [...prev, ...result.data]);
      }
      setHasMore(result.data.length === 20);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors du chargement.');
    }
  }, [session?.user.id]);

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

  function renderItem({ item }: { item: PackageRow }) {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/colis/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.cardRow}>
          <Text style={styles.tracking}>{item.tracking_number}</Text>
          <View style={[styles.badge, { backgroundColor: `${STATUS_COLORS[item.status as PackageStatus]}20` }]}>
            <Text style={[styles.badgeText, { color: STATUS_COLORS[item.status as PackageStatus] }]}>
              {STATUS_LABELS[item.status as PackageStatus]}
            </Text>
          </View>
        </View>
        <View style={styles.cardRow}>
          <Text style={styles.meta}>{item.destination_city} · {item.transport_mode === 'air' ? 'Aérien' : 'Maritime'}</Text>
          <Text style={styles.price}>${item.price?.toFixed(2)}</Text>
        </View>
        <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString('fr-FR')}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes colis</Text>
      </View>

      {/* Filtres */}
      <FlatList
        horizontal
        data={FILTERS}
        keyExtractor={(f) => f.value}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 4 },
  title: { color: '#fff', fontSize: 24, fontWeight: '700' },
  filterBtn: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 999, borderWidth: 1, borderColor: '#2A2A2A',
    backgroundColor: '#1A1A1A',
  },
  filterBtnActive: { borderColor: '#F97316', backgroundColor: '#F9731620' },
  filterText: { color: '#9CA3AF', fontSize: 13, fontWeight: '500' },
  filterTextActive: { color: '#F97316' },
  card: {
    backgroundColor: '#1A1A1A', borderRadius: 16, borderWidth: 1,
    borderColor: '#2A2A2A', padding: 16, gap: 6,
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tracking: { color: '#F97316', fontSize: 16, fontWeight: '700' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  meta: { color: '#9CA3AF', fontSize: 13 },
  price: { color: '#22C55E', fontSize: 14, fontWeight: '700' },
  date: { color: '#6B7280', fontSize: 12 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { color: '#9CA3AF', fontSize: 14 },
  errorBox: { margin: 16, backgroundColor: '#EF444420', borderRadius: 12, borderWidth: 1, borderColor: '#EF444450', padding: 16 },
  errorText: { color: '#EF4444', fontSize: 14 },
});
