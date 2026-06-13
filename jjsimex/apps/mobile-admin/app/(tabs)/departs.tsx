import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, TextInput, Alert } from 'react-native';

type Tab = 'avenir' | 'cours' | 'done';

const DEPARTS_AVENIR = [
  {
    id: '1', icon: '✈️', titre: 'Vol Miami → Port-au-Prince', date: 'Départ: 18 juin 2025',
    capLabel: '847 / 1,000 kg', capPct: 84.7, warnLabel: '⚠️ 85% plein',
    warnBg: 'rgba(249,115,22,0.12)', warnColor: '#F97316',
    colis: 847, clients: 124, dest1n: 612, dest1v: 'PAP', dest2n: 235, dest2v: 'Cap-Haïtien',
    countLabel: '3 jours', countBg: 'rgba(249,115,22,0.14)', countColor: '#F97316',
    barColor: '#F97316',
  },
  {
    id: '2', icon: '🚢', titre: 'Cargo Miami → Santo Domingo', date: 'Départ: 25 juin 2025',
    capLabel: '2,340 / 5,000 kg', capPct: 46.8, warnLabel: '✓ Places disponibles',
    warnBg: 'rgba(34,197,94,0.12)', warnColor: '#22C55E',
    colis: 456, clients: 78, dest1n: 456, dest1v: 'Santo Dom.', dest2n: 0, dest2v: '',
    countLabel: '10 jours', countBg: 'rgba(34,197,94,0.14)', countColor: '#22C55E',
    barColor: '#22C55E',
  },
];

const DEPART_EN_COURS = {
  icon: '✈️', titre: 'Vol Miami → Port-au-Prince', date: 'Parti le 11 juin 2025',
  position: 'Au-dessus de Cuba', eta: 'Arrivée prévue: 11 juin 18:30',
  colis: 923, clients: 147,
};

const DEPARTS_DONE = [
  { id: 'd1', icon: '✈️', titre: 'Vol Miami → PAP', date: '5 juin 2025', colis: 1047, clients: 162 },
  { id: 'd2', icon: '🚢', titre: 'Cargo Miami → RD', date: '1 juin 2025', colis: 2340, clients: 89 },
  { id: 'd3', icon: '✈️', titre: 'Vol Miami → PAP', date: '28 mai 2025', colis: 891, clients: 130 },
];

function NavItem({ icon, label, active }: { icon: string; label: string; active?: boolean }) {
  return (
    <View style={{ alignItems: 'center', gap: 5, width: 56 }}>
      <Text style={{ fontSize: 22, color: active ? '#F97316' : '#666666' }}>{icon}</Text>
      <Text style={{ fontSize: 10, fontWeight: '600', color: active ? '#F97316' : '#666666' }}>{label}</Text>
    </View>
  );
}

export default function DepartsAdminScreen() {
  const [tab, setTab] = useState<Tab>('avenir');
  const [showSheet, setShowSheet] = useState(false);
  const [newMode, setNewMode] = useState<'avion' | 'bateau'>('avion');
  const [newDest, setNewDest] = useState('Port-au-Prince');
  const [newDate, setNewDate] = useState('');

  const TABS = [
    { key: 'avenir' as Tab, label: `À venir (${DEPARTS_AVENIR.length})` },
    { key: 'cours' as Tab, label: 'En cours (1)' },
    { key: 'done' as Tab, label: `Complétés (${DEPARTS_DONE.length})` },
  ];

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

        {/* Tab À VENIR */}
        {tab === 'avenir' && (
          <View style={{ gap: 14, paddingHorizontal: 22, marginTop: 16 }}>
            {DEPARTS_AVENIR.map(d => (
              <View key={d.id} style={S.card}>
                {/* Header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, paddingBottom: 0 }}>
                  <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(249,115,22,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 20 }}>{d.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }} numberOfLines={1}>{d.titre}</Text>
                    <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{d.date}</Text>
                  </View>
                  <View style={{ backgroundColor: d.countBg, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 }}>
                    <Text style={{ color: d.countColor, fontSize: 11, fontWeight: '700' }}>{d.countLabel}</Text>
                  </View>
                </View>
                <View style={{ height: 1, backgroundColor: '#2A2A2A', marginHorizontal: 16, marginTop: 14 }} />

                {/* Capacité */}
                <View style={{ padding: 14, paddingBottom: 0 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 11, color: '#6B7280' }}>Capacité</Text>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>{d.capLabel}</Text>
                  </View>
                  <View style={{ height: 8, borderRadius: 4, backgroundColor: '#2A2A2A', overflow: 'hidden', marginTop: 9 }}>
                    <View style={{ height: '100%', width: `${d.capPct}%`, backgroundColor: d.barColor, borderRadius: 4 }} />
                  </View>
                  <View style={{ marginTop: 9 }}>
                    <View style={{ backgroundColor: d.warnBg, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start' }}>
                      <Text style={{ color: d.warnColor, fontSize: 11, fontWeight: '600' }}>{d.warnLabel}</Text>
                    </View>
                  </View>
                </View>

                {/* Stats 2x2 */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9, padding: 14, paddingBottom: 0 }}>
                  {[
                    [String(d.colis), 'Colis assignés'],
                    [String(d.clients), 'Clients'],
                    [String(d.dest1n), d.dest1v],
                    ...(d.dest2v ? [[String(d.dest2n), d.dest2v]] : []),
                  ].map(([val, lbl]) => (
                    <View key={lbl} style={{ flex: 1, minWidth: '45%', backgroundColor: '#2A2A2A', borderRadius: 12, padding: 11 }}>
                      <Text style={{ fontSize: 17, fontWeight: '800', color: '#F97316' }}>{val}</Text>
                      <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{lbl}</Text>
                    </View>
                  ))}
                </View>

                {/* Status badges */}
                <View style={{ flexDirection: 'row', gap: 9, padding: 12, paddingBottom: 0 }}>
                  {['Documents', 'Douane OK'].map(lbl => (
                    <View key={lbl} style={{ backgroundColor: 'rgba(34,197,94,0.12)', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ color: '#22C55E', fontSize: 11 }}>✓</Text>
                      <Text style={{ color: '#22C55E', fontSize: 11, fontWeight: '600' }}>{lbl}</Text>
                    </View>
                  ))}
                </View>

                {/* Actions 2x2 */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9, padding: 14 }}>
                  <TouchableOpacity activeOpacity={0.8} style={{ flex: 1, minWidth: '45%', height: 42, backgroundColor: '#2A2A2A', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>Voir colis</Text>
                  </TouchableOpacity>
                  <TouchableOpacity activeOpacity={0.8} style={{ flex: 1, minWidth: '45%', height: 42, backgroundColor: '#F97316', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#0D0D0D', fontSize: 12, fontWeight: '700' }}>Ajouter colis</Text>
                  </TouchableOpacity>
                  <TouchableOpacity activeOpacity={0.8} style={{ flex: 1, minWidth: '45%', height: 42, backgroundColor: '#22C55E', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#052E14', fontSize: 12, fontWeight: '700' }}>Notifier clients</Text>
                  </TouchableOpacity>
                  <TouchableOpacity activeOpacity={0.8}
                    onPress={() => Alert.alert('Fermer départ', 'Confirmer la fermeture de ce départ ?')}
                    style={{ flex: 1, minWidth: '45%', height: 42, backgroundColor: '#2D0A0A', borderWidth: 1, borderColor: 'rgba(239,68,68,0.4)', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '700' }}>Fermer départ</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Tab EN COURS */}
        {tab === 'cours' && (
          <View style={{ marginHorizontal: 22, marginTop: 16 }}>
            <View style={{ backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#1F1F1F', borderRadius: 20, padding: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: '#1E1B4B', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 20 }}>{DEPART_EN_COURS.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>{DEPART_EN_COURS.titre}</Text>
                  <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{DEPART_EN_COURS.date}</Text>
                </View>
                <View style={{ backgroundColor: '#1E1B4B', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Text style={{ color: '#A5B4FC', fontSize: 11, fontWeight: '700' }}>🔵 En vol</Text>
                </View>
              </View>
              <View style={{ marginTop: 14, backgroundColor: '#141414', borderRadius: 12, padding: 12 }}>
                <Text style={{ fontSize: 12, color: '#9CA3AF' }}>📍 Position : {DEPART_EN_COURS.position}</Text>
                <Text style={{ fontSize: 12, color: '#22C55E', marginTop: 6 }}>🕐 {DEPART_EN_COURS.eta}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 9, marginTop: 12 }}>
                <View style={{ flex: 1, backgroundColor: '#2A2A2A', borderRadius: 12, padding: 11 }}>
                  <Text style={{ fontSize: 17, fontWeight: '800', color: '#F97316' }}>{DEPART_EN_COURS.colis}</Text>
                  <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>Colis à bord</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: '#2A2A2A', borderRadius: 12, padding: 11 }}>
                  <Text style={{ fontSize: 17, fontWeight: '800', color: '#FFFFFF' }}>{DEPART_EN_COURS.clients}</Text>
                  <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>Clients notifiés</Text>
                </View>
              </View>
              <TouchableOpacity activeOpacity={0.8}
                style={{ marginTop: 12, height: 44, backgroundColor: '#22C55E', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#052E14', fontSize: 13, fontWeight: '700' }}>Marquer comme arrivé</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Tab COMPLÉTÉS */}
        {tab === 'done' && (
          <View style={{ gap: 12, paddingHorizontal: 22, marginTop: 16 }}>
            {DEPARTS_DONE.map(d => (
              <View key={d.id} style={[S.card, { padding: 14 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(34,197,94,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 20 }}>{d.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>{d.titre}</Text>
                    <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{d.date}</Text>
                  </View>
                  <View style={{ backgroundColor: 'rgba(34,197,94,0.14)', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 }}>
                    <Text style={{ color: '#22C55E', fontSize: 11, fontWeight: '700' }}>✓ Livré</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 9, marginTop: 12 }}>
                  <View style={{ flex: 1, backgroundColor: '#2A2A2A', borderRadius: 10, padding: 10 }}>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: '#F97316' }}>{d.colis}</Text>
                    <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>Colis livrés</Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: '#2A2A2A', borderRadius: 10, padding: 10 }}>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: '#FFFFFF' }}>{d.clients}</Text>
                    <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>Clients</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom nav */}
      <View style={S.bottomNav}>
        <NavItem icon="⬛" label="Dashboard" />
        <NavItem icon="📦" label="Colis" />
        <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: '#F97316', alignItems: 'center', justifyContent: 'center', marginTop: -22, borderWidth: 4, borderColor: '#111111', shadowColor: '#F97316', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 18, elevation: 10 }}>
          <Text style={{ fontSize: 22, color: '#0D0D0D' }}>📷</Text>
        </View>
        <NavItem icon="👥" label="Clients" />
        <NavItem icon="⚙️" label="Gestion" active />
      </View>

      {/* Sheet création */}
      <Modal visible={showSheet} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#1A1A1A', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
            <View style={{ width: 36, height: 4, backgroundColor: '#2A2A2A', borderRadius: 2, alignSelf: 'center', marginBottom: 20 }} />
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 20 }}>Nouveau départ</Text>

            <Text style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 8 }}>Mode de transport</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 18 }}>
              {(['avion', 'bateau'] as const).map(m => (
                <TouchableOpacity key={m} onPress={() => setNewMode(m)} activeOpacity={0.8}
                  style={{ flex: 1, height: 44, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: newMode === m ? 'rgba(249,115,22,0.12)' : '#141414',
                    borderColor: newMode === m ? '#F97316' : '#2A2A2A' }}>
                  <Text style={{ color: newMode === m ? '#F97316' : '#9CA3AF', fontWeight: '600' }}>
                    {m === 'avion' ? '✈️ Avion' : '🚢 Bateau'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 8 }}>Destination</Text>
            <TextInput
              style={{ height: 48, backgroundColor: '#141414', borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 10, color: '#FFFFFF', paddingHorizontal: 14, fontSize: 14, marginBottom: 18 }}
              value={newDest} onChangeText={setNewDest} placeholderTextColor="#5B6470"
            />

            <Text style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 8 }}>Date de départ</Text>
            <TextInput
              style={{ height: 48, backgroundColor: '#141414', borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 10, color: '#FFFFFF', paddingHorizontal: 14, fontSize: 14, marginBottom: 24 }}
              value={newDate} onChangeText={setNewDate} placeholder="JJ/MM/AAAA" placeholderTextColor="#5B6470"
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={() => setShowSheet(false)} activeOpacity={0.8}
                style={{ flex: 1, height: 50, backgroundColor: '#2A2A2A', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setShowSheet(false); Alert.alert('Départ créé', 'Le nouveau départ a été ajouté.'); }} activeOpacity={0.9}
                style={{ flex: 1.4, height: 50, backgroundColor: '#F97316', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#0D0D0D', fontWeight: '700' }}>Créer le départ</Text>
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
  bottomNav: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 84, backgroundColor: '#111111', borderTopWidth: 1, borderTopColor: '#2A2A2A', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-around', paddingTop: 12 },
});
