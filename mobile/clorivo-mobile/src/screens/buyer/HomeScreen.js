import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, RefreshControl, Image, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SHADOW } from '../../lib/tokens';
import { ProductCard, SectionHeader, Avatar, Badge } from '../../components/UI';
import { getProducts, getShops, getNotifications, supabase } from '../../lib/supabase';
import { useSession } from '../../hooks/useSession';

export default function HomeScreen({ navigation }) {
  const session = useSession();
  const [products, setProducts]         = useState([]);
  const [shops, setShops]               = useState([]);
  const [refreshing, setRefreshing]     = useState(false);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [unreadMsgs, setUnreadMsgs]     = useState(0);
  const [cartCount, setCartCount]       = useState(0);
  const [search, setSearch]             = useState('');

  const userName = session?.user?.user_metadata?.full_name?.split(' ')[0] ?? 'vous';
  const userInitials = session?.user?.user_metadata?.full_name
    ?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? 'AM';

  async function load() {
    const [{ data: prods }, sh] = await Promise.all([getProducts({ limit: 12 }), getShops(8)]);
    if (prods?.length) setProducts(prods);
    if (sh?.length) setShops(sh);

    if (session?.user) {
      const notifs = await getNotifications(session.user.id);
      setUnreadNotifs(notifs.filter(n => !n.read_at).length);
    }
  }

  useEffect(() => { load(); }, [session]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const filtered = search
    ? products.filter(p => p.title.toLowerCase().includes(search.toLowerCase()))
    : products;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.paper }} edges={['top']}>
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* Header */}
        <View style={{ backgroundColor: COLORS.white, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: COLORS.hairline }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                <Avatar size={42} initials={userInitials} />
              </TouchableOpacity>
              <View>
                <Text style={{ fontSize: 12, color: COLORS.mute }}>Bonjour 👋</Text>
                <Text style={{ fontSize: 17, fontWeight: '800', color: COLORS.ink, letterSpacing: -0.5 }}>{userName}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {/* Cart */}
              <TouchableOpacity onPress={() => navigation.navigate('Cart')}
                style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 22 }}>🛒</Text>
                <Badge count={cartCount} />
              </TouchableOpacity>
              {/* Messages */}
              <TouchableOpacity onPress={() => navigation.navigate('Messages')}
                style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 22 }}>💬</Text>
                <Badge count={unreadMsgs} />
              </TouchableOpacity>
              {/* Notifications */}
              <TouchableOpacity onPress={() => navigation.navigate('Notifications')}
                style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 22 }}>🔔</Text>
                <Badge count={unreadNotifs} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Search */}
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.paper, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.hairline, paddingHorizontal: 14, height: 44, marginBottom: 12, gap: 8 }}>
            <Text style={{ fontSize: 18 }}>🔍</Text>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Rechercher sur Clorivo…"
              placeholderTextColor={COLORS.mute}
              style={{ flex: 1, fontSize: 14, color: COLORS.ink }}
            />
          </View>
        </View>

        {/* Hero Banner */}
        <View style={{ margin: 16 }}>
          <TouchableOpacity activeOpacity={0.9}
            style={{ borderRadius: RADIUS.lg, backgroundColor: COLORS.primary, padding: 20, overflow: 'hidden' }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.8)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 }}>Offre printemps</Text>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.5, marginBottom: 12, lineHeight: 28 }}>Jusqu'à 70% offerts{'\n'}sur Maison & Cuisine</Text>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: RADIUS.full, paddingHorizontal: 16, paddingVertical: 8, alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' }}>
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>Acheter maintenant →</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Shops */}
        {shops.length > 0 && (
          <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
            <SectionHeader title="Boutiques populaires" onSeeAll={() => {}} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
              {shops.map((shop, i) => (
                <TouchableOpacity key={shop.id ?? i} style={{ alignItems: 'center', gap: 6, width: 64 }}>
                  <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: shop.brand_color ?? COLORS.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.hairline }}>
                    {shop.logo_url
                      ? <Image source={{ uri: shop.logo_url }} style={{ width: 50, height: 50, borderRadius: 25 }} />
                      : <Text style={{ fontWeight: '800', fontSize: 22, color: '#fff' }}>{shop.name[0].toUpperCase()}</Text>
                    }
                    {shop.is_verified && (
                      <View style={{ position: 'absolute', bottom: 0, right: 0, width: 17, height: 17, borderRadius: 9, backgroundColor: COLORS.primary, borderWidth: 2, borderColor: COLORS.white, alignItems: 'center', justifyContent: 'center' }}>
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

        {/* Category shortcuts */}
        <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
          <SectionHeader title="Catégories" onSeeAll={() => navigation.navigate('Categories')} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {[
              { label: 'Maison', emoji: '🏠', color: '#C97B5A', slug: 'maison' },
              { label: 'Mode', emoji: '👗', color: '#9B59B6', slug: 'mode' },
              { label: 'Tech', emoji: '📱', color: '#4A6FD4', slug: 'tech' },
              { label: 'Beauté', emoji: '💄', color: '#E67E22', slug: 'beaute' },
            ].map((cat, i) => (
              <TouchableOpacity key={i}
                onPress={() => navigation.navigate('Categories', { categorySlug: cat.slug })}
                style={{ flex: 1, minWidth: '45%', backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, ...SHADOW.sm }}>
                <Text style={{ fontSize: 24 }}>{cat.emoji}</Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.ink }}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Products grid */}
        <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
          <SectionHeader title={search ? `Résultats pour "${search}"` : 'À la une'} />
          {filtered.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Text style={{ fontSize: 36 }}>🔍</Text>
              <Text style={{ fontSize: 16, color: COLORS.mute, marginTop: 12 }}>Aucun produit trouvé</Text>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {filtered.map(p => (
                <View key={p.id} style={{ width: '47%' }}>
                  <ProductCard product={p} onPress={() => navigation.navigate('Product', { productId: p.id, product: p })} />
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
