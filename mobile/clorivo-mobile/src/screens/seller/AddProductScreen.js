import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, RADIUS } from '../../lib/tokens';
import { Btn, Input } from '../../components/UI';
import { supabase, uploadFile, getShops } from '../../lib/supabase';
import { useSession } from '../../hooks/useSession';

const CATEGORIES = ['Maison', 'Mode', 'Tech', 'Beauté', 'Sport', 'Enfants', 'Jardin', 'Autre'];

export default function AddProductScreen({ route, navigation }) {
  const existingProduct = route.params?.product;
  const session = useSession();

  const [title, setTitle]         = useState(existingProduct?.title ?? '');
  const [description, setDesc]    = useState(existingProduct?.description ?? '');
  const [price, setPrice]         = useState(existingProduct?.price?.toString() ?? '');
  const [comparePrice, setCompare]= useState(existingProduct?.compare_price?.toString() ?? '');
  const [stock, setStock]         = useState(existingProduct?.stock?.toString() ?? '');
  const [category, setCategory]   = useState(existingProduct?.category ?? CATEGORIES[0]);
  const [images, setImages]       = useState(existingProduct?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [shopId, setShopId]       = useState(null);

  useEffect(() => {
    if (session?.user) {
      getShops().then(shops => {
        const mine = shops?.find(s => s.seller_id === session.user.id);
        if (mine) setShopId(mine.id);
      });
    }
  }, [session]);

  async function pickImage() {
    const ImagePicker = await import('expo-image-picker');
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission refusée', 'Accès à la galerie requis.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (result.canceled) return;
    setUploading(true);
    try {
      const uri = result.assets[0].uri;
      const filename = `products/${session.user.id}/${Date.now()}.jpg`;
      const response = await fetch(uri);
      const blob = await response.blob();
      const url = await uploadFile(filename, blob, 'image/jpeg');
      if (url) setImages(prev => [...prev, url]);
      else Alert.alert('Erreur', 'Impossible d\'uploader l\'image.');
    } catch (e) {
      Alert.alert('Erreur', e.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!title.trim()) { Alert.alert('Erreur', 'Le titre est obligatoire.'); return; }
    if (!price || isNaN(Number(price))) { Alert.alert('Erreur', 'Prix invalide.'); return; }
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        price: Number(price),
        compare_price: comparePrice ? Number(comparePrice) : null,
        stock: stock ? Number(stock) : 0,
        category: category.toLowerCase(),
        images,
        shop_id: shopId,
        seller_id: session.user.id,
        status: 'active',
      };
      if (existingProduct) {
        const { error } = await supabase.from('products').update(payload).eq('id', existingProduct.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert(payload);
        if (error) throw error;
      }
      Alert.alert('Succès', existingProduct ? 'Produit mis à jour !' : 'Produit créé avec succès !', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Erreur', e.message ?? 'Impossible d\'enregistrer.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.paper }} edges={['top']}>
      <View style={{ backgroundColor: COLORS.white, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.hairline, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 22, color: COLORS.ink }}>←</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.ink }}>{existingProduct ? 'Modifier le produit' : 'Nouveau produit'}</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 20 }}>
          {/* Images */}
          <View style={{ backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: 16 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.ink, marginBottom: 14 }}>Photos du produit</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {images.map((img, i) => (
                <View key={i} style={{ position: 'relative' }}>
                  <Image source={{ uri: img }} style={{ width: 90, height: 90, borderRadius: RADIUS.sm }} />
                  <TouchableOpacity onPress={() => setImages(prev => prev.filter((_, j) => j !== i))}
                    style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.danger, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '900' }}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity onPress={pickImage} disabled={uploading}
                style={{ width: 90, height: 90, borderRadius: RADIUS.sm, borderWidth: 2, borderStyle: 'dashed', borderColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primarySoft }}>
                {uploading ? <ActivityIndicator color={COLORS.primary} /> : <Text style={{ fontSize: 28, color: COLORS.primary }}>+</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Basic info */}
          <View style={{ backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: 16 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.ink, marginBottom: 14 }}>Informations</Text>
            <Input label="Titre du produit *" value={title} onChangeText={setTitle} placeholder="Ex: Veste en cuir marron" />
            <Input label="Description" value={description} onChangeText={setDesc} placeholder="Décrivez votre produit…" />
          </View>

          {/* Pricing */}
          <View style={{ backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: 16 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.ink, marginBottom: 14 }}>Prix & stock</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Input label="Prix ($) *" value={price} onChangeText={setPrice} placeholder="29.99" keyboardType="decimal-pad" />
              </View>
              <View style={{ flex: 1 }}>
                <Input label="Prix barré ($)" value={comparePrice} onChangeText={setCompare} placeholder="49.99" keyboardType="decimal-pad" />
              </View>
            </View>
            <Input label="Stock" value={stock} onChangeText={setStock} placeholder="100" keyboardType="number-pad" />
          </View>

          {/* Category */}
          <View style={{ backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: 16 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.ink, marginBottom: 14 }}>Catégorie</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity key={cat} onPress={() => setCategory(cat)}
                  style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: category === cat ? COLORS.primary : COLORS.hairline, backgroundColor: category === cat ? COLORS.primarySoft : COLORS.white }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: category === cat ? COLORS.primary : COLORS.mute }}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={{ padding: 20, paddingBottom: 32, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.hairline }}>
          <Btn size="lg" onPress={handleSave} disabled={saving || uploading}>
            {saving ? 'Enregistrement…' : existingProduct ? 'Mettre à jour' : 'Publier le produit'}
          </Btn>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
