import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

type Tab = 'tous' | 'recu' | 'attente' | 'rembourse';

const KPI = [
  { label: "Aujourd'hui", value: '$847', trend: '+12%', icon: '💵' },
  { label: 'Ce mois', value: '$18,450', trend: '+8%', icon: '📅' },
  { label: 'En attente', value: '$3,240', trend: '-2%', trendDown: true, icon: '⏳' },
  { label: 'Total 2025', value: '$94,820', trend: '+34%', icon: '📈' },
];

const PAIEMENTS = [
  { id: 'P001', client: 'Marie Joseph', initials: 'MJ', color: '#7C3AED', montant: '$340.00', methode: 'MonCash', date: 'Aujourd\'hui 14:32', statut: 'recu' as Tab, ref: 'MCH-84920', colis: 'JJI-2845, JJI-2846' },
  { id: 'P002', client: 'Jean-Pierre Dumas', initials: 'JD', color: '#0891B2', montant: '$127.50', methode: 'Zelle', date: 'Aujourd\'hui 11:18', statut: 'recu' as Tab, ref: 'ZEL-29301', colis: 'JJI-2841' },
  { id: 'P003', client: 'Sophie Belizaire', initials: 'SB', color: '#059669', montant: '$892.00', methode: 'Western Union', date: 'Hier 16:45', statut: 'attente' as Tab, ref: 'WU-11047', colis: 'JJI-2830, JJI-2831, JJI-2832' },
  { id: 'P004', client: 'Robert Thermidor', initials: 'RT', color: '#7C3AED', montant: '$234.00', methode: 'MonCash', date: 'Hier 09:30', statut: 'recu' as Tab, ref: 'MCH-74821', colis: 'JJI-2828, JJI-2829' },
  { id: 'P005', client: 'Claude Alexis', initials: 'CA', color: '#D97706', montant: '$56.00', methode: 'Cash', date: '12 juin 2025', statut: 'rembourse' as Tab, ref: 'CASH-0049', colis: 'JJI-2801' },
  { id: 'P006', client: 'Nadine Pierre', initials: 'NP', color: '#DC2626', montant: '$445.50', methode: 'Zelle', date: '11 juin 2025', statut: 'attente' as Tab, ref: 'ZEL-19204', colis: 'JJI-2797, JJI-2798' },
];

const TABS: { key: Tab; label: string }[] = [
  { key: 'tous', label: 'Tous' },
  { key: 'recu', label: 'Reçus' },
  { key: 'attente', label: 'En attente' },
  { key: 'rembourse', label: 'Remboursés' },
];

const STATUS_STYLE: Record<Tab, { bg: string; color: string; label: string }> = {
  tous: { bg: '#2A2A2A', color: '#9CA3AF', label: '' },
  recu: { bg: 'rgba(34,197,94,0.14)', color: '#22C55E', label: 'Reçu' },
  attente: { bg: 'rgba(249,115,22,0.14)', color: '#F97316', label: 'En attente' },
  rembourse: { bg: 'rgba(239,68,68,0.14)', color: '#EF4444', label: 'Remboursé' },
};

const METHODE_COLORS: Record<string, string> = {
  MonCash: '#F97316', Zelle: '#2563EB', 'Western Union': '#FBBF24', Cash: '#22C55E',
};

function NavItem({ icon, label, active }: { icon: string; label: string; active?: boolean }) {
  return (
    <View style={{ alignItems: 'center', gap: 5, width: 56 }}>
      <Text style={{ fontSize: 22, color: active ? '#F97316' : '#666666' }}>{icon}</Text>
      <Text style={{ fontSize: 10, fontWeight: '600', color: active ? '#F97316' : '#666666' }}>{label}</Text>
    </View>
  );
}

export default function PaiementsAdminScreen() {
  const [tab, setTab] = useState<Tab>('tous');

  const filtered = PAIEMENTS.filter(p => tab === 'tous' || p.statut === tab);

  return (
    <View style={S.container}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 24, paddingBottom: 16 }}>
          <Text style={{ fontSize: 24, fontWeight: '700', letterSpacing: -0.5, color: '#FFFFFF' }}>Paiements</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity style={S.iconBtn} activeOpacity={0.8}>
              <Text style={{ color: '#FFFFFF', fontSize: 16 }}>⚡</Text>
            </TouchableOpacity>
            <TouchableOpacity style={S.iconBtn} activeOpacity={0.8}>
              <Text style={{ color: '#FFFFFF', fontSize: 16 }}>⬇️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* KPI scroll */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 22 }}>
          <View style={{ flexDirection: 'row', gap: 12, paddingRight: 22 }}>
            {KPI.map(k => (
              <View key={k.label} style={{ width: 150, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#1F1F1F', borderRadius: 16, padding: 14 }}>
                <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(249,115,22,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 16 }}>{k.icon}</Text>
                </View>
                <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 10 }}>{k.label}</Text>
                <Text style={{ fontSize: 24, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.6, marginTop: 2 }}>{k.value}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: k.trendDown ? '#EF4444' : '#22C55E' }}>
                    {k.trendDown ? '↓' : '↑'} {k.trend}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 22, marginTop: 18 }}>
          <View style={{ flexDirection: 'row', gap: 8, paddingRight: 22 }}>
            {TABS.map(t => (
              <TouchableOpacity key={t.key} onPress={() => setTab(t.key)} activeOpacity={0.8}
                style={[S.tab, tab === t.key && S.tabActive]}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: tab === t.key ? '#F97316' : '#9CA3AF' }}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Liste paiements */}
        <View style={{ gap: 10, paddingHorizontal: 22, marginTop: 16 }}>
          {filtered.map(p => {
            const st = STATUS_STYLE[p.statut];
            const methodeColor = METHODE_COLORS[p.methode] ?? '#9CA3AF';
            return (
              <TouchableOpacity key={p.id} activeOpacity={0.8}
                style={{ backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#1F1F1F', borderRadius: 14, padding: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: p.color, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 15 }}>{p.initials}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>{p.client}</Text>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: '#FFFFFF' }}>{p.montant}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                      <Text style={{ fontSize: 12, color: '#9CA3AF' }}>{p.date}</Text>
                      <View style={{ backgroundColor: st.bg, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 }}>
                        <Text style={{ color: st.color, fontSize: 11, fontWeight: '700' }}>{st.label}</Text>
                      </View>
                    </View>
                  </View>
                </View>
                <View style={{ height: 1, backgroundColor: '#2A2A2A', marginVertical: 12 }} />
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#2A2A2A', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: methodeColor }} />
                    <Text style={{ fontSize: 11, fontWeight: '600', color: '#FFFFFF' }}>{p.methode}</Text>
                  </View>
                  <View style={{ backgroundColor: '#2A2A2A', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}>
                    <Text style={{ fontSize: 11, color: '#9CA3AF' }}>Réf: {p.ref}</Text>
                  </View>
                  <View style={{ backgroundColor: '#2A2A2A', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}>
                    <Text style={{ fontSize: 11, color: '#9CA3AF' }}>📦 {p.colis}</Text>
                  </View>
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
        <NavItem icon="👥" label="Clients" />
        <NavItem icon="⚙️" label="Gestion" active />
      </View>
    </View>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  iconBtn: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2A2A2A', alignItems: 'center', justifyContent: 'center' },
  tab: { height: 38, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 20, paddingHorizontal: 16, justifyContent: 'center' },
  tabActive: { backgroundColor: 'rgba(249,115,22,0.12)', borderColor: '#F97316' },
  bottomNav: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 84, backgroundColor: '#111111', borderTopWidth: 1, borderTopColor: '#2A2A2A', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-around', paddingTop: 12 },
});
