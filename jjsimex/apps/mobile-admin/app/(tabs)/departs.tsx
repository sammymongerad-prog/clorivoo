import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, TextInput, Alert } from 'react-native';
import { getClient } from '@jjsimex/supabase/client';

type Tab = 'avenir' | 'cours' | 'done';
type DepartureStatus = 'open' | 'closed' | 'departed' | 'arrived';

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

export default function DepartsAdminScreen() {
  const supabase = getClient();
  const [tab, setTab] = useState<Tab>('avenir');
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSheet, setShowSheet] = useState(false);
  const [newMode, setNewMode] = useState<'air' | 'sea'>('air');
  const [newDest, setNewDest] = useState('Port-au-Prince, Cap-Haïtien');
  const [newDate, setNewDate] = useState('');
  const [newCapacity, setNewCapacity] = useState('500');
  const [actionLoading, setActionLoading] = useState(false);

  const loadDepartures = useCallback(async () => {
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
    setLoading(false);
  }, []);

  useEffect(() => {
    loadDepartures();
    const ch = supabase
      .channel('mob_departures_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'departures' }, () => loadDepartures())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [loadDepartures]);

  const upcoming = departures.filter(d => d.status === 'open' || d.status === 'closed');
  const active = departures.filter(d => d.status === 'departed');
  const completed = departures.filter(d => d.status === 'arrived');

  const TABS = [
    { key: 'avenir' as Tab, label: `À venir (${upcoming.length})` },
    { key: 'cours' as Tab, label: `En cours (${active.length})` },
    { key: 'done' as Tab, label: `Complétés (${completed.length})` },
  ];

  const current = tab === 'avenir' ? upcoming : tab === 'cours' ? active : completed;

  async function handleCreate() {
    if (!newDate) { Alert.alert('Erreur', 'Veuillez entrer une date de départ.'); return; }
    setActionLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { error } = await supabase.from('departures').insert({
        type: newMode,
        departure_date: newDate,
        origin: 'Miami, FL',
        destinations: newDest.split(',').map(s => s.trim()).filter(Boolean),
        capacity_lbs: parseFloat(newCapacity) || (newMode === 'air' ? 500 : 8000),
        used_capacity_lbs: 0,
        status: 'open',
        created_by: session?.user?.id ?? null,
      });
      if (error) throw error;
      setShowSheet(false);
      setNewDate('');
      loadDepartures();
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    }
    setActionLoading(false);
  }

  async function handleClose(depId: string) {
    Alert.alert('Fermer départ', 'Aucun colis supplémentaire ne pourra être ajouté.', [
      { text: 'Annuler' },
      { text: 'Fermer', style: 'destructive', onPress: async () => {
        await supabase.from('departures').update({ status: 'closed' }).eq('id', depId);
        loadDepartures();
      }},
    ]);
  }

  async function handleMarkDeparted(depId: string) {
    Alert.alert('Marquer parti', 'Tous les colis passeront en transit.', [
      { text: 'Annuler' },
      { text: 'Confirmer', onPress: async () => {
        await supabase.from('departures').update({ status: 'departed' }).eq('id', depId);
        await supabase.from('packages').update({ status: 'in_transit' }).eq('departure_id', depId).in('status', ['received_usa']);
        loadDepartures();
      }},
    ]);
  }

  async function handleMarkArrived(depId: string) {
    Alert.alert('Marquer arrivé', 'Tous les colis passeront en arrivé.', [
      { text: 'Annuler' },
      { text: 'Confirmer', onPress: async () => {
        await supabase.from('departures').update({ status: 'arrived' }).eq('id', depId);
        await supabase.from('packages').update({ status: 'arrived' }).eq('departure_id', depId).eq('status', 'in_transit');
        loadDepartures();
      }},
    ]);
  }

  async function handleNotify(depId: string) {
    const dep = departures.find(d => d.id === depId);
    if (!dep) return;

    const { data: packages } = await supabase
      .from('packages')
      .select('client_id')
      .eq('departure_id', depId);

    if (!packages || packages.length === 0) {
      Alert.alert('Info', 'Aucun colis assigné à ce départ.');
      return;
    }

    const uniqueClients = [...new Set(packages.map(p => p.client_id))];
    const typeLabel = dep.type === 'air' ? 'Vol' : 'Bateau';
    const destLabel = dep.destinations.join(', ');
    const title = `${typeLabel} prévu`;
    const message = `Votre colis est prévu sur le ${typeLabel.toLowerCase()} ${dep.origin} → ${destLabel}.`;

    await supabase.from('notifications').insert(
      uniqueClients.map(cid => ({ user_id: cid, type: 'package' as const, title, message }))
    );

    Alert.alert('Envoyé', `${uniqueClients.length} client(s) notifié(s).`);
  }

  function capPct(d: Departure) {
    return d.capacity_lbs > 0 ? Math.round((d.used_capacity_lbs / d.capacity_lbs) * 100) : 0;
  }

  function capColor(pct: number) {
    if (pct >= 90) return '#EF4444';
    if (pct >= 70) return '#F97316';
    return '#22C55E';
  }

  function daysUntil(d: string) {
    const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
    if (diff <= 0) return "Aujourd'hui";
    if (diff === 1) return 'Demain';
    return `${diff} jours`;
  }

  if (loading) {
    return (
      <View style={[S.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: '#9CA3AF', fontSize: 14 }}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={S.container}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 24, paddingBottom: 16 }}>
          <Text style={{ fontSize: 24, fontWeight: '700', letterSpacing: -0.5, color: '#FFFFFF' }}>Départs</Text>
          <TouchableOpacity onPress={() => setShowSheet(true)} activeOpacity={0.8}
            style={{ height: 40, backgroundColor: '#F97316', borderRadius: 10, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <Text style={{ color: '#0D0D0D', fontSize: 18, lineHeight: 22 }}>+</Text>
            <Text style={{ color: '#0D0D0D', fontSize: 13, fontWeight: '700' }}>Créer</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 22 }}>
          <View style={{ flexDirection: 'row', gap: 8, paddingRight: 22 }}>
            {TABS.map(t => (
              <TouchableOpacity key={t.key} onPress={() => setTab(t.key)} activeOpacity={0.8}
                style={[S.tab, tab === t.key && S.tabActive]}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: tab === t.key ? '#F97316' : '#9CA3AF' }}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Cards */}
        <View style={{ gap: 14, paddingHorizontal: 22, marginTop: 16 }}>
          {current.length === 0 && (
            <View style={[S.card, { padding: 32, alignItems: 'center' }]}>
              <Text style={{ color: '#6B7280', fontSize: 14 }}>Aucun départ dans cette catégorie</Text>
            </View>
          )}
          {current.map(dep => {
            const pct = capPct(dep);
            const cc = capColor(pct);
            return (
              <View key={dep.id} style={S.card}>
                {/* Header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, paddingBottom: 0 }}>
                  <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(249,115,22,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 20 }}>{dep.type === 'air' ? '✈️' : '🚢'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }} numberOfLines={1}>
                      {dep.type === 'air' ? 'Vol' : 'Bateau'} {dep.origin} → {dep.destinations.join(', ')}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
                      {new Date(dep.departure_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </Text>
                  </View>
                  {dep.status === 'open' && (
                    <View style={{ backgroundColor: 'rgba(249,115,22,0.14)', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 }}>
                      <Text style={{ color: '#F97316', fontSize: 11, fontWeight: '700' }}>{daysUntil(dep.departure_date)}</Text>
                    </View>
                  )}
                  {dep.status === 'departed' && (
                    <View style={{ backgroundColor: 'rgba(59,130,246,0.14)', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 }}>
                      <Text style={{ color: '#3B82F6', fontSize: 11, fontWeight: '700' }}>En transit</Text>
                    </View>
                  )}
                  {dep.status === 'arrived' && (
                    <View style={{ backgroundColor: 'rgba(34,197,94,0.14)', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 }}>
                      <Text style={{ color: '#22C55E', fontSize: 11, fontWeight: '700' }}>Arrivé</Text>
                    </View>
                  )}
                </View>

                <View style={{ height: 1, backgroundColor: '#2A2A2A', marginHorizontal: 16, marginTop: 14 }} />

                {/* Capacity */}
                <View style={{ padding: 14, paddingBottom: 0 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 11, color: '#6B7280' }}>Capacité</Text>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>
                      {dep.used_capacity_lbs} / {dep.capacity_lbs} lbs ({pct}%)
                    </Text>
                  </View>
                  <View style={{ height: 8, borderRadius: 4, backgroundColor: '#2A2A2A', overflow: 'hidden', marginTop: 9 }}>
                    <View style={{ height: '100%', width: `${Math.min(pct, 100)}%`, backgroundColor: cc, borderRadius: 4 }} />
                  </View>
                </View>

                {/* Stats */}
                <View style={{ flexDirection: 'row', gap: 9, padding: 14, paddingBottom: 0 }}>
                  <View style={{ flex: 1, backgroundColor: '#2A2A2A', borderRadius: 12, padding: 11 }}>
                    <Text style={{ fontSize: 17, fontWeight: '800', color: '#F97316' }}>{dep.package_count}</Text>
                    <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>Colis</Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: '#2A2A2A', borderRadius: 12, padding: 11 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>{dep.destinations.join(', ')}</Text>
                    <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>Destinations</Text>
                  </View>
                </View>

                {/* Actions */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9, padding: 14 }}>
                  {dep.status === 'open' && (
                    <>
                      <TouchableOpacity onPress={() => handleNotify(dep.id)} activeOpacity={0.8}
                        style={{ flex: 1, minWidth: '45%', height: 42, backgroundColor: '#22C55E', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: '#052E14', fontSize: 12, fontWeight: '700' }}>Notifier clients</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleClose(dep.id)} activeOpacity={0.8}
                        style={{ flex: 1, minWidth: '45%', height: 42, backgroundColor: '#2D0A0A', borderWidth: 1, borderColor: 'rgba(239,68,68,0.4)', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '700' }}>Fermer départ</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleMarkDeparted(dep.id)} activeOpacity={0.8}
                        style={{ flex: 1, minWidth: '45%', height: 42, backgroundColor: 'rgba(59,130,246,0.14)', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: '#3B82F6', fontSize: 12, fontWeight: '700' }}>Marquer parti</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  {dep.status === 'closed' && (
                    <TouchableOpacity onPress={() => handleMarkDeparted(dep.id)} activeOpacity={0.8}
                      style={{ flex: 1, height: 42, backgroundColor: '#3B82F6', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>Marquer parti</Text>
                    </TouchableOpacity>
                  )}
                  {dep.status === 'departed' && (
                    <TouchableOpacity onPress={() => handleMarkArrived(dep.id)} activeOpacity={0.8}
                      style={{ flex: 1, height: 44, backgroundColor: '#A855F7', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>Marquer arrivé</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Create Modal */}
      <Modal visible={showSheet} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#1A1A1A', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
            <View style={{ width: 36, height: 4, backgroundColor: '#2A2A2A', borderRadius: 2, alignSelf: 'center', marginBottom: 20 }} />
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 20 }}>Nouveau départ</Text>

            <Text style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 8 }}>Mode de transport</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 18 }}>
              {(['air', 'sea'] as const).map(m => (
                <TouchableOpacity key={m} onPress={() => { setNewMode(m); setNewCapacity(m === 'air' ? '500' : '8000'); }} activeOpacity={0.8}
                  style={{ flex: 1, height: 44, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: newMode === m ? 'rgba(249,115,22,0.12)' : '#141414',
                    borderColor: newMode === m ? '#F97316' : '#2A2A2A' }}>
                  <Text style={{ color: newMode === m ? '#F97316' : '#9CA3AF', fontWeight: '600' }}>
                    {m === 'air' ? '✈️ Avion' : '🚢 Bateau'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 8 }}>Destinations</Text>
            <TextInput
              style={{ height: 48, backgroundColor: '#141414', borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 10, color: '#FFFFFF', paddingHorizontal: 14, fontSize: 14, marginBottom: 18 }}
              value={newDest} onChangeText={setNewDest} placeholderTextColor="#5B6470"
            />

            <Text style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 8 }}>Date de départ (AAAA-MM-JJ)</Text>
            <TextInput
              style={{ height: 48, backgroundColor: '#141414', borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 10, color: '#FFFFFF', paddingHorizontal: 14, fontSize: 14, marginBottom: 18 }}
              value={newDate} onChangeText={setNewDate} placeholder="2026-07-15" placeholderTextColor="#5B6470"
            />

            <Text style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 8 }}>Capacité (lbs)</Text>
            <TextInput
              style={{ height: 48, backgroundColor: '#141414', borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 10, color: '#FFFFFF', paddingHorizontal: 14, fontSize: 14, marginBottom: 24 }}
              value={newCapacity} onChangeText={setNewCapacity} keyboardType="numeric" placeholderTextColor="#5B6470"
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={() => setShowSheet(false)} activeOpacity={0.8}
                style={{ flex: 1, height: 50, backgroundColor: '#2A2A2A', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreate} disabled={actionLoading} activeOpacity={0.9}
                style={{ flex: 1.4, height: 50, backgroundColor: '#F97316', borderRadius: 12, alignItems: 'center', justifyContent: 'center', opacity: actionLoading ? 0.6 : 1 }}>
                <Text style={{ color: '#0D0D0D', fontWeight: '700' }}>{actionLoading ? 'Création...' : 'Créer le départ'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  tab: { height: 38, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 20, paddingHorizontal: 16, justifyContent: 'center' },
  tabActive: { backgroundColor: 'rgba(249,115,22,0.12)', borderColor: '#F97316' },
  card: { backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#1F1F1F', borderRadius: 20 },
});
