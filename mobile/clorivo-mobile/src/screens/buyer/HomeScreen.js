import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  TextInput, RefreshControl, Modal, Platform, ActivityIndicator,
  FlatList, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, RADIUS, SHADOW } from '../../lib/tokens';
import { ProductCard, SectionHeader, Avatar, Badge } from '../../components/UI';
import Icon from '../../components/Icon';
import {
  getProducts, getShops, getBanners,
  getCart, getConversations, getProfile, getProductVideos,
  updateProfile,
} from '../../lib/supabase';
import { useSession } from '../../hooks/useSession';
import { useNotifications } from '../../hooks/useNotifications';

// ── Live countdown ─────────────────────────────────────────────────
function useCountdown(seconds) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    const t = setInterval(() => setLeft(s => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);
  const h = String(Math.floor(left / 3600)).padStart(2, '0');
  const m = String(Math.floor((left % 3600) / 60)).padStart(2, '0');
  const s = String(left % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

const { width: SCREEN_W } = Dimensions.get('window');
const BANNER_W = SCREEN_W - 32;

const LOCAL_BANNERS = [
  { id: '1', source: require('../../../assets/banners/MEN.png') },
  { id: '2', source: require('../../../assets/banners/MODE_FEMME.png') },
  { id: '3', source: require('../../../assets/banners/toys_kid.jpeg') },
];

function HeroBannerCarousel() {
  const [active, setActive] = useState(0);
  const flatRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive(prev => {
        const next = (prev + 1) % LOCAL_BANNERS.length;
        flatRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <View>
      <FlatList
        ref={flatRef}
        data={LOCAL_BANNERS}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={b => b.id}
        onMomentumScrollEnd={e => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / BANNER_W);
          setActive(idx);
        }}
        getItemLayout={(_, i) => ({ length: BANNER_W, offset: BANNER_W * i, index: i })}
        renderItem={({ item }) => (
          <Image
            source={item.source}
            style={{ width: BANNER_W, height: 180, borderRadius: RADIUS.lg }}
            resizeMode="cover"
          />
        )}
      />
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 }}>
        {LOCAL_BANNERS.map((_, i) => (
          <View key={i} style={{ width: i === active ? 20 : 6, height: 6, borderRadius: 3, backgroundColor: i === active ? COLORS.primary : COLORS.hairline }} />
        ))}
      </View>
    </View>
  );
}

// ── Static shortcuts (navigation buttons, not data) ────────────────
const SHORTCUTS = [
  { type: 'combo',   label: 'Offres',     route: 'Categories' },
  { type: 'img',     label: 'Parrainage', route: null,         img: require('../../../assets/icons/parrainage.jpg') },
  { type: 'special', label: 'Flash Live', route: 'Categories' },
  { emoji: '⭐',    label: 'Coupons',    route: null },
  { type: 'img',     label: 'Boutiques',  route: null,         img: require('../../../assets/icons/boutique.jpg') },
  { type: 'img',     label: 'Suivi',      route: 'Orders',     img: require('../../../assets/icons/suivit.jpg') },
  { emoji: '💳',    label: 'Paiements',  badge: 'NOUVEAU',    badgeBg: '#2563EB', route: null },
];

function ComboOfferIcon() {
  return (
    <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: '#3D2080', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', shadowColor: '#4B2E9B', shadowOpacity: 0.35, shadowRadius: 6, elevation: 4 }}>
      <View style={{ position: 'absolute', top: 4, left: 7, width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#F59E0B', opacity: 0.9 }} />
      <View style={{ position: 'absolute', top: 6, right: 7, width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#FBBF24' }} />
      <View style={{ position: 'absolute', bottom: 5, left: 5, width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#F59E0B' }} />
      <View style={{ position: 'absolute', bottom: 6, right: 6, width: 4, height: 4, borderRadius: 2, backgroundColor: '#FBBF24', opacity: 0.7 }} />
      <View style={{ backgroundColor: '#F59E0B', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1.5, marginBottom: 1.5 }}>
        <Text style={{ fontSize: 8, fontWeight: '900', color: '#3D2080', letterSpacing: 0.5 }}>SUPER</Text>
      </View>
      <View style={{ backgroundColor: '#fff', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1.5, marginBottom: 1.5 }}>
        <Text style={{ fontSize: 9, fontWeight: '900', color: '#3D2080', letterSpacing: 0.5 }}>COMBO</Text>
      </View>
      <View style={{ backgroundColor: '#F59E0B', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}>
        <Text style={{ fontSize: 7, fontWeight: '900', color: '#3D2080', letterSpacing: 0.5 }}>OFFRE</Text>
      </View>
    </View>
  );
}

function SpecialOfferIcon() {
  return (
    <View style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute', width: 42, height: 30, backgroundColor: '#F59E0B', borderRadius: 6, transform: [{ rotate: '-5deg' }], top: 9 }} />
      <View style={{ position: 'absolute', width: 42, height: 30, backgroundColor: '#EF4444', borderRadius: 6, transform: [{ rotate: '4deg' }], top: 7 }} />
      <View style={{ width: 44, height: 32, backgroundColor: '#111827', borderRadius: 7, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 }}>
        <Text style={{ fontSize: 7.5, fontWeight: '900', color: '#fff', letterSpacing: 0.8 }}>SPECIAL</Text>
        <Text style={{ fontSize: 9, fontWeight: '900', color: '#F59E0B', letterSpacing: 0.8 }}>OFFRE</Text>
      </View>
      <View style={{ position: 'absolute', bottom: 4, right: 3, width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#EF4444' }} />
      <View style={{ position: 'absolute', top: 3, right: 5, width: 4, height: 4, borderRadius: 2, backgroundColor: '#F59E0B' }} />
    </View>
  );
}


const CHIP_CATS = [
  { label: 'Tout',    slug: null },
  { label: 'Maison',  slug: 'maison' },
  { label: 'Tech',    slug: 'tech' },
  { label: 'Beauté',  slug: 'beaute' },
  { label: 'Mode',    slug: 'mode' },
  { label: 'Enfants', slug: 'enfants' },
];

// ── Category tile emoji fallbacks ──────────────────────────────────
const CAT_EMOJI = { maison: '🏠', mode: '👗', tech: '📱', beaute: '💄', enfants: '🧸', sport: '⚽', jardin: '🌿' };
const CAT_COLOR = { maison: '#C97B5A', mode: '#9B59B6', tech: '#4A6FD4', beaute: '#E67E22', enfants: '#F59E0B', sport: '#10B981', jardin: '#27AE60' };

// ── Promo banner emoji ─────────────────────────────────────────────
const BANNER_EMOJI = ['🏺', '☕', '💡', '🕯️', '👜', '🧴'];

const CATEGORIES_TILES = [
  { label: 'Maison & Déco',  sub: '1 200+ articles', slug: 'maison',  emoji: '🏠', color: '#C97B5A' },
  { label: 'Mode & Style',   sub: '3 400+ articles', slug: 'mode',    emoji: '👗', color: '#9B59B6' },
  { label: 'Tech & Gadgets', sub: '890 articles',    slug: 'tech',    emoji: '📱', color: '#4A6FD4' },
  { label: 'Beauté & Soin',  sub: '560 articles',    slug: 'beaute',  emoji: '💄', color: '#E67E22' },
];

export default function HomeScreen({ navigation }) {
  const session = useSession();

  const [products, setProducts]     = useState([]);
  const [shops, setShops]           = useState([]);
  const [banners, setBanners]       = useState([]);
  const [videos, setVideos]         = useState([]);
  const [cartCount, setCartCount]   = useState(0);
  const [unreadMsgs, setUnreadMsgs] = useState(0);
  const [loaded, setLoaded]         = useState(false);
  const { unreadCount: unreadNotifs } = useNotifications();
  const [address, setAddress]       = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]         = useState('');
  const [activeChip, setActiveChip] = useState(0);
  const [addrModal, setAddrModal]   = useState(false);
  const [addrInput, setAddrInput]   = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [imgSearch, setImgSearch]   = useState(null); // uri de l'image cherchée
  const [imgLoading, setImgLoading] = useState(false);

  const heroBannerCountdown  = useCountdown(7 * 3600 + 14 * 60 + 8);
  const flashDealsCountdown  = useCountdown(1 * 3600 + 42 * 60);

  const userName     = session?.user?.user_metadata?.full_name?.split(' ')[0] ?? 'vous';
  const userInitials = session?.user?.user_metadata?.full_name
    ?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? 'AM';

  async function load() {
    try {
      const userId = session?.user?.id;

      const [{ data: prods }, sh, bnrs, vids] = await Promise.all([
        getProducts({ limit: 16 }),
        getShops(10),
        getBanners(),
        getProductVideos(8).catch(() => []),
      ]);

      if (prods?.length)  setProducts(prods);
      if (sh?.length)     setShops(sh.filter(s => s?.name));
      if (bnrs?.length)   setBanners(bnrs);
      if (vids?.length)   setVideos(vids);

      if (userId) {
        const [cartItems, convs, profile] = await Promise.all([
          getCart(userId).catch(() => []),
          getConversations(userId).catch(() => []),
          getProfile(userId).catch(() => null),
        ]);
        setCartCount(cartItems?.length ?? 0);
        setUnreadMsgs(convs?.filter(c => c.last_message_at)?.length ?? 0);
        if (profile?.address) {
          const addr = profile.address;
          setAddress(typeof addr === 'string' ? addr : (addr?.city ?? addr?.street ?? null));
        }
      }
    } catch (e) {
      console.warn('HomeScreen load error:', e);
    } finally {
      setLoaded(true);
    }
  }

  useEffect(() => { load(); }, [session?.user?.id]);

  // Reload banners every time screen comes into focus (picks up admin changes instantly)
  useFocusEffect(useCallback(() => {
    getBanners().then(bnrs => { if (bnrs?.length) setBanners(bnrs); });
  }, []));

  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false); }

  async function detectLocation() {
    setGpsLoading(true);
    try {
      if (Platform.OS === 'web') {
        // Web : API navigateur standard
        navigator.geolocation.getCurrentPosition(async pos => {
          try {
            const { latitude, longitude } = pos.coords;
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
            const data = await res.json();
            const addr = data.display_name?.split(',').slice(0, 3).join(',').trim() ?? '';
            if (addr) setAddrInput(addr);
          } catch {}
          setGpsLoading(false);
        }, () => setGpsLoading(false));
        return;
      }
      const Location = await import('expo-location');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setGpsLoading(false); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [place] = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      if (place) {
        const addr = [place.streetNumber, place.street, place.city].filter(Boolean).join(' ');
        setAddrInput(addr);
      }
    } catch {}
    setGpsLoading(false);
  }

  async function handleImageSearch() {
    setImgLoading(true);
    try {
      const ImagePicker = await import('expo-image-picker');
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { setImgLoading(false); return; }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.6,
        allowsEditing: false,
      });
      if (result.canceled || !result.assets?.[0]) { setImgLoading(false); return; }
      const uri = result.assets[0].uri;
      setImgSearch(uri);
      // Analyse côté web : extraire couleur dominante via canvas
      if (Platform.OS === 'web') {
        const category = await analyzeImageWeb(uri);
        setSearch(category);
      } else {
        // Sur mobile : utiliser le nom de fichier ou simplement afficher l'image
        setSearch('');
      }
    } catch (e) { console.warn(e); }
    setImgLoading(false);
  }

  async function analyzeImageWeb(uri) {
    return new Promise(resolve => {
      const img = new window.Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 50; canvas.height = 50;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, 50, 50);
        const d = ctx.getImageData(0, 0, 50, 50).data;
        let r = 0, g = 0, b = 0, n = d.length / 4;
        for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i+1]; b += d[i+2]; }
        r = Math.round(r / n); g = Math.round(g / n); b = Math.round(b / n);
        // Map couleur dominante → catégorie produit
        const h = rgbToHue(r, g, b);
        if (r > 180 && g < 100 && b < 100) resolve('rouge');
        else if (g > r && g > b) resolve('maison');
        else if (b > r && b > g) resolve('tech');
        else if (r > 180 && g > 100 && b < 80) resolve('mode');
        else if (r > 200 && g > 150 && b > 100) resolve('beaute');
        else resolve('');
      };
      img.onerror = () => resolve('');
      img.src = uri;
    });
  }

  function rgbToHue(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    if (max === min) return 0;
    let h = max === r ? (g - b) / (max - min) : max === g ? 2 + (b - r) / (max - min) : 4 + (r - g) / (max - min);
    return ((h * 60) + 360) % 360;
  }

  async function saveAddress() {
    const trimmed = addrInput.trim();
    if (!trimmed) return;
    setAddress(trimmed);
    setAddrModal(false);
    if (session?.user?.id) {
      updateProfile(session.user.id, { address: trimmed }).catch(() => {});
    }
  }

  const filtered = search
    ? products.filter(p => p.title?.toLowerCase().includes(search.toLowerCase()))
    : products;

  // Flash deals = produits avec compare_price (remise réelle)
  const flashProducts = filtered.filter(p => p.compare_price && p.compare_price > p.price).slice(0, 2);
  const superProducts = filtered.filter(p => p.compare_price && p.compare_price > p.price).slice(2, 4);
  const featuredProds = filtered.slice(0, 8);
  const forYouProds   = filtered.slice(4, 10);

  function discountPct(p) {
    if (!p.compare_price || p.compare_price <= p.price) return null;
    return Math.round(100 - (p.price / p.compare_price) * 100);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.paper }} edges={['top']}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* ── HEADER ────────────────────────────── */}
        <View style={{ backgroundColor: COLORS.white, paddingHorizontal: 20, paddingTop: 12, borderBottomWidth: 1, borderBottomColor: COLORS.hairline }}>

          {/* Top row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Avatar size={42} initials={userInitials} />
              <View>
                <Text style={{ fontSize: 12, color: COLORS.mute }}>Bonjour 👋</Text>
                <Text style={{ fontSize: 17, fontWeight: '800', color: COLORS.ink, letterSpacing: -0.5 }}>{userName}</Text>
              </View>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', gap: 2 }}>
              <TouchableOpacity onPress={() => navigation.navigate('Cart')}
                style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="shoppingBag" size={22} color={COLORS.ink} />
                {cartCount > 0 && <Badge count={cartCount} />}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Messages')}
                style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="messageSquare" size={22} color={COLORS.ink} />
                {unreadMsgs > 0 && <Badge count={unreadMsgs} />}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Notifications')}
                style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="bell" size={22} color={COLORS.ink} />
                {unreadNotifs > 0 && <Badge count={unreadNotifs} />}
              </TouchableOpacity>
            </View>
          </View>

          {/* Address strip — ouvre modal */}
          <TouchableOpacity onPress={() => { setAddrInput(address ?? ''); setAddrModal(true); }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.primarySoft, borderRadius: 10, padding: 8, marginBottom: 10 }}>
            <Icon name="mapPin" size={15} color={COLORS.primary} />
            <Text style={{ flex: 1, fontSize: 11, color: COLORS.mute }}>
              Livrer à ·{' '}
              <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.primaryDeep }}>
                {address ?? 'Ajouter une adresse'}
              </Text>
            </Text>
            <Icon name="chevronRight" size={14} color={COLORS.primary} />
          </TouchableOpacity>

          {/* Search */}
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.paper, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: imgSearch ? COLORS.primary : COLORS.hairline, paddingHorizontal: 14, height: 44, marginBottom: 10, gap: 8 }}>
            <Icon name="search" size={18} color={COLORS.mute} />
            {imgSearch ? (
              <TouchableOpacity onPress={() => { setImgSearch(null); setSearch(''); }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                <Image source={{ uri: imgSearch }} style={{ width: 28, height: 28, borderRadius: 6 }} />
                <Text style={{ fontSize: 13, color: COLORS.primary, fontWeight: '600', flex: 1 }} numberOfLines={1}>
                  Recherche par image · {search || 'tous'}
                </Text>
                <Icon name="x" size={14} color={COLORS.mute} />
              </TouchableOpacity>
            ) : (
              <TextInput
                value={search} onChangeText={setSearch}
                placeholder="Rechercher sur Clorivo…"
                placeholderTextColor={COLORS.mute}
                style={{ flex: 1, fontSize: 14, color: COLORS.ink }}
              />
            )}
            <View style={{ width: 1, height: 16, backgroundColor: COLORS.hairline }} />
            <TouchableOpacity onPress={handleImageSearch} disabled={imgLoading}
              style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
              {imgLoading
                ? <ActivityIndicator size="small" color={COLORS.primary} />
                : <Icon name="camera" size={18} color={imgSearch ? COLORS.primary : COLORS.mute} />
              }
            </TouchableOpacity>
          </View>

          {/* Category chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 12 }}>
            {CHIP_CATS.map((c, i) => (
              <TouchableOpacity key={i} onPress={() => {
                setActiveChip(i);
                if (i > 0) navigation.navigate('Categories', { categorySlug: c.slug });
              }}
                style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: RADIUS.full,
                  backgroundColor: activeChip === i ? COLORS.primary : COLORS.paper,
                  borderWidth: 1.5, borderColor: activeChip === i ? COLORS.primary : COLORS.hairline }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: activeChip === i ? '#fff' : COLORS.ink }}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── HERO BANNER ───────────────────────── */}
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <HeroBannerCarousel />
        </View>

        {/* ── CLORI+ + SHORTCUTS ────────────────── */}
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.primarySoft, borderRadius: 12, padding: 10, marginBottom: 16 }}>
            <View style={{ backgroundColor: COLORS.primary, borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#fff' }}>clori+</Text>
            </View>
            <Text style={{ flex: 1, fontSize: 13, fontWeight: '500', color: COLORS.primaryDeep }} numberOfLines={1}>
              Essayez 1 mois : livraison express offerte
            </Text>
            <Text style={{ fontSize: 16, color: COLORS.primaryDeep }}>›</Text>
          </TouchableOpacity>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 20, paddingBottom: 4 }}>
            {SHORTCUTS.map((s, i) => (
              <TouchableOpacity key={i} onPress={() => s.route && navigation.navigate(s.route)}
                style={{ alignItems: 'center', gap: 6, width: 56 }}>
                <View style={{ height: 48, alignItems: 'center', justifyContent: 'center' }}>
                  {s.type === 'combo'   ? <ComboOfferIcon /> :
                   s.type === 'special' ? <SpecialOfferIcon /> :
                   s.type === 'img'     ? <Image source={s.img} style={{ width: 48, height: 48, resizeMode: 'contain' }} /> : (
                    <View style={{ position: 'relative' }}>
                      <Text style={{ fontSize: 30 }}>{s.emoji}</Text>
                      {s.badge && (
                        <View style={{ position: 'absolute', bottom: -4, right: -4, backgroundColor: s.badgeBg, borderRadius: 9999, paddingHorizontal: 5, paddingVertical: 1 }}>
                          <Text style={{ fontSize: 7, fontWeight: '800', color: '#fff' }}>{s.badge}</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
                <Text style={{ fontSize: 11, fontWeight: '500', color: COLORS.ink, textAlign: 'center', lineHeight: 14 }}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── BOUTIQUES POPULAIRES ──────────────── */}
        {shops.length > 0 && (
          <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
            <SectionHeader title="Boutiques populaires" onSeeAll={() => {}} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 4 }}>
              {shops.map((shop, i) => (
                <TouchableOpacity key={shop.id ?? i} onPress={() => navigation.navigate('Shop', { shopId: shop.id })} style={{ alignItems: 'center', gap: 6, width: 60 }}>
                  <View style={{ position: 'relative' }}>
                    <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: shop.brand_color ?? COLORS.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.hairline }}>
                      {shop.logo_url
                        ? <Image source={{ uri: shop.logo_url }} style={{ width: 50, height: 50, borderRadius: 25 }} />
                        : <Text style={{ fontWeight: '800', fontSize: 22, color: '#fff' }}>{(shop.name?.[0] ?? '?').toUpperCase()}</Text>
                      }
                    </View>
                    {shop.is_verified && (
                      <View style={{ position: 'absolute', bottom: 1, right: 1, width: 17, height: 17, borderRadius: 9, backgroundColor: COLORS.primary, borderWidth: 2, borderColor: COLORS.white, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: '#fff', fontSize: 9, fontWeight: '900' }}>✓</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontSize: 11, fontWeight: '500', color: COLORS.ink, textAlign: 'center' }} numberOfLines={1}>{shop.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── VENTES FLASH + SUPER DEALS ────────── */}
        {flashProducts.length > 0 && (
          <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
            <View style={{ flexDirection: 'row', gap: 10, backgroundColor: COLORS.white, borderRadius: 16, padding: 12, ...SHADOW.sm }}>

              {/* Ventes Flash */}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text>⚡</Text>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.ink }}>Ventes flash</Text>
                  </View>
                  <View style={{ backgroundColor: COLORS.primarySoft, borderRadius: 9999, paddingHorizontal: 6, paddingVertical: 2 }}>
                    <Text style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: '600', color: COLORS.primary }}>{flashDealsCountdown.slice(3)}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
                  {flashProducts.map((p, i) => (
                    <TouchableOpacity key={p.id} onPress={() => navigation.navigate('Product', { productId: p.id, product: p })}
                      style={{ flex: 1, borderRadius: 10, backgroundColor: COLORS.paper, overflow: 'hidden' }}>
                      <View style={{ height: 80, backgroundColor: COLORS.hairline, alignItems: 'center', justifyContent: 'center' }}>
                        {p.images?.[0]
                          ? <Image source={{ uri: p.images[0] }} style={{ width: '100%', height: 80 }} resizeMode="cover" />
                          : <Text style={{ fontSize: 28 }}>🏷️</Text>
                        }
                        <View style={{ position: 'absolute', top: 4, left: 4, backgroundColor: COLORS.primarySoft, borderRadius: 9999, paddingHorizontal: 5, paddingVertical: 1 }}>
                          <Text style={{ fontSize: 9, fontWeight: '700', color: COLORS.primaryDeep }}>-{discountPct(p)}%</Text>
                        </View>
                      </View>
                      <View style={{ padding: 5 }}>
                        <Text style={{ fontSize: 10, color: COLORS.mute }} numberOfLines={1}>{p.title}</Text>
                        <Text style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: '700', color: COLORS.primary }}>${p.price.toFixed(2)}</Text>
                        <Text style={{ fontFamily: 'monospace', fontSize: 9, color: COLORS.mute, textDecorationLine: 'line-through' }}>${p.compare_price.toFixed(2)}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity style={{ borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 9999, height: 30, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: COLORS.primary }}>Voir tout →</Text>
                </TouchableOpacity>
              </View>

              <View style={{ width: 1, backgroundColor: COLORS.hairline }} />

              {/* Super Deals */}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text>🏷️</Text>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.ink }}>Super Deals</Text>
                  </View>
                  <View style={{ backgroundColor: '#FEF3C7', borderRadius: 9999, paddingHorizontal: 6, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 10, fontWeight: '600', color: '#D97706' }}>-70%</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
                  {(superProducts.length ? superProducts : flashProducts).map((p, i) => (
                    <TouchableOpacity key={p.id + '_s'} onPress={() => navigation.navigate('Product', { productId: p.id, product: p })}
                      style={{ flex: 1, borderRadius: 10, backgroundColor: COLORS.paper, overflow: 'hidden' }}>
                      <View style={{ height: 80, backgroundColor: COLORS.hairline, alignItems: 'center', justifyContent: 'center' }}>
                        {p.images?.[1] ?? p.images?.[0]
                          ? <Image source={{ uri: p.images?.[1] ?? p.images?.[0] }} style={{ width: '100%', height: 80 }} resizeMode="cover" />
                          : <Text style={{ fontSize: 28 }}>✨</Text>
                        }
                        <View style={{ position: 'absolute', top: 4, left: 4, backgroundColor: '#FEF3C7', borderRadius: 9999, paddingHorizontal: 5, paddingVertical: 1 }}>
                          <Text style={{ fontSize: 9, fontWeight: '700', color: '#D97706' }}>-{discountPct(p)}%</Text>
                        </View>
                      </View>
                      <View style={{ padding: 5 }}>
                        <Text style={{ fontSize: 10, color: COLORS.mute }} numberOfLines={1}>{p.title}</Text>
                        <Text style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: '700', color: '#D97706' }}>${p.price.toFixed(2)}</Text>
                        <Text style={{ fontFamily: 'monospace', fontSize: 9, color: COLORS.mute, textDecorationLine: 'line-through' }}>${p.compare_price.toFixed(2)}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity style={{ borderWidth: 1.5, borderColor: '#D97706', borderRadius: 9999, height: 30, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: '#D97706' }}>Voir tout →</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* ── CATÉGORIES POPULAIRES ─────────────── */}
        <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
          <SectionHeader title="Catégories populaires" onSeeAll={() => navigation.navigate('Categories')} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {CATEGORIES_TILES.map((cat, i) => (
              <TouchableOpacity key={i}
                onPress={() => navigation.navigate('Categories', { categorySlug: cat.slug })}
                style={{ width: '47%', height: 110, borderRadius: 14, overflow: 'hidden', backgroundColor: cat.color, ...SHADOW.sm }}>
                <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.22)' }} />
                <View style={{ position: 'absolute', right: -15, top: -15, width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.1)' }} />
                <Text style={{ position: 'absolute', right: 12, top: 10, fontSize: 36 }}>{cat.emoji}</Text>
                <View style={{ position: 'absolute', bottom: 10, left: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>{cat.label}</Text>
                  <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>{cat.sub}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── OFFRES EXCLUSIVES (banners Supabase) ─ */}
        {banners.length > 0 && (
          <View style={{ paddingTop: 20 }}>
            <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
              <SectionHeader title="Offres exclusives" onSeeAll={() => {}} />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 16, paddingBottom: 4 }}>
              {banners.map((b, i) => (
                <TouchableOpacity key={b.id}
                  style={{ width: 300, height: 140, borderRadius: 16, backgroundColor: b.bg_color ?? COLORS.primary, flexDirection: 'row', alignItems: 'center', paddingLeft: 16, paddingRight: 0, paddingVertical: 14, overflow: 'hidden' }}>
                  <View style={{ position: 'absolute', right: -20, top: -20, width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(255,255,255,0.08)' }} />
                  <View style={{ flex: 1, zIndex: 1, paddingRight: 8 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff', marginBottom: 4 }} numberOfLines={2}>{b.title}</Text>
                    {b.subtitle && <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)' }} numberOfLines={2}>{b.subtitle}</Text>}
                    {!!b.cta_text && (
                      <View style={{ marginTop: 8, backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>{b.cta_text}</Text>
                      </View>
                    )}
                  </View>
                  {b.image_url
                    ? <Image source={{ uri: b.image_url }} style={{ width: 110, height: 140, borderBottomRightRadius: 16, borderTopRightRadius: 16 }} resizeMode="cover" />
                    : (
                      <View style={{ width: 90, height: 90, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                        <Text style={{ fontSize: 42 }}>{BANNER_EMOJI[i % BANNER_EMOJI.length]}</Text>
                      </View>
                    )
                  }
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── À LA UNE ──────────────────────────── */}
        <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
            <View>
              <Text style={{ fontSize: 17, fontWeight: '700', color: COLORS.ink, letterSpacing: -0.3 }}>
                {search ? `Résultats pour "${search}"` : 'À la une'}
              </Text>
              {!search && <Text style={{ fontSize: 12, color: COLORS.mute, marginTop: 2 }}>Sélection mise en avant</Text>}
            </View>
            <TouchableOpacity>
              <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.primary }}>Voir tout ›</Text>
            </TouchableOpacity>
          </View>
          {featuredProds.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Text style={{ fontSize: 36 }}>{search ? '🔍' : loaded ? '🛍️' : '⏳'}</Text>
              <Text style={{ fontSize: 16, color: COLORS.mute, marginTop: 12 }}>
                {search ? 'Aucun produit trouvé' : loaded ? 'Aucun produit disponible' : 'Chargement…'}
              </Text>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {featuredProds.map(p => (
                <View key={p.id} style={{ width: '47%' }}>
                  <ProductCard product={p} onPress={() => navigation.navigate('Product', { productId: p.id, product: p })} />
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── VIDÉOS PRODUITS ──────────────────── */}
        {(videos.length > 0 || featuredProds.length > 0) && (
          <View style={{ paddingTop: 20 }}>
            <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
              <Text style={{ fontSize: 17, fontWeight: '700', color: COLORS.ink, letterSpacing: -0.3 }}>Vidéos produits</Text>
              <Text style={{ fontSize: 12, color: COLORS.mute, marginTop: 2 }}>Découvrez les produits en action</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 16, paddingBottom: 4 }}>
              {(videos.length > 0 ? videos : featuredProds.slice(0, 6).map((p, i) => ({
                id: p.id + '_demo',
                video_url: null,
                thumbnail_url: p.images?.[0] ?? null,
                caption: ['Un article unique\nfait à la main','La pièce que\ntout le monde veut','Lumière douce pour\nvotre intérieur','Sentez la différence\nchaque matin','Le sac parfait pour\ntous les jours','Le choix des chefs\nà la maison'][i] ?? p.title,
                views: [1200, 5600, 3400, 2100, 890, 4200][i] ?? 0,
                products: p,
              }))).map((v, i) => {
                const prod = v.products;
                const thumb = v.thumbnail_url ?? prod?.images?.[0];
                const viewsLabel = v.views >= 1000 ? `${(v.views / 1000).toFixed(1)}k` : String(v.views ?? 0);
                return (
                  <TouchableOpacity key={v.id}
                    onPress={() => prod && navigation.navigate('Product', { productId: prod.id, product: prod })}
                    style={{ width: 148, height: 228, borderRadius: 14, overflow: 'hidden', backgroundColor: '#1a1a2e' }}>
                    {thumb
                      ? <Image source={{ uri: thumb }} style={{ position: 'absolute', width: 148, height: 228 }} resizeMode="cover" />
                      : <View style={{ position: 'absolute', width: 148, height: 228, backgroundColor: COLORS.primary, opacity: 0.7 }} />
                    }
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)' }} />
                    <View style={{ position: 'absolute', bottom: 62, left: 0, right: 0, top: '50%', backgroundColor: 'rgba(0,0,0,0.38)' }} />
                    {/* Play + views */}
                    <View style={{ position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 8, color: '#fff', marginLeft: 1 }}>▶</Text>
                      </View>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: '#fff' }}>{viewsLabel}</Text>
                    </View>
                    {/* Caption */}
                    <View style={{ position: 'absolute', bottom: 70, left: 8, right: 8 }}>
                      <Text style={{ fontSize: 11, fontWeight: '600', color: '#fff', lineHeight: 15 }}>{v.caption}</Text>
                    </View>
                    {/* Product bar */}
                    <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(255,255,255,0.96)', padding: 7, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View style={{ width: 34, height: 34, borderRadius: 8, overflow: 'hidden', backgroundColor: COLORS.paper }}>
                        {thumb
                          ? <Image source={{ uri: thumb }} style={{ width: 34, height: 34 }} resizeMode="cover" />
                          : <Text style={{ fontSize: 18, textAlign: 'center', lineHeight: 34 }}>🛍️</Text>
                        }
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 10, color: COLORS.ink }} numberOfLines={1}>{prod?.title ?? '—'}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 }}>
                          <Text style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: '700', color: COLORS.ink }}>${Number(prod?.price ?? 0).toFixed(2)}</Text>
                          {prod && discountPct(prod) && (
                            <View style={{ backgroundColor: COLORS.success, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 }}>
                              <Text style={{ fontSize: 9, fontWeight: '800', color: '#fff' }}>{discountPct(prod)}% OFF</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ── RIEN QUE POUR VOUS ────────────────── */}
        {forYouProds.length > 0 && (
          <View style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 24 }}>
            <SectionHeader title="Rien que pour vous" onSeeAll={() => {}} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {forYouProds.map(p => (
                <View key={p.id + '_fy'} style={{ width: '47%' }}>
                  <ProductCard product={p} onPress={() => navigation.navigate('Product', { productId: p.id, product: p })} />
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── MODAL ADRESSE ────────────────────── */}
      <Modal visible={addrModal} transparent animationType="slide" onRequestClose={() => setAddrModal(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} activeOpacity={1} onPress={() => setAddrModal(false)} />
        <View style={{ backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, position: 'absolute', bottom: 0, left: 0, right: 0 }}>
          {/* Handle */}
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.hairline, alignSelf: 'center', marginBottom: 20 }} />
          <Text style={{ fontSize: 18, fontWeight: '800', color: COLORS.ink, letterSpacing: -0.5, marginBottom: 4 }}>Adresse de livraison</Text>
          <Text style={{ fontSize: 13, color: COLORS.mute, marginBottom: 20 }}>Entrez votre adresse ou utilisez votre position</Text>

          {/* GPS button */}
          <TouchableOpacity onPress={detectLocation} disabled={gpsLoading}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.primarySoft, borderRadius: 12, padding: 14, marginBottom: 14, opacity: gpsLoading ? 0.7 : 1 }}>
            {gpsLoading
              ? <ActivityIndicator size="small" color={COLORS.primary} />
              : <Icon name="mapPin" size={18} color={COLORS.primary} />
            }
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.primaryDeep }}>
                {gpsLoading ? 'Détection en cours…' : 'Utiliser ma position actuelle'}
              </Text>
              <Text style={{ fontSize: 11, color: COLORS.mute, marginTop: 1 }}>Via GPS</Text>
            </View>
            <Icon name="chevronRight" size={16} color={COLORS.primary} />
          </TouchableOpacity>

          {/* Divider */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: COLORS.hairline }} />
            <Text style={{ fontSize: 12, color: COLORS.mute }}>ou entrez manuellement</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: COLORS.hairline }} />
          </View>

          {/* Manual input */}
          <TextInput
            value={addrInput}
            onChangeText={setAddrInput}
            placeholder="Ex: 14 rue de la Roquette, 75011 Paris"
            placeholderTextColor={COLORS.mute}
            style={{ borderWidth: 1.5, borderColor: COLORS.hairline, borderRadius: 12, padding: 14, fontSize: 14, color: COLORS.ink, marginBottom: 16, backgroundColor: COLORS.paper }}
            autoFocus={false}
            returnKeyType="done"
            onSubmitEditing={saveAddress}
          />

          <TouchableOpacity onPress={saveAddress}
            style={{ backgroundColor: COLORS.primary, borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Confirmer l'adresse</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
