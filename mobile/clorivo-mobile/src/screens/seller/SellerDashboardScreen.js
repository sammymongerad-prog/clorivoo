import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, RADIUS, SHADOW } from '../../lib/tokens';
import { getSellerStats, getSellerOrders, getProducts } from '../../lib/supabase';
import { useSession } from '../../hooks/useSession';
import Icon from '../../components/Icon';

function StatCard({ emoji, label, value, color }) {
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: 14, alignItems: 'flex-start', ...SHADOW.sm }}>
      <Text style={{ fontSize: 22, marginBottom: 6 }}>{emoji}</Text>
      <Text style={{ fontSize: 22, fontWeight: '800', color: color ?? COLORS.ink, letterSpacing: -0.5 }}>{value}</Text>
      <Text style={{ fontSize: 12, color: COLORS.mute, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

function MenuRow({ icon, label, onPress, accent }) {
  return (
    <TouchableOpacity onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 13, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: COLORS.hairline }}>
      <View style={{ width: 36, height: 36, borderRadius: RADIUS.sm, backgroundColor: accent ? accent + '20' : COLORS.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={18} color={accent ?? COLORS.primary} />
      </View>
      <Text style={{ flex: 1, fontSize: 14, fontWeight: '500', color: COLORS.ink }}>{label}</Text>
      <Icon name="chevronRight" size={16} color={COLORS.mute} />
    </TouchableOpacity>
  );
}

function SectionHeader({ label }) {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 18, paddingBottom: 6 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.mute, letterSpacing: 1, textTransform: 'uppercase' }}>{label}</Text>
    </View>
  );
}

export default function SellerDashboardScreen({ navigation }) {
  const session = useSession();
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    if (!session?.user) return;
    Promise.all([
      getSellerStats(session.user.id),
      getSellerOrders(session.user.id, 5),
    ]).then(([s, o]) => {
      setStats(s);
      setOrders(o ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [session]));

  if (loading) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={COLORS.primary} size="large" />
    </View>
  );

  const STATUS_COLOR = { pending: '#F59E0B', confirmed: COLORS.primary, shipped: '#3B82F6', delivered: COLORS.success };
  const STATUS_LABEL = { pending: 'En attente', confirmed: 'Confirmée', shipped: 'Expédiée', delivered: 'Livrée' };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.paper }} edges={['top']}>
      <View style={{ backgroundColor: COLORS.white, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.hairline, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 20, fontWeight: '800', color: COLORS.ink, letterSpacing: -0.5 }}>Tableau de bord</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddProduct')}
          style={{ backgroundColor: COLORS.primary, borderRadius: RADIUS.full, paddingHorizontal: 14, paddingVertical: 8, flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 16 }}>+</Text>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Produit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* KPI Stats */}
        <View style={{ padding: 16, gap: 10 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <StatCard emoji="💰" label="Revenus (30j)" value={`$${(stats?.revenue_30d ?? 0).toFixed(0)}`} color={COLORS.primary} />
            <StatCard emoji="📦" label="Commandes" value={stats?.orders_count ?? 0} />
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <StatCard emoji="🛍️" label="Produits actifs" value={stats?.products_count ?? 0} />
            <StatCard emoji="⭐" label="Note moyenne" value={`${(stats?.avg_rating ?? 4.8).toFixed(1)}`} color="#F59E0B" />
          </View>
        </View>

        {/* Recent orders mini preview */}
        {orders.length > 0 && (
          <View style={{ marginHorizontal: 16, marginBottom: 8, backgroundColor: COLORS.white, borderRadius: RADIUS.md, overflow: 'hidden', ...SHADOW.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: COLORS.hairline }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.ink }}>Dernières commandes</Text>
              <TouchableOpacity onPress={() => navigation.navigate('SellerOrders')}>
                <Text style={{ fontSize: 13, color: COLORS.primary }}>Voir tout</Text>
              </TouchableOpacity>
            </View>
            {orders.slice(0, 3).map(o => (
              <View key={o.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderBottomWidth: 1, borderBottomColor: COLORS.hairline }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.ink }}>#{o.id.slice(0, 8).toUpperCase()}</Text>
                  <Text style={{ fontSize: 12, color: COLORS.mute }}>{new Date(o.created_at).toLocaleDateString('fr-FR')}</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.primary }}>${Number(o.total_amount).toFixed(2)}</Text>
                <View style={{ backgroundColor: (STATUS_COLOR[o.status] ?? COLORS.mute) + '20', borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 3 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: STATUS_COLOR[o.status] ?? COLORS.mute }}>{STATUS_LABEL[o.status] ?? o.status}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Full navigation menu */}
        <View style={{ backgroundColor: COLORS.white, marginHorizontal: 16, borderRadius: RADIUS.md, overflow: 'hidden', ...SHADOW.sm }}>
          <SectionHeader label="Produits" />
          <MenuRow icon="package" label="Mes produits" onPress={() => navigation.navigate('SellerProducts')} />
          <MenuRow icon="tag" label="Remises par catégorie" onPress={() => navigation.navigate('CategoryDiscount')} />
          <MenuRow icon="upload" label="Import en masse" onPress={() => navigation.navigate('BulkUpload')} />
          <MenuRow icon="zap" label="Produits digitaux" onPress={() => navigation.navigate('DigitalProducts')} />
          <MenuRow icon="star" label="Avis produits" onPress={() => navigation.navigate('ProductReviews')} />

          <SectionHeader label="Gestion" />
          <MenuRow icon="truck" label="Commandes" onPress={() => navigation.navigate('SellerOrders')} />
          <MenuRow icon="store" label="Ma boutique" onPress={() => navigation.navigate('ShopSetup')} />
          <MenuRow icon="tag" label="Coupons" onPress={() => navigation.navigate('SellerCoupons')} accent="#10B981" />
          <MenuRow icon="help" label="Questions produits" onPress={() => navigation.navigate('ProductQueries')} accent="#3B82F6" />

          <SectionHeader label="Finances" />
          <MenuRow icon="creditCard" label="Historique paiements" onPress={() => navigation.navigate('PaymentHistory')} accent="#8B5CF6" />
          <MenuRow icon="arrowRight" label="Demande de retrait" onPress={() => navigation.navigate('Withdraw')} accent={COLORS.success} />
          <MenuRow icon="barChart" label="Commissions" onPress={() => navigation.navigate('CommissionHistory')} accent="#F59E0B" />

          <SectionHeader label="Contenu" />
          <MenuRow icon="film" label="Gérer les vidéos" onPress={() => navigation.navigate('ManageVideos')} accent="#EF4444" />
          <MenuRow icon="upload" label="Fichiers uploadés" onPress={() => navigation.navigate('UploadedFiles')} accent="#6366F1" />

          <SectionHeader label="Communication" />
          <MenuRow icon="message" label="Conversations" onPress={() => navigation.navigate('Messages')} accent="#0EA5E9" />
          <MenuRow icon="messageSquare" label="Support" onPress={() => navigation.navigate('SellerSupport')} accent="#F97316" />

          <SectionHeader label="Outils" />
          <MenuRow icon="edit" label="Mes notes" onPress={() => navigation.navigate('SellerNotes')} accent="#84CC16" />

          <View style={{ height: 4 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
