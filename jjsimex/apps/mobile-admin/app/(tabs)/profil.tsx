import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Modal } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

function Toggle({ value, onToggle }: { value: boolean; onToggle: () => void }) {
  return (
    <TouchableOpacity onPress={onToggle} activeOpacity={0.8}
      style={{ width: 44, height: 26, borderRadius: 99, backgroundColor: value ? '#F97316' : '#2A2A2A', justifyContent: 'center', padding: 3 }}>
      <View style={{ width: 20, height: 20, borderRadius: 99, backgroundColor: '#FFFFFF', marginLeft: value ? 18 : 0 }} />
    </TouchableOpacity>
  );
}

function NavItem({ icon, label, active }: { icon: string; label: string; active?: boolean }) {
  return (
    <View style={{ alignItems: 'center', gap: 5, width: 56 }}>
      <Text style={{ fontSize: 22, color: active ? '#F97316' : '#666666' }}>{icon}</Text>
      <Text style={{ fontSize: 10, fontWeight: '600', color: active ? '#F97316' : '#666666' }}>{label}</Text>
    </View>
  );
}

export default function ProfilAdminScreen() {
  const { profile, signOut } = useAuth();
  const [alertes, setAlertes] = useState(true);
  const [rapport, setRapport] = useState(true);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }

  function handleSignOut() { setConfirmLogout(true); }
  function doLogout() { setConfirmLogout(false); signOut(); }

  const firstName = profile?.first_name ?? 'Marie';
  const lastName = profile?.last_name ?? 'Joseph';
  const initials = `${firstName[0] ?? 'M'}${lastName[0] ?? 'J'}`.toUpperCase();

  const SECTIONS = [
    {
      titre: 'Compte',
      items: [
        { icon: '👤', titre: 'Informations personnelles', sub: 'Nom, email, téléphone', onPress: () => {} },
        { icon: '🔑', titre: 'Changer le mot de passe', sub: 'Dernière modif. il y a 3 mois', onPress: () => {} },
        { icon: '📱', titre: 'Numéro de téléphone', sub: '+509 34 12 34 56', onPress: () => {} },
      ],
    },
    {
      titre: 'Succursales & Tarifs',
      items: [
        { icon: '📦', titre: 'Tarifs par kg', sub: 'Avion & bateau', onPress: () => {} },
        { icon: '🔄', titre: 'Taux de change', sub: '1 USD = 132 HTG', onPress: () => {} },
        { icon: '✈️', titre: 'Prochains départs', sub: 'Gérer les vols & bateaux', onPress: () => {} },
      ],
    },
    {
      titre: 'Notifications',
      items: [
        { icon: '🔔', titre: 'Alertes urgentes', sub: 'Colis en attente, vols complets', toggle: true, toggleKey: 'alertes' as const },
        { icon: '📊', titre: 'Rapport quotidien', sub: 'Résumé chaque matin à 8h', toggle: true, toggleKey: 'rapport' as const },
      ],
    },
    {
      titre: 'Administration',
      items: [
        { icon: '👥', titre: 'Gérer les employés', sub: '4 comptes actifs', onPress: () => {} },
        { icon: '📍', titre: 'Succursales', sub: '23 points de retrait', onPress: () => {} },
        { icon: '🔒', titre: 'Sécurité & Logs', note: 'Accès Super Admin requis', onPress: () => {} },
        { icon: '📥', titre: 'Exporter les données', sub: 'CSV, Excel', onPress: () => {} },
        { icon: '📄', titre: 'CGU & Politique', sub: 'Dernière mise à jour: Jan 2025', onPress: () => {} },
      ],
    },
  ];

  const toggleMap: Record<string, boolean> = { alertes, rapport };
  const toggleSetters: Record<string, (v: boolean) => void> = {
    alertes: setAlertes, rapport: setRapport,
  };

  return (
    <View style={S.container}>
      {/* Scroll content */}
      <ScrollView style={S.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Header */}
        <View style={S.headerRow}>
          <Text style={S.headerTitle}>Mon profil</Text>
          <TouchableOpacity style={S.editBtn} activeOpacity={0.8}>
            <Text style={{ color: '#FFFFFF', fontSize: 16 }}>✎</Text>
          </TouchableOpacity>
        </View>

        {/* Carte profil */}
        <View style={S.profileCard}>
          <View style={S.avatar}>
            <Text style={S.avatarText}>{initials}</Text>
          </View>
          <Text style={S.profileName}>{firstName} {lastName}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 10 }}>
            <View style={{ backgroundColor: '#F97316', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 99 }}>
              <Text style={{ color: '#0D0D0D', fontSize: 10, fontWeight: '800', letterSpacing: 0.4 }}>SUPER ADMIN</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(34,197,94,0.14)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 99 }}>
              <Text style={{ color: '#22C55E', fontSize: 10, fontWeight: '700' }}>✓ Vérifié</Text>
            </View>
          </View>
          <Text style={{ fontSize: 13, color: '#9CA3AF', marginTop: 12, textAlign: 'center' }}>{profile?.email ?? 'marie@jjsimex.com'}</Text>
          <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 3, textAlign: 'center' }}>Toutes les succursales</Text>
          <View style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 18 }}>
            {[['1,247', 'Colis traités'], ['342', 'Clients gérés'], ['4 ans', 'Ancienneté'], ['99.8%', 'Disponibilité']].map(([val, lbl]) => (
              <View key={lbl} style={{ flex: 1, minWidth: '45%', backgroundColor: '#2A2A2A', borderRadius: 12, padding: 12 }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#F97316' }}>{val}</Text>
                <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{lbl}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Sections */}
        {SECTIONS.map((sec) => (
          <View key={sec.titre} style={{ paddingTop: 22, paddingHorizontal: 22 }}>
            <Text style={S.sectionTitle}>{sec.titre}</Text>
            <View style={{ flexDirection: 'column', gap: 8, marginTop: 10 }}>
              {sec.items.map((item) => (
                <TouchableOpacity key={item.titre} onPress={item.onPress} activeOpacity={item.toggle ? 1 : 0.7}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 13, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#1F1F1F', borderRadius: 12, padding: 13 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(249,115,22,0.10)', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 16 }}>{item.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>{item.titre}</Text>
                    {item.sub ? <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{item.sub}</Text> : null}
                    {item.note ? <Text style={{ fontSize: 10, fontWeight: '600', color: '#EF4444', marginTop: 4 }}>{item.note}</Text> : null}
                  </View>
                  {item.toggle && item.toggleKey
                    ? <Toggle value={toggleMap[item.toggleKey]} onToggle={() => { toggleSetters[item.toggleKey](!toggleMap[item.toggleKey]); showToast('Sauvegardé ✓'); }} />
                    : <Text style={{ color: '#6B7280', fontSize: 20 }}>›</Text>
                  }
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Déconnexion */}
        <View style={{ padding: 22, paddingTop: 24 }}>
          <TouchableOpacity onPress={handleSignOut} activeOpacity={0.85}
            style={{ width: '100%', height: 52, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#EF4444', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#EF4444', fontSize: 14, fontWeight: '700' }}>Se déconnecter</Text>
          </TouchableOpacity>
          <Text style={{ textAlign: 'center', fontSize: 11, color: '#4B5563', marginTop: 16 }}>JJ's IMEX Admin v1.0.0</Text>
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

      {/* Confirm logout modal */}
      <Modal visible={confirmLogout} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center', padding: 30 }}>
          <View style={{ backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 20, padding: 24, width: '100%' }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' }}>Se déconnecter ?</Text>
            <Text style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginTop: 8 }}>Votre session admin sera fermée.</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
              <TouchableOpacity onPress={() => setConfirmLogout(false)} style={{ flex: 1, height: 46, backgroundColor: '#2A2A2A', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={doLogout} style={{ flex: 1.2, height: 46, backgroundColor: '#EF4444', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>Oui, me déconnecter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Toast */}
      {toast ? (
        <View style={{ position: 'absolute', bottom: 106, alignSelf: 'center', backgroundColor: '#14532D', borderWidth: 1, borderColor: '#22C55E', paddingHorizontal: 18, paddingVertical: 11, borderRadius: 99 }}>
          <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>{toast}</Text>
        </View>
      ) : null}
    </View>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  scroll: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 24, paddingBottom: 16 },
  headerTitle: { fontSize: 24, fontWeight: '700', letterSpacing: -0.5, color: '#FFFFFF' },
  editBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2A2A2A', alignItems: 'center', justifyContent: 'center' },
  profileCard: { marginHorizontal: 22, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#1F1F1F', borderRadius: 20, padding: 20, alignItems: 'center' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F97316', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#0D0D0D', fontWeight: '800', fontSize: 28 },
  profileName: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4, color: '#FFFFFF', marginTop: 14 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8 },
  bottomNav: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 84, backgroundColor: '#111111', borderTopWidth: 1, borderTopColor: '#2A2A2A', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-around', paddingTop: 12 },
});
