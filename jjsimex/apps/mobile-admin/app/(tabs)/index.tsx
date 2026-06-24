import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, SafeAreaView,
  RefreshControl, Dimensions, FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { getAllPackages, getPackageStats } from '@jjsimex/supabase/packages';
import { getPaymentStats } from '@jjsimex/supabase/payments';
import { StatusBadge } from '@/components/ui/StatusBadge';

const { width } = Dimensions.get('window');

const PERIODS = ["Aujourd'hui", '7 jours', '30 jours', 'Ce mois'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Pkg = any;
type PeriodStats = {
  total: number; count_growth: number; revenue: number; revenue_growth: number;
  by_status: Record<string, number>;
};
type PayStats = { total_confirmed: number; growth_percentage: number };

const BRANCHES = [
  { name: 'Delmas 31, PAP', perf: 87 },
  { name: 'Cap-Haïtien', perf: 72 },
  { name: 'Santiago, RD', perf: 65 },
];

export default function AdminDashboard() {
  const router = useRouter();
  const { profile } = useAuth();
  const [period, setPeriod] = useState(2); // 30 jours default
  const [pkgStats, setPkgStats] = useState<PeriodStats | null>(null);
  const [payStats, setPayStats] = useState<PayStats | null>(null);
  const [recentPkgs, setRecentPkgs] = useState<Pkg[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const p = period === 0 ? 'week' : period === 1 ? 'week' : 'month';
    try {
      const [ps, pays, pkgs] = await Promise.all([
        getPackageStats(p),
        getPaymentStats(p),
        getAllPackages({ limit: 4 } as Parameters<typeof getAllPackages>[0]),
      ]);
      setPkgStats(ps as PeriodStats);
      setPayStats(pays as PayStats);
      setRecentPkgs((pkgs as any)?.packages?.slice(0, 4) ?? []);
    } catch {}
  }, [period]);

  useEffect(() => { load(); }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const firstName = profile?.first_name ?? 'Admin';
  const initials = profile ? `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase() : 'MJ';
  const fmt = (n: number) => n.toLocaleString('fr-FR');
  const fmtUSD = (n: number) => `$${n.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}`;
  const fmtGrowth = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;

  const KPIS = [
    { label: 'Colis reçus', value: fmt(pkgStats?.total ?? 0), growth: fmtGrowth(pkgStats?.count_growth ?? 0), up: (pkgStats?.count_growth ?? 0) >= 0, icon: '📦', color: '#F97316' },
    { label: 'Revenus', value: fmtUSD(pkgStats?.revenue ?? 0), growth: fmtGrowth(pkgStats?.revenue_growth ?? 0), up: (pkgStats?.revenue_growth ?? 0) >= 0, icon: '💰', color: '#22C55E' },
    { label: 'Paiements', value: fmtUSD(payStats?.total_confirmed ?? 0), growth: fmtGrowth(payStats?.growth_percentage ?? 0), up: (payStats?.growth_percentage ?? 0) >= 0, icon: '💳', color: '#3B82F6' },
    { label: 'En attente', value: fmt((pkgStats?.by_status?.['pending'] as number) ?? 0), growth: 'À traiter', up: false, icon: '⏳', color: '#EF4444' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0D0D0D' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F97316" />}
      >
        {/* HEADER */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#F97316', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#0D0D0D' }}>{initials}</Text>
            </View>
            <View>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>{firstName}</Text>
              <View style={{ backgroundColor: 'rgba(249,115,22,0.15)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginTop: 2 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#F97316' }}>{profile?.role === 'super_admin' ? 'Super Admin' : profile?.role === 'admin' ? 'Admin' : 'Employé'}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity onPress={() => router.push('/screens/notifications')} style={{ width: 40, height: 40, backgroundColor: '#1A1A1A', borderRadius: 12, borderWidth: 1, borderColor: '#2A2A2A', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 20 }}>🔔</Text>
          </TouchableOpacity>
        </View>

        {/* PERIOD SELECTOR */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 16 }}>
          {PERIODS.map((p, i) => (
            <TouchableOpacity
              key={p}
              onPress={() => setPeriod(i)}
              style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: period === i ? '#F97316' : '#1A1A1A', borderWidth: 1, borderColor: period === i ? '#F97316' : '#2A2A2A' }}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: period === i ? '#0D0D0D' : '#9CA3AF' }}>{p}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* KPI CARDS */}
        <FlatList
          data={KPIS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
          style={{ marginBottom: 20 }}
          renderItem={({ item }) => (
            <View style={{ width: 160, backgroundColor: '#1A1A1A', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#242424' }}>
              <Text style={{ fontSize: 24 }}>{item.icon}</Text>
              <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 12 }}>{item.label}</Text>
              <Text style={{ fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginTop: 4, letterSpacing: -0.5 }}>{item.value}</Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: item.up ? '#22C55E' : '#EF4444', marginTop: 4 }}>{item.up ? '↑' : '↓'} {item.growth}</Text>
            </View>
          )}
        />

        {/* RECENT PACKAGES */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: '#FFFFFF' }}>Derniers colis</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/colis')}><Text style={{ fontSize: 13, color: '#F97316', fontWeight: '600' }}>Voir tout →</Text></TouchableOpacity>
          </View>
          {recentPkgs.length === 0 ? (
            <View style={{ backgroundColor: '#1A1A1A', borderRadius: 14, padding: 20, borderWidth: 1, borderColor: '#242424', alignItems: 'center' }}>
              <Text style={{ color: '#9CA3AF', fontSize: 14 }}>Aucun colis récent</Text>
            </View>
          ) : recentPkgs.map((pkg: Pkg) => (
            <TouchableOpacity key={pkg.id} onPress={() => router.push(`/colis/${pkg.id}` as never)} activeOpacity={0.85}
              style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1A', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#242424', marginBottom: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#F97316' }}>{pkg.tracking_number}</Text>
                <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
                  {pkg.users?.first_name} {pkg.users?.last_name} · {pkg.destination_city ?? '—'}
                </Text>
              </View>
              <StatusBadge status={pkg.status} />
            </TouchableOpacity>
          ))}
        </View>

        {/* BRANCHES PERFORMANCE */}
        <View style={{ paddingHorizontal: 20, marginBottom: 30 }}>
          <Text style={{ fontSize: 17, fontWeight: '700', color: '#FFFFFF', marginBottom: 12 }}>Performance succursales</Text>
          <View style={{ backgroundColor: '#1A1A1A', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#242424', gap: 14 }}>
            {BRANCHES.map(b => (
              <View key={b.name}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ fontSize: 13, color: '#FFFFFF', fontWeight: '600' }}>{b.name}</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: b.perf >= 80 ? '#22C55E' : b.perf >= 65 ? '#F97316' : '#EF4444' }}>{b.perf}%</Text>
                </View>
                <View style={{ height: 6, backgroundColor: '#2A2A2A', borderRadius: 3 }}>
                  <View style={{ width: `${b.perf}%`, height: '100%', backgroundColor: b.perf >= 80 ? '#22C55E' : b.perf >= 65 ? '#F97316' : '#EF4444', borderRadius: 3 }} />
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
