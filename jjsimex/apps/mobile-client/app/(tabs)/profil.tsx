import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

type ToggleKey = 'whatsapp' | 'email' | 'theme';

function Toggle({ value, onToggle }: { value: boolean; onToggle: () => void }) {
  return (
    <TouchableOpacity onPress={onToggle} activeOpacity={0.8}
      style={{ width: 44, height: 26, borderRadius: 99, backgroundColor: value ? '#F97316' : '#2A2A2A', justifyContent: 'center', padding: 3 }}>
      <View style={{ width: 20, height: 20, borderRadius: 99, backgroundColor: '#FFFFFF', marginLeft: value ? 18 : 0 }} />
    </TouchableOpacity>
  );
}

function MenuItem({ icon, label, sub, onPress, iconBg = 'rgba(249,115,22,0.12)' }: {
  icon: string; label: string; sub?: string; onPress?: () => void; iconBg?: string;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 14 }}>
      <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: iconBg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>{label}</Text>
        {sub ? <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{sub}</Text> : null}
      </View>
      <Text style={{ color: '#6B7280', fontSize: 20 }}>›</Text>
    </TouchableOpacity>
  );
}

function Sep() {
  return <View style={{ height: 1, backgroundColor: '#242424' }} />;
}

export default function ProfilScreen() {
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const [toggles, setToggles] = useState<Record<ToggleKey, boolean>>({ whatsapp: true, email: true, theme: true });
  const toggle = (k: ToggleKey) => setToggles(p => ({ ...p, [k]: !p[k] }));

  const firstName = profile?.first_name ?? 'Jean';
  const lastName = profile?.last_name ?? 'Paul';
  const initials = `${firstName[0] ?? 'J'}${lastName[0] ?? 'P'}`.toUpperCase();

  function handleSignOut() {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Se déconnecter', style: 'destructive', onPress: signOut },
    ]);
  }

  return (
    <View style={S.container}>
      {/* Header */}
      <View style={S.header}>
        <Text style={S.headerTitle}>Mon Profil</Text>
        <TouchableOpacity style={S.editBtn} activeOpacity={0.8}>
          <Text style={{ color: '#FFFFFF', fontSize: 16 }}>✎</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 22, paddingTop: 8, paddingBottom: 40 }}>
        {/* Carte profil */}
        <View style={S.profileCard}>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <View style={S.avatar}>
              <Text style={S.avatarText}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#FFFFFF' }}>{firstName} {lastName}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#14532D', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginTop: 6 }}>
                <Text style={{ color: '#22C55E', fontSize: 11, fontWeight: '600' }}>✓ Client vérifié</Text>
              </View>
              <Text style={{ fontSize: 13, color: '#9CA3AF', marginTop: 8 }}>{profile?.email ?? 'jean.paul@gmail.com'}</Text>
              <Text style={{ fontSize: 13, color: '#9CA3AF', marginTop: 2 }}>{profile?.phone_whatsapp ?? '+509 34 12 34 56'}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20, paddingTop: 18, borderTopWidth: 1, borderTopColor: '#2A2A2A' }}>
            {[['24', 'Colis envoyés'], ['2', 'En cours'], ['4 ans', 'Membre depuis']].map(([val, lbl], i) => (
              <>
                {i > 0 && <View key={`sep${i}`} style={{ width: 1, height: 34, backgroundColor: '#2A2A2A' }} />}
                <View key={val} style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontSize: 19, fontWeight: '800', color: '#F97316' }}>{val}</Text>
                  <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 3, textAlign: 'center' }}>{lbl}</Text>
                </View>
              </>
            ))}
          </View>
        </View>

        {/* Mon compte */}
        <Text style={S.sectionTitle}>Mon compte</Text>
        <View style={S.section}>
          <MenuItem icon="👤" label="Mes informations personnelles" sub="Nom, email, téléphone" />
          <Sep /><MenuItem icon="📦" label="Historique des colis" sub="24 expéditions au total" />
          <Sep /><MenuItem icon="🛒" label="Mes demandes Personal Shopper" sub="Commandes en cours" onPress={() => router.push('/demandes')} />
          <Sep /><MenuItem icon="📍" label="Mes adresses de livraison" sub="Port-au-Prince, Delmas 31" />
          <Sep /><MenuItem icon="💳" label="Mes paiements" sub="MonCash, Zelle configurés" />
        </View>

        {/* Préférences */}
        <Text style={S.sectionTitle}>Préférences</Text>
        <View style={S.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 14 }}>
            <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(249,115,22,0.12)', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 18 }}>🌐</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>Langue</Text>
              <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Français</Text>
            </View>
            <View style={{ backgroundColor: '#2A2A2A', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, marginRight: 8 }}>
              <Text style={{ color: '#C9CDD3', fontSize: 11, fontWeight: '700' }}>FR</Text>
            </View>
            <Text style={{ color: '#6B7280', fontSize: 20 }}>›</Text>
          </View>
          <Sep />
          {([
            ['whatsapp', '💬', 'Notifications WhatsApp'],
            ['email', '✉️', 'Notifications email'],
            ['theme', '🌙', 'Thème'],
          ] as [ToggleKey, string, string][]).map(([key, icon, label]) => (
            <>
              <View key={key} style={{ flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 14 }}>
                <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(249,115,22,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 18 }}>{icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>{label}</Text>
                  <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{toggles[key] ? 'Activé' : 'Désactivé'}</Text>
                </View>
                <Toggle value={toggles[key]} onToggle={() => toggle(key)} />
              </View>
              {key !== 'theme' && <Sep key={`sep-${key}`} />}
            </>
          ))}
        </View>

        {/* Support */}
        <Text style={S.sectionTitle}>Support</Text>
        <View style={S.section}>
          <MenuItem icon="💚" label="Contacter via WhatsApp" sub="+1 (305) 600-9364" iconBg="rgba(34,197,94,0.12)" />
          <Sep /><MenuItem icon="❓" label="Centre d'aide & FAQ" sub="Réponses à vos questions" />
          <Sep /><MenuItem icon="⭐" label="Noter l'application" sub="Donnez-nous votre avis" />
          <Sep /><MenuItem icon="📢" label="Parrainage" sub="Invitez vos amis, gagnez des points" />
        </View>

        {/* Déconnexion */}
        <TouchableOpacity onPress={handleSignOut} activeOpacity={0.85}
          style={{ marginTop: 28, height: 52, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#EF4444', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#EF4444' }}>Se déconnecter</Text>
        </TouchableOpacity>

        <Text style={{ textAlign: 'center', fontSize: 11, color: '#4B5563', marginTop: 16 }}>JJ's IMEX v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  header: { height: 68, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, backgroundColor: '#0D0D0D' },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
  editBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2A2A2A', alignItems: 'center', justifyContent: 'center' },
  profileCard: { backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#262626', borderRadius: 20, padding: 22, marginBottom: 4 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#F97316', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#0D0D0D', fontWeight: '800', fontSize: 26 },
  sectionTitle: { fontSize: 12, fontWeight: '600', color: '#9CA3AF', letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 24, marginBottom: 10 },
  section: { backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#1F1F1F', borderRadius: 12, paddingHorizontal: 14 },
});
