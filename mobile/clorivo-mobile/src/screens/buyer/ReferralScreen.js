import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Share, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, RADIUS } from '../../lib/tokens';
import { getProducts, supabase } from '../../lib/supabase';
import { useSession } from '../../hooks/useSession';

const MENU = [
  { icon: '👤', label: 'Mon\nprofil' },
  { icon: '🎥', label: 'Campagnes\nvidéos' },
  { icon: '🎁', label: 'Campagnes\nincitatives' },
  { icon: '💰', label: 'Revenus' },
  { icon: '🔗', label: 'Listes\naffilités' },
  { icon: '🤝', label: 'Collaborateurs' },
];

const FILTERS = ['Plus vendus', 'Catégories ▾', 'Tech', 'Mode', 'Maison'];

async function shareProduct(product) {
  try {
    await Share.share({
      message: `Découvrez "${product.name}" à ${Number(product.price).toFixed(2)}€ sur Clorivo ! 🛍️`,
    });
  } catch (_) {}
}

function ProductTile({ item }) {
  return (
    <View style={{ flex: 1, margin: 5, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#EBEBEB' }}>
      <View style={{ aspectRatio: 1, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {item.images?.[0] ? (
          <Image source={{ uri: item.images[0] }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <Text style={{ fontSize: 48 }}>🛍️</Text>
        )}
      </View>
      <View style={{ padding: 10 }}>
        <Text style={{ fontSize: 12, fontWeight: '600', color: '#1C1C1E', lineHeight: 17, marginBottom: 5 }} numberOfLines={2}>{item.name}</Text>
        {item.compare_price && item.compare_price > item.price && (
          <Text style={{ fontSize: 11, color: '#9CA3AF', textDecorationLine: 'line-through' }}>{Number(item.compare_price).toFixed(2)}€</Text>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2, marginBottom: 2 }}>
          <Text style={{ fontSize: 15, fontWeight: '800', color: '#1C1C1E' }}>{Number(item.price).toFixed(2)}€</Text>
          {item.compare_price && item.compare_price > item.price && (
            <View style={{ backgroundColor: '#DCFCE7', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#15803D' }}>-{Math.round((1 - item.price / item.compare_price) * 100)}%</Text>
            </View>
          )}
        </View>
        <Text style={{ fontSize: 10, color: '#6C4DFF', marginBottom: 10 }}>6x sans intérêts</Text>
        <TouchableOpacity onPress={() => shareProduct(item)}
          style={{ backgroundColor: '#EEF2FF', borderRadius: 8, paddingVertical: 9, alignItems: 'center' }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#6C4DFF' }}>Partager</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ReferralScreen({ navigation }) {
  const session = useSession();
  const [activeFilter, setActiveFilter] = useState(0);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [stats, setStats] = useState({ clicks: 0, orders: 0, earnings: 0 });

  const userId = session?.user?.id;
  const referralCode = userId ? 'CLORIVO-' + userId.slice(0, 6).toUpperCase() : 'CLORIVO-???';

  useEffect(() => {
    async function loadProducts() {
      try {
        const result = await getProducts({ limit: 6 });
        setProducts(result.data ?? []);
      } catch (e) {
      } finally {
        setLoadingProducts(false);
      }
    }
    loadProducts();
  }, []);

  useEffect(() => {
    if (!userId) return;
    async function loadStats() {
      try {
        const { data } = await supabase.from('referrals').select('*').eq('referrer_id', userId);
        if (data && data.length > 0) {
          setStats({
            clicks: data.length,
            orders: data.filter(r => r.status === 'converted').length,
            earnings: data.reduce((sum, r) => sum + (r.commission ?? 0), 0),
          });
        }
      } catch (e) {
        // table may not exist, keep defaults at 0
      }
    }
    loadStats();
  }, [userId]);

  const STATS_DISPLAY = [
    { label: 'Clics', value: String(stats.clicks) },
    { label: 'Commandes', value: String(stats.orders) },
    { label: 'Gains estimés', value: `${stats.earnings} €` },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F8FB' }}>

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#EBEBEB' }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
          <Text style={{ fontSize: 22, color: '#9CA3AF' }}>←</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '800', color: '#1C1C1E', flex: 1 }}>Programme Affilié</Text>
        <TouchableOpacity style={{ backgroundColor: '#6C4DFF', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 }}>
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Mon lien</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Referral code card */}
        <View style={{ margin: 16, marginBottom: 0, backgroundColor: '#EEF2FF', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#D1D5FB' }}>
          <Text style={{ fontSize: 12, color: '#6C4DFF', fontWeight: '600', marginBottom: 4 }}>Votre code de parrainage</Text>
          <Text style={{ fontSize: 20, fontWeight: '900', color: '#1C1C1E', letterSpacing: 2, fontFamily: 'monospace' }}>{referralCode}</Text>
        </View>

        {/* Stats card */}
        <View style={{ margin: 16, backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#EBEBEB', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#1C1C1E' }}>
              Vos performances{'  '}
              <Text style={{ fontSize: 12, fontWeight: '400', color: '#9CA3AF' }}>jusqu'au 01/06/2026</Text>
            </Text>
            <Text style={{ color: '#6C4DFF', fontSize: 18 }}>›</Text>
          </View>
          <View style={{ flexDirection: 'row' }}>
            {STATS_DISPLAY.map((s, i) => (
              <View key={i} style={{ flex: 1, alignItems: i === 0 ? 'flex-start' : 'center', borderLeftWidth: i > 0 ? 1 : 0, borderLeftColor: '#EBEBEB', paddingLeft: i > 0 ? 12 : 0 }}>
                <Text style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>{s.label}</Text>
                <Text style={{ fontSize: 22, fontWeight: '800', color: '#1C1C1E' }}>{s.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Menu */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 18, paddingBottom: 8, paddingTop: 4 }}>
          {MENU.map((m, i) => (
            <TouchableOpacity key={i} style={{ alignItems: 'center', gap: 8, width: 62 }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#EBEBEB' }}>
                <Text style={{ fontSize: 24 }}>{m.icon}</Text>
              </View>
              <Text style={{ fontSize: 10, color: '#1C1C1E', textAlign: 'center', lineHeight: 14, fontWeight: '500' }}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Promo banner */}
        <TouchableOpacity activeOpacity={0.9} style={{ margin: 16, borderRadius: 14, backgroundColor: '#F59E0B', padding: 20, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 10, fontWeight: '800', color: '#7C2D12', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
              PREMIERS PAS COMME AFFILIÉ
            </Text>
            <Text style={{ fontSize: 17, fontWeight: '900', color: '#1C1C1E', lineHeight: 23 }}>
              COMMENT COMMENCER{'\n'}À GAGNER DE L'ARGENT ?
            </Text>
          </View>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 38 }}>💸</Text>
          </View>
        </TouchableOpacity>

        {/* Products */}
        <View style={{ paddingHorizontal: 11 }}>
          <Text style={{ fontSize: 17, fontWeight: '800', color: '#1C1C1E', marginBottom: 12, paddingHorizontal: 5 }}>
            Produits sélectionnés pour vous
          </Text>

          {/* Filters */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 14, paddingHorizontal: 5 }}>
            {FILTERS.map((f, i) => (
              <TouchableOpacity key={i} onPress={() => setActiveFilter(i)}
                style={{ paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: activeFilter === i ? '#6C4DFF' : '#EBEBEB', backgroundColor: activeFilter === i ? '#EEF2FF' : '#fff' }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: activeFilter === i ? '#6C4DFF' : '#1C1C1E' }}>{f}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* 2-col grid */}
          {loadingProducts ? (
            <View style={{ alignItems: 'center', paddingVertical: 24 }}>
              <ActivityIndicator size="large" color="#6C4DFF" />
            </View>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {products.map(item => (
                <View key={item.id} style={{ width: '50%' }}>
                  <ProductTile item={item} />
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
