import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { BackButton } from '@/components/layout/BackButton';
import { useToast } from '@/components/ui/Toast';
import { AuthContext } from '@/contexts/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

type AdminRole = 'admin' | 'super_admin' | 'employee';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: 'SUPER ADMIN',
  admin: 'ADMIN',
  employee: 'EMPLOYÉ',
};

function getInitials(firstName?: string, lastName?: string): string {
  const f = (firstName ?? '').charAt(0).toUpperCase();
  const l = (lastName ?? '').charAt(0).toUpperCase();
  return (f + l) || '??';
}

// ─── Section component ────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={sectionStyles.container}>
      <Text style={sectionStyles.title}>{title}</Text>
      <View style={sectionStyles.card}>{children}</View>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  container: { marginBottom: 20 },
  title: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, paddingHorizontal: 4 },
  card: { backgroundColor: '#1A1A1A', borderRadius: 14, borderWidth: 1, borderColor: '#2A2A2A', overflow: 'hidden' },
});

// ─── Row components ────────────────────────────────────────────────────────────

interface RowProps {
  icon: string;
  label: string;
  onPress?: () => void;
  right?: React.ReactNode;
  color?: string;
  last?: boolean;
}

function Row({ icon, label, onPress, right, color = '#FFFFFF', last = false }: RowProps) {
  const content = (
    <View style={[rowStyles.row, !last && rowStyles.rowBorder]}>
      <Text style={rowStyles.icon}>{icon}</Text>
      <Text style={[rowStyles.label, { color }]}>{label}</Text>
      <View style={rowStyles.right}>
        {right ?? (onPress ? <Text style={rowStyles.chevron}>›</Text> : null)}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#252525' },
  icon: { fontSize: 18, width: 26, textAlign: 'center' },
  label: { flex: 1, fontSize: 14, fontWeight: '500' },
  right: { alignItems: 'flex-end' },
  chevron: { fontSize: 20, color: '#4B5563' },
});

// ─── Stats component ──────────────────────────────────────────────────────────

function StatItem({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={statStyles.item}>
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  item: { alignItems: 'center', flex: 1 },
  value: { fontSize: 22, fontWeight: '800', color: '#F97316', marginBottom: 2 },
  label: { fontSize: 11, color: '#9CA3AF', fontWeight: '500', textAlign: 'center' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ProfilAdminScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const authContext = useContext(AuthContext);

  const profile = authContext?.profile;
  const signOut = authContext?.signOut;

  const isSuperAdmin = profile?.role === 'super_admin';

  // Notification toggles
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);

  // Maintenance mode
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);

  const [signingOut, setSigningOut] = useState(false);

  // ── Maintenance toggle ────────────────────────────────────────────────────

  const handleMaintenanceToggle = (value: boolean) => {
    if (value) {
      Alert.alert(
        'Activer le mode maintenance',
        "L'app client sera inaccessible pendant la maintenance. Continuer ?",
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Confirmer',
            style: 'destructive',
            onPress: async () => {
              setMaintenanceLoading(true);
              try {
                const { error } = await supabase
                  .from('app_settings')
                  .upsert({ key: 'maintenance_mode', value: true });
                if (error) throw error;
                setMaintenanceMode(true);
                showToast('Mode maintenance activé', 'info');
              } catch {
                showToast('Erreur lors de l\'activation', 'error');
              } finally {
                setMaintenanceLoading(false);
              }
            },
          },
        ]
      );
    } else {
      Alert.alert(
        'Désactiver le mode maintenance',
        "L'app client redeviendra accessible. Continuer ?",
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Confirmer',
            onPress: async () => {
              setMaintenanceLoading(true);
              try {
                const { error } = await supabase
                  .from('app_settings')
                  .upsert({ key: 'maintenance_mode', value: false });
                if (error) throw error;
                setMaintenanceMode(false);
                showToast('Mode maintenance désactivé', 'success');
              } catch {
                showToast('Erreur lors de la désactivation', 'error');
              } finally {
                setMaintenanceLoading(false);
              }
            },
          },
        ]
      );
    }
  };

  // ── Sign out ───────────────────────────────────────────────────────────────

  const handleSignOut = () => {
    Alert.alert(
      'Se déconnecter',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: async () => {
            setSigningOut(true);
            try {
              await signOut?.();
            } catch {
              showToast('Erreur lors de la déconnexion', 'error');
              setSigningOut(false);
            }
          },
        },
      ]
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const initials = getInitials(profile?.first_name, profile?.last_name);
  const fullName = profile ? `${profile.first_name} ${profile.last_name}` : '—';
  const roleLabel = ROLE_LABELS[profile?.role ?? 'employee'];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <Text style={styles.headerTitle}>Mon Profil Admin</Text>
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => router.push('/screens/parametres' as any)}
          activeOpacity={0.7}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <View style={styles.profileCard}>
          {/* Avatar */}
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          {/* Name + role */}
          <Text style={styles.profileName}>{fullName}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{roleLabel}</Text>
          </View>

          {/* Employee ID */}
          <View style={styles.employeeIdBadge}>
            <Text style={styles.employeeIdText}>ID: {profile?.id?.slice(0, 8).toUpperCase() ?? '—'}</Text>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <StatItem label="Colis traités" value={142} />
            <View style={styles.statDivider} />
            <StatItem label="Clients aidés" value={87} />
            <View style={styles.statDivider} />
            <StatItem label="Jours actifs" value={38} />
          </View>
        </View>

        {/* Section 1: Mon compte */}
        <Section title="Mon compte">
          <Row icon="👤" label="Informations personnelles" onPress={() => {}} />
          <Row icon="🔑" label="Changer le mot de passe" onPress={() => {}} />
          <Row icon="🛡️" label="Authentification 2FA" onPress={() => {}} last />
        </Section>

        {/* Section 2: Activité */}
        <Section title="Activité">
          <Row icon="📋" label="Historique des actions" onPress={() => {}} />
          <Row icon="📊" label="Statistiques personnelles" onPress={() => {}} last />
        </Section>

        {/* Section 3: Notifications admin */}
        <Section title="Notifications admin">
          <Row
            icon="💬"
            label="Notifications WhatsApp"
            right={
              <Switch
                value={whatsappEnabled}
                onValueChange={setWhatsappEnabled}
                trackColor={{ false: '#3A3A3A', true: '#F9731666' }}
                thumbColor={whatsappEnabled ? '#F97316' : '#6B7280'}
              />
            }
          />
          <Row
            icon="📧"
            label="Notifications Email"
            right={
              <Switch
                value={emailEnabled}
                onValueChange={setEmailEnabled}
                trackColor={{ false: '#3A3A3A', true: '#F9731666' }}
                thumbColor={emailEnabled ? '#F97316' : '#6B7280'}
              />
            }
          />
          <Row
            icon="🔔"
            label="Notifications Push"
            last
            right={
              <Switch
                value={pushEnabled}
                onValueChange={setPushEnabled}
                trackColor={{ false: '#3A3A3A', true: '#F9731666' }}
                thumbColor={pushEnabled ? '#F97316' : '#6B7280'}
              />
            }
          />
        </Section>

        {/* Section 4: Accès & Sécurité */}
        <Section title="Accès & Sécurité">
          <Row
            icon="🎖️"
            label="Niveau d'accès"
            right={
              <View style={[styles.accessBadge]}>
                <Text style={styles.accessBadgeText}>{roleLabel}</Text>
              </View>
            }
          />
          <Row icon="📱" label="Sessions actives" onPress={() => {}} />
          <Row icon="📜" label="Journal d'audit" onPress={() => {}} last />
        </Section>

        {/* Section 5: Paramètres système (super_admin only) */}
        {isSuperAdmin && (
          <Section title="Paramètres système">
            <Row icon="💱" label="Taux de change" onPress={() => {}} />
            <Row icon="🏷️" label="Tarifs & Grilles" onPress={() => {}} />
            <Row
              icon="🚧"
              label="Mode maintenance"
              right={
                maintenanceLoading ? (
                  <ActivityIndicator color="#F97316" size="small" />
                ) : (
                  <Switch
                    value={maintenanceMode}
                    onValueChange={handleMaintenanceToggle}
                    trackColor={{ false: '#3A3A3A', true: '#DC262666' }}
                    thumbColor={maintenanceMode ? '#DC2626' : '#6B7280'}
                  />
                )
              }
              last
            />
          </Section>
        )}

        {/* Section 6: Assistance */}
        <Section title="Assistance">
          <Row icon="🛠️" label="Support technique" onPress={() => {}} />
          <Row icon="📚" label="Documentation" onPress={() => {}} last />
        </Section>

        {/* Sign out button */}
        <TouchableOpacity
          style={[styles.signOutBtn, signingOut && styles.signOutBtnDisabled]}
          onPress={handleSignOut}
          disabled={signingOut}
          activeOpacity={0.7}
        >
          {signingOut ? (
            <ActivityIndicator color="#EF4444" size="small" />
          ) : (
            <Text style={styles.signOutText}>Se déconnecter</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.versionText}>JJSimex Admin • v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#1A1A1A',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#FFFFFF', flex: 1, textAlign: 'center' },
  settingsBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2A2A2A',
    alignItems: 'center', justifyContent: 'center',
  },
  settingsIcon: { fontSize: 18 },

  // Scroll
  scrollContent: { padding: 16, paddingBottom: 48 },

  // Profile card
  profileCard: {
    backgroundColor: '#1A1A1A', borderRadius: 18,
    borderWidth: 1, borderColor: '#2A2A2A',
    alignItems: 'center', padding: 24, marginBottom: 24,
  },
  avatarCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: '#F97316', alignItems: 'center', justifyContent: 'center',
    marginBottom: 14, borderWidth: 3, borderColor: '#F9731644',
  },
  avatarText: { fontSize: 32, fontWeight: '800', color: '#FFFFFF' },
  profileName: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', marginBottom: 8, textAlign: 'center' },
  roleBadge: {
    backgroundColor: '#F9731622', borderWidth: 1, borderColor: '#F97316',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 8,
  },
  roleBadgeText: { fontSize: 12, fontWeight: '800', color: '#F97316', letterSpacing: 0.8 },
  employeeIdBadge: {
    backgroundColor: '#252525', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 20,
  },
  employeeIdText: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', fontVariant: ['tabular-nums'] },

  // Stats
  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    width: '100%', paddingTop: 16,
    borderTopWidth: 1, borderTopColor: '#252525',
  },
  statDivider: { width: 1, height: 36, backgroundColor: '#2A2A2A' },

  // Access badge
  accessBadge: {
    backgroundColor: '#F9731622', borderWidth: 1, borderColor: '#F97316',
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
  },
  accessBadgeText: { fontSize: 11, fontWeight: '700', color: '#F97316' },

  // Sign out
  signOutBtn: {
    borderRadius: 12, paddingVertical: 14, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#EF4444', marginTop: 8, marginBottom: 20,
    backgroundColor: '#EF444411',
  },
  signOutBtnDisabled: { opacity: 0.5 },
  signOutText: { fontSize: 15, fontWeight: '700', color: '#EF4444' },

  // Version
  versionText: { fontSize: 11, color: '#4B5563', textAlign: 'center' },
});
