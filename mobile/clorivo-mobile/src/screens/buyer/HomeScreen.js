import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  TextInput, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SHADOW } from '../../lib/tokens';
import { ProductCard, SectionHeader, Avatar, Badge } from '../../components/UI';
import {
  getProducts, getShops, getNotifications, getBanners,
  getCart, getConversations, getProfile,
} from '../../lib/supabase';
import { useSession } from '../../hooks/useSession';

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

// ── Static shortcuts (navigation buttons, not data) ────────────────
const SHORTCUTS = [
  { emoji: '🏷️', label: 'Offres',     badge: null,      badgeBg: null },
  { emoji: '🔗', label: 'Parrainage', badge: 'GAGNE $', badgeBg: COLORS.success },
  { emoji: '⚡',  label: 'Flash Live', badge: 'LIVE',    badgeBg: COLORS.danger },
  { emoji: '⭐',  label: 'Coupons',   badge: null,       badgeBg: null },
  { emoji: '🏪', label: 'Boutiques',  badge: null,       badgeBg: null },
  { emoji: '📦', label: 'Suivi',      badge: null,       badgeBg: null },
  { emoji: '💳', label: 'Paiements',  badge: 'NOUVEAU', badgeBg: '#2563EB' },
];

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
  const [cartCount, setCartCount]   = useState(0);
  const [unreadMsgs, setUnreadMsgs] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [address, setAddress]       = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]         = useState('');
  const [activeChip, setActiveChip] = useState(0);

  const heroBannerCountdown  = useCountdown(7 * 3600 + 14 * 60 + 8);
  const flashDealsCountdown  = useCountdown(1 * 3600 + 42 * 60);

  const userName     = session?.user?.user_metadata?.full_name?.split(' ')[0] ?? 'vous';
  const userInitials = session?.user?.user_metadata?.full_name
    ?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? 'AM';

  async function load() {
    try {
      const userId = session?.user?.id;

      const [{ data: prods }, sh, bnrs] = await Promise.all([
        getProducts({ limit: 16 }),
        getShops(10),
        getBanners(),
      ]);

      if (prods?.length)  setProducts(prods);
      if (sh?.length)     setShops(sh.filter(s => s?.name));
      if (bnrs?.length)   setBanners(bnrs);

      if (userId) {
        const [cartItems, convs, notifs, profile] = await Promise.all([
          getCart(userId).catch(() => []),
          getConversations(userId).catch(() => []),
          getNotifications(userId).catch(() => []),
          getProfile(userId).catch(() => null),
        ]);
        setCartCount(cartItems?.length ?? 0);
        setUnreadMsgs(convs?.filter(c => c.last_message_at)?.length ?? 0);
        setUnreadNotifs(notifs?.filter(n => !n.read_at)?.length ?? 0);
        if (profile?.address) setAddress(profile.address);
      }
    } catch (e) {
      console.warn('HomeScreen load error:', e);
    }
  }

  useEffect(() => { load(); }, [session?.user?.id]);

  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false); }

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
                <Text style={{ fontSize: 22 }}>🛒</Text>
                {cartCount > 0 && <Badge count={cartCount} />}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Messages')}
                style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 22 }}>💬</Text>
                {unreadMsgs > 0 && <Badge count={unreadMsgs} />}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Notifications')}
                style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 22 }}>🔔</Text>
                {unreadNotifs > 0 && <Badge count={unreadNotifs} />}
              </TouchableOpacity>
            </View>
          </View>

          {/* Address strip */}
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.primarySoft, borderRadius: 10, padding: 8, marginBottom: 10 }}>
            <Text style={{ fontSize: 15 }}>📍</Text>
            <Text style={{ flex: 1, fontSize: 11, color: COLORS.mute }}>
              Livrer à ·{' '}
              <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.primaryDeep }}>
                {address ?? 'Ajouter une adresse'}
              </Text>
            </Text>
            <Text style={{ fontSize: 14, color: COLORS.primary }}>›</Text>
          </TouchableOpacity>

          {/* Search */}
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.paper, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.hairline, paddingHorizontal: 14, height: 44, marginBottom: 10, gap: 8 }}>
            <Text style={{ fontSize: 18 }}>🔍</Text>
            <TextInput
              value={search} onChangeText={setSearch}
              placeholder="Rechercher sur Clorivo…"
              placeholderTextColor={COLORS.mute}
              style={{ flex: 1, fontSize: 14, color: COLORS.ink }}
            />
            <View style={{ width: 1, height: 16, backgroundColor: COLORS.hairline }} />
            <Text style={{ fontSize: 18 }}>📷</Text>
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
          <TouchableOpacity activeOpacity={0.9}
            style={{ borderRadius: RADIUS.lg, backgroundColor: COLORS.primary, padding: 20, overflow: 'hidden' }}>
            <View style={{ position: 'absolute', right: -20, top: -20, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.07)' }} />
            <View style={{ position: 'absolute', right: 20, bottom: -30, width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.05)' }} />
            <Text style={{ fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.8)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
              Offre printemps · expire dans
            </Text>
            <Text style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.95)', marginBottom: 8 }}>
              {heroBannerCountdown}
            </Text>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.5, marginBottom: 12, lineHeight: 28 }}>
              Jusqu'à 70% offerts{'\n'}sur Maison & Cuisine
            </Text>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: RADIUS.full, paddingHorizontal: 16, paddingVertical: 8, alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' }}>
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>Acheter maintenant →</Text>
            </View>
          </TouchableOpacity>
          {/* Dots */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: 8 }}>
            {[0,1,2,3].map(i => (
              <View key={i} style={{ width: i === 0 ? 16 : 5, height: 5, borderRadius: 9999, backgroundColor: i === 0 ? COLORS.primary : COLORS.hairline }} />
            ))}
          </View>
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
              <TouchableOpacity key={i} style={{ alignItems: 'center', gap: 6, width: 52 }}>
                <View style={{ position: 'relative', height: 40, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 28 }}>{s.emoji}</Text>
                  {s.badge && (
                    <View style={{ position: 'absolute', bottom: -4, backgroundColor: s.badgeBg, borderRadius: 9999, paddingHorizontal: 5, paddingVertical: 1 }}>
                      <Text style={{ fontSize: 7, fontWeight: '800', color: '#fff' }}>{s.badge}</Text>
                    </View>
                  )}
                </View>
                <Text style={{ fontSize: 11, fontWeight: '500', color: COLORS.ink, textAlign: 'center', lineHeight: 14, marginTop: s.badge ? 6 : 0 }}>{s.label}</Text>
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
                <TouchableOpacity key={shop.id ?? i} style={{ alignItems: 'center', gap: 6, width: 60 }}>
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
                  style={{ width: 268, height: 112, borderRadius: 14, backgroundColor: b.bg_color ?? COLORS.primary, flexDirection: 'row', alignItems: 'center', padding: 12, overflow: 'hidden' }}>
                  <View style={{ position: 'absolute', right: -20, top: -20, width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(255,255,255,0.08)' }} />
                  <View style={{ flex: 1, zIndex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff', marginBottom: 4 }} numberOfLines={2}>{b.title}</Text>
                    {b.subtitle && <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)' }} numberOfLines={2}>{b.subtitle}</Text>}
                    {b.cta_text && (
                      <View style={{ marginTop: 6, backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>{b.cta_text}</Text>
                      </View>
                    )}
                  </View>
                  {b.image_url
                    ? <Image source={{ uri: b.image_url }} style={{ width: 78, height: 88, borderRadius: 10 }} resizeMode="cover" />
                    : (
                      <View style={{ width: 78, height: 88, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 38 }}>{BANNER_EMOJI[i % BANNER_EMOJI.length]}</Text>
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
              <Text style={{ fontSize: 36 }}>🔍</Text>
              <Text style={{ fontSize: 16, color: COLORS.mute, marginTop: 12 }}>
                {search ? 'Aucun produit trouvé' : 'Chargement…'}
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
    </SafeAreaView>
  );
}
