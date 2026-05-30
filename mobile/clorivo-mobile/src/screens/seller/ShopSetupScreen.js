import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, RADIUS } from '../../lib/tokens';
import { Btn, Input } from '../../components/UI';
import { getShopBySeller, createShop, updateShop, uploadFile } from '../../lib/supabase';
import { useSession } from '../../hooks/useSession';

const BRAND_COLORS = ['#6C4DFF', '#C97B5A', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#14B8A6'];

export default function ShopSetupScreen({ navigation }) {
  const session = useSession();
  const [shop, setShop]         = useState(null);
  const [name, setName]         = useState('');
  const [description, setDesc]  = useState('');
  const [brandColor, setColor]  = useState(BRAND_COLORS[0]);
  const [logoUri, setLogoUri]   = useState(null);
  const [logoUrl, setLogoUrl]   = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!session?.user) return;
    getShopBySeller(session.user.id).then(s => {
      if (s) {
        setShop(s);
        setName(s.name ?? '');
        setDesc(s.description ?? '');
        setColor(s.brand_color ?? BRAND_COLORS[0]);
        setLogoUrl(s.logo_url ?? null);
      }
      setLoading(false);
    });
  }, [session]);

  async function pickLogo() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission refusée'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8, allowsEditing: true, aspect: [1, 1] });
    if (result.canceled) return;
    setLogoUri(result.assets[0].uri);
    setUploading(true);
    try {
      const response = await fetch(result.assets[0].uri);
      const blob = await response.blob();
      const url = await uploadFile(`shops/${session.user.id}/logo.jpg`, blob, 'image/jpeg');
      if (url) setLogoUrl(url);
    } catch (e) {
      Alert.alert('Erreur upload', e.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!name.trim()) { Alert.alert('Erreur', 'Le nom de la boutique est obligatoire.'); return; }
    setSaving(true);
    try {
      const payload = { name: name.trim(), description: description.trim() || null, brand_color: brandColor, logo_url: logoUrl, seller_id: session.user.id };
      if (shop) await updateShop(shop.id, payload);
      else await createShop(payload);
      Alert.alert('Succès', shop ? 'Boutique mise à jour !' : 'Boutique créée !', [
        { text: 'OK', onPress: () => navigation.navigate('SellerDashboard') },
      ]);
    } catch (e) {
      Alert.alert('Erreur', e.message ?? 'Impossible d\'enregistrer.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={COLORS.primary} size="large" />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.paper }} edges={['top']}>
      <View style={{ backgroundColor: COLORS.white, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.hairline, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 22, color: COLORS.ink }}>←</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.ink }}>{shop ? 'Ma boutique' : 'Créer ma boutique'}</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 20 }}>
          {/* Logo */}
          <View style={{ backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: 16, alignItems: 'center', gap: 14 }}>
            <TouchableOpacity onPress={pickLogo} disabled={uploading}>
              <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: brandColor, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {uploading ? <ActivityIndicator color="#fff" /> :
                  logoUri || logoUrl
                    ? <Image source={{ uri: logoUri ?? logoUrl }} style={{ width: 90, height: 90 }} />
                    : <Text style={{ fontSize: 36, fontWeight: '900', color: '#fff' }}>{name?.[0]?.toUpperCase() ?? '+'}</Text>
                }
              </View>
            </TouchableOpacity>
            <Text style={{ fontSize: 13, color: COLORS.mute }}>Appuyer pour changer le logo</Text>
          </View>

          {/* Info */}
          <View style={{ backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: 16 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.ink, marginBottom: 14 }}>Informations</Text>
            <Input label="Nom de la boutique *" value={name} onChangeText={setName} placeholder="luna.studio" />
            <Input label="Description" value={description} onChangeText={setDesc} placeholder="Ce que vous vendez, votre histoire…" />
          </View>

          {/* Brand color */}
          <View style={{ backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: 16 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.ink, marginBottom: 14 }}>Couleur de marque</Text>
            <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
              {BRAND_COLORS.map(c => (
                <TouchableOpacity key={c} onPress={() => setColor(c)}
                  style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c, borderWidth: c === brandColor ? 3 : 0, borderColor: '#fff', shadowColor: c, shadowOpacity: 0.5, shadowRadius: 6, elevation: 4 }} />
              ))}
            </View>
          </View>

          {/* Preview */}
          <View style={{ backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: 16 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.ink, marginBottom: 14 }}>Aperçu</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderWidth: 1.5, borderColor: COLORS.hairline, borderRadius: RADIUS.md }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: brandColor, alignItems: 'center', justifyContent: 'center' }}>
                {logoUrl
                  ? <Image source={{ uri: logoUrl }} style={{ width: 44, height: 44, borderRadius: 22 }} />
                  : <Text style={{ fontSize: 20, fontWeight: '900', color: '#fff' }}>{name?.[0]?.toUpperCase() ?? '?'}</Text>
                }
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.ink }}>{name || 'Nom de la boutique'}</Text>
                <Text style={{ fontSize: 12, color: COLORS.mute }} numberOfLines={1}>{description || 'Description…'}</Text>
              </View>
              <View style={{ backgroundColor: '#EFF9F4', borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 3 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.success }}>✓ Vérifié</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={{ padding: 20, paddingBottom: 32, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.hairline }}>
          <Btn size="lg" onPress={handleSave} disabled={saving || uploading}>
            {saving ? 'Enregistrement…' : shop ? 'Mettre à jour' : 'Créer la boutique →'}
          </Btn>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
