import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { COLORS, RADIUS, SHADOW } from '../../lib/tokens';
import { supabase } from '../../lib/supabase';

const FALLBACK_COUPONS = [
  { id: 'c1', code: 'SAVE10EUR', discount_value: 10, discount_type: 'fixed', min_order_amount: 50, expires_at: '2025-06-30', usage_limit: null, usage_count: 0, is_active: true },
  { id: 'c2', code: 'FLASH15', discount_value: 15, discount_type: 'percent', min_order_amount: null, expires_at: '2025-07-15', usage_limit: null, usage_count: 0, is_active: true },
  { id: 'c3', code: 'BIENV5', discount_value: 5, discount_type: 'fixed', min_order_amount: null, expires_at: '2025-12-31', usage_limit: 1, usage_count: 0, is_active: true },
];

function formatValue(coupon) {
  if (coupon.discount_type === 'percent') return `-${coupon.discount_value}%`;
  return `-${coupon.discount_value}€`;
}

function formatExpiry(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch (_) {
    return dateStr;
  }
}

function buildCondition(coupon) {
  const parts = [];
  if (coupon.min_order_amount) parts.push(`Commande min. ${coupon.min_order_amount}€`);
  if (coupon.usage_limit === 1) parts.push('1 utilisation');
  return parts.join(' · ') || 'Valable sur toute la boutique';
}

function CouponCard({ coupon, faded }) {
  function copyCode() {
    Alert.alert('Copié !', `Le code ${coupon.code} a été copié.`);
  }

  const accentColor = faded ? COLORS.mute : (coupon.discount_type === 'percent' ? COLORS.primary : '#D97706');

  return (
    <View style={{
      backgroundColor: faded ? COLORS.paper : COLORS.white,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: faded ? COLORS.hairline : accentColor + '44',
      overflow: 'hidden',
      ...SHADOW.sm,
      opacity: faded ? 0.7 : 1,
    }}>
      {/* Top section */}
      <View style={{ flexDirection: 'row' }}>
        {/* Color stripe */}
        <View style={{ width: 8, backgroundColor: faded ? COLORS.hairline : accentColor }} />
        <View style={{ flex: 1, padding: 14 }}>
          {/* Value badge */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <View style={{ backgroundColor: faded ? COLORS.hairline : accentColor + '18', borderRadius: RADIUS.sm, paddingHorizontal: 12, paddingVertical: 6 }}>
              <Text style={{ fontSize: 22, fontWeight: '900', color: faded ? COLORS.mute : accentColor }}>{formatValue(coupon)}</Text>
            </View>
            {coupon.used && (
              <View style={{ backgroundColor: COLORS.mute + '22', borderRadius: RADIUS.sm, paddingHorizontal: 8, paddingVertical: 4 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.mute }}>UTILISÉ</Text>
              </View>
            )}
            {coupon.expired && (
              <View style={{ backgroundColor: COLORS.danger + '18', borderRadius: RADIUS.sm, paddingHorizontal: 8, paddingVertical: 4 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.danger }}>EXPIRÉ</Text>
              </View>
            )}
          </View>
          <Text style={{ fontSize: 12, color: faded ? COLORS.mute : COLORS.ink, marginBottom: 4 }}>{buildCondition(coupon)}</Text>
          {coupon.expires_at && (
            <Text style={{ fontSize: 11, color: COLORS.mute }}>Expire le {formatExpiry(coupon.expires_at)}</Text>
          )}
          {coupon.usage_limit && (
            <Text style={{ fontSize: 11, color: COLORS.mute, marginTop: 2 }}>{coupon.usage_count ?? 0} / {coupon.usage_limit} utilisations</Text>
          )}
        </View>
      </View>

      {/* Divider with notches */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 8 }}>
        <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.hairline, marginLeft: -14 }} />
        <View style={{ flex: 1, borderTopWidth: 1.5, borderColor: COLORS.hairline, borderStyle: 'dashed' }} />
        <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.hairline, marginRight: -14 }} />
      </View>

      {/* Code + copy button */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, paddingLeft: 22 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 13, color: COLORS.mute }}>Code :</Text>
          <Text style={{ fontSize: 15, fontWeight: '900', color: faded ? COLORS.mute : COLORS.ink, fontFamily: 'monospace', letterSpacing: 1 }}>{coupon.code}</Text>
        </View>
        {!faded && (
          <TouchableOpacity onPress={copyCode}
            style={{ backgroundColor: accentColor, borderRadius: RADIUS.sm, paddingHorizontal: 14, paddingVertical: 7 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>Copier</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function CouponsScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState(0);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase.from('coupons').select('*').eq('is_active', true);
        if (error || !data || data.length === 0) {
          setCoupons(FALLBACK_COUPONS);
        } else {
          setCoupons(data);
        }
      } catch (e) {
        setCoupons(FALLBACK_COUPONS);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const faded = activeTab > 0;

  const TABS = [
    { label: 'Disponibles', count: coupons.filter(c => !c.used && !c.expired).length },
    { label: 'Utilisés', count: coupons.filter(c => c.used).length },
    { label: 'Expirés', count: coupons.filter(c => c.expired).length },
  ];

  const displayedCoupons = activeTab === 0
    ? coupons.filter(c => !c.used && !c.expired)
    : activeTab === 1
    ? coupons.filter(c => c.used)
    : coupons.filter(c => c.expired);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.hairline }}>
        <TouchableOpacity onPress={() => navigation.goBack()}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
          <Text style={{ fontSize: 18, color: COLORS.primary }}>←</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '800', color: COLORS.ink, letterSpacing: -0.5, flex: 1 }}>Mes Coupons</Text>
        <Text style={{ fontSize: 20 }}>🎟️</Text>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}>
        {TABS.map((tab, i) => (
          <TouchableOpacity key={i} onPress={() => setActiveTab(i)}
            style={{ flex: 1, paddingVertical: 9, borderRadius: RADIUS.md, alignItems: 'center', backgroundColor: activeTab === i ? COLORS.primary : COLORS.paper, borderWidth: 1.5, borderColor: activeTab === i ? COLORS.primary : COLORS.hairline }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: activeTab === i ? '#fff' : COLORS.mute }}>{tab.label}</Text>
            <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: activeTab === i ? 'rgba(255,255,255,0.25)' : COLORS.hairline, alignItems: 'center', justifyContent: 'center', marginTop: 3 }}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: activeTab === i ? '#fff' : COLORS.mute }}>{tab.count}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 14 }}>
          {displayedCoupons.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Text style={{ fontSize: 36 }}>🎟️</Text>
              <Text style={{ fontSize: 16, color: COLORS.mute, marginTop: 12 }}>Aucun coupon dans cette catégorie</Text>
            </View>
          )}
          {displayedCoupons.map(coupon => (
            <CouponCard key={coupon.id} coupon={coupon} faded={faded} />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
