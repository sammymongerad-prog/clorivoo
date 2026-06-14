import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getAllPackages } from '@jjsimex/supabase';
import { AdminPackageCard } from '@/components/ui/AdminPackageCard';
import { StatusChanger } from '@/components/ui/StatusChanger';
import { supabase } from '@/lib/supabase';

type FilterValue = 'all' | 'pending' | 'received_usa' | 'in_transit' | 'arrived' | 'ready_pickup' | 'delivered';

interface FilterTab {
  label: string;
  value: FilterValue;
}

const FILTER_TABS: FilterTab[] = [
  { label: 'Tous', value: 'all' },
  { label: 'En attente', value: 'pending' },
  { label: 'En transit', value: 'in_transit' },
  { label: 'Arrivé', value: 'arrived' },
  { label: 'Prêt retrait', value: 'ready_pickup' },
  { label: 'Livrés', value: 'delivered' },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PackageRow = any;

export default function ColisAdminScreen() {
  const router = useRouter();

  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [filtered, setFiltered] = useState<PackageRow[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterValue>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // StatusChanger state
  const [statusTarget, setStatusTarget] = useState<PackageRow>(null);
  const [statusChangerVisible, setStatusChangerVisible] = useState(false);

  // Realtime subscription ref
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const applyFilters = useCallback(
    (pkgs: PackageRow[], filter: FilterValue, q: string) => {
      let result = pkgs;
      if (filter !== 'all') {
        result = result.filter((p) => p.status === filter);
      }
      if (q.trim()) {
        const lower = q.toLowerCase();
        result = result.filter(
          (p) =>
            p.tracking_number?.toLowerCase().includes(lower) ||
            p.users?.first_name?.toLowerCase().includes(lower) ||
            p.users?.last_name?.toLowerCase().includes(lower) ||
            p.destination_city?.toLowerCase().includes(lower),
        );
      }
      return result;
    },
    [],
  );

  const loadPackages = useCallback(async (p: number, replace = false) => {
    try {
      const result = await getAllPackages({ page: p });
      const incoming: PackageRow[] = result.data ?? result;
      setPackages((prev) => {
        const next = replace ? incoming : [...prev, ...incoming];
        return next;
      });
      setHasMore(incoming.length === 20);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors du chargement.');
    }
  }, []);

  // Initial load
  useEffect(() => {
    setLoading(true);
    setPage(1);
    loadPackages(1, true).finally(() => setLoading(false));
  }, [loadPackages]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('admin-packages-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'packages' },
        () => {
          // Refresh from page 1 silently
          loadPackages(1, true);
        },
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [loadPackages]);

  // Recompute filtered list when packages, filter, or search changes
  useEffect(() => {
    setFiltered(applyFilters(packages, activeFilter, search));
  }, [packages, activeFilter, search, applyFilters]);

  async function onRefresh() {
    setRefreshing(true);
    setPage(1);
    await loadPackages(1, true);
    setRefreshing(false);
  }

  function loadMore() {
    if (!hasMore || loading || refreshing) return;
    const next = page + 1;
    setPage(next);
    loadPackages(next, false);
  }

  function handleChangeStatus(pkg: PackageRow) {
    setStatusTarget(pkg);
    setStatusChangerVisible(true);
  }

  async function handleStatusSelected(newStatus: string) {
    setStatusChangerVisible(false);
    if (!statusTarget) return;
    try {
      await supabase
        .from('packages')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', statusTarget.id);
      // Optimistic update in list
      setPackages((prev) =>
        prev.map((p) => (p.id === statusTarget.id ? { ...p, status: newStatus } : p)),
      );
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Impossible de changer le statut.');
    } finally {
      setStatusTarget(null);
    }
  }

  function renderItem({ item }: { item: PackageRow }) {
    return (
      <AdminPackageCard
        pkg={item}
        onView={() =>
          router.push({ pathname: '/screens/detail-colis', params: { id: item.id } })
        }
        onChangeStatus={() => handleChangeStatus(item)}
      />
    );
  }

  function renderEmpty() {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📦</Text>
        <Text style={styles.emptyTitle}>Aucun colis</Text>
        <Text style={styles.emptySubtitle}>
          {search
            ? 'Aucun résultat pour cette recherche.'
            : activeFilter !== 'all'
            ? 'Aucun colis avec ce statut.'
            : 'Aucun colis enregistré pour le moment.'}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Gestion Colis</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{filtered.length}</Text>
          </View>
        </View>

        {/* Search bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Numéro de tracking, client..."
            placeholderTextColor="#6B7280"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {!!search && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.searchClear}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
      >
        {FILTER_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.value}
            onPress={() => setActiveFilter(tab.value)}
            style={[
              styles.filterTab,
              activeFilter === tab.value && styles.filterTabActive,
            ]}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterTabText,
                activeFilter === tab.value && styles.filterTabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Error */}
      {!!error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Loading */}
      {loading && !refreshing && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#F97316" size="large" />
        </View>
      )}

      {/* List */}
      {!loading && (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#F97316"
              colors={['#F97316']}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/screens/nouveau-colis')}
        activeOpacity={0.85}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Status changer */}
      {statusTarget && (
        <StatusChanger
          visible={statusChangerVisible}
          currentStatus={statusTarget.status ?? ''}
          trackingNumber={statusTarget.tracking_number}
          onSelect={handleStatusSelected}
          onClose={() => {
            setStatusChangerVisible(false);
            setStatusTarget(null);
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  countBadge: {
    backgroundColor: '#F97316',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    minWidth: 28,
    alignItems: 'center',
  },
  countBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    padding: 0,
  },
  searchClear: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  filterScroll: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    backgroundColor: '#1A1A1A',
  },
  filterTabActive: {
    borderColor: '#F97316',
    backgroundColor: 'rgba(249,115,22,0.12)',
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  filterTabTextActive: {
    color: '#F97316',
    fontWeight: '700',
  },
  errorBox: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    padding: 14,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
  },
  fabIcon: {
    fontSize: 30,
    color: '#FFFFFF',
    fontWeight: '300',
    lineHeight: 34,
  },
});
