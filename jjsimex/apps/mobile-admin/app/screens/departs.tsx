import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity,
  TextInput, Modal, Alert, RefreshControl, ActivityIndicator,
  KeyboardAvoidingView, Platform, Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

type DepartureStatus = 'open' | 'closed' | 'departed' | 'arrived';
type TabKey = 'upcoming' | 'active' | 'completed';

interface Departure {
  id: string;
  type: 'air' | 'sea';
  departure_date: string;
  origin: string;
  destinations: string[];
  status: DepartureStatus;
  capacity_lbs: number;
  used_capacity_lbs: number;
  notes: string | null;
  created_at: string;
  package_count: number;
}

const TABS: { key: TabKey; label: string }[] = [
  { key: 'upcoming', label: 'À venir' },
  { key: 'active', label: 'En cours' },
  { key: 'completed', label: 'Complétés' },
];

function DepartureCard({ dep, onClose, onMarkDeparted, onMarkArrived, onNotify }: {
  dep: Departure;
  onClose: (id: string) => void;
  onMarkDeparted: (id: string) => void;
  onMarkArrived: (id: string) => void;
  onNotify: (id: string) => void;
}) {
  const pct = dep.capacity_lbs > 0 ? Math.round((dep.used_capacity_lbs / dep.capacity_lbs) * 100) : 0;
  const barColor = pct >= 90 ? '#EF4444' : pct >= 70 ? '#F97316' : '#22C55E';
  const dateStr = new Date(dep.departure_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <View style={styles.card}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(249,115,22,0.12)', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 20 }}>{dep.type === 'air' ? '✈️' : '🚢'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFF' }} numberOfLines={1}>
            {dep.type === 'air' ? 'Vol' : 'Bateau'} {dep.origin} → {dep.destinations.join(', ')}
          </Text>
          <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{dateStr}</Text>
        </View>
        <View style={{
          backgroundColor: dep.status === 'open' ? 'rgba(34,197,94,0.14)' : dep.status === 'departed' ? 'rgba(59,130,246,0.14)' : dep.status === 'arrived' ? 'rgba(168,85,247,0.14)' : 'rgba(245,158,11,0.14)',
          borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4,
        }}>
          <Text style={{
            fontSize: 11, fontWeight: '700',
            color: dep.status === 'open' ? '#22C55E' : dep.status === 'departed' ? '#3B82F6' : dep.status === 'arrived' ? '#A855F7' : '#F59E0B',
          }}>
            {dep.status === 'open' ? 'Ouvert' : dep.status === 'closed' ? 'Fermé' : dep.status === 'departed' ? 'En transit' : 'Arrivé'}
          </Text>
        </View>
      </View>

      {/* Capacity */}
      <View style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 11, color: '#6B7280' }}>Capacité</Text>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFF' }}>{dep.used_capacity_lbs}/{dep.capacity_lbs} lbs ({pct}%)</Text>
        </View>
        <View style={{ height: 6, borderRadius: 3, backgroundColor: '#2A2A2A', overflow: 'hidden', marginTop: 6 }}>
          <View style={{ height: '100%', width: `${Math.min(pct, 100)}%`, backgroundColor: barColor, borderRadius: 3 }} />
        </View>
      </View>

      {/* Stats */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
        <View style={{ flex: 1, backgroundColor: '#2A2A2A', borderRadius: 10, padding: 10 }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#F97316' }}>{dep.package_count}</Text>
          <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>Colis</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: '#2A2A2A', borderRadius: 10, padding: 10 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFF' }}>{dep.destinations.join(', ')}</Text>
          <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>Destinations</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {dep.status === 'open' && (
          <>
            <TouchableOpacity onPress={() => onNotify(dep.id)} activeOpacity={0.8}
              style={{ flex: 1, minWidth: '45%', height: 40, backgroundColor: '#22C55E', borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#052E14', fontSize: 12, fontWeight: '700' }}>Notifier</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onClose(dep.id)} activeOpacity={0.8}
              style={{ flex: 1, minWidth: '45%', height: 40, backgroundColor: '#2D0A0A', borderWidth: 1, borderColor: 'rgba(239,68,68,0.4)', borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '700' }}>Fermer</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onMarkDeparted(dep.id)} activeOpacity={0.8}
              style={{ flex: 1, minWidth: '45%', height: 40, backgroundColor: 'rgba(59,130,246,0.14)', borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#3B82F6', fontSize: 12, fontWeight: '700' }}>Marquer parti</Text>
            </TouchableOpacity>
          </>
        )}
        {dep.status === 'closed' && (
          <TouchableOpacity onPress={() => onMarkDeparted(dep.id)} activeOpacity={0.8}
            style={{ flex: 1, height: 40, backgroundColor: '#3B82F6', borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '700' }}>Marquer parti</Text>
          </TouchableOpacity>
        )}
        {dep.status === 'departed' && (
          <TouchableOpacity onPress={() => onMarkArrived(dep.id)} activeOpacity={0.8}
            style={{ flex: 1, height: 42, backgroundColor: '#A855F7', borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '700' }}>Marquer arrivé</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function DepartsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>('upcoming');
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [creating, setCreating] = useState(false);

  // Create form
  const [newType, setNewType] = useState<'air' | 'sea'>('air');
  const [newDest, setNewDest] = useState('Port-au-Prince, Cap-Haïtien');
  const [newDate, setNewDate] = useState('');
  const [newCapacity, setNewCapacity] = useState('500');

  const fetchDepartures = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('departures')
        .select('*')
        .order('departure_date', { ascending: true });

      const deps = (data ?? []) as Departure[];

      if (deps.length > 0) {
        const ids = deps.map(d => d.id);
        const { data: pkgs } = await supabase
          .from('packages')
          .select('departure_id')
          .in('departure_id', ids);

        const countMap: Record<string, number> = {};
        for (const p of pkgs ?? []) {
          countMap[p.departure_id] = (countMap[p.departure_id] ?? 0) + 1;
        }
        for (const d of deps) {
          d.package_count = countMap[d.id] ?? 0;
        }
      }

      setDepartures(deps);
    } catch {
      Alert.alert('Erreur', 'Impossible de charger les départs.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartures();
    const ch = supabase
      .channel('screen_departures_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'departures' }, () => fetchDepartures())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchDepartures]);

  const filtered = departures.filter(d => {
    if (activeTab === 'upcoming') return d.status === 'open' || d.status === 'closed';
    if (activeTab === 'active') return d.status === 'departed';
    return d.status === 'arrived';
  });

  async function handleCreate() {
    if (!newDate.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer une date.');
      return;
    }

    let isoDate = newDate;
    const parts = newDate.split('/');
    if (parts.length === 3) isoDate = `${parts[2]}-${parts[1]}-${parts[0]}`;

    setCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { error } = await supabase.from('departures').insert({
        type: newType,
        departure_date: isoDate,
        origin: 'Miami, FL',
        destinations: newDest.split(',').map(s => s.trim()).filter(Boolean),
        capacity_lbs: parseFloat(newCapacity) || (newType === 'air' ? 500 : 8000),
        used_capacity_lbs: 0,
        status: 'open',
        created_by: session?.user?.id ?? null,
      });
      if (error) throw error;
      setModalVisible(false);
      setNewDate('');
      fetchDepartures();
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    }
    setCreating(false);
  }

  function handleClose(depId: string) {
    Alert.alert('Fermer départ', 'Plus aucun colis ne pourra être ajouté.', [
      { text: 'Annuler' },
      { text: 'Fermer', style: 'destructive', onPress: async () => {
        await supabase.from('departures').update({ status: 'closed' }).eq('id', depId);
        fetchDepartures();
      }},
    ]);
  }

  function handleMarkDeparted(depId: string) {
    Alert.alert('Marquer parti', 'Tous les colis passeront en transit.', [
      { text: 'Annuler' },
      { text: 'Confirmer', onPress: async () => {
        await supabase.from('departures').update({ status: 'departed' }).eq('id', depId);
        await supabase.from('packages').update({ status: 'in_transit' }).eq('departure_id', depId).in('status', ['received_usa']);
        fetchDepartures();
      }},
    ]);
  }

  function handleMarkArrived(depId: string) {
    Alert.alert('Marquer arrivé', 'Tous les colis passeront en arrivé.', [
      { text: 'Annuler' },
      { text: 'Confirmer', onPress: async () => {
        await supabase.from('departures').update({ status: 'arrived' }).eq('id', depId);
        await supabase.from('packages').update({ status: 'arrived' }).eq('departure_id', depId).eq('status', 'in_transit');
        fetchDepartures();
      }},
    ]);
  }

  async function handleNotify(depId: string) {
    const dep = departures.find(d => d.id === depId);
    if (!dep) return;

    const { data: packages } = await supabase.from('packages').select('client_id').eq('departure_id', depId);
    if (!packages || packages.length === 0) {
      Alert.alert('Info', 'Aucun colis assigné.');
      return;
    }

    const uniqueClients = [...new Set(packages.map(p => p.client_id))];
    const typeLabel = dep.type === 'air' ? 'Vol' : 'Bateau';
    const title = `${typeLabel} prévu`;
    const message = `Votre colis est prévu sur le ${typeLabel.toLowerCase()} ${dep.origin} → ${dep.destinations.join(', ')}.`;

    await supabase.from('notifications').insert(
      uniqueClients.map(cid => ({ user_id: cid, type: 'package' as const, title, message }))
    );
    Alert.alert('Envoyé', `${uniqueClients.length} client(s) notifié(s).`);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gestion Départs</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)} activeOpacity={0.7}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)} activeOpacity={0.7}>
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label} ({activeTab === tab.key ? filtered.length : departures.filter(d => {
                if (tab.key === 'upcoming') return d.status === 'open' || d.status === 'closed';
                if (tab.key === 'active') return d.status === 'departed';
                return d.status === 'arrived';
              }).length})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color="#F97316" size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, gap: 14 }}
          renderItem={({ item }) => (
            <DepartureCard dep={item} onClose={handleClose} onMarkDeparted={handleMarkDeparted} onMarkArrived={handleMarkArrived} onNotify={handleNotify} />
          )}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', padding: 40 }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>{activeTab === 'upcoming' ? '📅' : activeTab === 'active' ? '✈️' : '✅'}</Text>
              <Text style={{ color: '#6B7280', fontSize: 14 }}>Aucun départ</Text>
            </View>
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDepartures(); }} tintColor="#F97316" />}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)} activeOpacity={0.8}>
        <Text style={styles.fabText}>+ Nouveau départ</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ justifyContent: 'flex-end', flex: 1 }}>
            <Pressable onPress={() => {}} style={styles.modalSheet}>
              <View style={{ width: 36, height: 4, backgroundColor: '#2A2A2A', borderRadius: 2, alignSelf: 'center', marginBottom: 20 }} />
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFF', marginBottom: 20 }}>Nouveau départ</Text>

              <Text style={styles.fieldLabel}>Type de transport</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                {(['air', 'sea'] as const).map(m => (
                  <TouchableOpacity key={m} onPress={() => { setNewType(m); setNewCapacity(m === 'air' ? '500' : '8000'); }} activeOpacity={0.7}
                    style={{ flex: 1, height: 44, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
                      backgroundColor: newType === m ? 'rgba(249,115,22,0.12)' : '#141414',
                      borderColor: newType === m ? '#F97316' : '#2A2A2A' }}>
                    <Text style={{ color: newType === m ? '#F97316' : '#9CA3AF', fontWeight: '600' }}>
                      {m === 'air' ? '✈️ Avion' : '🚢 Bateau'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Destinations</Text>
              <TextInput style={styles.input} value={newDest} onChangeText={setNewDest} placeholderTextColor="#4B5563" />

              <Text style={styles.fieldLabel}>Date (JJ/MM/AAAA ou AAAA-MM-JJ)</Text>
              <TextInput style={styles.input} value={newDate} onChangeText={setNewDate} placeholder="15/07/2026" placeholderTextColor="#4B5563" keyboardType="numeric" />

              <Text style={styles.fieldLabel}>Capacité (lbs)</Text>
              <TextInput style={styles.input} value={newCapacity} onChangeText={setNewCapacity} keyboardType="numeric" placeholderTextColor="#4B5563" />

              <TouchableOpacity style={[styles.createBtn, creating && { opacity: 0.6 }]} onPress={handleCreate} disabled={creating} activeOpacity={0.8}>
                {creating ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.createBtnText}>Créer le départ</Text>}
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)} activeOpacity={0.7}>
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1A1A1A' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#FFF' },
  addBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F97316', alignItems: 'center', justifyContent: 'center' },
  addBtnText: { fontSize: 22, color: '#FFF', fontWeight: '700', marginTop: -2 },
  tabBar: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2A2A2A' },
  tabActive: { backgroundColor: 'rgba(249,115,22,0.12)', borderColor: '#F97316' },
  tabText: { fontSize: 13, fontWeight: '500', color: '#9CA3AF' },
  tabTextActive: { color: '#F97316', fontWeight: '600' },
  card: { backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#222', borderRadius: 16, padding: 16 },
  fab: { position: 'absolute', bottom: 24, right: 20, backgroundColor: '#F97316', borderRadius: 14, paddingHorizontal: 20, paddingVertical: 14, shadowColor: '#F97316', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  fabText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#1A1A1A', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  fieldLabel: { fontSize: 13, color: '#9CA3AF', marginBottom: 6 },
  input: { height: 48, backgroundColor: '#141414', borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 10, color: '#FFF', paddingHorizontal: 14, fontSize: 14, marginBottom: 14 },
  createBtn: { height: 50, backgroundColor: '#F97316', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  createBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  cancelBtn: { height: 44, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  cancelBtnText: { color: '#9CA3AF', fontSize: 14, fontWeight: '500' },
});
