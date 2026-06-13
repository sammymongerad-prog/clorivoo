import { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

type Tab = 'tous' | 'actifs' | 'inactifs' | 'bloques';
type Statut = 'actif' | 'inactif' | 'bloque';

const CLIENTS = [
  { id: '1', nom: 'Marie Joseph', email: 'marie.joseph@gmail.com', initials: 'MJ', color: '#7C3AED', statut: 'actif' as Statut, colis: '47 colis', total: '$2,340', niveau: 'Or' },
  { id: '2', nom: 'Jean-Pierre Dumas', email: 'jp.dumas@hotmail.com', initials: 'JD', color: '#0891B2', statut: 'actif' as Statut, colis: '23 colis', total: '$890', niveau: 'Argent' },
  { id: '3', nom: 'Sophie Belizaire', email: 'sophie.b@yahoo.fr', initials: 'SB', color: '#059669', statut: 'actif' as Statut, colis: '61 colis', total: '$4,120', niveau: 'Platine' },
  { id: '4', nom: 'Claude Alexis', email: 'claude.alexis@gmail.com', initials: 'CA', color: '#D97706', statut: 'inactif' as Statut, colis: '8 colis', total: '$340', niveau: 'Bronze' },
  { id: '5', nom: 'Nadine Pierre', email: 'nadine.pierre@gmail.com', initials: 'NP', color: '#DC2626', statut: 'bloque' as Statut, colis: '2 colis', total: '$120', niveau: 'Bronze' },
  { id: '6', nom: 'Robert Thermidor', email: 'r.thermidor@outlook.com', initials: 'RT', color: '#7C3AED', statut: 'actif' as Statut, colis: '35 colis', total: '$1,780', niveau: 'Or' },
];

const TABS: { key: Tab; label: string }[] = [
  { key: 'tous', label: 'Tous' },
  { key: 'actifs', label: 'Actifs' },
  { key: 'inactifs', label: 'Inactifs' },
  { key: 'bloques', label: 'Bloqués' },
];

const STATUS_STYLE: Record<Statut, { bg: string; color: string; label: string }> = {
  actif: { bg: 'rgba(34,197,94,0.14)', color: '#22C55E', label: 'Actif' },
  inactif: { bg: 'rgba(156,163,175,0.14)', color: '#9CA3AF', label: 'Inactif' },
  bloque: { bg: 'rgba(239,68,68,0.14)', color: '#EF4444', label: 'Bloqué' },
};

function NavItem({ icon, label, active }: { icon: string; label: string; active?: boolean }) {
  return (
    <View style={{ alignItems: 'center', gap: 5, width: 56 }}>
      <Text style={{ fontSize: 22, color: active ? '#F97316' : '#666666' }}>{icon}</Text>
      <Text style={{ fontSize: 10, fontWeight: '600', color: active ? '#F97316' : '#666666' }}>{label}</Text>
    </View>
  );
}

export default function ClientsAdminScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<Tab>('tous');

  const filtered = CLIENTS.filter(c => {
    const matchTab = tab === 'tous' || c.statut === tab.replace('s', '').replace('bloques', 'bloque').replace('inactifs', 'inactif').replace('actifs', 'actif');
    const matchSearch = !search || c.nom.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  return (
    <View style={S.container}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 24, paddingBottom: 16 }}>
          <Text style={{ fontSize: 24, fontWeight: '700', letterSpacing: -0.5, color: '#FFFFFF' }}>Clients</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity style={S.iconBtn} activeOpacity={0.8}>
              <Text style={{ color: '#FFFFFF', fontSize: 16 }}>⚡</Text>
            </TouchableOpacity>
            <TouchableOpacity style={S.iconBtn} activeOpacity={0.8}>
              <Text style={{ color: '#FFFFFF', fontSize: 16 }}>🔍</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recherche */}
        <View style={{ marginHorizontal: 22, position: 'relative' }}>
          <TextInput
            style={S.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Nom, email, téléphone..."
            placeholderTextColor="#5B6470"
          />
          <Text style={{ position: 'absolute', left: 14, top: 14, color: '#F97316', fontSize: 16 }}>🔍</Text>
        </View>

        {/* Stats pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 22, marginTop: 14 }}>
          <View style={{ flexDirection: 'row', gap: 8, paddingRight: 22 }}>
            <View style={S.pill}>
              <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>Total : 22,847</Text>
            </View>
            <View style={[S.pill, { flexDirection: 'row', alignItems: 'center', gap: 7 }]}>
              <Text style={{ color: '#9CA3AF', fontSize: 12 }}>Actifs</Text>
              <View style={{ backgroundColor: 'rgba(34,197,94,0.14)', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 }}>
                <Text style={{ color: '#22C55E', fontSize: 11, fontWeight: '700' }}>18,234</Text>
              </View>
            </View>
            <View style={[S.pill, { flexDirection: 'row', alignItems: 'center', gap: 7 }]}>
              <Text style={{ color: '#9CA3AF', fontSize: 12 }}>Nouveaux</Text>
              <View style={{ backgroundColor: 'rgba(249,115,22,0.14)', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 }}>
                <Text style={{ color: '#F97316', fontSize: 11, fontWeight: '700' }}>342</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 22, marginTop: 14 }}>
          <View style={{ flexDirection: 'row', gap: 8, paddingRight: 22 }}>
            {TABS.map(t => (
              <TouchableOpacity key={t.key} onPress={() => setTab(t.key)} activeOpacity={0.8}
                style={[S.tab, tab === t.key && S.tabActive]}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: tab === t.key ? '#F97316' : '#9CA3AF' }}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Liste */}
        <View style={{ gap: 12, paddingHorizontal: 22, marginTop: 18 }}>
          {filtered.map(c => {
            const st = STATUS_STYLE[c.statut];
            return (
              <TouchableOpacity key={c.id} activeOpacity={0.8}
                style={{ backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#1F1F1F', borderRadius: 14, overflow: 'hidden' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13, padding: 14 }}>
                  <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: c.color, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 16 }}>{c.initials}</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>{c.nom}</Text>
                    <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }} numberOfLines={1}>{c.email}</Text>
                  </View>
                  <View style={{ backgroundColor: st.bg, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 }}>
                    <Text style={{ color: st.color, fontSize: 11, fontWeight: '700' }}>{st.label}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#222222', paddingHorizontal: 16, paddingVertical: 9 }}>
                  <Text style={{ fontSize: 12, color: '#9CA3AF' }}>📦 {c.colis}</Text>
                  <Text style={{ color: '#3A3A3A' }}>|</Text>
                  <Text style={{ fontSize: 12, color: '#9CA3AF' }}>💵 {c.total}</Text>
                  <Text style={{ color: '#3A3A3A' }}>|</Text>
                  <Text style={{ fontSize: 12, color: '#9CA3AF' }}>⭐ {c.niveau}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom nav */}
      <View style={S.bottomNav}>
        <NavItem icon="⬛" label="Dashboard" />
        <NavItem icon="📦" label="Colis" />
        <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: '#F97316', alignItems: 'center', justifyContent: 'center', marginTop: -22, borderWidth: 4, borderColor: '#111111', shadowColor: '#F97316', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 18, elevation: 10 }}>
          <Text style={{ fontSize: 22, color: '#0D0D0D' }}>📷</Text>
        </View>
        <NavItem icon="👥" label="Clients" active />
        <NavItem icon="⚙️" label="Gestion" />
      </View>
    </View>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  iconBtn: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2A2A2A', alignItems: 'center', justifyContent: 'center' },
  searchInput: { height: 48, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 12, color: '#FFFFFF', paddingLeft: 44, paddingRight: 16, fontSize: 14 },
  pill: { height: 38, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 20, paddingHorizontal: 14, justifyContent: 'center' },
  tab: { height: 38, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 20, paddingHorizontal: 16, justifyContent: 'center' },
  tabActive: { backgroundColor: 'rgba(249,115,22,0.12)', borderColor: '#F97316' },
  bottomNav: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 84, backgroundColor: '#111111', borderTopWidth: 1, borderTopColor: '#2A2A2A', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-around', paddingTop: 12 },
});
