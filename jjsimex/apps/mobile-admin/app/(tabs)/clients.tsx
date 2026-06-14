import React, { useState, useEffect, useCallback } from 'react';
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
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { ClientCard } from '@/components/ui/ClientCard';

type FilterPill = 'all' | 'active' | 'inactive' | 'vip';

interface FilterOption {
  label: string;
  value: FilterPill;
}

const FILTER_OPTIONS: FilterOption[] = [
  { label: 'Tous', value: 'all' },
  { label: 'Actifs', value: 'active' },
  { label: 'Inactifs', value: 'inactive' },
  { label: 'VIP', value: 'vip' },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ClientRow = any;

export default function ClientsAdminScreen() {
  const router = useRouter();

  const [clients, setClients] = useState<ClientRow[]>([]);
  const [filtered, setFiltered] = useState<ClientRow[]>([]);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterPill>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchClients = useCallback(async () => {
    try {
      const { data, error: err } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (err) throw err;
      setClients(data ?? []);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors du chargement des clients.');
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchClients().finally(() => setLoading(false));
  }, [fetchClients]);

  // Apply filters and search
  useEffect(() => {
    let result = clients;

    if (activeFilter !== 'all') {
      if (activeFilter === 'active') {
        result = result.filter((c) => c.is_active === true && c.loyalty_level !== 'platinum');
      } else if (activeFilter === 'inactive') {
        result = result.filter((c) => c.is_active === false);
      } else if (activeFilter === 'vip') {
        result = result.filter(
          (c) => c.loyalty_level === 'platinum' || c.loyalty_level === 'gold',
        );
      }
    }

    if (search.trim()) {
      const lower = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.first_name?.toLowerCase().includes(lower) ||
          c.last_name?.toLowerCase().includes(lower) ||
          c.email?.toLowerCase().includes(lower) ||
          c.phone?.toLowerCase().includes(lower),
      );
    }

    setFiltered(result);
  }, [clients, activeFilter, search]);

  async function onRefresh() {
    setRefreshing(true);
    await fetchClients();
    setRefreshing(false);
  }

  function renderItem({ item }: { item: ClientRow }) {
    const clientData = {
      id: item.id,
      first_name: item.first_name ?? '',
      last_name: item.last_name ?? '',
      email: item.email ?? '',
      status: item.is_active ? 'active' : 'inactive',
      loyalty_level: item.loyalty_level,
    };
    return (
      <ClientCard
        client={clientData}
        onPress={() =>
          router.push({ pathname: '/screens/profil-client', params: { id: item.id } })
        }
      />
    );
  }

  function renderEmpty() {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>👥</Text>
        <Text style={styles.emptyTitle}>Aucun client</Text>
        <Text style={styles.emptySubtitle}>
          {search
            ? 'Aucun client ne correspond à cette recherche.'
            : 'Aucun client enregistré pour le moment.'}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Clients</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{filtered.length}</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Nom, email, téléphone..."
            placeholderTextColor="#6B7280"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {!!search && (
            <TouchableOpacity
              onPress={() => setSearch('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.searchClear}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillsRow}
      >
        {FILTER_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            onPress={() => setActiveFilter(opt.value)}
            style={[styles.pill, activeFilter === opt.value && styles.pillActive]}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.pillText,
                activeFilter === opt.value && styles.pillTextActive,
              ]}
            >
              {opt.label}
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
  pillsRow: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    backgroundColor: '#1A1A1A',
  },
  pillActive: {
    borderColor: '#F97316',
    backgroundColor: 'rgba(249,115,22,0.12)',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  pillTextActive: {
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
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 52,
    marginBottom: 14,
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
});
