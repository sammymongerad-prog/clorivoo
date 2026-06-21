import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Platform, StatusBar, Alert, TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowLeft, User, Mail, Phone, Shield, Key,
  LogOut, ChevronRight,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

const statusBarH = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 44;
const ACCENT = '#F97316';

export default function AdminProfil() {
  const router = useRouter();
  const { profile, signOut, refreshProfile } = useAuth();
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(profile?.full_name ?? '');
  const [saving, setSaving] = useState(false);

  const roleLabel = profile?.role === 'super_admin' ? 'Super Admin'
    : profile?.role === 'employee' ? 'Employé' : 'Admin';

  async function handleSaveName() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await supabase.from('users').update({ full_name: name.trim() }).eq('id', profile!.id);
      await refreshProfile();
      setEditingName(false);
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    }
    setSaving(false);
  }

  function handleChangePassword() {
    Alert.alert(
      'Changer le mot de passe',
      'Un email de réinitialisation sera envoyé à votre adresse.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Envoyer',
          onPress: async () => {
            try {
              const { error } = await supabase.auth.resetPasswordForEmail(profile!.email);
              if (error) throw error;
              Alert.alert('Envoyé', 'Vérifiez votre email.');
            } catch (e: any) {
              Alert.alert('Erreur', e.message);
            }
          },
        },
      ]
    );
  }

  function handleLogout() {
    Alert.alert('Se déconnecter', 'Êtes-vous sûr ?', [
      { text: 'Non', style: 'cancel' },
      { text: 'Oui', style: 'destructive', onPress: signOut },
    ]);
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={20} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Mon profil</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 18, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        {/* Avatar + info */}
        <View style={s.profileCard}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{(profile?.full_name || 'A')[0].toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            {editingName ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TextInput
                  style={s.nameInput}
                  value={name}
                  onChangeText={setName}
                  autoFocus
                />
                <TouchableOpacity onPress={handleSaveName} disabled={saving} activeOpacity={0.7}>
                  <Text style={{ color: ACCENT, fontWeight: '700', fontSize: 13 }}>{saving ? '...' : 'OK'}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setEditingName(true)} activeOpacity={0.7}>
                <Text style={s.profileName}>{profile?.full_name || 'Admin'}</Text>
              </TouchableOpacity>
            )}
            <View style={s.roleBadge}>
              <Shield size={10} color={ACCENT} strokeWidth={2} />
              <Text style={s.roleText}>{roleLabel}</Text>
            </View>
          </View>
        </View>

        {/* Info section */}
        <Text style={s.sectionTitle}>Informations</Text>
        <View style={s.infoCard}>
          <View style={s.infoRow}>
            <Mail size={16} color="#6B7280" strokeWidth={1.8} />
            <View style={{ flex: 1 }}>
              <Text style={s.infoLabel}>Email</Text>
              <Text style={s.infoValue}>{profile?.email ?? '—'}</Text>
            </View>
          </View>
          <View style={s.sep} />
          <View style={s.infoRow}>
            <Phone size={16} color="#6B7280" strokeWidth={1.8} />
            <View style={{ flex: 1 }}>
              <Text style={s.infoLabel}>Téléphone</Text>
              <Text style={s.infoValue}>{profile?.phone_whatsapp ?? '—'}</Text>
            </View>
          </View>
          <View style={s.sep} />
          <View style={s.infoRow}>
            <User size={16} color="#6B7280" strokeWidth={1.8} />
            <View style={{ flex: 1 }}>
              <Text style={s.infoLabel}>Membre depuis</Text>
              <Text style={s.infoValue}>
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
                  : '—'}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <Text style={s.sectionTitle}>Sécurité</Text>
        <TouchableOpacity style={s.actionRow} onPress={handleChangePassword} activeOpacity={0.7}>
          <View style={s.actionIcon}>
            <Key size={18} color={ACCENT} strokeWidth={1.8} />
          </View>
          <Text style={s.actionLabel}>Changer le mot de passe</Text>
          <ChevronRight size={16} color="#4B5563" strokeWidth={2} />
        </TouchableOpacity>

        <View style={{ marginTop: 30 }}>
          <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
            <LogOut size={18} color="#EF4444" strokeWidth={1.8} />
            <Text style={s.logoutText}>Se déconnecter</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 18, paddingTop: statusBarH + 10, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: '#1A1A1A',
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', flex: 1 },

  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: '#1A1A1A', borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: '#1F1F1F',
  },
  avatar: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: ACCENT,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 24, fontWeight: '800', color: '#0D0D0D' },
  profileName: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  nameInput: {
    flex: 1, height: 34, backgroundColor: '#0D0D0D', borderRadius: 8,
    borderWidth: 1, borderColor: '#2A2A2A', color: '#FFFFFF',
    paddingHorizontal: 10, fontSize: 14,
  },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginTop: 6, backgroundColor: 'rgba(249,115,22,0.12)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, alignSelf: 'flex-start',
  },
  roleText: { fontSize: 11, fontWeight: '700', color: ACCENT },

  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#6B7280', marginTop: 24, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },

  infoCard: {
    backgroundColor: '#1A1A1A', borderRadius: 14, borderWidth: 1, borderColor: '#1F1F1F',
    padding: 16,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 6 },
  infoLabel: { fontSize: 11, color: '#6B7280' },
  infoValue: { fontSize: 13, color: '#FFFFFF', fontWeight: '500', marginTop: 1 },
  sep: { height: 1, backgroundColor: '#222222', marginVertical: 6 },

  actionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#1A1A1A', borderRadius: 14, borderWidth: 1, borderColor: '#1F1F1F',
    padding: 16,
  },
  actionIcon: {
    width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(249,115,22,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  actionLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: '#FFFFFF' },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, padding: 16, borderRadius: 12,
    backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
  },
  logoutText: { fontSize: 14, fontWeight: '700', color: '#EF4444' },
});
