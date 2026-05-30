import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  TextInput, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SHADOW } from '../../lib/tokens';
import { ProductCard, SectionHeader, Avatar, Badge } from '../../components/UI';
import { getProducts, getShops, getNotifications } from '../../lib/supabase';
import { useSession } from '../../hooks/useSession';

// Countdown hook
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

const SHORTCUTS = [
  { emoji: '🏷️', label: 'Offres',      badge: null,      badgeBg: null },
  { emoji: '🔗', label: 'Parrainage',  badge: 'GAGNE $',  badgeBg: COLORS.success },
  { emoji: '⚡',  label: 'Flash Live',  badge: 'LIVE',     badgeBg: COLORS.danger },
  { emoji: '⭐',  label: 'Coupons',    badge: null,       badgeBg: null },
  { emoji: '🏪', label: 'Boutiques',   badge: null,       badgeBg: null },
  { emoji: '📦', label: 'Suivi',       badge: null,       badgeBg: null },
  { emoji: '💳', label: 'Paiements',   badge: 'NOUVEAU',  badgeBg: '#2563EB' },
];

const PROMO_BANNERS = [
  { color: '#059669', badge: 'Exclusif · 1ère commande', oldPrice: '$39.99', price: '$24.50', desc: 'Vase terracotta nervuré · M' },
  { color: '#6C4DFF', badge: 'Vente flash · -65%',        oldPrice: '$24.00', price: '$8.99',  desc: 'Mug céramique artisanal' },
  { color: '#D97706', badge: 'Meilleure vente',           oldPrice: '$58.00', price: '$22.00', desc: 'Abat-jour lin naturel' },
  { color: '#DC2626', badge: 'Dernières pièces',          oldPrice: '$40.00', price: '$15.00', desc: 'Brûleur à huile en bambou' },
];

const CATEGORIES_TILES = [
  { label: 'Maison & Déco',  sub: '1 200+ articles', slug: 'maison',  emoji: '🏠', color: '#C97B5A' },
  { label: 'Mode & Style',   sub: '3 400+ articles', slug: 'mode',    emoji: '👗', color: '#9B59B6' },
  { label: 'Tech & Gadgets', sub: '890 articles',    slug: 'tech',    emoji: '📱', color: '#4A6FD4' },
  { label: 'Beauté & Soin',  sub: '560 articles',    slug: 'beaute',  emoji: '💄', color: '#E67E22' },
];

const CHIP_CATS = ['Tout', 'Maison', 'Tech', 'Beauté', 'Mode', 'Enfants'];

export default function HomeScreen({ navigation }) {
  const session = useSession();
  const [products, setProducts]         = useState([]);
  const [shops, setShops]               = useState([]);
  const [refreshing, setRefreshing]     = useState(false);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [cartCount]                     = useState(0);
  const [unreadMsgs]                    = useState(2);
  const [search, setSearch]             = useState('');
  const [activeChip, setActiveChip]     = useState(0);
  const countdown                       = useCountdown(7 * 3600 + 14 * 60 + 8);
  const flashCountdown                  = useCountdown(1 * 3600 + 42 * 60);

  const userName     = session?.user?.user_metadata?.full_name?.split(' ')[0] ?? 'vous';
  const userInitials = session?.user?.user_metadata?.full_name
    ?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? 'AM';

  async function load() {
    const [{ data: prods }, sh] = await Promise.all([getProducts({ limit: 12 }), getShops(8)]);
    if (prods?.length) setProducts(prods);
    if (sh?.length)    setShops(sh);
    if (session?.user) {
      const notifs = await getNotifications(session.user.id);
      setUnreadNotifs(notifs.filter(n => !n.read_at).length);
    }
  }

  useEffect(() => { load(); }, [session?.user?.id]);

  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false); }

  const filtered = search
    ? products.filter(p => p.title?.toLowerCase().includes(search.toLowerCase()))
    : products;

  // Split products for sections
  const flashProducts  = filtered.slice(0, 2);
  const superProducts  = filtered.slice(2, 4);
  const featuredProds  = filtered.slice(0, 8);
  const forYouProds    = filtered.slice(2, 8);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.paper }} edges={['top']}>
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HEADER ─────────────────────────────── */}
        <View style={{ backgroundColor: COLORS.white, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 0, borderBottomWidth: 1, borderBottomColor: COLORS.hairline }}>
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
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, color: COLORS.mute }}>Livrer à ·{' '}
                <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.primaryDeep }}>14 rue de la Roquette, 75011 Paris</Text>
              </Text>
            </View>
            <Text style={{ fontSize: 14, color: COLORS.primary }}>›</Text>
          </TouchableOpacity>

          {/* Search bar */}
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.paper, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.hairline, paddingHorizontal: 14, height: 44, marginBottom: 10, gap: 8 }}>
            <Text style={{ fontSize: 18 }}>🔍</Text>
            <TextInput
              value={search}
              onChangeText={setSearch}
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
              <TouchableOpacity key={i} onPress={() => setActiveChip(i)}
                style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: RADIUS.full,
                  backgroundColor: activeChip === i ? COLORS.primary : COLORS.paper,
                  borderWidth: 1.5, borderColor: activeChip === i ? COLORS.primary : COLORS.hairline }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: activeChip === i ? '#fff' : COLORS.ink }}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── HERO BANNER ────────────────────────── */}
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <TouchableOpacity activeOpacity={0.9}
            style={{ borderRadius: RADIUS.lg, backgroundColor: COLORS.primary, padding: 20, overflow: 'hidden' }}>
            {/* Decorative circles */}
            <View style={{ position: 'absolute', right: -20, top: -20, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.07)' }} />
            <View style={{ position: 'absolute', right: 20, bottom: -30, width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.05)' }} />
            <Text style={{ fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.8)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Offre printemps · expire dans</Text>
            <Text style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.95)', marginBottom: 8 }}>{countdown}</Text>
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

        {/* ── CLORI+ STRIP + SHORTCUTS ───────────── */}
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          {/* clori+ promo */}
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.primarySoft, borderRadius: 12, padding: 10, marginBottom: 16 }}>
            <View style={{ backgroundColor: COLORS.primary, borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#fff', letterSpacing: -0.3 }}>clori+</Text>
            </View>
            <Text style={{ flex: 1, fontSize: 13, fontWeight: '500', color: COLORS.primaryDeep }} numberOfLines={1}>
              Essayez 1 mois : livraison express offerte
            </Text>
            <Text style={{ fontSize: 16, color: COLORS.primaryDeep }}>›</Text>
          </TouchableOpacity>

          {/* Shortcuts */}
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

        {/* ── FEATURED SHOPS ─────────────────────── */}
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
                        : <Text style={{ fontWeight: '800', fontSize: 22, color: '#fff' }}>{shop.name[0].toUpperCase()}</Text>
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

        {/* ── FLASH DEALS + SUPER DEALS ──────────── */}
        {filtered.length > 0 && (
          <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
            <View style={{ flexDirection: 'row', gap: 10, backgroundColor: COLORS.white, borderRadius: 16, padding: 12, ...SHADOW.sm }}>
              {/* Ventes Flash */}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontSize: 13 }}>⚡</Text>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.ink }}>Ventes flash</Text>
                  </View>
                  <View style={{ backgroundColor: COLORS.primarySoft, borderRadius: 9999, paddingHorizontal: 6, paddingVertical: 2 }}>
                    <Text style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: '600', color: COLORS.primary }}>{flashCountdown.slice(3)}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
                  {(flashProducts.length ? flashProducts : [{id:'a',title:'Produit',price:24.99},{id:'b',title:'Produit',price:14.99}]).map((p, i) => (
                    <TouchableOpacity key={p.id} onPress={() => navigation.navigate('Product', { productId: p.id, product: p })}
                      style={{ flex: 1, borderRadius: 10, backgroundColor: COLORS.paper, overflow: 'hidden' }}>
                      <View style={{ height: 80, backgroundColor: COLORS.hairline, alignItems: 'center', justifyContent: 'center' }}>
                        {p.images?.[0]
                          ? <Image source={{ uri: p.images[0] }} style={{ width: '100%', height: 80 }} resizeMode="cover" />
                          : <Text style={{ fontSize: 28 }}>{['🏠','✨','💡','🌿'][i % 4]}</Text>
                        }
                        <View style={{ position: 'absolute', top: 4, left: 4, backgroundColor: COLORS.primarySoft, borderRadius: 9999, paddingHorizontal: 5, paddingVertical: 1 }}>
                          <Text style={{ fontSize: 9, fontWeight: '700', color: COLORS.primaryDeep }}>-{p.discount ?? 38}%</Text>
                        </View>
                      </View>
                      <View style={{ padding: 5 }}>
                        <Text style={{ fontSize: 10, color: COLORS.mute }} numberOfLines={1}>{p.title}</Text>
                        <Text style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: '700', color: COLORS.primary }}>${(p.price ?? 24.99).toFixed(2)}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity style={{ borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 9999, height: 30, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: COLORS.primary }}>Voir tout →</Text>
                </TouchableOpacity>
              </View>

              {/* Divider */}
              <View style={{ width: 1, backgroundColor: COLORS.hairline }} />

              {/* Super Deals */}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontSize: 13 }}>🏷️</Text>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.ink }}>Super Deals</Text>
                  </View>
                  <View style={{ backgroundColor: '#FEF3C7', borderRadius: 9999, paddingHorizontal: 6, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 10, fontWeight: '600', color: '#D97706' }}>-70%</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
                  {(superProducts.length ? superProducts : [{id:'c',title:'Produit',price:8.99},{id:'d',title:'Produit',price:22.00}]).map((p, i) => (
                    <TouchableOpacity key={p.id} onPress={() => navigation.navigate('Product', { productId: p.id, product: p })}
                      style={{ flex: 1, borderRadius: 10, backgroundColor: COLORS.paper, overflow: 'hidden' }}>
                      <View style={{ height: 80, backgroundColor: COLORS.hairline, alignItems: 'center', justifyContent: 'center' }}>
                        {p.images?.[0]
                          ? <Image source={{ uri: p.images[0] }} style={{ width: '100%', height: 80 }} resizeMode="cover" />
                          : <Text style={{ fontSize: 28 }}>{['🧴','👜','🕯️','🌸'][i % 4]}</Text>
                        }
                        <View style={{ position: 'absolute', top: 4, left: 4, backgroundColor: '#FEF3C7', borderRadius: 9999, paddingHorizontal: 5, paddingVertical: 1 }}>
                          <Text style={{ fontSize: 9, fontWeight: '700', color: '#D97706' }}>-{p.discount ?? 65}%</Text>
                        </View>
                      </View>
                      <View style={{ padding: 5 }}>
                        <Text style={{ fontSize: 10, color: COLORS.mute }} numberOfLines={1}>{p.title}</Text>
                        <Text style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: '700', color: '#D97706' }}>${(p.price ?? 8.99).toFixed(2)}</Text>
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

        {/* ── CATEGORY TILES ─────────────────────── */}
        <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
          <SectionHeader title="Catégories populaires" onSeeAll={() => navigation.navigate('Categories')} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {CATEGORIES_TILES.map((cat, i) => (
              <TouchableOpacity key={i}
                onPress={() => navigation.navigate('Categories', { categorySlug: cat.slug })}
                style={{ width: '47%', height: 110, borderRadius: 14, overflow: 'hidden', backgroundColor: cat.color, ...SHADOW.sm }}>
                <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.25)' }} />
                <View style={{ position: 'absolute', right: -15, top: -15, width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.1)' }} />
                <Text style={{ position: 'absolute', right: 12, top: 10, fontSize: 36 }}>{cat.emoji}</Text>
                <View style={{ position: 'absolute', bottom: 10, left: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>{cat.label}</Text>
                  <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 1 }}>{cat.sub}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── PROMO BANNERS ──────────────────────── */}
        <View style={{ paddingTop: 20 }}>
          <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
            <SectionHeader title="Offres exclusives" onSeeAll={() => {}} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 16, paddingBottom: 4 }}>
            {PROMO_BANNERS.map((b, i) => (
              <TouchableOpacity key={i}
                style={{ width: 268, height: 112, borderRadius: 14, backgroundColor: b.color, flexDirection: 'row', alignItems: 'center', padding: 12, overflow: 'hidden' }}>
                <View style={{ position: 'absolute', right: -20, top: -20, width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(255,255,255,0.08)' }} />
                <View style={{ flex: 1, zIndex: 1 }}>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 9999, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 5 }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#fff' }}>{b.badge}</Text>
                  </View>
                  <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginBottom: 1 }}>
                    Avant : <Text style={{ textDecorationLine: 'line-through' }}>{b.oldPrice}</Text>
                  </Text>
                  <Text style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.5 }}>{b.price}</Text>
                  <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.85)' }}>{b.desc}</Text>
                </View>
                <View style={{ width: 78, height: 88, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 38 }}>{['🏺','☕','💡','🕯️'][i]}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── À LA UNE ───────────────────────────── */}
        <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
            <View>
              <Text style={{ fontSize: 17, fontWeight: '700', color: COLORS.ink, letterSpacing: -0.3 }}>
                {search ? `Résultats pour "${search}"` : 'À la une'}
              </Text>
              {!search && <Text style={{ fontSize: 12, color: COLORS.mute, marginTop: 2 }}>Sélection mise en avant par nos vendeurs</Text>}
            </View>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.primary }}>Voir tout</Text>
              <Text style={{ fontSize: 14, color: COLORS.primary }}>›</Text>
            </TouchableOpacity>
          </View>
          {featuredProds.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Text style={{ fontSize: 36 }}>🔍</Text>
              <Text style={{ fontSize: 16, color: COLORS.mute, marginTop: 12 }}>Aucun produit trouvé</Text>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {featuredProds.map((p, i) => (
                <View key={p.id} style={{ width: '47%', position: 'relative' }}>
                  <ProductCard product={p} onPress={() => navigation.navigate('Product', { productId: p.id, product: p })} />
                  <View style={{ position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(14,11,31,0.55)', borderRadius: 9999, paddingHorizontal: 8, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 9, fontWeight: '600', color: 'rgba(255,255,255,0.92)' }}>Sponsorisé</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── RIEN QUE POUR VOUS ─────────────────── */}
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
