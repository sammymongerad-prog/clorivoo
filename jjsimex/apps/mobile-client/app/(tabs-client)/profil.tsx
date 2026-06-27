import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Linking, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import {
  User, Package, ShoppingCart, MapPin, CreditCard, Calculator,
  Globe, MessageCircle, HelpCircle, Star, Megaphone, LogOut,
  Camera, ChevronRight,
} from 'lucide-react-native';

type ToggleKey = 'whatsapp' | 'email' | 'theme';

function Toggle({ value, onToggle }: { value: boolean; onToggle: () => void }) {
  return (
    <TouchableOpacity onPress={onToggle} activeOpacity={0.8}
      style={{ width: 44, height: 26, borderRadius: 99, backgroundColor: value ? '#F97316' : '#2A2A2A', justifyContent: 'center', padding: 3 }}>
      <View style={{ width: 20, height: 20, borderRadius: 99, backgroundColor: '#FFFFFF', marginLeft: value ? 18 : 0 }} />
    </TouchableOpacity>
  );
}

function MenuItem({ icon: Icon, label, sub, onPress, iconBg = 'rgba(249,115,22,0.12)' }: {
  icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
  sub?: string;
  onPress?: () => void;
  iconBg?: string;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 14 }}>
      <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: iconBg, alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={18} color="#F97316" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>{label}</Text>
        {sub ? <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{sub}</Text> : null}
      </View>
      <ChevronRight size={18} color="#6B7280" />
    </TouchableOpacity>
  );
}

function Sep() {
  return <View style={{ height: 1, backgroundColor: '#242424' }} />;
}

function mapCountry(code?: string | null): string {
  if (!code) return '—';
  if (code === 'haiti') return 'Haïti';
  if (code === 'dr') return 'Rép. Dominicaine';
  return code;
}

function getMemberSince(createdAt?: string | null): string {
  try {
    if (!createdAt) return '—';
    const created = new Date(createdAt);
    if (isNaN(created.getTime())) return '—';
    const now = new Date();
    if (created.getFullYear() === now.getFullYear()) return 'Nouveau';
    const years = now.getFullYear() - created.getFullYear();
    return `${years} ans`;
  } catch {
    return '—';
  }
}

export default function ProfilScreen() {
  const router = useRouter();
  const { profile, signOut, refreshProfile } = useAuth();
  const [toggles, setToggles] = useState<Record<ToggleKey, boolean>>({ whatsapp: true, email: true, theme: true });
  const [uploading, setUploading] = useState(false);
  const toggle = (k: ToggleKey) => setToggles(p => ({ ...p, [k]: !p[k] }));

  if (!profile) {
    return (
      <View style={S.container}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#F97316" size="large" />
          <Text style={{ color: '#9CA3AF', marginTop: 12, fontSize: 14 }}>Chargement du profil…</Text>
        </View>
      </View>
    );
  }

  const fullName = profile.full_name ?? '';
  const initials = fullName
    ? fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase()
    : '??';

  const destination = [mapCountry(profile.destination_country), profile.destination_city].filter(Boolean).join(', ');

  async function uploadAvatar(uri: string) {
    try {
      setUploading(true);
      const filePath = `${profile!.id}/avatar.jpg`;
      const ext = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
      const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

      const formData = new FormData();
      formData.append('file', { uri, name: 'avatar.jpg', type: mimeType } as any);

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, formData, { contentType: mimeType, upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const ts = Date.now();
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: `${publicUrl}?t=${ts}` })
        .eq('id', profile!.id);

      if (updateError) throw updateError;
      await refreshProfile();
    } catch (err: any) {
      Alert.alert('Erreur', err.message ?? 'Impossible de télécharger la photo.');
    } finally {
      setUploading(false);
    }
  }

  async function deleteAvatar() {
    try {
      setUploading(true);
      const filePath = `${profile!.id}/avatar.jpg`;
      await supabase.storage.from('avatars').remove([filePath]);
      await supabase.from('users').update({ avatar_url: null }).eq('id', profile!.id);
      await refreshProfile();
    } catch (err: any) {
      Alert.alert('Erreur', err.message ?? 'Impossible de supprimer la photo.');
    } finally {
      setUploading(false);
    }
  }

  async function pickImage(source: 'camera' | 'gallery') {
    let result: ImagePicker.ImagePickerResult;
    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'Veuillez autoriser l\'accès à la caméra.');
        return;
      }
      result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7, allowsEditing: true, aspect: [1, 1] });
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'Veuillez autoriser l\'accès à la galerie.');
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, allowsEditing: true, aspect: [1, 1] });
    }
    if (!result.canceled && result.assets[0]) {
      await uploadAvatar(result.assets[0].uri);
    }
  }

  function handleAvatarPress() {
    Alert.alert('Photo de profil', undefined, [
      { text: 'Prendre une photo', onPress: () => pickImage('camera') },
      { text: 'Choisir dans la galerie', onPress: () => pickImage('gallery') },
      { text: 'Supprimer la photo', style: 'destructive', onPress: deleteAvatar },
      { text: 'Annuler', style: 'cancel' },
    ]);
  }

  async function handleSignOut() {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Se déconnecter', style: 'destructive', onPress: async () => {
        await signOut();
        router.replace('/(auth)/login');
      }},
    ]);
  }

  const stats: [string, string][] = [
    [String(profile.total_packages ?? 0), 'Colis envoyés'],
    ['—', 'En cours'],
    [getMemberSince(profile.created_at), 'Membre depuis'],
  ];

  const toggleItems: [ToggleKey, React.ComponentType<{ size: number; color: string }>, string][] = [
    ['whatsapp', MessageCircle, 'Notifications WhatsApp'],
    ['email', Globe, 'Notifications email'],
    ['theme', Globe, 'Thème'],
  ];

  return (
    <View style={S.container}>
      {/* Header */}
      <View style={S.header}>
        <Text style={S.headerTitle}>Mon Profil</Text>
        <TouchableOpacity style={S.editBtn} activeOpacity={0.8}>
          <User size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 22, paddingTop: 8, paddingBottom: 40 }}>
        {/* Carte profil */}
        <View style={S.profileCard}>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.8} style={{ position: 'relative' }}>
              <View style={S.avatar}>
                {profile.avatar_url ? (
                  <Image source={{ uri: profile.avatar_url }} style={{ width: 72, height: 72, borderRadius: 36 }} />
                ) : (
                  <Text style={S.avatarText}>{initials}</Text>
                )}
                {uploading && (
                  <View style={{ ...StyleSheet.absoluteFillObject, borderRadius: 36, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  </View>
                )}
              </View>
              <View style={S.cameraButton}>
                <Camera size={12} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#FFFFFF' }}>{fullName}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#14532D', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginTop: 6 }}>
                <Text style={{ color: '#22C55E', fontSize: 11, fontWeight: '600' }}>✓ Client vérifié</Text>
              </View>
              <Text style={{ fontSize: 13, color: '#9CA3AF', marginTop: 8 }}>{profile.email}</Text>
              {profile.phone_whatsapp ? <Text style={{ fontSize: 13, color: '#9CA3AF', marginTop: 2 }}>{profile.phone_whatsapp}</Text> : null}
              {destination ? <Text style={{ fontSize: 13, color: '#9CA3AF', marginTop: 2 }}>{destination}</Text> : null}
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20, paddingTop: 18, borderTopWidth: 1, borderTopColor: '#2A2A2A' }}>
            {stats.map(([val, lbl], i) => (
              <React.Fragment key={lbl}>
                {i > 0 && <View style={{ width: 1, height: 34, backgroundColor: '#2A2A2A' }} />}
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontSize: 19, fontWeight: '800', color: '#F97316' }}>{val}</Text>
                  <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 3, textAlign: 'center' }}>{lbl}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Mon compte */}
        <Text style={S.sectionTitle}>Mon compte</Text>
        <View style={S.section}>
          <MenuItem icon={User} label="Mes informations personnelles" sub="Nom, email, téléphone" onPress={() => router.push('/screens/edit-profile')} />
          <Sep /><MenuItem icon={Package} label="Historique des colis" sub="Toutes mes expéditions" onPress={() => router.push('/(tabs-client)/colis')} />
          <Sep /><MenuItem icon={ShoppingCart} label="Personal Shopper" sub="Commandes en cours" onPress={() => router.push('/screens/personal-shopper?tab=history')} />
          <Sep /><MenuItem icon={MapPin} label="Mes adresses US" sub="Miami + Boston" onPress={() => router.push('/screens/adresses-us')} />
          <Sep /><MenuItem icon={CreditCard} label="Mes paiements" sub="MonCash, Zelle configurés" onPress={() => router.push('/paiements')} />
          <Sep /><MenuItem icon={Calculator} label="Calculateur de tarifs" sub="Estimez vos frais" onPress={() => router.push('/screens/calculateur')} />
        </View>

        {/* Préférences */}
        <Text style={S.sectionTitle}>Préférences</Text>
        <View style={S.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 14 }}>
            <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(249,115,22,0.12)', alignItems: 'center', justifyContent: 'center' }}>
              <Globe size={18} color="#F97316" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>Langue</Text>
              <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Français</Text>
            </View>
            <View style={{ backgroundColor: '#2A2A2A', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, marginRight: 8 }}>
              <Text style={{ color: '#C9CDD3', fontSize: 11, fontWeight: '700' }}>FR</Text>
            </View>
            <ChevronRight size={18} color="#6B7280" />
          </View>
          <Sep />
          {toggleItems.map(([key, Icon, label], i) => (
            <React.Fragment key={key}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 14 }}>
                <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(249,115,22,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} color="#F97316" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>{label}</Text>
                  <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{toggles[key] ? 'Activé' : 'Désactivé'}</Text>
                </View>
                <Toggle value={toggles[key]} onToggle={() => toggle(key)} />
              </View>
              {i < toggleItems.length - 1 && <Sep />}
            </React.Fragment>
          ))}
        </View>

        {/* Support */}
        <Text style={S.sectionTitle}>Support</Text>
        <View style={S.section}>
          <MenuItem icon={MessageCircle} label="Contacter via WhatsApp" sub="+1 (305) 600-9364" iconBg="rgba(34,197,94,0.12)" onPress={() => Linking.openURL('https://wa.me/13056009364')} />
          <Sep /><MenuItem icon={HelpCircle} label="Centre d'aide & FAQ" sub="Réponses à vos questions" onPress={() => router.push('/screens/faq')} />
          <Sep /><MenuItem icon={Star} label="Noter l'application" sub="Donnez-nous votre avis" onPress={() => Linking.openURL('https://play.google.com/store/apps/details?id=com.jjsimex.client')} />
          <Sep /><MenuItem icon={Megaphone} label="Parrainage" sub="Invitez vos amis, gagnez des points" onPress={() => router.push('/screens/referral')} />
        </View>

        {/* Déconnexion */}
        <TouchableOpacity onPress={handleSignOut} activeOpacity={0.85}
          style={{ marginTop: 28, height: 52, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#EF4444', borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <LogOut size={16} color="#EF4444" />
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
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#F97316', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarText: { color: '#0D0D0D', fontWeight: '800', fontSize: 26 },
  cameraButton: { position: 'absolute', bottom: 0, right: -2, width: 24, height: 24, borderRadius: 12, backgroundColor: '#F97316', borderWidth: 2, borderColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 12, fontWeight: '600', color: '#9CA3AF', letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 24, marginBottom: 10 },
  section: { backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#1F1F1F', borderRadius: 12, paddingHorizontal: 14 },
});
