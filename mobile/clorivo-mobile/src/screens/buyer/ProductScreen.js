import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image, Alert,
  ActivityIndicator, FlatList, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SHADOW } from '../../lib/tokens';
import { Btn, Avatar } from '../../components/UI';
import { getProduct, upsertCartItem, supabase } from '../../lib/supabase';
import { useSession } from '../../hooks/useSession';
import { sendLocalNotification } from '../../lib/notifications';

const { width: SCREEN_W } = Dimensions.get('window');

// ── Variant parsing ──────────────────────────────────────────────────
// CJ variant shape: { variantProperty: "Color:Red;Size:M", variantPrice, variantImage, vid, variantSku }
// Also supports: { variantKeyEn: "Color", variantValueEn: "Red" } (newer CJ format)
function parseVariantGroups(variants) {
  if (!Array.isArray(variants) || variants.length === 0) return {};
  const groups = {}; // { "Color": Set([...]), "Size": Set([...]) }

  for (const v of variants) {
    if (v.variantProperty) {
      v.variantProperty.split(';').forEach(pair => {
        const idx = pair.indexOf(':');
        if (idx === -1) return;
        const key = pair.slice(0, idx).trim();
        const val = pair.slice(idx + 1).trim();
        if (!key || !val) return;
        if (!groups[key]) groups[key] = [];
        if (!groups[key].includes(val)) groups[key].push(val);
      });
    } else if (v.variantKeyEn && v.variantValueEn) {
      const key = v.variantKeyEn.trim();
      const val = v.variantValueEn.trim();
      if (!groups[key]) groups[key] = [];
      if (!groups[key].includes(val)) groups[key].push(val);
    }
  }
  return groups;
}

// Find a variant entry matching the current selection map
function findVariant(variants, selection) {
  if (!Array.isArray(variants) || variants.length === 0) return null;
  return variants.find(v => {
    if (v.variantProperty) {
      const props = {};
      v.variantProperty.split(';').forEach(pair => {
        const idx = pair.indexOf(':');
        if (idx !== -1) props[pair.slice(0, idx).trim()] = pair.slice(idx + 1).trim();
      });
      return Object.entries(selection).every(([k, val]) => props[k] === val);
    }
    return true;
  }) ?? null;
}

// Try to map a color name to a CSS hex color
const COLOR_MAP = {
  red: '#E53935', rouge: '#E53935',
  blue: '#1E88E5', bleu: '#1E88E5',
  green: '#43A047', vert: '#43A047',
  black: '#212121', noir: '#212121',
  white: '#F5F5F5', blanc: '#F5F5F5', ivory: '#FFFFF0',
  yellow: '#FDD835', jaune: '#FDD835', gold: '#FFD700', doré: '#FFD700',
  orange: '#FB8C00',
  pink: '#E91E97', rose: '#E91E97',
  purple: '#8E24AA', violet: '#8E24AA',
  grey: '#9E9E9E', gray: '#9E9E9E', gris: '#9E9E9E',
  brown: '#795548', marron: '#795548',
  silver: '#B0BEC5', argent: '#B0BEC5',
  beige: '#F5F0DC',
  navy: '#283593',
  cyan: '#00BCD4',
};

function colorForName(name) {
  const lower = name.toLowerCase();
  for (const [key, hex] of Object.entries(COLOR_MAP)) {
    if (lower.includes(key)) return hex;
  }
  return null;
}

// ── Image Gallery ────────────────────────────────────────────────────
function ImageGallery({ images, discount }) {
  const [active, setActive] = useState(0);
  const flatRef = useRef(null);

  const imgs = Array.isArray(images) && images.length > 0 ? images : [null];

  return (
    <View style={{ height: 340, backgroundColor: COLORS.primarySoft }}>
      <FlatList
        ref={flatRef}
        data={imgs}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        onMomentumScrollEnd={e => setActive(Math.round(e.nativeEvent.contentOffset.x / SCREEN_W))}
        renderItem={({ item }) => (
          <View style={{ width: SCREEN_W, height: 340, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F8F8' }}>
            {item
              ? <Image source={{ uri: item }} style={{ width: SCREEN_W, height: 340 }} resizeMode="contain" />
              : <Text style={{ fontSize: 64 }}>🛍️</Text>
            }
          </View>
        )}
      />
      {/* Dots */}
      {imgs.length > 1 && (
        <View style={{ position: 'absolute', bottom: 12, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 5 }}>
          {imgs.map((_, i) => (
            <View key={i} style={{ width: i === active ? 18 : 6, height: 6, borderRadius: 3, backgroundColor: i === active ? COLORS.primary : 'rgba(0,0,0,0.25)' }} />
          ))}
        </View>
      )}
      {discount && (
        <View style={{ position: 'absolute', top: 16, right: 16, backgroundColor: '#FF3B30', borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4 }}>
          <Text style={{ fontSize: 12, fontWeight: '800', color: '#fff' }}>-{discount}%</Text>
        </View>
      )}
    </View>
  );
}

// ── Variant selector for ONE attribute group ─────────────────────────
function VariantGroup({ label, values, selected, onSelect, variantImages }) {
  const isColor = ['color', 'couleur', 'colour'].includes(label.toLowerCase());

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.ink, marginBottom: 10 }}>
        {label}
        {selected ? <Text style={{ fontWeight: '400', color: COLORS.mute }}> — {selected}</Text> : null}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {values.map(val => {
          const isSelected = selected === val;
          if (isColor) {
            const hex = colorForName(val);
            const img = variantImages?.[val];
            return (
              <TouchableOpacity key={val} onPress={() => onSelect(val)}
                style={{
                  width: 38, height: 38, borderRadius: 19,
                  borderWidth: isSelected ? 2.5 : 1.5,
                  borderColor: isSelected ? COLORS.primary : COLORS.hairline,
                  overflow: 'hidden',
                  alignItems: 'center', justifyContent: 'center',
                  backgroundColor: hex ?? COLORS.paper,
                  ...SHADOW.sm,
                }}>
                {img
                  ? <Image source={{ uri: img }} style={{ width: 34, height: 34, borderRadius: 17 }} resizeMode="cover" />
                  : !hex
                    ? <Text style={{ fontSize: 8 }} numberOfLines={1}>{val.slice(0, 3)}</Text>
                    : null
                }
              </TouchableOpacity>
            );
          }
          // Generic chip
          return (
            <TouchableOpacity key={val} onPress={() => onSelect(val)}
              style={{
                paddingHorizontal: 14, paddingVertical: 9,
                borderRadius: 10, borderWidth: 1.5,
                borderColor: isSelected ? COLORS.primary : COLORS.hairline,
                backgroundColor: isSelected ? COLORS.primarySoft : COLORS.white,
                minWidth: 44, alignItems: 'center',
              }}>
              <Text style={{ fontSize: 13, fontWeight: isSelected ? '700' : '400', color: isSelected ? COLORS.primaryDeep : COLORS.mute }}>
                {val}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ── Main screen ──────────────────────────────────────────────────────
export default function ProductScreen({ route, navigation }) {
  const { productId, product: initialProduct } = route.params ?? {};
  const session = useSession();

  const [product, setProduct]       = useState(initialProduct ?? null);
  const [activeTab, setActiveTab]   = useState(0);
  const [addedToCart, setAdded]     = useState(false);
  const [loading, setLoading]       = useState(false);
  const [varLoading, setVarLoading] = useState(false);

  // Parsed variant groups: { "Color": ["Red", "Blue"], "Size": ["S", "M"] }
  const [varGroups, setVarGroups] = useState({});
  // Current selection per attribute: { "Color": "Red", "Size": "S" }
  const [selection, setSelection] = useState({});
  // Per-color variant images: { "Red": "https://..." }
  const [varImages, setVarImages] = useState({});

  // Load full product if needed
  useEffect(() => {
    if (productId && !product) {
      getProduct(productId).then(p => p && setProduct(p));
    }
  }, [productId]);

  // Parse variants once product is available
  useEffect(() => {
    if (!product) return;
    const rawVariants = product.variants;
    if (Array.isArray(rawVariants) && rawVariants.length > 0) {
      applyVariants(rawVariants);
    } else if (product.source === 'cj' && product.cj_product_id) {
      // Fetch variants from CJ API for older imports
      fetchCJVariants(product.cj_product_id);
    }
  }, [product?.id]);

  function applyVariants(variants) {
    const groups = parseVariantGroups(variants);
    setVarGroups(groups);
    // Default: first value of each group
    const defaults = {};
    Object.entries(groups).forEach(([key, vals]) => { defaults[key] = vals[0]; });
    setSelection(defaults);
    // Build color image map
    const imgMap = {};
    variants.forEach(v => {
      if (!v.variantImage) return;
      if (v.variantProperty) {
        v.variantProperty.split(';').forEach(pair => {
          const idx = pair.indexOf(':');
          if (idx === -1) return;
          const key = pair.slice(0, idx).trim().toLowerCase();
          const val = pair.slice(idx + 1).trim();
          if (['color','couleur','colour'].includes(key)) imgMap[val] = v.variantImage;
        });
      }
    });
    setVarImages(imgMap);
  }

  async function fetchCJVariants(cjPid) {
    setVarLoading(true);
    try {
      // Get stored API key
      const { data: cfg } = await supabase.from('app_config').select('value').eq('key', 'cj.apiKey').maybeSingle();
      const apiKey = cfg?.value ? JSON.parse(cfg.value) : null;
      if (!apiKey) return;

      const { getCJProduct } = await import('../../lib/cjapi');
      const detail = await getCJProduct(apiKey, cjPid);
      if (!detail) return;

      const variants = detail.variantList ?? [];
      if (variants.length > 0) {
        applyVariants(variants);
        // Save to DB so next time is instant
        await supabase.from('products').update({ variants }).eq('id', product.id);
      }
    } catch (e) {
      console.warn('[ProductScreen] fetchCJVariants error:', e.message);
    } finally {
      setVarLoading(false);
    }
  }

  function selectAttr(key, val) {
    setSelection(prev => ({ ...prev, [key]: val }));
  }

  // Resolve current price from selected variant
  const activeVariant = findVariant(product?.variants ?? [], selection);
  const basePrice = +(product?.price ?? 0);
  const variantPrice = activeVariant?.variantPrice
    ? parseFloat(activeVariant.variantPrice) * (basePrice / (parseFloat(product?.variants?.[0]?.variantPrice ?? basePrice) || basePrice))
    : null;
  const displayPrice = variantPrice ?? basePrice;

  const discount = product?.compare_price && product.compare_price > displayPrice
    ? Math.round((1 - displayPrice / product.compare_price) * 100) : null;

  // Gallery images: if selected color has a variant image, prepend it
  const colorKey = Object.keys(varGroups).find(k => ['color','couleur','colour'].includes(k.toLowerCase()));
  const colorVal = colorKey ? selection[colorKey] : null;
  const colorImg = colorVal ? varImages[colorVal] : null;
  let galleryImages = Array.isArray(product?.images) ? product.images : [];
  if (colorImg && !galleryImages.includes(colorImg)) {
    galleryImages = [colorImg, ...galleryImages];
  }

  async function addToCart() {
    if (!session?.user) { Alert.alert('Connexion requise', 'Connectez-vous pour ajouter au panier.'); return; }
    setLoading(true);
    const variantData = Object.keys(selection).length > 0 ? selection : null;
    await upsertCartItem(session.user.id, product.id, variantData, 1, displayPrice);
    setLoading(false);
    setAdded(true);
    await sendLocalNotification('Ajouté au panier 🛒', `${product.title} a été ajouté à votre panier.`);
    setTimeout(() => setAdded(false), 2000);
  }

  if (!product) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={COLORS.primary} size="large" />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }} edges={['top']}>
      {/* Back button floating */}
      <TouchableOpacity onPress={() => navigation.goBack()}
        style={{ position: 'absolute', top: 56, left: 16, zIndex: 99, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center', ...SHADOW.sm }}>
        <Text style={{ fontSize: 16 }}>←</Text>
      </TouchableOpacity>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 110 }}>
        {/* Gallery */}
        <ImageGallery images={galleryImages} discount={discount} />

        <View style={{ padding: 20, gap: 14 }}>
          {/* Price + title */}
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
              <Text style={{ fontSize: 26, fontWeight: '700', color: COLORS.primary }}>${displayPrice.toFixed(2)}</Text>
              {product.compare_price > displayPrice && (
                <Text style={{ fontSize: 15, color: COLORS.mute, textDecorationLine: 'line-through' }}>${(+product.compare_price).toFixed(2)}</Text>
              )}
            </View>
            <Text style={{ fontSize: 17, fontWeight: '600', color: COLORS.ink, lineHeight: 24, marginBottom: 8 }}>{product.title}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ color: '#F59E0B', fontSize: 14 }}>{'★'.repeat(Math.round(product.rating ?? 4))}</Text>
              <Text style={{ fontSize: 13, color: COLORS.mute }}>
                {product.rating ?? 4.5} · {(product.reviews_count ?? 0).toLocaleString()} avis
              </Text>
            </View>
          </View>

          {/* Variant selectors */}
          {varLoading && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={{ fontSize: 12, color: COLORS.mute }}>Chargement des options…</Text>
            </View>
          )}
          {Object.entries(varGroups).map(([key, vals]) => (
            <VariantGroup
              key={key}
              label={key}
              values={vals}
              selected={selection[key]}
              onSelect={val => selectAttr(key, val)}
              variantImages={varImages}
            />
          ))}

          {/* Seller strip */}
          <TouchableOpacity
            onPress={() => product.shops?.id && navigation.navigate('Shop', { shopId: product.shops.id })}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderWidth: 1.5, borderColor: COLORS.hairline, borderRadius: RADIUS.md }}>
            <Avatar size={40} initials={(product.shops?.name?.[0] ?? 'C').toUpperCase()} bg={COLORS.primarySoft} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.ink }}>{product.shops?.name ?? 'Clorivo'}</Text>
                {product.shops?.is_verified && (
                  <View style={{ backgroundColor: '#EFF9F4', borderRadius: RADIUS.full, paddingHorizontal: 6, paddingVertical: 2, flexDirection: 'row', gap: 3, alignItems: 'center' }}>
                    <Text style={{ fontSize: 10, color: COLORS.success }}>✓</Text>
                    <Text style={{ fontSize: 10, fontWeight: '600', color: COLORS.success }}>Vérifié</Text>
                  </View>
                )}
              </View>
              <Text style={{ fontSize: 12, color: COLORS.mute }}>{product.shops?.followers ?? 0} abonnés</Text>
            </View>
            <Text style={{ fontSize: 16, color: COLORS.mute }}>›</Text>
          </TouchableOpacity>

          {/* Delivery */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {[
              { emoji: '🚚', text: 'Livraison gratuite dès $30' },
              { emoji: '📦', text: 'Expédition sous 2 à 7 jours' },
            ].map((info, i) => (
              <View key={i} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, backgroundColor: COLORS.paper, borderRadius: RADIUS.sm }}>
                <Text>{info.emoji}</Text>
                <Text style={{ fontSize: 11, color: COLORS.mute, lineHeight: 15, flex: 1 }}>{info.text}</Text>
              </View>
            ))}
          </View>

          {/* Tabs */}
          <View>
            <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.hairline, marginBottom: 14 }}>
              {['Description', 'Avis', 'Livraison'].map((t, i) => (
                <TouchableOpacity key={i} onPress={() => setActiveTab(i)}
                  style={{ flex: 1, height: 40, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: i === activeTab ? COLORS.primary : 'transparent' }}>
                  <Text style={{ fontSize: 14, fontWeight: i === activeTab ? '600' : '400', color: i === activeTab ? COLORS.ink : COLORS.mute }}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {activeTab === 0 && (
              <Text style={{ fontSize: 15, color: COLORS.mute, lineHeight: 24 }}>
                {product.description ?? 'Produit importé depuis CJDropshipping. Qualité vérifiée par nos équipes.'}
              </Text>
            )}

            {activeTab === 1 && (
              <View style={{ gap: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Text style={{ fontSize: 32, fontWeight: '700', color: COLORS.ink }}>{product.rating ?? '—'}</Text>
                  <View>
                    <Text style={{ color: '#F59E0B', fontSize: 16 }}>{'★'.repeat(5)}</Text>
                    <Text style={{ fontSize: 13, color: COLORS.mute }}>{(product.reviews_count ?? 0).toLocaleString()} avis</Text>
                  </View>
                </View>
                {product.reviews_count > 0
                  ? null
                  : <Text style={{ color: COLORS.mute, fontSize: 14 }}>Aucun avis pour l'instant.</Text>
                }
              </View>
            )}

            {activeTab === 2 && (
              <View style={{ gap: 12 }}>
                {[
                  { emoji: '🚚', title: 'Standard', detail: '7 à 15 jours ouvrés', price: 'Gratuit dès $30' },
                  { emoji: '⚡', title: 'Express',  detail: '3 à 5 jours ouvrés',  price: '$8.99' },
                ].map((m, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderWidth: 1.5, borderColor: COLORS.hairline, borderRadius: RADIUS.md }}>
                    <Text style={{ fontSize: 22 }}>{m.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: '600', color: COLORS.ink }}>{m.title}</Text>
                      <Text style={{ fontSize: 12, color: COLORS.mute }}>{m.detail}</Text>
                    </View>
                    <Text style={{ fontWeight: '600', color: COLORS.ink }}>{m.price}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: 28, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.hairline, flexDirection: 'row', gap: 10 }}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Chat', { productId: product.id, productTitle: product.title, sellerId: product.shops?.seller_id })}
          style={{ width: 50, height: 50, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.hairline, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 22 }}>💬</Text>
        </TouchableOpacity>
        <Btn style={{ flex: 1 }} variant="secondary" onPress={addToCart} disabled={loading}>
          {addedToCart ? '✓ Ajouté !' : 'Ajouter au panier'}
        </Btn>
        <Btn style={{ flex: 1 }} onPress={() => navigation.navigate('Cart')}>
          Acheter
        </Btn>
      </View>
    </SafeAreaView>
  );
}
