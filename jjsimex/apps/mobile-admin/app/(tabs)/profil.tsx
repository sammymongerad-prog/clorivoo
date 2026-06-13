import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrateur',
  super_admin: 'Super Admin',
  employee: 'Employé',
};

export default function ProfilAdminScreen() {
  const { profile, signOut } = useAuth();

  function handleSignOut() {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnecter', style: 'destructive', onPress: signOut },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profil</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.name}>{profile?.first_name} {profile?.last_name}</Text>
        <Text style={styles.info}>{profile?.email}</Text>
        <View style={styles.divider} />
        <View style={styles.roleRow}>
          <Text style={styles.roleLabel}>Rôle</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{ROLE_LABELS[profile?.role ?? ''] ?? profile?.role ?? '—'}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D', padding: 20, paddingTop: 56 },
  header: { marginBottom: 24 },
  title: { color: '#fff', fontSize: 24, fontWeight: '700' },
  card: {
    backgroundColor: '#1A1A1A', borderRadius: 16, borderWidth: 1,
    borderColor: '#2A2A2A', padding: 20, marginBottom: 16,
  },
  name: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 4 },
  info: { color: '#9CA3AF', fontSize: 14 },
  divider: { height: 1, backgroundColor: '#2A2A2A', marginVertical: 14 },
  roleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  roleLabel: { color: '#9CA3AF', fontSize: 13 },
  roleBadge: { backgroundColor: '#F9731620', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1, borderColor: '#F9731640' },
  roleBadgeText: { color: '#F97316', fontSize: 13, fontWeight: '600' },
  logoutBtn: {
    backgroundColor: '#EF444420', borderRadius: 12, borderWidth: 1,
    borderColor: '#EF444450', padding: 16, alignItems: 'center',
  },
  logoutText: { color: '#EF4444', fontSize: 15, fontWeight: '600' },
});
