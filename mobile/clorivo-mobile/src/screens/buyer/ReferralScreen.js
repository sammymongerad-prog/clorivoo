import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, RADIUS } from '../../lib/tokens';

const STATS = [
  { label: 'Clics',      value: '0' },
  { label: 'Commandes',  value: '0' },
  { label: 'Gains estimés', value: '0 $' },
];

const MENU = [
  { icon: '👤', label: 'Mon\nprofil' },
  { icon: '🎥', label: 'Campagnes\nvidéos' },
  { icon: '🎁', label: 'Campagnes\nincitatives' },
  { icon: '💰', label: 'Revenus' },
  { icon: '🔗', label: 'Listes\naffilités' },
  { icon: '🤝', label: 'Collaborateurs' },
];

const PRODUCTS = [
  { id: '1', name: 'Sneakers Air Pro Max Running', price: '89,99 $', original: '129,99 $', discount: '31% OFF', badge: 'OFFRE DU JOUR', badgeColor: COLORS.primary ?? '#6C4DFF', rating: 4.8, sold: '+2k vendus', bg: '#E8F4FD' },
  { id: '2', name: 'Parfum Odyssey Mandarin Sky Limited', price: '49,99 $', original: '99,99 $', discount: '50% OFF', badge: 'PLUS VENDU', badgeColor: '#FF6B00', rating: 4.9, sold: '+10k vendus', bg: '#FDF3E8' },
  { id: '3', name: 'Montre connectée Sport Pro', price: '79,99 $', original: null, discount: null, badge: 'PLUS VENDU', badgeColor: '#FF6B00', rating: 4.7, sold: '+5k vendus', bg: '#F0FDF4' },
  { id: '4', name: 'Écouteurs sans fil ANC 40h', price: '59,99 $', original: '89,99 $', discount: '33% OFF', badge: 'PLUS VENDU', badgeColor: '#FF6B00', rating: 4.9, sold: '+8k vendus', bg: '#FFF0F0' },
  { id: '5', name: 'Sac à dos imperméable 30L', price: '34,99 $', original: '54,99 $', discount: '36% OFF', badge: 'OFFRE DU JOUR', badgeColor: '#6C4DFF', rating: 4.6, sold: '+3k vendus', bg: '#F5F0FF' },
  { id: '6', name: 'Cafetière automatique programmable', price: '44,99 $', original: null, discount: null, badge: 'PLUS VENDU', badgeColor: '#FF6B00', rating: 4.8, sold: '+4k vendus', bg: '#FFFBEB' },
];

const FILTERS = ['Plus vendus', 'Catégories ▾', 'Tech', 'Mode', 'Maison'];

async function shareProduct(product) {
  try {
    await Share.share({
      message: `Découvrez "${product.name}" à ${product.price} sur Clorivo ! 🛍️`,
    });
  } catch (_) {}
}

function ProductTile({ item }) {
  return (
    <View style={{ flex: 1, margin: 5, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#EBEBEB' }}>
      <View style={{ aspectRatio: 1, backgroundColor: item.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 48 }}>🛍️</Text>
        <View style={{ position: 'absolute', bottom: 8, left: 8, backgroundColor: item.badgeColor, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 3 }}>
          <Text style={{ fontSize: 8, fontWeight: '800', color: '#fff', letterSpacing: 0.3 }}>{item.badge}</Text>
        </View>
      </View>
      <View style={{ padding: 10 }}>
        <Text style={{ fontSize: 12, fontWeight: '600', color: '#1C1C1E', lineHeight: 17, marginBottom: 5 }} numberOfLines={2}>{item.name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 5 }}>
          <Text style={{ fontSize: 11, color: '#F59E0B' }}>★</Text>
          <Text style={{ fontSize: 11, color: '#9CA3AF' }}>{item.rating} | {item.sold}</Text>
        </View>
        {item.original && (
          <Text style={{ fontSize: 11, color: '#9CA3AF', textDecorationLine: 'line-through' }}>{item.original}</Text>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2, marginBottom: 2 }}>
          <Text style={{ fontSize: 15, fontWeight: '800', color: '#1C1C1E' }}>{item.price}</Text>
          {item.discount && (
            <View style={{ backgroundColor: '#DCFCE7', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#15803D' }}>{item.discount}</Text>
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
  const [activeFilter, setActiveFilter] = useState(0);

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
            {STATS.map((s, i) => (
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
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {PRODUCTS.map(item => (
              <View key={item.id} style={{ width: '50%' }}>
                <ProductTile item={item} />
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
