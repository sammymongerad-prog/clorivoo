import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SHADOW } from '../../lib/tokens';
import { Avatar, Btn, Divider } from '../../components/UI';
import { signOut, getProfile } from '../../lib/supabase';
import { useSession } from '../../hooks/useSession';

export default function ProfileScreen({ navigation }) {
  const session = useSession();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (session?.user) getProfile(session.user.id).then(setProfile);
  }, [session]);

  async function handleSignOut() {
    Alert.alert('Déconnexion', 'Êtes-vous sûr de vouloir vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnexion', style: 'destructive', onPress: signOut },
    ]);
  }

  const name = profile?.full_name ?? session?.user?.user_metadata?.full_name ?? 'Utilisateur';
  const email = session?.user?.email ?? '';
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const isSeller = profile?.role === 'seller';

  const menuItems = [
    { icon: '📦', label: 'Mes commandes',       onPress: () => navigation.navigate('Orders') },
    { icon: '🔔', label: 'Notifications',        onPress: () => navigation.navigate('Notifications') },
    { icon: '💬', label: 'Messages',             onPress: () => navigation.navigate('Messages') },
    { icon: '❤️', label: 'Favoris',              onPress: () => {} },
    { icon: '🏠', label: 'Adresses sauvegardées', onPress: () => {} },
    ...(isSeller ? [
      { icon: '🏪', label: 'Mon espace vendeur', onPress: () => navigation.navigate('SellerDashboard') },
      { icon: '🏬', label: 'Ma boutique',         onPress: () => navigation.navigate('ShopSetup') },
    ] : [{ icon: '🏪', label: 'Devenir vendeur', onPress: () => navigation.navigate('ShopSetup') }]),
    { icon: '⚙️', label: 'Paramètres',           onPress: () => {} },
  ];

  if (!session?.user) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.paper }} edges={['top']}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>👤</Text>
        <Text style={{ fontSize: 17, fontWeight: '700', color: COLORS.ink, marginBottom: 8 }}>Non connecté</Text>
        <Text style={{ fontSize: 14, color: COLORS.mute, textAlign: 'center', marginBottom: 24 }}>Connectez-vous pour accéder à votre profil</Text>
        <Btn onPress={() => navigation.navigate('Auth')}>Se connecter</Btn>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.paper }} edges={['top']}>
      <ScrollView style={{ flex: 1 }}>
        {/* Profile card */}
        <View style={{ backgroundColor: COLORS.white, alignItems: 'center', paddingVertical: 28, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: COLORS.hairline }}>
          <Avatar size={72} initials={initials} bg={COLORS.primary} />
          <Text style={{ fontSize: 20, fontWeight: '800', color: COLORS.ink, marginTop: 12, letterSpacing: -0.5 }}>{name}</Text>
          <Text style={{ fontSize: 14, color: COLORS.mute, marginTop: 4 }}>{email}</Text>
          {isSeller && (
            <View style={{ marginTop: 8, backgroundColor: COLORS.primarySoft, borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 4 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.primary }}>Vendeur vérifié</Text>
            </View>
          )}
        </View>

        {/* Menu */}
        <View style={{ backgroundColor: COLORS.white, marginTop: 16, borderTopWidth: 1, borderBottomWidth: 1, borderColor: COLORS.hairline }}>
          {menuItems.map((item, i) => (
            <React.Fragment key={i}>
              <TouchableOpacity onPress={item.onPress}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 16 }}>
                <Text style={{ fontSize: 20, width: 28 }}>{item.icon}</Text>
                <Text style={{ flex: 1, fontSize: 15, color: COLORS.ink }}>{item.label}</Text>
                <Text style={{ fontSize: 16, color: COLORS.mute }}>›</Text>
              </TouchableOpacity>
              {i < menuItems.length - 1 && <Divider style={{ marginLeft: 62 }} />}
            </React.Fragment>
          ))}
        </View>

        <View style={{ padding: 20, paddingTop: 24 }}>
          <Btn variant="ghost" onPress={handleSignOut}>
            <Text style={{ color: COLORS.danger, fontWeight: '700', fontSize: 15 }}>Se déconnecter</Text>
          </Btn>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
