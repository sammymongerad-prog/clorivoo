import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert, TextInput,
  Image, ActivityIndicator, Modal, Switch, Animated, Dimensions,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, RADIUS, SHADOW } from '../../lib/tokens';
import Icon from '../../components/Icon';
import { useSession } from '../../hooks/useSession';
import {
  supabase, getShopBySeller, createShop, updateShop,
  uploadImage, getProducts,
} from '../../lib/supabase';

const BRAND_COLORS = ['#6C4DFF', '#C97B5A', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#14B8A6'];
const TABS = ['Infos', 'Bannières', 'Catalogue', 'Texte défilant'];

const inputStyle = {
  borderWidth: 1,
  borderColor: COLORS.hairline,
  borderRadius: RADIUS.sm,
  paddingHorizontal: 14,
  paddingVertical: 12,
  fontSize: 15,
  color: COLORS.ink,
  backgroundColor: COLORS.white,
};

const sectionTitle = {
  fontSize: 16,
  fontWeight: '700',
  color: COLORS.ink,
  marginBottom: 10,
  marginTop: 4,
};

const label = {
  fontSize: 13,
  fontWeight: '600',
  color: COLORS.mute,
  marginBottom: 6,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
};

export default function ShopSetupScreen({ navigation }) {
  const session = useSession();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [brandColor, setBrandColor] = useState(BRAND_COLORS[0]);
  const [logoUri, setLogoUri] = useState(null);
  const [logoUrl, setLogoUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [banners, setBanners] = useState([null, null, null]);
  const [bannerModal, setBannerModal] = useState(false);
  const [editingBannerIdx, setEditingBannerIdx] = useState(null);
  const [bTitle, setBTitle] = useState('');
  const [bSubtitle, setBSubtitle] = useState('');
  const [bCtaText, setBCtaText] = useState('');
  const [bCtaUrl, setBCtaUrl] = useState('');
  const [bImageUri, setBImageUri] = useState(null);
  const [bImageUrl, setBImageUrl] = useState(null);
  const [bUploading, setBUploading] = useState(false);
  const [bSaving, setBSaving] = useState(false);

  const [allCategories, setAllCategories] = useState([]);
  const [featuredCategoryIds, setFeaturedCategoryIds] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [featuredProductIds, setFeaturedProductIds] = useState([]);
  const [catModalVisible, setCatModalVisible] = useState(false);
  const [prodModalVisible, setProdModalVisible] = useState(false);
  const [catalogueSaving, setCatalogueSaving] = useState(false);

  const [tickerText, setTickerText] = useState('');
  const [tickerActive, setTickerActive] = useState(false);
  const [tickerSaving, setTickerSaving] = useState(false);
  const tickerAnim = useRef(new Animated.Value(0)).current;
  const tickerLoopRef = useRef(null);
  const tickerContainerWidth = useRef(Dimensions.get('window').width - 48);
  const tickerTextWidth = useRef(300);

  const runTickerAnim = useCallback(() => {
    if (tickerLoopRef.current) {
      tickerLoopRef.current.stop();
      tickerLoopRef.current = null;
    }
    tickerAnim.setValue(tickerContainerWidth.current);
    const loop = Animated.loop(
      Animated.timing(tickerAnim, {
        toValue: -tickerTextWidth.current,
        duration: 8000,
        useNativeDriver: true,
      })
    );
    tickerLoopRef.current = loop;
    loop.start();
  }, [tickerAnim]);

  useFocusEffect(
    useCallback(() => {
      if (!session?.user) return;
      loadAll();
    }, [session])
  );

  async function loadAll() {
    setLoading(true);
    try {
      const s = await getShopBySeller(session.user.id);
      if (s) {
        setShop(s);
        setName(s.name ?? '');
        setDescription(s.description ?? '');
        setBrandColor(s.brand_color ?? BRAND_COLORS[0]);
        setLogoUrl(s.logo_url ?? null);
        setFeaturedCategoryIds(s.featured_category_ids ?? []);
        setFeaturedProductIds(s.featured_product_ids ?? []);
        setTickerText(s.ticker_text ?? '');
        setTickerActive(s.ticker_active ?? false);

        const { data: rawBanners } = await supabase
          .from('shop_banners')
          .select('*')
          .eq('shop_id', s.id)
          .order('position');

        const slots = [null, null, null];
        if (rawBanners) {
          rawBanners.forEach(b => {
            if (b.position >= 1 && b.position <= 3) slots[b.position - 1] = b;
          });
        }
        setBanners(slots);

        const { data: cats } = await supabase
          .from('categories')
          .select('id,name,icon,slug')
          .order('position');
        setAllCategories(cats ?? []);

        const { data: prods } = await getProducts({ seller_id: session.user.id, limit: 50 });
        setAllProducts(prods ?? []);
      }
    } catch {
    }
    setLoading(false);
  }

  async function pickLogo() {
    const ImagePicker = await import('expo-image-picker');
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission refusée'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled) return;
    setLogoUri(result.assets[0].uri);
    setUploading(true);
    try {
      const { url, error } = await uploadImage('shops', `${session.user.id}/logo.jpg`, result.assets[0].uri);
      if (error) Alert.alert('Erreur upload logo');
      else if (url) setLogoUrl(url);
    } catch {
      Alert.alert('Erreur upload logo');
    }
    setUploading(false);
  }

  async function saveInfo() {
    if (!name.trim()) { Alert.alert('Le nom est requis'); return; }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        brand_color: brandColor,
        logo_url: logoUrl,
      };
      if (shop) {
        const { data, error } = await updateShop(shop.id, payload);
        if (error) throw error;
        if (data) setShop(data);
      } else {
        const { data, error } = await createShop({ ...payload, seller_id: session.user.id });
        if (error) throw error;
        if (data) setShop(data);
      }
      Alert.alert('Sauvegardé !');
    } catch (e) {
      Alert.alert('Erreur lors de la sauvegarde', e?.message ?? '');
    }
    setSaving(false);
  }

  function openAddBanner(idx) {
    const existing = banners[idx];
    setEditingBannerIdx(idx);
    setBTitle(existing?.title ?? '');
    setBSubtitle(existing?.subtitle ?? '');
    setBCtaText(existing?.cta_text ?? '');
    setBCtaUrl(existing?.cta_url ?? '');
    setBImageUri(null);
    setBImageUrl(existing?.image_url ?? null);
    setBannerModal(true);
  }

  async function pickBannerImage() {
    const ImagePicker = await import('expo-image-picker');
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission refusée'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: true,
      aspect: [16, 7],
    });
    if (result.canceled) return;
    setBImageUri(result.assets[0].uri);
    setBUploading(true);
    try {
      const path = `${shop?.id ?? session.user.id}/banner_${editingBannerIdx + 1}_${Date.now()}.jpg`;
      const { url, error } = await uploadImage('shop-banners', path, result.assets[0].uri);
      if (error) Alert.alert('Erreur upload image');
      else if (url) setBImageUrl(url);
    } catch {
      Alert.alert('Erreur upload image');
    }
    setBUploading(false);
  }

  async function saveBanner() {
    if (!shop) { Alert.alert("Sauvegardez d'abord les infos de la boutique"); return; }
    setBSaving(true);
    try {
      const position = editingBannerIdx + 1;
      const existing = banners[editingBannerIdx];
      const payload = {
        shop_id: shop.id,
        position,
        title: bTitle,
        subtitle: bSubtitle,
        cta_text: bCtaText,
        cta_url: bCtaUrl,
        image_url: bImageUrl,
        is_active: true,
      };
      let data, error;
      if (existing?.id) {
        ({ data, error } = await supabase.from('shop_banners').update(payload).eq('id', existing.id).select().single());
      } else {
        ({ data, error } = await supabase.from('shop_banners').insert(payload).select().single());
      }
      if (error) { Alert.alert('Erreur sauvegarde bannière', error.message); setBSaving(false); return; }
      const updated = [...banners];
      updated[editingBannerIdx] = data;
      setBanners(updated);
      setBannerModal(false);
    } catch (e) {
      Alert.alert('Erreur sauvegarde bannière', e?.message ?? '');
    }
    setBSaving(false);
  }

  async function deleteBanner(idx) {
    const b = banners[idx];
    if (!b?.id) return;
    Alert.alert('Supprimer', 'Supprimer cette bannière ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await supabase.from('shop_banners').delete().eq('id', b.id);
            const updated = [...banners];
            updated[idx] = null;
            setBanners(updated);
          } catch {
            Alert.alert('Erreur suppression');
          }
        },
      },
    ]);
  }

  async function saveCatalogue() {
    if (!shop) return;
    setCatalogueSaving(true);
    try {
      const { error } = await supabase
        .from('shops')
        .update({ featured_category_ids: featuredCategoryIds, featured_product_ids: featuredProductIds })
        .eq('id', shop.id);
      if (error) throw error;
      Alert.alert('Sauvegardé !');
    } catch (e) {
      Alert.alert('Erreur sauvegarde catalogue', e?.message ?? '');
    }
    setCatalogueSaving(false);
  }

  async function saveTicker() {
    if (!shop) return;
    setTickerSaving(true);
    try {
      const { error } = await supabase
        .from('shops')
        .update({ ticker_text: tickerText, ticker_active: tickerActive })
        .eq('id', shop.id);
      if (error) throw error;
      Alert.alert('Sauvegardé !');
    } catch (e) {
      Alert.alert('Erreur sauvegarde ticker', e?.message ?? '');
    }
    setTickerSaving(false);
  }

  function toggleTickerActive(val) {
    setTickerActive(val);
    if (val && tickerText.trim()) runTickerAnim();
  }

  const featuredCategories = allCategories.filter(c => featuredCategoryIds.includes(c.id));
  const featuredProducts = allProducts.filter(p => featuredProductIds.includes(p.id));

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.paper, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.paper }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, marginRight: 4 }}>
          <Icon name="arrowLeft" size={22} color={COLORS.ink} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.ink }}>Ma boutique</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8, gap: 8, flexDirection: 'row' }}
      >
        {TABS.map((tab, i) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(i)}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: RADIUS.full,
              backgroundColor: activeTab === i ? COLORS.primary : COLORS.white,
              borderWidth: 1,
              borderColor: activeTab === i ? COLORS.primary : COLORS.hairline,
              ...SHADOW.sm,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: activeTab === i ? COLORS.white : COLORS.ink }}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={{ flex: 1 }}>
        {activeTab === 0 && (
          <TabInfos
            logoUri={logoUri}
            logoUrl={logoUrl}
            uploading={uploading}
            saving={saving}
            name={name}
            description={description}
            brandColor={brandColor}
            setName={setName}
            setDescription={setDescription}
            setBrandColor={setBrandColor}
            pickLogo={pickLogo}
            saveInfo={saveInfo}
          />
        )}
        {activeTab === 1 && (
          <TabBannieres
            banners={banners}
            openAddBanner={openAddBanner}
            deleteBanner={deleteBanner}
          />
        )}
        {activeTab === 2 && (
          <TabCatalogue
            featuredCategories={featuredCategories}
            featuredProducts={featuredProducts}
            featuredCategoryIds={featuredCategoryIds}
            featuredProductIds={featuredProductIds}
            setFeaturedCategoryIds={setFeaturedCategoryIds}
            setFeaturedProductIds={setFeaturedProductIds}
            allCategories={allCategories}
            allProducts={allProducts}
            catModalVisible={catModalVisible}
            setCatModalVisible={setCatModalVisible}
            prodModalVisible={prodModalVisible}
            setProdModalVisible={setProdModalVisible}
            saving={catalogueSaving}
            saveCatalogue={saveCatalogue}
          />
        )}
        {activeTab === 3 && (
          <TabTicker
            tickerText={tickerText}
            tickerActive={tickerActive}
            setTickerText={setTickerText}
            toggleTickerActive={toggleTickerActive}
            tickerAnim={tickerAnim}
            containerWidth={tickerContainerWidth}
            textWidth={tickerTextWidth}
            runTickerAnim={runTickerAnim}
            saving={tickerSaving}
            saveTicker={saveTicker}
          />
        )}
      </View>

      <Modal
        visible={bannerModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setBannerModal(false)}
      >
        <BannerModal
          idx={editingBannerIdx}
          bImageUri={bImageUri}
          bImageUrl={bImageUrl}
          bUploading={bUploading}
          bTitle={bTitle}
          setBTitle={setBTitle}
          bSubtitle={bSubtitle}
          setBSubtitle={setBSubtitle}
          bCtaText={bCtaText}
          setBCtaText={setBCtaText}
          bCtaUrl={bCtaUrl}
          setBCtaUrl={setBCtaUrl}
          bSaving={bSaving}
          pickBannerImage={pickBannerImage}
          saveBanner={saveBanner}
          onClose={() => setBannerModal(false)}
        />
      </Modal>
    </SafeAreaView>
  );
}

function TabInfos({ logoUri, logoUrl, uploading, saving, name, description, brandColor, setName, setDescription, setBrandColor, pickLogo, saveInfo }) {
  const displayLogo = logoUri || logoUrl;
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text style={sectionTitle}>Logo</Text>
        <TouchableOpacity
          onPress={pickLogo}
          style={{
            alignSelf: 'center',
            marginBottom: 24,
            width: 96,
            height: 96,
            borderRadius: 48,
            backgroundColor: COLORS.primarySoft,
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
            borderWidth: 2,
            borderColor: COLORS.primary,
          }}
        >
          {uploading
            ? <ActivityIndicator color={COLORS.primary} />
            : displayLogo
              ? <Image source={{ uri: displayLogo }} style={{ width: 96, height: 96, borderRadius: 48 }} />
              : <Icon name="camera" size={28} color={COLORS.primary} />}
        </TouchableOpacity>

        <Text style={label}>Nom de la boutique</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Ma boutique"
          placeholderTextColor={COLORS.mute}
          style={[inputStyle, { marginBottom: 16 }]}
        />

        <Text style={label}>Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Décrivez votre boutique…"
          placeholderTextColor={COLORS.mute}
          multiline
          numberOfLines={4}
          style={[inputStyle, { height: 100, textAlignVertical: 'top', marginBottom: 20 }]}
        />

        <Text style={label}>Couleur de marque</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
          {BRAND_COLORS.map(c => (
            <TouchableOpacity
              key={c}
              onPress={() => setBrandColor(c)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: c,
                borderWidth: brandColor === c ? 3 : 0,
                borderColor: COLORS.white,
                ...SHADOW.sm,
              }}
            >
              {brandColor === c && (
                <View style={{ position: 'absolute', inset: 0, borderRadius: 18, borderWidth: 2, borderColor: c }} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={sectionTitle}>Aperçu</Text>
        <View style={{ borderRadius: RADIUS.lg, backgroundColor: COLORS.white, overflow: 'hidden', ...SHADOW.md, marginBottom: 24 }}>
          <View style={{ height: 8, backgroundColor: brandColor }} />
          <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {(logoUri || logoUrl)
              ? <Image source={{ uri: logoUri || logoUrl }} style={{ width: 48, height: 48, borderRadius: 24 }} />
              : (
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: brandColor, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: COLORS.white, fontWeight: '700', fontSize: 18 }}>{name?.[0]?.toUpperCase() ?? '?'}</Text>
                </View>
              )}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.ink }}>{name || 'Nom boutique'}</Text>
              {!!description && <Text style={{ fontSize: 13, color: COLORS.mute }} numberOfLines={2}>{description}</Text>}
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={saveInfo}
          disabled={saving}
          style={{ backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 14, alignItems: 'center' }}
        >
          {saving
            ? <ActivityIndicator color={COLORS.white} />
            : <Text style={{ color: COLORS.white, fontWeight: '700', fontSize: 15 }}>Sauvegarder</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function TabBannieres({ banners, openAddBanner, deleteBanner }) {
  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 16 }}>
      {banners.map((banner, idx) => (
        <View key={idx} style={{ borderRadius: RADIUS.lg, backgroundColor: COLORS.white, ...SHADOW.sm, overflow: 'hidden' }}>
          {banner ? (
            <>
              {banner.image_url
                ? <Image source={{ uri: banner.image_url }} style={{ width: '100%', height: 140 }} resizeMode="cover" />
                : (
                  <View style={{ width: '100%', height: 140, backgroundColor: COLORS.primarySoft, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: COLORS.mute, fontSize: 13 }}>Pas d'image</Text>
                  </View>
                )}
              <View style={{ padding: 12, gap: 6 }}>
                <Text style={{ fontWeight: '700', color: COLORS.ink, fontSize: 15 }}>{banner.title || '(Sans titre)'}</Text>
                {!!banner.subtitle && <Text style={{ color: COLORS.mute, fontSize: 13 }}>{banner.subtitle}</Text>}
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                  <TouchableOpacity
                    onPress={() => openAddBanner(idx)}
                    style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.sm, backgroundColor: COLORS.primarySoft }}
                  >
                    <Text style={{ color: COLORS.primary, fontWeight: '600', fontSize: 13 }}>Modifier</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => deleteBanner(idx)}
                    style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.sm, backgroundColor: '#FFF0F0' }}
                  >
                    <Text style={{ color: COLORS.danger, fontWeight: '600', fontSize: 13 }}>Supprimer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          ) : (
            <TouchableOpacity
              onPress={() => openAddBanner(idx)}
              style={{
                height: 140,
                borderWidth: 2,
                borderColor: COLORS.hairline,
                borderStyle: 'dashed',
                borderRadius: RADIUS.lg,
                justifyContent: 'center',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Text style={{ fontSize: 28, color: COLORS.mute }}>+</Text>
              <Text style={{ color: COLORS.mute, fontSize: 14 }}>Ajouter bannière niveau {idx + 1}</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

function BannerModal({ idx, bImageUri, bImageUrl, bUploading, bTitle, setBTitle, bSubtitle, setBSubtitle, bCtaText, setBCtaText, bCtaUrl, setBCtaUrl, bSaving, pickBannerImage, saveBanner, onClose }) {
  const displayImg = bImageUri || bImageUrl;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.paper }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.hairline }}>
          <TouchableOpacity onPress={onClose} style={{ padding: 4, marginRight: 8 }}>
            <Icon name="arrowLeft" size={22} color={COLORS.ink} />
          </TouchableOpacity>
          <Text style={{ fontSize: 17, fontWeight: '700', color: COLORS.ink }}>
            Bannière niveau {idx != null ? idx + 1 : ''}
          </Text>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 40 }}>
          <TouchableOpacity
            onPress={pickBannerImage}
            style={{
              width: '100%',
              height: 140,
              borderRadius: RADIUS.md,
              overflow: 'hidden',
              backgroundColor: COLORS.primarySoft,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: displayImg ? 0 : 2,
              borderColor: COLORS.hairline,
              borderStyle: 'dashed',
            }}
          >
            {bUploading
              ? <ActivityIndicator color={COLORS.primary} />
              : displayImg
                ? <Image source={{ uri: displayImg }} style={{ width: '100%', height: 140 }} resizeMode="cover" />
                : (
                  <>
                    <Icon name="image" size={30} color={COLORS.mute} />
                    <Text style={{ color: COLORS.mute, fontSize: 13, marginTop: 6 }}>Choisir une image</Text>
                  </>
                )}
          </TouchableOpacity>

          <Text style={label}>Titre</Text>
          <TextInput
            value={bTitle}
            onChangeText={setBTitle}
            placeholder="Titre bannière"
            placeholderTextColor={COLORS.mute}
            style={inputStyle}
          />

          <Text style={label}>Sous-titre</Text>
          <TextInput
            value={bSubtitle}
            onChangeText={setBSubtitle}
            placeholder="Sous-titre"
            placeholderTextColor={COLORS.mute}
            style={inputStyle}
          />

          <Text style={label}>Texte bouton (CTA)</Text>
          <TextInput
            value={bCtaText}
            onChangeText={setBCtaText}
            placeholder="Ex : Voir les offres"
            placeholderTextColor={COLORS.mute}
            style={inputStyle}
          />

          <Text style={label}>Lien (URL)</Text>
          <TextInput
            value={bCtaUrl}
            onChangeText={setBCtaUrl}
            placeholder="https://..."
            placeholderTextColor={COLORS.mute}
            autoCapitalize="none"
            style={inputStyle}
          />

          <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
            <TouchableOpacity
              onPress={onClose}
              style={{ flex: 1, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.hairline, paddingVertical: 13, alignItems: 'center' }}
            >
              <Text style={{ color: COLORS.ink, fontWeight: '600', fontSize: 15 }}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={saveBanner}
              disabled={bSaving}
              style={{ flex: 1, borderRadius: RADIUS.md, backgroundColor: COLORS.primary, paddingVertical: 13, alignItems: 'center' }}
            >
              {bSaving
                ? <ActivityIndicator color={COLORS.white} />
                : <Text style={{ color: COLORS.white, fontWeight: '700', fontSize: 15 }}>Sauvegarder</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function TabCatalogue({ featuredCategories, featuredProducts, featuredCategoryIds, featuredProductIds, setFeaturedCategoryIds, setFeaturedProductIds, allCategories, allProducts, catModalVisible, setCatModalVisible, prodModalVisible, setProdModalVisible, saving, saveCatalogue }) {
  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <Text style={sectionTitle}>Catégories en vedette</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        {featuredCategories.map(cat => (
          <View
            key={cat.id}
            style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full, backgroundColor: COLORS.primarySoft, gap: 6 }}
          >
            {!!cat.icon && <Text>{cat.icon}</Text>}
            <Text style={{ color: COLORS.primary, fontWeight: '600', fontSize: 14 }}>{cat.name}</Text>
            <TouchableOpacity onPress={() => setFeaturedCategoryIds(ids => ids.filter(id => id !== cat.id))}>
              <Text style={{ color: COLORS.primary, fontWeight: '700', fontSize: 16, marginLeft: 2 }}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
      {featuredCategoryIds.length < 6 && (
        <TouchableOpacity
          onPress={() => setCatModalVisible(true)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 14, borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: RADIUS.md, alignSelf: 'flex-start', marginBottom: 24 }}
        >
          <Text style={{ color: COLORS.primary, fontWeight: '700', fontSize: 18 }}>+</Text>
          <Text style={{ color: COLORS.primary, fontWeight: '600', fontSize: 14 }}>Ajouter une catégorie</Text>
        </TouchableOpacity>
      )}

      <Text style={sectionTitle}>Produits en vedette</Text>
      <View style={{ gap: 8, marginBottom: 12 }}>
        {featuredProducts.map(prod => (
          <View
            key={prod.id}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: 10, ...SHADOW.sm }}
          >
            {prod.image_url
              ? <Image source={{ uri: prod.image_url }} style={{ width: 48, height: 48, borderRadius: RADIUS.sm }} />
              : <View style={{ width: 48, height: 48, borderRadius: RADIUS.sm, backgroundColor: COLORS.primarySoft }} />}
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '600', color: COLORS.ink, fontSize: 14 }} numberOfLines={1}>{prod.name}</Text>
              <Text style={{ color: COLORS.mute, fontSize: 13 }}>{prod.price ? `${prod.price} FCFA` : ''}</Text>
            </View>
            <TouchableOpacity onPress={() => setFeaturedProductIds(ids => ids.filter(id => id !== prod.id))}>
              <Text style={{ color: COLORS.danger, fontWeight: '700', fontSize: 18 }}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
      {featuredProductIds.length < 8 && (
        <TouchableOpacity
          onPress={() => setProdModalVisible(true)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 14, borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: RADIUS.md, alignSelf: 'flex-start', marginBottom: 24 }}
        >
          <Text style={{ color: COLORS.primary, fontWeight: '700', fontSize: 18 }}>+</Text>
          <Text style={{ color: COLORS.primary, fontWeight: '600', fontSize: 14 }}>Ajouter un produit</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        onPress={saveCatalogue}
        disabled={saving}
        style={{ backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 14, alignItems: 'center' }}
      >
        {saving
          ? <ActivityIndicator color={COLORS.white} />
          : <Text style={{ color: COLORS.white, fontWeight: '700', fontSize: 15 }}>Sauvegarder le catalogue</Text>}
      </TouchableOpacity>

      <Modal visible={catModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setCatModalVisible(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.paper }} edges={['top', 'bottom']}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.hairline }}>
            <Text style={{ flex: 1, fontSize: 17, fontWeight: '700', color: COLORS.ink }}>Catégories</Text>
            <TouchableOpacity onPress={() => setCatModalVisible(false)}>
              <Text style={{ color: COLORS.primary, fontWeight: '600', fontSize: 15 }}>Fermer</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 4 }}>
            {allCategories.map(cat => {
              const selected = featuredCategoryIds.includes(cat.id);
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => {
                    if (selected) {
                      setFeaturedCategoryIds(ids => ids.filter(id => id !== cat.id));
                    } else if (featuredCategoryIds.length < 6) {
                      setFeaturedCategoryIds(ids => [...ids, cat.id]);
                    }
                  }}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: COLORS.hairline }}
                >
                  <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: selected ? COLORS.primary : COLORS.hairline, backgroundColor: selected ? COLORS.primary : COLORS.white, justifyContent: 'center', alignItems: 'center' }}>
                    {selected && <Text style={{ color: COLORS.white, fontSize: 13, fontWeight: '700' }}>✓</Text>}
                  </View>
                  {!!cat.icon && <Text style={{ fontSize: 18 }}>{cat.icon}</Text>}
                  <Text style={{ flex: 1, fontSize: 15, color: COLORS.ink }}>{cat.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal visible={prodModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setProdModalVisible(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.paper }} edges={['top', 'bottom']}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.hairline }}>
            <Text style={{ flex: 1, fontSize: 17, fontWeight: '700', color: COLORS.ink }}>Produits</Text>
            <TouchableOpacity onPress={() => setProdModalVisible(false)}>
              <Text style={{ color: COLORS.primary, fontWeight: '600', fontSize: 15 }}>Fermer</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 4 }}>
            {allProducts.map(prod => {
              const selected = featuredProductIds.includes(prod.id);
              return (
                <TouchableOpacity
                  key={prod.id}
                  onPress={() => {
                    if (selected) {
                      setFeaturedProductIds(ids => ids.filter(id => id !== prod.id));
                    } else if (featuredProductIds.length < 8) {
                      setFeaturedProductIds(ids => [...ids, prod.id]);
                    }
                  }}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.hairline }}
                >
                  <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: selected ? COLORS.primary : COLORS.hairline, backgroundColor: selected ? COLORS.primary : COLORS.white, justifyContent: 'center', alignItems: 'center' }}>
                    {selected && <Text style={{ color: COLORS.white, fontSize: 13, fontWeight: '700' }}>✓</Text>}
                  </View>
                  {prod.image_url
                    ? <Image source={{ uri: prod.image_url }} style={{ width: 40, height: 40, borderRadius: RADIUS.sm }} />
                    : <View style={{ width: 40, height: 40, borderRadius: RADIUS.sm, backgroundColor: COLORS.primarySoft }} />}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, color: COLORS.ink, fontWeight: '600' }} numberOfLines={1}>{prod.name}</Text>
                    <Text style={{ fontSize: 13, color: COLORS.mute }}>{prod.price ? `${prod.price} FCFA` : ''}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </ScrollView>
  );
}

function TabTicker({ tickerText, tickerActive, setTickerText, toggleTickerActive, tickerAnim, containerWidth, textWidth, runTickerAnim, saving, saveTicker }) {
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text style={sectionTitle}>Texte défilant</Text>

        <Text style={label}>Message</Text>
        <TextInput
          value={tickerText}
          onChangeText={setTickerText}
          placeholder="🔥 Soldes d'été — Jusqu'à 50% de réduction !"
          placeholderTextColor={COLORS.mute}
          style={[inputStyle, { marginBottom: 20 }]}
        />

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: 14, ...SHADOW.sm }}>
          <Text style={{ fontSize: 15, color: COLORS.ink, fontWeight: '600' }}>Activer le texte défilant</Text>
          <Switch
            value={tickerActive}
            onValueChange={toggleTickerActive}
            trackColor={{ false: COLORS.hairline, true: COLORS.primary }}
            thumbColor={COLORS.white}
          />
        </View>

        <Text style={sectionTitle}>Aperçu</Text>
        <View
          onLayout={e => { containerWidth.current = e.nativeEvent.layout.width; }}
          style={{ backgroundColor: COLORS.ink, borderRadius: RADIUS.md, height: 40, overflow: 'hidden', justifyContent: 'center', marginBottom: 16 }}
        >
          {tickerText.trim()
            ? (
              <Animated.Text
                onLayout={e => { textWidth.current = e.nativeEvent.layout.width; }}
                style={{ color: COLORS.white, fontSize: 14, fontWeight: '500', transform: [{ translateX: tickerAnim }] }}
                numberOfLines={1}
              >
                {tickerText}
              </Animated.Text>
            )
            : <Text style={{ color: COLORS.mute, fontSize: 13, textAlign: 'center' }}>Aucun texte</Text>}
        </View>
        {!!tickerText.trim() && (
          <TouchableOpacity
            onPress={runTickerAnim}
            style={{ alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.primary, marginBottom: 28 }}
          >
            <Text style={{ color: COLORS.primary, fontSize: 13, fontWeight: '600' }}>Lancer l'aperçu</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={saveTicker}
          disabled={saving}
          style={{ backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 14, alignItems: 'center' }}
        >
          {saving
            ? <ActivityIndicator color={COLORS.white} />
            : <Text style={{ color: COLORS.white, fontWeight: '700', fontSize: 15 }}>Sauvegarder</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
