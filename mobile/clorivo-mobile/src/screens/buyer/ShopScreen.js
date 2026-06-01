import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  ActivityIndicator,
  Share,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, RADIUS, SHADOW } from '../../lib/tokens';
import Icon from '../../components/Icon';
import { useSession } from '../../hooks/useSession';
import { supabase } from '../../lib/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────────────────────
// ProductMiniCard
// ─────────────────────────────────────────────────────────────────────────────
function ProductMiniCard({ product, onPress }) {
  const img = Array.isArray(product.images) ? product.images[0] : null;
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        width: 140,
        marginRight: 12,
        backgroundColor: COLORS.white,
        borderRadius: RADIUS.md,
        overflow: 'hidden',
        ...SHADOW.sm,
      }}
    >
      <View style={{ width: 140, height: 140, backgroundColor: COLORS.primarySoft }}>
        {img && (
          <Image
            source={{ uri: img }}
            style={{ width: 140, height: 140 }}
            resizeMode="cover"
          />
        )}
      </View>
      <View style={{ padding: 10 }}>
        <Text
          numberOfLines={2}
          style={{ fontSize: 13, fontWeight: '600', color: COLORS.ink, marginBottom: 4 }}
        >
          {product.title}
        </Text>
        <Text style={{ fontSize: 14, fontWeight: '800', color: COLORS.primary }}>
          ${Number(product.price).toFixed(2)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ProductGridCard
// ─────────────────────────────────────────────────────────────────────────────
function ProductGridCard({ product, onPress }) {
  const img = Array.isArray(product.images) ? product.images[0] : null;
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flex: 1,
        backgroundColor: COLORS.white,
        borderRadius: RADIUS.md,
        overflow: 'hidden',
        ...SHADOW.sm,
      }}
    >
      <View style={{ height: 160, backgroundColor: COLORS.primarySoft }}>
        {img && (
          <Image
            source={{ uri: img }}
            style={{ width: '100%', height: 160 }}
            resizeMode="cover"
          />
        )}
      </View>
      <View style={{ padding: 10 }}>
        <Text
          numberOfLines={2}
          style={{ fontSize: 13, fontWeight: '600', color: COLORS.ink, marginBottom: 4 }}
        >
          {product.title}
        </Text>
        <Text style={{ fontSize: 15, fontWeight: '800', color: COLORS.primary }}>
          ${Number(product.price).toFixed(2)}
        </Text>
        {product.rating ? (
          <Text style={{ fontSize: 11, color: '#F59E0B', marginTop: 2 }}>
            {'★'.repeat(Math.round(product.rating))} {product.rating}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BannerCarousel
// ─────────────────────────────────────────────────────────────────────────────
function BannerCarousel({ banners, brandColor }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  const onScroll = useCallback((e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentIndex(idx);
  }, []);

  return (
    <View>
      <FlatList
        ref={flatListRef}
        data={banners}
        keyExtractor={(item) => String(item.id)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <View
            style={{
              width: SCREEN_WIDTH,
              height: 180,
              backgroundColor: item.bg_color || brandColor || COLORS.primary,
            }}
          >
            {item.image_url ? (
              <Image
                source={{ uri: item.image_url }}
                style={{ width: SCREEN_WIDTH, height: 180 }}
                resizeMode="cover"
              />
            ) : null}
            {/* Bottom overlay: title + subtitle */}
            {(item.title || item.subtitle) ? (
              <View
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  backgroundColor: 'rgba(0,0,0,0.35)',
                }}
              >
                {item.title ? (
                  <Text
                    style={{ color: COLORS.white, fontSize: 15, fontWeight: '700' }}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                ) : null}
                {item.subtitle ? (
                  <Text
                    style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}
                    numberOfLines={1}
                  >
                    {item.subtitle}
                  </Text>
                ) : null}
              </View>
            ) : null}
            {/* CTA button */}
            {item.cta_text ? (
              <TouchableOpacity
                style={{
                  position: 'absolute',
                  bottom: 12,
                  right: 14,
                  backgroundColor: COLORS.white,
                  borderRadius: RADIUS.full,
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                }}
                activeOpacity={0.85}
              >
                <Text style={{ color: COLORS.ink, fontSize: 12, fontWeight: '700' }}>
                  {item.cta_text}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      />
      {/* Pagination dots */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 8,
          backgroundColor: COLORS.paper,
        }}
      >
        {banners.map((_, i) => (
          <View
            key={i}
            style={{
              width: i === currentIndex ? 18 : 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: i === currentIndex ? COLORS.primary : COLORS.hairline,
              marginHorizontal: 3,
            }}
          />
        ))}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Ticker
// ─────────────────────────────────────────────────────────────────────────────
function Ticker({ text }) {
  const translateX = useRef(new Animated.Value(SCREEN_WIDTH)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(translateX, {
        toValue: -SCREEN_WIDTH * 1.5,
        duration: 8000,
        useNativeDriver: true,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, [translateX]);

  return (
    <View
      style={{
        backgroundColor: COLORS.primary,
        overflow: 'hidden',
        height: 32,
        justifyContent: 'center',
      }}
    >
      <Animated.Text
        style={{
          color: COLORS.white,
          fontSize: 13,
          fontWeight: '600',
          transform: [{ translateX }],
          whiteSpace: 'nowrap',
        }}
        numberOfLines={1}
      >
        {text}
      </Animated.Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ShopScreen
// ─────────────────────────────────────────────────────────────────────────────
export default function ShopScreen({ route, navigation }) {
  const { shopId: paramShopId, shop: paramShop } = route.params ?? {};
  const shopId = paramShopId ?? paramShop?.id;

  const { session } = useSession();

  const [shop, setShop] = useState(paramShop ?? null);
  const [banners, setBanners] = useState([]);
  const [products, setProducts] = useState([]);
  const [featuredCategories, setFeaturedCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  // ── Load data ────────────────────────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      if (!shopId) {
        setError('Boutique introuvable.');
        setLoading(false);
        return;
      }

      let cancelled = false;

      async function load() {
        setLoading(true);
        setError(null);

        try {
          // 1. Shop details
          const { data: shopData, error: shopErr } = await supabase
            .from('shops')
            .select('*, profiles(full_name, avatar_url)')
            .eq('id', shopId)
            .single();

          if (shopErr || !shopData) {
            if (!cancelled) {
              setError('Boutique introuvable.');
              setLoading(false);
            }
            return;
          }
          if (!cancelled) setShop(shopData);

          // 2. Banners
          const { data: bannersData } = await supabase
            .from('shop_banners')
            .select('*')
            .eq('shop_id', shopId)
            .eq('is_active', true)
            .order('position');
          if (!cancelled) setBanners(bannersData ?? []);

          // 3. Products
          const { data: productsData } = await supabase
            .from('products')
            .select('*')
            .eq('shop_id', shopId)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(30);
          if (!cancelled) setProducts(productsData ?? []);

          // 4. Featured categories
          if (shopData.featured_category_ids?.length > 0) {
            const { data: catsData } = await supabase
              .from('categories')
              .select('*')
              .in('id', shopData.featured_category_ids);
            if (!cancelled) setFeaturedCategories(catsData ?? []);
          }
        } catch (e) {
          if (!cancelled) setError('Une erreur est survenue.');
        } finally {
          if (!cancelled) setLoading(false);
        }
      }

      load();
      return () => { cancelled = true; };
    }, [shopId]),
  );

  // ── Share ────────────────────────────────────────────────────────────────
  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `Découvrez la boutique${shop?.name ? ` ${shop.name}` : ''} sur Clorivoo !`,
      });
    } catch (_) {
      // ignore
    }
  }, [shop]);

  // ── Derived: filtered products ───────────────────────────────────────────
  const visibleProducts = selectedCategoryId
    ? products.filter((p) => p.category_id === selectedCategoryId)
    : products;

  // Featured products (from shop.featured_product_ids)
  const featuredProducts =
    shop?.featured_product_ids?.length > 0
      ? products.filter((p) => shop.featured_product_ids.includes(p.id))
      : [];

  // ── Helper: initials ─────────────────────────────────────────────────────
  function initials(name) {
    if (!name) return '?';
    return name
      .trim()
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('');
  }

  // ── Render: loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.paper }}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Render: error ────────────────────────────────────────────────────────
  if (error || !shop) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.paper }}>
        <View style={styles.center}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>😕</Text>
          <Text style={{ fontSize: 16, color: COLORS.ink, fontWeight: '600', marginBottom: 8 }}>
            {error ?? 'Boutique introuvable.'}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Text style={{ color: COLORS.white, fontWeight: '700' }}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const brandColor = shop.brand_color ?? COLORS.primary;

  // ── Grid rows ────────────────────────────────────────────────────────────
  const gridRows = [];
  for (let i = 0; i < visibleProducts.length; i += 2) {
    gridRows.push(visibleProducts.slice(i, i + 2));
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.paper }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── TICKER ── */}
        {shop.ticker_active && shop.ticker_text ? (
          <Ticker text={shop.ticker_text} />
        ) : null}

        {/* ── BANNER / HERO ── */}
        {banners.length > 0 ? (
          <BannerCarousel banners={banners} brandColor={brandColor} />
        ) : (
          <View
            style={{
              width: SCREEN_WIDTH,
              height: 140,
              backgroundColor: brandColor,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: COLORS.white, fontSize: 22, fontWeight: '800' }}>
              {shop.name ?? ''}
            </Text>
          </View>
        )}

        {/* ── SHOP INFO BAR ── */}
        <View
          style={{
            backgroundColor: COLORS.white,
            marginHorizontal: 0,
            padding: 16,
            ...SHADOW.sm,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            {/* Logo */}
            <View
              style={{
                width: 54,
                height: 54,
                borderRadius: 27,
                backgroundColor: brandColor,
                overflow: 'hidden',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12,
              }}
            >
              {shop.logo_url ? (
                <Image
                  source={{ uri: shop.logo_url }}
                  style={{ width: 54, height: 54 }}
                  resizeMode="cover"
                />
              ) : (
                <Text style={{ color: COLORS.white, fontSize: 20, fontWeight: '700' }}>
                  {initials(shop.name)}
                </Text>
              )}
            </View>

            {/* Name + verified + followers */}
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text
                  style={{ fontSize: 16, fontWeight: '800', color: COLORS.ink, flexShrink: 1 }}
                  numberOfLines={1}
                >
                  {shop.name ?? ''}
                </Text>
                {shop.is_verified ? (
                  <View
                    style={{
                      marginLeft: 6,
                      backgroundColor: COLORS.primary,
                      borderRadius: RADIUS.full,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                    }}
                  >
                    <Text style={{ color: COLORS.white, fontSize: 10, fontWeight: '700' }}>
                      ✓
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text style={{ fontSize: 12, color: COLORS.mute, marginTop: 2 }}>
                {shop.follower_count != null
                  ? `${shop.follower_count.toLocaleString()} abonnés`
                  : ''}
              </Text>
            </View>

            {/* Message button */}
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('Chat', { sellerId: shop.seller_id })
              }
              style={{
                borderWidth: 1.5,
                borderColor: COLORS.primary,
                borderRadius: RADIUS.full,
                paddingHorizontal: 14,
                paddingVertical: 7,
              }}
            >
              <Text style={{ color: COLORS.primary, fontSize: 13, fontWeight: '700' }}>
                Message
              </Text>
            </TouchableOpacity>
          </View>

          {/* Description */}
          {shop.description ? (
            <Text
              numberOfLines={2}
              style={{ fontSize: 13, color: COLORS.mute, lineHeight: 18 }}
            >
              {shop.description}
            </Text>
          ) : null}
        </View>

        {/* ── FEATURED CATEGORIES ── */}
        {featuredCategories.length > 0 ? (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.sectionHeader}>Catégories</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 4 }}
            >
              {/* "Tous" chip */}
              <TouchableOpacity
                onPress={() => setSelectedCategoryId(null)}
                style={[
                  styles.categoryChip,
                  !selectedCategoryId && styles.categoryChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    !selectedCategoryId && styles.categoryChipTextActive,
                  ]}
                >
                  Tous
                </Text>
              </TouchableOpacity>
              {featuredCategories.map((cat) => {
                const isActive = selectedCategoryId === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setSelectedCategoryId(isActive ? null : cat.id)}
                    style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                  >
                    {cat.icon ? (
                      <Text style={{ fontSize: 14, marginRight: 4 }}>{cat.icon}</Text>
                    ) : null}
                    <Text
                      style={[
                        styles.categoryChipText,
                        isActive && styles.categoryChipTextActive,
                      ]}
                    >
                      {cat.name ?? cat.label ?? ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {/* ── FEATURED PRODUCTS (vendeur's selection) ── */}
        {featuredProducts.length > 0 ? (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.sectionHeader}>Sélection du vendeur</Text>
            <FlatList
              data={featuredProducts}
              keyExtractor={(item) => String(item.id)}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
              renderItem={({ item }) => (
                <ProductMiniCard
                  product={item}
                  onPress={() =>
                    navigation.navigate('Product', {
                      productId: item.id,
                      product: item,
                    })
                  }
                />
              )}
            />
          </View>
        ) : null}

        {/* ── ALL PRODUCTS GRID ── */}
        <View style={{ marginTop: 20 }}>
          <Text style={styles.sectionHeader}>
            Tous les produits ({visibleProducts.length})
          </Text>

          {visibleProducts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>🛍️</Text>
              <Text style={{ fontSize: 15, color: COLORS.mute, fontWeight: '500' }}>
                Aucun produit disponible
              </Text>
            </View>
          ) : (
            <View style={{ paddingHorizontal: 16 }}>
              {gridRows.map((row, rowIdx) => (
                <View
                  key={rowIdx}
                  style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}
                >
                  {row.map((product) => (
                    <ProductGridCard
                      key={product.id}
                      product={product}
                      onPress={() =>
                        navigation.navigate('Product', {
                          productId: product.id,
                          product,
                        })
                      }
                    />
                  ))}
                  {/* If odd row, fill with empty flex=1 view */}
                  {row.length === 1 ? <View style={{ flex: 1 }} /> : null}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── FIXED HEADER OVERLAY ── */}
      <SafeAreaView
        edges={['top']}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="box-none"
      >
        <View style={styles.headerBar} pointerEvents="box-none">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerIconBtn}
          >
            <Icon name="arrowLeft" size={20} color={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.headerIconBtn}>
            <Icon name="share" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  backBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: 24,
    paddingVertical: 10,
    marginTop: 8,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 4,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.32)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.ink,
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primarySoft,
    borderRadius: RADIUS.full,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  categoryChipTextActive: {
    color: COLORS.white,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
});
