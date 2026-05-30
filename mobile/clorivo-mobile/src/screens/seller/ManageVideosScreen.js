import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Image, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SHADOW } from '../../lib/tokens';
import { useSession } from '../../hooks/useSession';
import {
  getSellerVideos, getProducts, createProductVideo,
  deleteProductVideo, uploadVideo, uploadImage,
} from '../../lib/supabase';
import Icon from '../../components/Icon';

function showAlert(title, msg) {
  if (Platform.OS === 'web') { window.alert(`${title}\n${msg}`); }
  else { Alert.alert(title, msg); }
}

export default function ManageVideosScreen({ navigation }) {
  const session = useSession();
  const userId  = session?.user?.id;

  const [videos,   setVideos]   = useState([]);
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [caption,    setCaption]    = useState('');
  const [productId,  setProductId]  = useState(null);
  const [videoUri,   setVideoUri]   = useState(null);
  const [thumbUri,   setThumbUri]   = useState(null);
  const [error,      setError]      = useState('');

  useEffect(() => {
    if (!userId) return;
    Promise.all([getSellerVideos(userId), getProducts({ seller_id: userId, limit: 50 })])
      .then(([vids, { data: prods }]) => {
        setVideos(vids);
        setProducts(prods ?? []);
        setLoading(false);
      });
  }, [userId]);

  async function pickVideo() {
    const ImagePicker = await import('expo-image-picker');
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { showAlert('Permission requise', 'Autorisez l\'accès à la galerie.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'], quality: 0.8 });
    if (!result.canceled && result.assets?.[0]) setVideoUri(result.assets[0].uri);
  }

  async function pickThumbnail() {
    const ImagePicker = await import('expo-image-picker');
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: true, aspect: [3, 4] });
    if (!result.canceled && result.assets?.[0]) setThumbUri(result.assets[0].uri);
  }

  async function handleUpload() {
    setError('');
    if (!videoUri) { setError('Sélectionnez une vidéo.'); return; }
    if (!caption.trim()) { setError('Ajoutez une description.'); return; }

    setUploading(true);
    try {
      const ts = Date.now();
      const { url: videoUrl, error: ve } = await uploadVideo(`${userId}/${ts}.mp4`, videoUri);
      if (ve) throw new Error(ve.message);

      let thumbnailUrl = null;
      if (thumbUri) {
        const { url } = await uploadImage('videos', `${userId}/${ts}_thumb.jpg`, thumbUri);
        thumbnailUrl = url;
      }

      const { data, error: ce } = await createProductVideo({
        seller_id: userId,
        product_id: productId ?? null,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        caption: caption.trim(),
      });
      if (ce) throw new Error(ce.message);

      setVideos(prev => [data, ...prev]);
      setCaption('');
      setProductId(null);
      setVideoUri(null);
      setThumbUri(null);
      showAlert('Succès', 'Vidéo publiée !');
    } catch (e) {
      setError(e.message);
    }
    setUploading(false);
  }

  async function handleDelete(id) {
    const confirmed = Platform.OS === 'web'
      ? window.confirm('Supprimer cette vidéo ?')
      : await new Promise(res => Alert.alert('Supprimer ?', '', [
          { text: 'Annuler', onPress: () => res(false) },
          { text: 'Supprimer', style: 'destructive', onPress: () => res(true) },
        ]));
    if (!confirmed) return;
    await deleteProductVideo(id);
    setVideos(prev => prev.filter(v => v.id !== id));
  }

  if (loading) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={COLORS.primary} size="large" />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.paper }} edges={['top']}>
      {/* Header */}
      <View style={{ backgroundColor: COLORS.white, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.hairline }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrowLeft" size={22} color={COLORS.ink} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.ink, letterSpacing: -0.3 }}>Vidéos produits</Text>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>

        {/* Upload form */}
        <View style={{ margin: 16, backgroundColor: COLORS.white, borderRadius: 16, padding: 16, ...SHADOW.sm }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.ink, marginBottom: 14 }}>Ajouter une vidéo</Text>

          {error ? (
            <View style={{ backgroundColor: '#FEE2E2', borderRadius: 10, padding: 10, marginBottom: 12 }}>
              <Text style={{ color: '#B91C1C', fontSize: 13 }}>⚠️ {error}</Text>
            </View>
          ) : null}

          {/* Video picker */}
          <TouchableOpacity onPress={pickVideo}
            style={{ height: 100, borderRadius: 12, borderWidth: 2, borderColor: videoUri ? COLORS.primary : COLORS.hairline, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: videoUri ? COLORS.primarySoft : COLORS.paper, marginBottom: 12 }}>
            {videoUri ? (
              <View style={{ alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 28 }}>🎬</Text>
                <Text style={{ fontSize: 12, color: COLORS.primary, fontWeight: '600' }}>Vidéo sélectionnée ✓</Text>
                <Text style={{ fontSize: 10, color: COLORS.mute }}>Appuyer pour changer</Text>
              </View>
            ) : (
              <View style={{ alignItems: 'center', gap: 4 }}>
                <Icon name="video" size={28} color={COLORS.mute} />
                <Text style={{ fontSize: 13, color: COLORS.mute }}>Choisir une vidéo</Text>
                <Text style={{ fontSize: 11, color: COLORS.mute }}>MP4, MOV · max 50MB</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Thumbnail picker */}
          <TouchableOpacity onPress={pickThumbnail}
            style={{ height: 60, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.hairline, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, marginBottom: 12, backgroundColor: COLORS.paper }}>
            {thumbUri
              ? <Image source={{ uri: thumbUri }} style={{ width: 44, height: 44, borderRadius: 8 }} resizeMode="cover" />
              : <Icon name="image" size={20} color={COLORS.mute} />
            }
            <Text style={{ fontSize: 13, color: thumbUri ? COLORS.ink : COLORS.mute }}>
              {thumbUri ? 'Miniature sélectionnée ✓' : 'Ajouter une miniature (optionnel)'}
            </Text>
          </TouchableOpacity>

          {/* Caption */}
          <TextInput
            value={caption}
            onChangeText={setCaption}
            placeholder="Description courte (ex: Le vase que tout le monde veut)"
            placeholderTextColor={COLORS.mute}
            multiline
            numberOfLines={2}
            style={{ borderWidth: 1.5, borderColor: COLORS.hairline, borderRadius: 10, padding: 12, fontSize: 13, color: COLORS.ink, minHeight: 60, textAlignVertical: 'top', marginBottom: 12, backgroundColor: COLORS.paper }}
          />

          {/* Product selector */}
          <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.mute, marginBottom: 8 }}>Lier à un produit (optionnel)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 14 }}>
            <TouchableOpacity onPress={() => setProductId(null)}
              style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full, borderWidth: 1.5,
                borderColor: productId === null ? COLORS.primary : COLORS.hairline,
                backgroundColor: productId === null ? COLORS.primarySoft : COLORS.white }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: productId === null ? COLORS.primary : COLORS.mute }}>Aucun</Text>
            </TouchableOpacity>
            {products.map(p => (
              <TouchableOpacity key={p.id} onPress={() => setProductId(p.id)}
                style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full, borderWidth: 1.5,
                  borderColor: productId === p.id ? COLORS.primary : COLORS.hairline,
                  backgroundColor: productId === p.id ? COLORS.primarySoft : COLORS.white, maxWidth: 160 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: productId === p.id ? COLORS.primary : COLORS.mute }} numberOfLines={1}>{p.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity onPress={handleUpload} disabled={uploading}
            style={{ backgroundColor: COLORS.primary, borderRadius: 12, height: 48, alignItems: 'center', justifyContent: 'center', opacity: uploading ? 0.7 : 1 }}>
            {uploading
              ? <ActivityIndicator color="#fff" />
              : <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Publier la vidéo</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Published videos */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 32 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.ink, marginBottom: 12 }}>
            Mes vidéos ({videos.length})
          </Text>
          {videos.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Text style={{ fontSize: 36 }}>🎬</Text>
              <Text style={{ fontSize: 15, color: COLORS.mute, marginTop: 8 }}>Aucune vidéo publiée</Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {videos.map(v => (
                <View key={v.id} style={{ backgroundColor: COLORS.white, borderRadius: 14, overflow: 'hidden', flexDirection: 'row', ...SHADOW.sm }}>
                  {/* Thumbnail */}
                  <View style={{ width: 90, height: 90, backgroundColor: COLORS.primarySoft }}>
                    {v.thumbnail_url
                      ? <Image source={{ uri: v.thumbnail_url }} style={{ width: 90, height: 90 }} resizeMode="cover" />
                      : v.products?.images?.[0]
                        ? <Image source={{ uri: v.products.images[0] }} style={{ width: 90, height: 90 }} resizeMode="cover" />
                        : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 28 }}>🎬</Text></View>
                    }
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
                      <View style={{ backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: '#fff', fontSize: 12, marginLeft: 2 }}>▶</Text>
                      </View>
                    </View>
                  </View>
                  {/* Info */}
                  <View style={{ flex: 1, padding: 12 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.ink }} numberOfLines={2}>{v.caption}</Text>
                    {v.products && (
                      <Text style={{ fontSize: 11, color: COLORS.mute, marginTop: 4 }} numberOfLines={1}>🔗 {v.products.title}</Text>
                    )}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                      <Text style={{ fontSize: 11, color: COLORS.mute }}>👁 {v.views ?? 0} vues</Text>
                      <TouchableOpacity onPress={() => handleDelete(v.id)} style={{ padding: 4 }}>
                        <Icon name="trash2" size={16} color={COLORS.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
