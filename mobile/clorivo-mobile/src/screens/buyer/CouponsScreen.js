import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { COLORS, RADIUS, SHADOW } from '../../lib/tokens';

const TABS = [
  { label: 'Disponibles', count: 3 },
  { label: 'Utilisés', count: 2 },
  { label: 'Expirés', count: 1 },
];

const COUPONS = {
  0: [
    { id: 'c1', code: 'SAVE10EUR', value: '-10€', condition: 'Commande min. 50€', expiry: '30 juin 2025', type: 'fixed' },
    { id: 'c2', code: 'FLASH15', value: '-15%', condition: 'Valable sur toute la boutique', expiry: '15 juil. 2025', type: 'percent' },
    { id: 'c3', code: 'BIENV5', value: '-5€', condition: 'Offre de bienvenue · 1 utilisation', expiry: '31 déc. 2025', type: 'fixed' },
  ],
  1: [
    { id: 'c4', code: 'PROMO20', value: '-20€', condition: 'Commande min. 100€', expiry: '1 juin 2025', type: 'fixed', used: true },
    { id: 'c5', code: 'ETE10', value: '-10%', condition: 'Collection été', expiry: '10 juin 2025', type: 'percent', used: true },
  ],
  2: [
    { id: 'c6', code: 'HIVER8', value: '-8€', condition: 'Commande min. 40€', expiry: '31 janv. 2025', type: 'fixed', expired: true },
  ],
};

function CouponCard({ coupon, faded }) {
  function copyCode() {
    Alert.alert('Copié !', `Le code ${coupon.code} a été copié.`);
  }

  const accentColor = faded ? COLORS.mute : (coupon.type === 'percent' ? COLORS.primary : '#D97706');

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
              <Text style={{ fontSize: 22, fontWeight: '900', color: faded ? COLORS.mute : accentColor }}>{coupon.value}</Text>
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
          <Text style={{ fontSize: 12, color: faded ? COLORS.mute : COLORS.ink, marginBottom: 4 }}>{coupon.condition}</Text>
          <Text style={{ fontSize: 11, color: COLORS.mute }}>Expire le {coupon.expiry}</Text>
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
  const faded = activeTab > 0;

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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 14 }}>
        {COUPONS[activeTab].map(coupon => (
          <CouponCard key={coupon.id} coupon={coupon} faded={faded} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
