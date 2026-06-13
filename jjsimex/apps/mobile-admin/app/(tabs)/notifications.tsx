import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

type Tab = 'tous' | 'colis' | 'paiements' | 'clients' | 'systeme';

const NOTIFS = [
  {
    section: "Aujourd'hui",
    items: [
      { id: '1', icon: '🚨', iconBg: 'rgba(239,68,68,0.14)', titre: 'Colis en attente de douane', texte: '3 colis bloqués à Miami nécessitent des documents supplémentaires.', heure: 'il y a 12 min', unread: true, type: 'colis', btns: [{ label: 'Voir les colis', color: '#F97316', textColor: '#0D0D0D' }, { label: 'Ignorer', color: '#2A2A2A', textColor: '#FFFFFF' }] },
      { id: '2', icon: '💵', iconBg: 'rgba(34,197,94,0.14)', titre: 'Paiement reçu — $340', texte: 'Marie Joseph a payé $340 via MonCash pour 2 colis.', heure: 'il y a 34 min', unread: true, type: 'paiements', btns: [] },
      { id: '3', icon: '📦', iconBg: 'rgba(249,115,22,0.14)', titre: 'Nouveau colis enregistré', texte: 'Colis JJI-2847 ajouté par Jean-Pierre Dumas — Miami entrepôt.', heure: 'il y a 1h', unread: false, type: 'colis', btns: [{ label: 'Voir le colis', color: '#2A2A2A', textColor: '#FFFFFF' }] },
      { id: '4', icon: '👤', iconBg: 'rgba(139,92,246,0.14)', titre: 'Nouveau client inscrit', texte: 'Sophie Belizaire (sophie.b@yahoo.fr) a créé un compte.', heure: 'il y a 2h', unread: false, type: 'clients', btns: [] },
    ],
  },
  {
    section: 'Hier',
    items: [
      { id: '5', icon: '✈️', iconBg: 'rgba(249,115,22,0.14)', titre: 'Vol confirmé — 18 juin', texte: 'American Airlines AA 1234 · 847 colis · 1,000 kg confirmés.', heure: 'hier 16:30', unread: false, type: 'systeme', btns: [{ label: 'Notifier clients', color: '#22C55E', textColor: '#052E14' }] },
      { id: '6', icon: '⚠️', iconBg: 'rgba(249,115,22,0.14)', titre: 'Capacité à 85%', texte: 'Le vol du 18 juin est à 85% de sa capacité. Fermeture recommandée dans 48h.', heure: 'hier 14:12', unread: false, type: 'systeme', btns: [] },
      { id: '7', icon: '💵', iconBg: 'rgba(34,197,94,0.14)', titre: 'Virement reçu — $2,340', texte: 'Zelle — Claude Alexis · Référence: ZEL-84920.', heure: 'hier 11:05', unread: false, type: 'paiements', btns: [] },
    ],
  },
  {
    section: 'Cette semaine',
    items: [
      { id: '8', icon: '🔒', iconBg: 'rgba(239,68,68,0.14)', titre: 'Tentative connexion suspecte', texte: '3 tentatives échouées — IP: 192.168.1.45 · Accès bloqué.', heure: 'lun 09:22', unread: false, type: 'systeme', btns: [{ label: 'Voir logs', color: '#EF4444', textColor: '#FFFFFF' }] },
      { id: '9', icon: '📊', iconBg: 'rgba(249,115,22,0.14)', titre: 'Rapport hebdo disponible', texte: '847 colis traités · $18,450 collectés · 23 succursales actives.', heure: 'lun 08:00', unread: false, type: 'systeme', btns: [{ label: 'Voir rapport', color: '#2A2A2A', textColor: '#FFFFFF' }] },
    ],
  },
];

const TABS: { key: Tab; label: string }[] = [
  { key: 'tous', label: 'Tous' },
  { key: 'colis', label: 'Colis' },
  { key: 'paiements', label: 'Paiements' },
  { key: 'clients', label: 'Clients' },
  { key: 'systeme', label: 'Système' },
];

function NavItem({ icon, label, active, badge }: { icon: string; label: string; active?: boolean; badge?: number }) {
  return (
    <View style={{ alignItems: 'center', gap: 5, width: 56 }}>
      <View>
        <Text style={{ fontSize: 22, color: active ? '#F97316' : '#666666' }}>{icon}</Text>
        {badge ? (
          <View style={{ position: 'absolute', top: -4, right: -7, minWidth: 15, height: 15, borderRadius: 99, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '700' }}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <Text style={{ fontSize: 10, fontWeight: '600', color: active ? '#F97316' : '#666666' }}>{label}</Text>
    </View>
  );
}

export default function NotificationsAdminScreen() {
  const [tab, setTab] = useState<Tab>('tous');
  const [read, setRead] = useState<Record<string, boolean>>({});

  const unread = NOTIFS.flatMap(s => s.items).filter(n => n.unread && !read[n.id]).length;

  function markAllRead() {
    const all: Record<string, boolean> = {};
    NOTIFS.flatMap(s => s.items).forEach(n => { all[n.id] = true; });
    setRead(all);
  }

  const filtered = NOTIFS.map(sec => ({
    ...sec,
    items: sec.items.filter(n => tab === 'tous' || n.type === tab),
  })).filter(sec => sec.items.length > 0);

  return (
    <View style={S.container}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 24, paddingBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={{ fontSize: 24, fontWeight: '700', letterSpacing: -0.5, color: '#FFFFFF' }}>Notifications</Text>
            {unread > 0 && (
              <View style={{ minWidth: 22, height: 22, paddingHorizontal: 7, borderRadius: 99, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700' }}>{unread}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={markAllRead} activeOpacity={0.8}>
            <Text style={{ color: '#F97316', fontSize: 13, fontWeight: '600' }}>Tout lire</Text>
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

        {/* Sections */}
        {filtered.map(sec => (
          <View key={sec.section} style={{ paddingHorizontal: 22, marginTop: 20 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>{sec.section}</Text>
            <View style={{ gap: 10 }}>
              {sec.items.map(n => {
                const isUnread = n.unread && !read[n.id];
                return (
                  <TouchableOpacity key={n.id} activeOpacity={0.8} onPress={() => setRead(r => ({ ...r, [n.id]: true }))}
                    style={[S.notifCard, isUnread && S.notifCardUnread]}>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: n.iconBg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Text style={{ fontSize: 18 }}>{n.icon}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                          <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF', flex: 1, lineHeight: 18 }}>{n.titre}</Text>
                          {isUnread && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#F97316', marginTop: 4 }} />}
                        </View>
                        <Text style={{ fontSize: 12, color: '#9CA3AF', lineHeight: 18, marginTop: 4 }}>{n.texte}</Text>
                        <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 7 }}>{n.heure}</Text>
                        {n.btns.length > 0 && (
                          <View style={{ flexDirection: 'row', gap: 8, marginTop: 11 }}>
                            {n.btns.map(b => (
                              <TouchableOpacity key={b.label} activeOpacity={0.8}
                                style={{ height: 34, paddingHorizontal: 14, borderRadius: 8, backgroundColor: b.color, alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={{ color: b.textColor, fontSize: 12, fontWeight: '700' }}>{b.label}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom nav */}
      <View style={S.bottomNav}>
        <NavItem icon="⬛" label="Dashboard" badge={unread > 0 ? unread : undefined} />
        <NavItem icon="📦" label="Colis" />
        <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: '#F97316', alignItems: 'center', justifyContent: 'center', marginTop: -22, borderWidth: 4, borderColor: '#111111', shadowColor: '#F97316', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 18, elevation: 10 }}>
          <Text style={{ fontSize: 22, color: '#0D0D0D' }}>📷</Text>
        </View>
        <NavItem icon="👥" label="Clients" />
        <NavItem icon="⚙️" label="Gestion" />
      </View>
    </View>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  tab: { height: 38, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 20, paddingHorizontal: 16, justifyContent: 'center' },
  tabActive: { backgroundColor: 'rgba(249,115,22,0.12)', borderColor: '#F97316' },
  notifCard: { backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#1F1F1F', borderRadius: 14, padding: 14 },
  notifCardUnread: { borderColor: 'rgba(249,115,22,0.3)', backgroundColor: 'rgba(249,115,22,0.05)' },
  bottomNav: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 84, backgroundColor: '#111111', borderTopWidth: 1, borderTopColor: '#2A2A2A', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-around', paddingTop: 12 },
});
