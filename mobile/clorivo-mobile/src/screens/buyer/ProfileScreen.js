import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  Modal, TextInput, ActivityIndicator, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, RADIUS, SHADOW } from '../../lib/tokens';
import { Avatar, Badge } from '../../components/UI';
import Icon from '../../components/Icon';
import {
  signOut, getProfile, updateProfile, getOrders,
  uploadImage,
} from '../../lib/supabase';
import { useSession } from '../../hooks/useSession';

function showAlert(title, msg, buttons) {
  if (Platform.OS === 'web') {
    if (buttons?.find(b => b.style === 'destructive')) {
      if (window.confirm(`${title}\n${msg ?? ''}`)) {
        buttons.find(b => b.style === 'destructive')?.onPress?.();
      }
    } else {
      window.alert(`${title}${msg ? '\n' + msg : ''}`);
    }
  } else {
    Alert.alert(title, msg, buttons);
  }
}

function StatBox({ value, label }) {
  return (
    <View style={{ flex: 1, paddingVertical: 12, alignItems: 'center' }}>
      <Text style={{ fontFamily: 'monospace', fontSize: 17, fontWeight: '700', color: COLORS.primary }}>{value}</Text>
      <Text style={{ fontSize: 11, color: COLORS.mute, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

function MenuItem({ icon, label, detail, onPress, accent, danger }) {
  return (
    <TouchableOpacity onPress={onPress}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14,
        backgroundColor: accent ? COLORS.primarySoft : COLORS.white,
      }}>
      <View style={{
        width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
        backgroundColor: accent ? COLORS.primary : danger ? '#FFF0F0' : COLORS.paper,
      }}>
        <Icon name={icon} size={17} color={accent ? '#fff' : danger ? COLORS.danger : COLORS.mute} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '500', color: accent ? COLORS.primaryDeep : danger ? COLORS.danger : COLORS.ink }}>
          {label}
        </Text>
        {detail ? <Text style={{ fontSize: 12, color: COLORS.mute, marginTop: 1 }}>{detail}</Text> : null}
      </View>
      {!danger && <Icon name="chevronRight" size={16} color={COLORS.mute} />}
    </TouchableOpacity>
  );
}

function MenuGroup({ children }) {
  return (
    <View style={{ marginHorizontal: 16, marginTop: 14, backgroundColor: COLORS.white, borderRadius: 16, overflow: 'hidden', ...SHADOW.sm }}>
      {React.Children.map(children, (child, i) => (
        <>
          {i > 0 && <View style={{ height: 1, backgroundColor: COLORS.hairline, marginLeft: 64 }} />}
          {child}
        </>
      ))}
    </View>
  );
}

export default function ProfileScreen({ navigation }) {
  const session  = useSession();
  const userId   = session?.user?.id;

  const [profile,  setProfile]  = useState(null);
  const [orders,   setOrders]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [editName,  setEditName]  = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saving,    setSaving]    = useState(false);

  useFocusEffect(useCallback(() => {
    if (!userId) return;
    Promise.all([getProfile(userId), getOrders(userId)])
      .then(([p, o]) => {
        setProfile(p);
        setOrders(o ?? []);
        setLoading(false);
      });
  }, [userId]));

  const name     = profile?.full_name ?? session?.user?.user_metadata?.full_name ?? 'Utilisateur';
  const email    = session?.user?.email ?? '';
  const initials = name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U';
  const isSeller = profile?.role === 'seller' || profile?.role === 'admin';
  const address  = typeof profile?.address === 'string' ? profile.address : (profile?.address?.city ?? null);

  // Stats
  const ordersCount  = orders.length;
  const inTransit    = orders.filter(o => o.status === 'shipped').length;
  const toRate       = orders.filter(o => o.status === 'delivered').length;
  const memberSince  = session?.user?.created_at
    ? new Date(session.user.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : '';

  async function handleSaveEdit() {
    setSaving(true);
    await updateProfile(userId, { full_name: editName.trim(), phone: editPhone.trim() });
    setProfile(p => ({ ...p, full_name: editName.trim(), phone: editPhone.trim() }));
    setSaving(false);
    setEditModal(false);
  }

  async function handlePickAvatar() {
    try {
      const ImagePicker = await import('expo-image-picker');
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return;
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
      if (result.canceled || !result.assets?.[0]) return;
      const { url } = await uploadImage('avatars', `${userId}/avatar.jpg`, result.assets[0].uri);
      if (url) {
        await updateProfile(userId, { avatar_url: url });
        setProfile(p => ({ ...p, avatar_url: url }));
      }
    } catch {}
  }

  async function handleSignOut() {
    showAlert('Déconnexion', 'Êtes-vous sûr ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnexion', style: 'destructive', onPress: () => signOut() },
    ]);
  }

  if (!userId) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.paper, alignItems: 'center', justifyContent: 'center' }} edges={['top']}>
      <Text style={{ fontSize: 48, marginBottom: 16 }}>👤</Text>
      <Text style={{ fontSize: 17, fontWeight: '700', color: COLORS.ink, marginBottom: 8 }}>Non connecté</Text>
      <TouchableOpacity onPress={() => navigation.navigate('Login')}
        style={{ backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 28, paddingVertical: 12 }}>
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Se connecter</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.paper }} edges={['top']}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>

        {/* ── HEADER ─────────────────────────────── */}
        <View style={{ backgroundColor: COLORS.white, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 0 }}>
          {/* Avatar + name + edit button */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingBottom: 12 }}>
            <TouchableOpacity onPress={handlePickAvatar} style={{ position: 'relative' }}>
              {profile?.avatar_url
                ? <Image source={{ uri: profile.avatar_url }} style={{ width: 60, height: 60, borderRadius: 30 }} />
                : <Avatar size={60} initials={initials} bg={COLORS.primary} />
              }
              <View style={{ position: 'absolute', bottom: 0, right: 0, width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.primary, borderWidth: 2, borderColor: COLORS.white, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="camera" size={9} color="#fff" />
              </View>
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: COLORS.mute, marginBottom: 1 }}>Bonjour 👋</Text>
              <Text style={{ fontSize: 20, fontWeight: '800', color: COLORS.ink, letterSpacing: -0.5 }}>{name}</Text>
              <Text style={{ fontSize: 12, color: COLORS.mute, marginTop: 2 }}>
                {memberSince ? `Membre depuis ${memberSince} · ` : ''}{email}
              </Text>
            </View>

            <TouchableOpacity onPress={() => { setEditName(name); setEditPhone(profile?.phone ?? ''); setEditModal(true); }}
              style={{ borderWidth: 1.5, borderColor: COLORS.hairline, borderRadius: RADIUS.full, paddingHorizontal: 14, paddingVertical: 7 }}>
              <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.ink }}>Modifier</Text>
            </TouchableOpacity>
          </View>

          {/* Address strip */}
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.primarySoft, borderRadius: 12, padding: 10, marginBottom: 16 }}>
            <Icon name="mapPin" size={16} color={COLORS.primary} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, color: COLORS.mute, marginBottom: 1 }}>Adresse de livraison</Text>
              <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.primaryDeep }}>
                {address ?? 'Ajouter une adresse'}
              </Text>
            </View>
            <Icon name="chevronRight" size={14} color={COLORS.primary} />
          </TouchableOpacity>

          {/* Stats */}
          <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: COLORS.hairline, marginHorizontal: -20 }}>
            <StatBox value={String(ordersCount)} label="commandes" />
            <View style={{ width: 1, backgroundColor: COLORS.hairline }} />
            <StatBox value="14" label="favoris" />
            <View style={{ width: 1, backgroundColor: COLORS.hairline }} />
            <StatBox value="1.2k" label="points" />
            <View style={{ width: 1, backgroundColor: COLORS.hairline }} />
            <StatBox value="Gold" label="statut" />
          </View>
        </View>

        {/* ── MES COMMANDES (quick row) ──────────── */}
        <View style={{ marginHorizontal: 16, marginTop: 14, backgroundColor: COLORS.white, borderRadius: 16, padding: 14, ...SHADOW.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 8, marginBottom: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.ink }}>Mes commandes</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Orders')}>
              <Text style={{ fontSize: 13, color: COLORS.primary, fontWeight: '500' }}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            {[
              { icon: 'creditCard', label: 'À payer',     count: 1 },
              { icon: 'package',    label: 'À expédier',  count: 0 },
              { icon: 'truck',      label: 'En transit',  count: inTransit },
              { icon: 'star',       label: 'À noter',     count: toRate },
            ].map((s, i) => (
              <TouchableOpacity key={i} onPress={() => navigation.navigate('Orders')}
                style={{ alignItems: 'center', gap: 5, padding: 8, position: 'relative' }}>
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.paper, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={s.icon} size={20} color={COLORS.mute} />
                  {s.count > 0 && (
                    <View style={{ position: 'absolute', top: -2, right: -2, width: 18, height: 18, borderRadius: 9, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.white }}>
                      <Text style={{ fontSize: 9, fontWeight: '700', color: '#fff' }}>{s.count}</Text>
                    </View>
                  )}
                </View>
                <Text style={{ fontSize: 11, color: COLORS.mute }}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── MENU GROUP 1 ──────────────────────── */}
        <MenuGroup>
          <MenuItem icon="package"    label="Mes commandes"  detail={`${ordersCount} commande${ordersCount !== 1 ? 's' : ''}`} onPress={() => navigation.navigate('Orders')} />
          <MenuItem icon="mapPin"     label="Adresses"       detail="Gérer mes adresses"  onPress={() => navigation.navigate('Address')} />
          <MenuItem icon="creditCard" label="Paiements"      detail="Visa, PayPal"         onPress={() => navigation.navigate('Settings')} />
          <MenuItem icon="messageSquare" label="Messages"    detail=""                     onPress={() => navigation.navigate('Messages')} />
        </MenuGroup>

        {/* ── MENU GROUP 2 — vendeur ─────────────── */}
        <MenuGroup>
          {isSeller ? (
            <MenuItem icon="barChart"  label="Espace vendeur"  detail="Tableau de bord"  onPress={() => navigation.navigate('SellerDashboard')} accent />
          ) : (
            <MenuItem icon="store"     label="Devenir vendeur" detail="Gagner sur clorivo" onPress={() => navigation.navigate('ShopSetup')} accent />
          )}
        </MenuGroup>

        {/* ── MENU GROUP 3 ──────────────────────── */}
        <MenuGroup>
          <MenuItem icon="bell"      label="Notifications"   onPress={() => navigation.navigate('Notifications')} />
          <MenuItem icon="help"      label="Aide & Support"  onPress={() => navigation.navigate('Help')} />
          <MenuItem icon="settings"  label="Paramètres"      onPress={() => navigation.navigate('Settings')} />
          {profile?.role === 'admin' && (
            <MenuItem icon="lock"    label="Console admin"   onPress={() => navigation.navigate('AdminConsole')} />
          )}
          <MenuItem icon="logOut"    label="Se déconnecter"  onPress={handleSignOut} danger />
        </MenuGroup>

        <Text style={{ textAlign: 'center', padding: 24, fontFamily: 'monospace', fontSize: 11, color: COLORS.hairline }}>
          clorivo v1.0.0
        </Text>
      </ScrollView>

      {/* ── MODAL ÉDITION PROFIL ──────────────── */}
      <Modal visible={editModal} transparent animationType="slide" onRequestClose={() => setEditModal(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} activeOpacity={1} onPress={() => setEditModal(false)} />
        <View style={{ backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, position: 'absolute', bottom: 0, left: 0, right: 0 }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.hairline, alignSelf: 'center', marginBottom: 20 }} />
          <Text style={{ fontSize: 18, fontWeight: '800', color: COLORS.ink, letterSpacing: -0.5, marginBottom: 20 }}>Modifier le profil</Text>

          <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.mute, marginBottom: 6 }}>Nom complet</Text>
          <TextInput
            value={editName} onChangeText={setEditName}
            placeholder="Votre nom"
            placeholderTextColor={COLORS.mute}
            style={{ borderWidth: 1.5, borderColor: COLORS.hairline, borderRadius: 12, padding: 14, fontSize: 14, color: COLORS.ink, marginBottom: 14, backgroundColor: COLORS.paper }}
          />

          <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.mute, marginBottom: 6 }}>Téléphone</Text>
          <TextInput
            value={editPhone} onChangeText={setEditPhone}
            placeholder="+33 6 00 00 00 00"
            placeholderTextColor={COLORS.mute}
            keyboardType="phone-pad"
            style={{ borderWidth: 1.5, borderColor: COLORS.hairline, borderRadius: 12, padding: 14, fontSize: 14, color: COLORS.ink, marginBottom: 20, backgroundColor: COLORS.paper }}
          />

          <TouchableOpacity onPress={handleSaveEdit} disabled={saving}
            style={{ backgroundColor: COLORS.primary, borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center', opacity: saving ? 0.7 : 1 }}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Enregistrer</Text>}
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
