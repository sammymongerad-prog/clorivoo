import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, FlatList, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SHADOW } from '../../lib/tokens';
import { ProductCard } from '../../components/UI';
import { getProducts, getCategories, getSubCategories } from '../../lib/supabase';
import Icon from '../../components/Icon';

const MAIN_CATS = [
  { label: 'Tout',     slug: null,      color: COLORS.primary },
  { label: 'Maison',   slug: 'maison',  color: '#C97B5A' },
  { label: 'Tech',     slug: 'tech',    color: '#4A6FD4' },
  { label: 'Beauté',   slug: 'beaute',  color: '#E67E22' },
  { label: 'Mode',     slug: 'mode',    color: '#9B59B6' },
  { label: 'Enfants',  slug: 'enfants', color: '#F59E0B' },
  { label: 'Sport',    slug: 'sport',   color: '#10B981' },
  { label: 'Électro',  slug: 'electro', color: '#3B82F6' },
];

const SUB_CATS_STATIC = {
  null:      ['Tendances', 'Nouveautés', 'Meilleures ventes', 'Promos'],
  maison:    ['Déco', 'Cuisine', 'Luminaire', 'Textile', 'Rangement'],
  tech:      ['Audio', 'Smartphones', 'Accessoires', 'Gaming'],
  beaute:    ['Soin', 'Maquillage', 'Parfum', 'Cheveux'],
  mode:      ['Femme', 'Homme', 'Sacs', 'Chaussures', 'Bijoux'],
  enfants:   ['Jouets', 'Vêtements', 'Puériculture'],
  sport:     ['Fitness', 'Plein air', 'Vélo'],
  electro:   ['TV & Son', 'Cuisine', 'Gros électro'],
};

const SORTS = ['Populaire', 'Prix ↑', 'Prix ↓', 'Nouveautés'];

export default function CategoriesScreen({ route, navigation }) {
  const initSlug = route.params?.categorySlug ?? null;
  const initCat  = MAIN_CATS.find(c => c.slug === initSlug) ?? MAIN_CATS[0];

  const [activeCat, setActiveCat]   = useState(initCat);
  const [activeSub, setActiveSub]   = useState(0);
  const [sort, setSort]             = useState(0);
  const [view, setView]             = useState('grid'); // 'grid' | 'list'
  const [products, setProducts]     = useState([]);
  const [subCats, setSubCats]       = useState(SUB_CATS_STATIC[initCat.slug] ?? SUB_CATS_STATIC[null]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');

  useEffect(() => {
    loadProducts(activeCat.slug);
    loadSubCats(activeCat.slug);
    setActiveSub(0);
  }, [activeCat.slug]);

  async function loadProducts(slug) {
    setLoading(true);
    const { data } = await getProducts({ categorySlug: slug ?? undefined, limit: 40 });
    let prods = data ?? [];
    if (sort === 1) prods = [...prods].sort((a, b) => a.price - b.price);
    else if (sort === 2) prods = [...prods].sort((a, b) => b.price - a.price);
    setProducts(prods);
    setLoading(false);
  }

  async function loadSubCats(slug) {
    setSubCats(SUB_CATS_STATIC[slug ?? null] ?? SUB_CATS_STATIC[null]);
  }

  useEffect(() => {
    let prods = [...products];
    if (sort === 1) prods.sort((a, b) => a.price - b.price);
    else if (sort === 2) prods.sort((a, b) => b.price - a.price);
    setProducts(prods);
  }, [sort]);

  const filtered = search
    ? products.filter(p => p.title?.toLowerCase().includes(search.toLowerCase()))
    : products;

  const catColor = activeCat.color ?? COLORS.primary;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.paper }} edges={['top']}>

      {/* ── HEADER ── */}
      <View style={{ backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.hairline }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8 }}>
          <TouchableOpacity onPress={() => navigation.goBack()}
            style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="arrowLeft" size={22} color={COLORS.ink} />
          </TouchableOpacity>
          {/* Search */}
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.paper, borderWidth: 1.5, borderColor: COLORS.hairline, borderRadius: RADIUS.full, paddingHorizontal: 14, height: 40 }}>
            <Icon name="search" size={16} color={COLORS.mute} />
            <TextInput
              value={search} onChangeText={setSearch}
              placeholder={`Rechercher dans ${activeCat.label}…`}
              placeholderTextColor={COLORS.mute}
              style={{ flex: 1, fontSize: 13, color: COLORS.ink }}
            />
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Cart')}
            style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="shoppingBag" size={22} color={COLORS.ink} />
          </TouchableOpacity>
        </View>

        {/* Category chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 12, paddingBottom: 10 }}>
          {MAIN_CATS.map((cat, i) => {
            const active = activeCat.slug === cat.slug;
            return (
              <TouchableOpacity key={i} onPress={() => setActiveCat(cat)}
                style={{ height: 32, paddingHorizontal: 14, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: active ? COLORS.primary : COLORS.white,
                  borderWidth: 1.5, borderColor: active ? COLORS.primary : COLORS.hairline }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: active ? '#fff' : COLORS.mute }}>{cat.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>

        {/* ── HERO BANNER ── */}
        <View style={{ margin: 12, borderRadius: 16, overflow: 'hidden', height: 96 }}>
          <View style={{ position: 'absolute', inset: 0, backgroundColor: catColor, opacity: 0.9 }} />
          <View style={{ position: 'absolute', right: -30, top: -30, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.1)' }} />
          <View style={{ position: 'absolute', left: -20, bottom: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.07)' }} />
          <View style={{ position: 'absolute', inset: 0, padding: 16, justifyContent: 'center' }}>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.5 }}>{activeCat.label}</Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
              {products.length} produits · jusqu'à -70%
            </Text>
          </View>
        </View>

        {/* ── SOUS-CATÉGORIES ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingBottom: 4 }}>
          {subCats.map((s, i) => (
            <TouchableOpacity key={i} onPress={() => setActiveSub(i)}
              style={{ height: 32, paddingHorizontal: 14, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center',
                backgroundColor: activeSub === i ? COLORS.primary : COLORS.white,
                borderWidth: 1.5, borderColor: activeSub === i ? COLORS.primary : COLORS.hairline }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: activeSub === i ? '#fff' : COLORS.mute }}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── SORT + VIEW TOGGLE ── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
            {SORTS.map((s, i) => (
              <TouchableOpacity key={i} onPress={() => setSort(i)}>
                <Text style={{ fontSize: 13, fontWeight: sort === i ? '700' : '500', color: sort === i ? COLORS.primary : COLORS.mute }}>
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity onPress={() => setView(v => v === 'grid' ? 'list' : 'grid')}
            style={{ width: 32, height: 32, borderWidth: 1.5, borderColor: COLORS.hairline, borderRadius: 8, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', marginLeft: 12 }}>
            <Icon name={view === 'grid' ? 'grid' : 'package'} size={16} color={COLORS.mute} />
          </TouchableOpacity>
        </View>

        {/* ── PRODUITS ── */}
        {loading ? (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}>
            <ActivityIndicator color={COLORS.primary} size="large" />
          </View>
        ) : filtered.length === 0 ? (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}>
            <Text style={{ fontSize: 36 }}>📭</Text>
            <Text style={{ fontSize: 15, color: COLORS.mute, marginTop: 12 }}>Aucun produit trouvé</Text>
          </View>
        ) : view === 'grid' ? (
          <View style={{ paddingHorizontal: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingBottom: 24 }}>
            {filtered.map(p => (
              <View key={p.id} style={{ width: '47%' }}>
                <ProductCard product={p} onPress={() => navigation.navigate('Product', { productId: p.id, product: p })} />
              </View>
            ))}
          </View>
        ) : (
          <View style={{ paddingHorizontal: 16, gap: 10, paddingBottom: 24 }}>
            {filtered.map(p => (
              <TouchableOpacity key={p.id} onPress={() => navigation.navigate('Product', { productId: p.id, product: p })}
                style={{ flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: RADIUS.md, overflow: 'hidden', ...SHADOW.sm }}>
                <View style={{ width: 100, height: 100, backgroundColor: COLORS.primarySoft }}>
                  {p.images?.[0]
                    ? <Image source={{ uri: p.images[0] }} style={{ width: 100, height: 100 }} resizeMode="cover" />
                    : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 28 }}>🛍️</Text></View>
                  }
                </View>
                <View style={{ flex: 1, padding: 12, justifyContent: 'space-between' }}>
                  <View>
                    <Text style={{ fontSize: 11, color: COLORS.mute, marginBottom: 2 }}>{p.shops?.name ?? ''}</Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.ink }} numberOfLines={2}>{p.title}</Text>
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.primary }}>${Number(p.price ?? 0).toFixed(2)}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
