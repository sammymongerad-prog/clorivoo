import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image, Alert,
  ActivityIndicator, FlatList, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SHADOW } from '../../lib/tokens';
import { Btn, Avatar } from '../../components/UI';
import { getProduct, upsertCartItem, supabase } from '../../lib/supabase';
import { getShippingMethods } from '../../lib/cms';
import { useSession } from '../../hooks/useSession';
import { sendLocalNotification } from '../../lib/notifications';

const { width: SCREEN_W } = Dimensions.get('window');

// Strip HTML tags and decode common entities for clean display
function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ── Extract variant options embedded in plain-text description ───────
// CJ often writes "Color: Red, Blue\nSize: S, M, L" in the description.
// Returns { groups: { Color: [...], Size: [...] }, cleanText: "..." }
const VARIANT_KEYS = [
  'color', 'colour', 'couleur',
  'size', 'taille',
  'style', 'type', 'model', 'modèle', 'modele',
  'pattern', 'motif',
  'voltage', 'wattage', 'capacity', 'capacité',
  'length', 'longueur', 'width', 'largeur',
  'weight', 'poids',
  'quantity', 'quantité',
  'specification', 'spec',
];
// Keys that should stay in the description (not become selectors)
const DESC_ONLY_KEYS = ['material', 'matériau', 'matiere', 'matière', 'category', 'catégorie', 'packing', 'package', 'note', 'notice'];

function parseVariantsFromDescription(rawDesc) {
  if (!rawDesc) return { groups: {}, cleanText: '' };
  const text = stripHtml(rawDesc);
  const lines = text.split('\n');
  const groups = {};
  const keptLines = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) { keptLines.push(''); continue; }

    // Match "Key: val1, val2, val3" or "Key：val1、val2"
    const match = trimmed.match(/^([^:：]{1,30})[：:](.+)$/);
    if (match) {
      const key = match[1].trim();
      const keyLower = key.toLowerCase();
      const rawVals = match[2].trim();

      // Remove duplicate comma-separated values (CJ sometimes repeats same value)
      const vals = [...new Set(
        rawVals.split(/[,、;；]+/).map(v => v.trim()).filter(v => v.length > 0 && v.length < 80)
      )];

      if (VARIANT_KEYS.some(k => keyLower.includes(k)) && vals.length > 0 && vals.length <= 20) {
        // Capitalize key nicely
        const niceKey = key.charAt(0).toUpperCase() + key.slice(1);
        groups[niceKey] = vals;
        continue; // don't add to description
      }
      if (DESC_ONLY_KEYS.some(k => keyLower.includes(k))) {
        keptLines.push(trimmed);
        continue;
      }
    }

    // Remove noise lines
    const lower = trimmed.toLowerCase();
    if (
      lower === 'product information:' || lower === 'product information' ||
      lower === 'product image:' || lower === 'product image' ||
      lower === 'packing list:' || lower === 'package list:' ||
      (lower.startsWith('note:') && trimmed.length < 10)
    ) {
      keptLines.push(''); continue;
    }

    keptLines.push(trimmed);
  }

  const cleanText = keptLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  return { groups, cleanText };
}

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
// Handles both variantProperty ("Color:Red;Size:M") and variantKeyEn/variantValueEn formats
function getVariantProps(v) {
  if (v.variantProperty) {
    const props = {};
    v.variantProperty.split(';').forEach(pair => {
      const idx = pair.indexOf(':');
      if (idx !== -1) props[pair.slice(0, idx).trim()] = pair.slice(idx + 1).trim();
    });
    return props;
  }
  if (v.variantKeyEn && v.variantValueEn) {
    return { [v.variantKeyEn.trim()]: v.variantValueEn.trim() };
  }
  return null; // variant has no parseable properties → skip it
}

function findVariant(variants, selection) {
  if (!Array.isArray(variants) || variants.length === 0) return null;
  if (Object.keys(selection).length === 0) return variants[0] ?? null;
  return variants.find(v => {
    const props = getVariantProps(v);
    if (!props) return false; // skip variants with no parseable properties
    return Object.entries(selection).every(([k, val]) => props[k] === val);
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
            // For long color names (e.g. "Pink ball knife"), show a small image or colored chip instead of a circle
            const isLongName = val.length > 12;
            if (isLongName && !hex && !img) {
              // Show as chip with colored left border
              return (
                <TouchableOpacity key={val} onPress={() => onSelect(val)}
                  style={{
                    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
                    borderWidth: 1.5, borderLeftWidth: 4,
                    borderColor: isSelected ? COLORS.primary : COLORS.hairline,
                    borderLeftColor: isSelected ? COLORS.primary : '#aaa',
                    backgroundColor: isSelected ? COLORS.primarySoft : COLORS.white,
                  }}>
                  <Text style={{ fontSize: 12, fontWeight: isSelected ? '700' : '400', color: isSelected ? COLORS.primaryDeep : COLORS.mute }}>
                    {val}
                  </Text>
                </TouchableOpacity>
              );
            }
            return (
              <View key={val} style={{ alignItems: 'center', gap: 4 }}>
                <TouchableOpacity onPress={() => onSelect(val)}
                  style={{
                    width: 40, height: 40, borderRadius: 20,
                    borderWidth: isSelected ? 3 : 1.5,
                    borderColor: isSelected ? COLORS.primary : COLORS.hairline,
                    overflow: 'hidden',
                    alignItems: 'center', justifyContent: 'center',
                    backgroundColor: hex ?? '#E5E7EB',
                    ...SHADOW.sm,
                  }}>
                  {img
                    ? <Image source={{ uri: img }} style={{ width: 36, height: 36, borderRadius: 18 }} resizeMode="cover" />
                    : !hex
                      ? <Text style={{ fontSize: 9, textAlign: 'center', color: '#555' }} numberOfLines={2}>{val.slice(0, 6)}</Text>
                      : null
                  }
                </TouchableOpacity>
                {isSelected && (
                  <Text style={{ fontSize: 9, color: COLORS.primary, fontWeight: '600', maxWidth: 50, textAlign: 'center' }} numberOfLines={1}>{val}</Text>
                )}
              </View>
            );
          }
          // Generic chip (size, style, etc.)
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
  // Groups + clean text parsed from description when no CJ variants available
  const [descGroups, setDescGroups] = useState({});
  const [cleanDesc, setCleanDesc]   = useState(null);
  const [shippingMethods, setShippingMethods] = useState([]);

  // Fetch shipping methods on mount
  useEffect(() => {
    getShippingMethods().then(methods => { if (methods?.length) setShippingMethods(methods); });
  }, []);

  // Always reload full product from DB to get fresh variants/description/source fields
  useEffect(() => {
    if (!productId) return;
    getProduct(productId).then(p => {
      if (!p) return;
      setProduct(p);

      // 1. Try real CJ variant list
      const rawVariants = p.variants;
      if (Array.isArray(rawVariants) && rawVariants.length > 0) {
        applyVariants(rawVariants);
        // Also clean description even when we have real variants
        const { cleanText } = parseVariantsFromDescription(p.description);
        setCleanDesc(cleanText);
      } else if (p.cj_product_id) {
        // 2. Try fetching from CJ API
        fetchCJVariants(p.cj_product_id);
        // 3. Meanwhile, parse description as fallback for variant options
        const { groups, cleanText } = parseVariantsFromDescription(p.description);
        setDescGroups(groups);
        setCleanDesc(cleanText);
        // Pre-select first value of each desc group
        const defaults = {};
        Object.entries(groups).forEach(([k, vals]) => { defaults[k] = vals[0]; });
        if (Object.keys(defaults).length > 0) setSelection(defaults);
      } else {
        // Non-CJ product: still clean the description if it has embedded key:val lines
        const { groups, cleanText } = parseVariantsFromDescription(p.description);
        setDescGroups(groups);
        setCleanDesc(cleanText);
        const defaults = {};
        Object.entries(groups).forEach(([k, vals]) => { defaults[k] = vals[0]; });
        if (Object.keys(defaults).length > 0) setSelection(defaults);
      }
    });
  }, [productId]);

  function applyVariants(variants) {
    const groups = parseVariantGroups(variants);
    setVarGroups(groups);
    // Default: first value of each group
    const defaults = {};
    Object.entries(groups).forEach(([key, vals]) => { defaults[key] = vals[0]; });
    setSelection(defaults);
    // Build color image map — support both variantProperty and variantKeyEn formats
    const imgMap = {};
    const COLOR_KEYS = ['color', 'couleur', 'colour'];
    variants.forEach(v => {
      if (!v.variantImage) return;
      const props = getVariantProps(v);
      if (!props) return;
      Object.entries(props).forEach(([key, val]) => {
        if (COLOR_KEYS.includes(key.toLowerCase())) imgMap[val] = v.variantImage;
      });
    });
    setVarImages(imgMap);
  }

  async function fetchCJVariants(cjPid) {
    if (!cjPid) return;
    setVarLoading(true);
    try {
      const { data: cfg } = await supabase.from('app_config').select('value').eq('key', 'cj.apiKey').maybeSingle();
      let apiKey = null;
      try { apiKey = cfg?.value ? JSON.parse(cfg.value) : null; } catch { apiKey = cfg?.value ?? null; }
      if (!apiKey) {
        // No API key configured — variants can't be loaded from CJ
        setVarLoading(false);
        return;
      }

      const { getCJProduct } = await import('../../lib/cjapi');
      const detail = await getCJProduct(apiKey, cjPid);
      if (!detail) return;

      const variants  = detail.variantList ?? [];
      const allImages = (detail.productImageSet?.length
        ? detail.productImageSet
        : detail.productImage ? [detail.productImage] : []
      ).filter(Boolean);
      const description = detail.description ?? detail.productDescription ?? null;

      // Apply variants to UI, clear desc-based groups since we now have real ones
      if (variants.length > 0) {
        applyVariants(variants);
        setDescGroups({});
      }

      // Clean description text
      const { cleanText } = parseVariantsFromDescription(
        description ?? product.description
      );
      setCleanDesc(cleanText);

      // Update local product state with full data
      setProduct(prev => ({
        ...prev,
        ...(allImages.length > 0 ? { images: allImages } : {}),
        ...(description && !prev.description ? { description } : {}),
        variants,
      }));

      // Persist to DB so next open is instant
      const updates = { variants };
      if (allImages.length > 0) updates.images = allImages;
      if (description && !product.description) updates.description = description;
      await supabase.from('products').update(updates).eq('id', product.id);
    } catch (e) {
      console.warn('[ProductScreen] fetchCJVariants error:', e.message);
    } finally {
      setVarLoading(false);
    }
  }

  function selectAttr(key, val) {
    setSelection(prev => ({ ...prev, [key]: val }));
  }

  // Merge real CJ variant groups with those parsed from description
  // Real CJ groups take priority; desc groups fill in what's missing
  const activeGroups = Object.keys(varGroups).length > 0
    ? varGroups
    : descGroups;

  // Resolve current price from selected variant
  const activeVariant = findVariant(product?.variants ?? [], selection);
  const basePrice = +(product?.price ?? 0);

  function resolveVariantPrice(variant) {
    if (!variant) return null;
    // Prefer pre-computed sellPrice (markup already applied during import)
    if (variant.sellPrice && variant.sellPrice > 0) return parseFloat(variant.sellPrice);
    // Fall back: apply stored markup_percent to CJ base price
    const cjPrice = parseFloat(variant.cj_price ?? variant.variantPrice ?? 0);
    if (!cjPrice) return null;
    const markup = parseFloat(product?.markup_percent ?? 30);
    return parseFloat((cjPrice * (1 + markup / 100)).toFixed(2));
  }

  const displayPrice = resolveVariantPrice(activeVariant) ?? basePrice;

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
    const requiredGroups = Object.keys(activeGroups);
    if (requiredGroups.length > 0) {
      const missing = requiredGroups.filter(k => !selection[k]);
      if (missing.length > 0) {
        Alert.alert('Sélection requise', `Veuillez choisir : ${missing.join(', ')}`);
        return;
      }
    }
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
          {Object.entries(activeGroups).map(([key, vals]) => (
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
              <Text style={{ fontSize: 14, color: COLORS.mute, lineHeight: 22 }}>
                {(cleanDesc !== null ? cleanDesc : (product.description ? stripHtml(product.description) : '')) ||
                  'Produit importé depuis CJDropshipping. Qualité vérifiée par nos équipes.'}
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
                {(shippingMethods.length > 0 ? shippingMethods : [
                  { emoji: '🚚', name: 'Standard', estimated_days: '7 à 15 jours ouvrés', price: null, free_threshold: 30 },
                  { emoji: '⚡', name: 'Express',  estimated_days: '3 à 5 jours ouvrés',  price: 8.99, free_threshold: null },
                ]).map((m, i) => {
                  const priceLabel = m.free_threshold
                    ? `Gratuit dès $${m.free_threshold}`
                    : m.price != null ? `$${m.price}` : '';
                  return (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderWidth: 1.5, borderColor: COLORS.hairline, borderRadius: RADIUS.md }}>
                      <Text style={{ fontSize: 22 }}>{m.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: '600', color: COLORS.ink }}>{m.name}</Text>
                        <Text style={{ fontSize: 12, color: COLORS.mute }}>{m.estimated_days ?? m.description}</Text>
                      </View>
                      <Text style={{ fontWeight: '600', color: COLORS.ink }}>{priceLabel}</Text>
                    </View>
                  );
                })}
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
