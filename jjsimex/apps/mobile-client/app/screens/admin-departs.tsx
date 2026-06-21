import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Platform, StatusBar, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft, Plane, Ship, Calendar, MapPin, Weight, Package,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

const statusBarH = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 44;
const ACCENT = '#F97316';

type DepartureStatus = 'open' | 'full' | 'departed' | 'arrived';

const TABS: { key: DepartureStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'Tous' },
  { key: 'open', label: 'Ouverts' },
  { key: 'full', label: 'Complets' },
  { key: 'departed', label: 'Partis' },
  { key: 'arrived', label: 'Arrivés' },
];

const STATUS_STYLE: Record<string, { label: string; bg: string; color: string }> = {
  open: { label: 'Ouvert', bg: 'rgba(34,197,94,0.14)', color: '#22C55E' },
  full: { label: 'Complet', bg: 'rgba(249,115,22,0.14)', color: ACCENT },
  departed: { label: 'Parti', bg: 'rgba(59,130,246,0.14)', color: '#3B82F6' },
  arrived: { label: 'Arrivé', bg: 'rgba(168,85,247,0.14)', color: '#A855F7' },
};

interface Departure {
  id: string;
  transport_mode: 'air' | 'sea';
  departure_date: string;
  origin: string;
  destination_country: string;
  status: DepartureStatus;
  capacity_lbs: number;
  current_weight: number;
  created_at: string;
}

export default function AdminDeparts() {
  const router = useRouter();
  const [tab, setTab] = useState<DepartureStatus | 'all'>('all');
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDepartures = useCallback(async () => {
    try {
      let query = supabase
        .from('departures')
        .select('*')
        .order('departure_date', { ascending: true });

      if (tab !== 'all') query = query.eq('status', tab);

      const { data } = await query;
      setDepartures((data ?? []) as Departure[]);
    } catch {}
    setLoading(false);
  }, [tab]);

  useEffect(() => { fetchDepartures(); }, [fetchDepartures]);

  async function onRefresh() {
    setRefreshing(true);
    await fetchDepartures();
    setRefreshing(false);
  }

  function handleStatusChange(d: Departure, newStatus: DepartureStatus) {
    const labels: Record<string, string> = { open: 'Ouvert', full: 'Complet', departed: 'Parti', arrived: 'Arrivé' };
    Alert.alert('Changer le statut', `Passer "${d.transport_mode === 'air' ? 'Vol' : 'Bateau'}" à "${labels[newStatus]}" ?`, [
      { text: 'Non', style: 'cancel' },
      {
        text: 'Oui', onPress: async () => {
          try {
            await supabase.from('departures').update({ status: newStatus }).eq('id', d.id);
            fetchDepartures();
          } catch (e: any) { Alert.alert('Erreur', e.message); }
        },
      },
    ]);
  }

  function getCapacityPercent(d: Departure) {
    if (!d.capacity_lbs) return 0;
    return Math.min(100, Math.round(((d.current_weight ?? 0) / d.capacity_lbs) * 100));
  }

  function getCapacityColor(pct: number) {
    if (pct >= 90) return '#EF4444';
    if (pct >= 70) return ACCENT;
    return '#22C55E';
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={20} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Départs</Text>
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
        ) : departures.length === 0 ? (
          <Text style={s.emptyText}>Aucun départ trouvé.</Text>
        ) : (
          <View style={{ paddingHorizontal: 18, gap: 14 }}>
            {departures.map((d) => {
              const badge = STATUS_STYLE[d.status] ?? STATUS_STYLE.open;
              const pct = getCapacityPercent(d);
              const capColor = getCapacityColor(pct);
              const isAir = d.transport_mode === 'air';
              return (
                <View key={d.id} style={s.card}>
                  <View style={s.cardHeader}>
                    <View style={[s.modeIcon, { backgroundColor: isAir ? 'rgba(59,130,246,0.12)' : 'rgba(6,182,212,0.12)' }]}>
                      {isAir ? <Plane size={18} color="#3B82F6" strokeWidth={1.8} /> : <Ship size={18} color="#06B6D4" strokeWidth={1.8} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.cardTitle}>{isAir ? 'Vol aérien' : 'Bateau maritime'}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                        <Calendar size={11} color="#6B7280" strokeWidth={1.8} />
                        <Text style={s.cardDate}>
                          {new Date(d.departure_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </Text>
                      </View>
                    </View>
                    <View style={[s.statusBadge, { backgroundColor: badge.bg }]}>
                      <Text style={[s.statusText, { color: badge.color }]}>{badge.label}</Text>
                    </View>
                  </View>

                  <View style={s.cardBody}>
                    <View style={s.detailRow}>
                      <MapPin size={13} color="#6B7280" strokeWidth={1.8} />
                      <Text style={s.detailText}>{d.origin} → {d.destination_country === 'haiti' ? 'Haïti' : 'RD'}</Text>
                    </View>

                    <View style={{ marginTop: 10 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                          <Weight size={12} color="#6B7280" strokeWidth={1.8} />
                          <Text style={s.detailText}>Capacité</Text>
                        </View>
                        <Text style={[s.detailText, { color: capColor, fontWeight: '700' }]}>
                          {(d.current_weight ?? 0).toFixed(0)} / {d.capacity_lbs ?? 0} lbs ({pct}%)
                        </Text>
                      </View>
                      <View style={s.progressBg}>
                        <View style={[s.progressFill, { width: `${pct}%`, backgroundColor: capColor }]} />
                      </View>
                    </View>
                  </View>

                  {d.status === 'open' && (
                    <View style={s.cardActions}>
                      <TouchableOpacity style={s.actionBtn} onPress={() => handleStatusChange(d, 'full')} activeOpacity={0.7}>
                        <Text style={s.actionText}>Marquer complet</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#3B82F6' }]} onPress={() => handleStatusChange(d, 'departed')} activeOpacity={0.7}>
                        <Text style={s.actionText}>Marquer parti</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {d.status === 'departed' && (
                    <View style={s.cardActions}>
                      <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#A855F7' }]} onPress={() => handleStatusChange(d, 'arrived')} activeOpacity={0.7}>
                        <Text style={s.actionText}>Marquer arrivé</Text>
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
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, paddingBottom: 10,
  },
  modeIcon: {
    width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  cardDate: { fontSize: 11, color: '#6B7280' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  statusText: { fontSize: 10, fontWeight: '700' },

  cardBody: { paddingHorizontal: 14, paddingBottom: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { fontSize: 12, color: '#9CA3AF' },

  progressBg: { height: 6, borderRadius: 99, backgroundColor: '#2A2A2A' },
  progressFill: { height: 6, borderRadius: 99 },

  cardActions: {
    flexDirection: 'row', gap: 8, padding: 14, paddingTop: 0,
  },
  actionBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 9,
    backgroundColor: ACCENT, borderRadius: 8,
  },
  actionText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
});
