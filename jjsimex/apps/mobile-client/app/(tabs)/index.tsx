import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  FlatList, Dimensions, RefreshControl, Modal, Pressable, SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Tag, Plane, BookOpen, Newspaper, Gift, Bell, ChevronDown,
  Package, ShoppingCart, Calculator, MapPin, Check, Share2,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { getMyPackages } from '@jjsimex/supabase/packages';
import { getExchangeRates, subscribeToExchangeRates } from '@jjsimex/supabase/shipping';
import type { ExchangeRate } from '@jjsimex/supabase/shipping';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PackageCard } from '@/components/ui/PackageCard';
import { CITIES_HT, CITIES_RD } from '@/lib/cities';

const { width } = Dimensions.get('window');
const ACCENT = '#F97316';

const STORIES = [
  { Icon: Tag, label: 'Offres', unread: true },
  { Icon: Plane, label: 'Départs', unread: true },
  { Icon: BookOpen, label: 'Guide', unread: true },
  { Icon: Newspaper, label: 'Nouvelles', unread: false },
  { Icon: Gift, label: 'Parrainage', unread: false },
];

const BANNERS = [
  { bg: '#1E1B4B', title: '15% de réduction\nsur le mode bateau', sub: 'Offre limitée — expire bientôt', cta: 'En profiter', ctaBg: '#FFFFFF', ctaColor: '#1E1B4B' },
  { bg: '#14532D', title: 'Nouvelle destination\nPunta Cana', sub: 'Livraisons disponibles dès maintenant', cta: 'Découvrir', ctaBg: '#FFFFFF', ctaColor: '#14532D' },
  { bg: '#7C2D12', title: 'Personal Shopper\ngratuit ce weekend', sub: 'Frais offerts pour toute commande +$50', cta: 'Commander', ctaBg: '#FFFFFF', ctaColor: '#7C2D12' },
];

const QUICK_ACTIONS = [
  { Icon: Package, label: 'Tracker\nun colis', route: '/(tabs)/colis' },
  { Icon: ShoppingCart, label: 'Personal\nShopper', route: '/screens/personal-shopper' },
  { Icon: Calculator, label: 'Calculateur\ntarifs', route: '/screens/calculateur' },
  { Icon: MapPin, label: 'Adresses\nUS', route: '/screens/adresses-us' },
];

const STATUS_STEPS = ['received_usa', 'in_transit', 'arrived', 'ready_pickup', 'delivered'];
const STATUS_LABELS: Record<string, string> = {
  received_usa: 'Reçu USA', in_transit: 'En transit', arrived: 'Arrivé', ready_pickup: 'Prêt retrait', delivered: 'Livré',
};

const LOYALTY_LABELS: Record<string, string> = {
  bronze: '🥉 Bronze', silver: '🥈 Argent', gold: '🥇 Or', platinum: '💎 Platine',
};
const LOYALTY_PCT: Record<string, number> = { bronze: 25, silver: 50, gold: 75, platinum: 100 };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Pkg = any;

export default function HomeScreen() {
  const router = useRouter();
  const { session, profile, updateDestination } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [cityModal, setCityModal] = useState(false);
  const [savingCity, setSavingCity] = useState(false);
  const [activePackage, setActivePackage] = useState<Pkg>(null);
  const [recentPackages, setRecentPackages] = useState<Pkg[]>([]);
  const [rates, setRates] = useState<ExchangeRate | null>(null);
  const [bannerDot, setBannerDot] = useState(0);

  async function loadData() {
    if (!session?.user.id) return;
    try {
      const result = await getMyPackages(session.user.id, { page: 1 });
      const pkgs: Pkg[] = Array.isArray(result) ? result : result.data ?? [];
      const active = pkgs.find((p: Pkg) => ['in_transit', 'arrived', 'ready_pickup', 'received_usa'].includes(p.status));
      setActivePackage(active ?? null);
      setRecentPackages(pkgs.slice(0, 3));
    } catch {}
  }

  useEffect(() => {
    getExchangeRates().then(setRates).catch(() => {});
    const unsub = subscribeToExchangeRates(setRates);
    return unsub;
  }, []);

  useEffect(() => { loadData(); }, [session?.user.id]);

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  const nameParts = profile?.full_name?.split(' ') ?? [];
  const firstName = nameParts[0] ?? 'vous';
  const initials = nameParts.length >= 2 ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase() : (nameParts[0]?.[0]?.toUpperCase() ?? '?');
  const loyalty = profile?.loyalty_level ?? 'bronze';
  const stepIdx = activePackage ? STATUS_STEPS.indexOf(activePackage.status) : -1;

  async function selectCity(country: 'haiti' | 'dr', city: string) {
    setSavingCity(true);
    await updateDestination(country, city);
    setSavingCity(false);
    setCityModal(false);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0D0D0D' }}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F97316" />}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View>
              <Text style={styles.greeting}>Bonjour {firstName} 👋</Text>
              <TouchableOpacity
                onPress={() => setCityModal(true)}
                style={styles.locationRow}
                activeOpacity={0.7}
              >
                <Text style={styles.location}>{profile?.destination_city ?? 'Choisir ma ville'}</Text>
                <ChevronDown size={14} color="#9CA3AF" strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/notifications')} style={styles.bellBtn}>
            <Bell size={22} color={ACCENT} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* STORIES */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesRow}>
          {STORIES.map((s, i) => (
            <TouchableOpacity key={i} style={styles.storyItem} activeOpacity={0.8}>
              <View style={[styles.storyCircle, s.unread && styles.storyCircleActive]}>
                <s.Icon size={24} color={ACCENT} strokeWidth={2} />
              </View>
              <Text style={styles.storyLabel}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* BANNERS */}
        <FlatList
          data={BANNERS}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, i) => String(i)}
          onMomentumScrollEnd={e => setBannerDot(Math.round(e.nativeEvent.contentOffset.x / (width - 48)))}
          style={{ marginHorizontal: 20 }}
          renderItem={({ item }) => (
            <View style={[styles.banner, { backgroundColor: item.bg, width: width - 48 }]}>
              <Text style={styles.bannerTitle}>{item.title}</Text>
              <Text style={styles.bannerSub}>{item.sub}</Text>
              <TouchableOpacity style={[styles.bannerBtn, { backgroundColor: item.ctaBg }]} activeOpacity={0.85}>
                <Text style={[styles.bannerBtnText, { color: item.ctaColor }]}>{item.cta}</Text>
              </TouchableOpacity>
            </View>
          )}
        />
        <View style={styles.dots}>
          {BANNERS.map((_, i) => (
            <View key={i} style={[styles.dot, i === bannerDot && styles.dotActive]} />
          ))}
        </View>

        {/* QUICK ACTIONS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <View style={styles.quickGrid}>
            {QUICK_ACTIONS.map((a, i) => (
              <TouchableOpacity key={i} onPress={() => router.push(a.route as never)} style={styles.quickCard} activeOpacity={0.8}>
                <View style={styles.quickIcon}>
                  <a.Icon size={24} color={ACCENT} strokeWidth={2} />
                </View>
                <Text style={styles.quickLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* TAUX DE CHANGE */}
        {rates && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Taux de change</Text>
            <View style={[styles.card, { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16 }]}>
              {[
                { label: '1 USD', value: `${rates.usd_to_htg?.toFixed(0)} HTG` },
                { label: '1 USD', value: `${rates.usd_to_dop?.toFixed(1)} DOP` },
                { label: '1 EUR', value: `${rates.eur_to_htg?.toFixed(0)} HTG` },
              ].map((r, i) => (
                <View key={i} style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>{r.label}</Text>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#F97316' }}>{r.value}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* COLIS ACTIF */}
        {activePackage && (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Colis en cours</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/colis')}><Text style={styles.seeAll}>Voir tout →</Text></TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={() => router.push(`/colis/${activePackage.id}`)}
              style={[styles.card, { borderColor: 'rgba(249,115,22,0.3)', borderWidth: 1 }]}
              activeOpacity={0.85}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
                <View>
                  <Text style={{ fontSize: 11, color: '#9CA3AF', letterSpacing: 0.5, textTransform: 'uppercase' }}>Tracking</Text>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#F97316', marginTop: 2 }}>{activePackage.tracking_number}</Text>
                </View>
                <StatusBadge status={activePackage.status} size="md" />
              </View>
              {/* Progress bar */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                {STATUS_STEPS.map((step, i) => (
                  <React.Fragment key={step}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: i <= stepIdx ? '#F97316' : '#2A2A2A' }} />
                    {i < STATUS_STEPS.length - 1 && <View style={{ flex: 1, height: 2, backgroundColor: i < stepIdx ? '#F97316' : '#2A2A2A' }} />}
                  </React.Fragment>
                ))}
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                {STATUS_STEPS.map((step, i) => (
                  <Text key={step} style={{ fontSize: 9, color: i <= stepIdx ? '#F97316' : '#6B7280', fontWeight: i === stepIdx ? '700' : '400', flex: 1, textAlign: i === 0 ? 'left' : i === STATUS_STEPS.length - 1 ? 'right' : 'center' }}>
                    {STATUS_LABELS[step]}
                  </Text>
                ))}
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* RECENT PACKAGES */}
        {recentPackages.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Expéditions récentes</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/colis')}><Text style={styles.seeAll}>Voir tout →</Text></TouchableOpacity>
            </View>
            <View style={styles.card}>
              {recentPackages.map((pkg: Pkg) => (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  variant="compact"
                  onPress={() => router.push(`/colis/${pkg.id}`)}
                />
              ))}
            </View>
          </View>
        )}

        {/* FIDÉLITÉ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Niveau fidélité</Text>
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>{LOYALTY_LABELS[loyalty] ?? loyalty}</Text>
              <Text style={{ fontSize: 13, color: '#F97316', fontWeight: '600' }}>{LOYALTY_PCT[loyalty] ?? 0}%</Text>
            </View>
            <View style={{ height: 8, backgroundColor: '#2A2A2A', borderRadius: 4, overflow: 'hidden' }}>
              <View style={{ width: `${LOYALTY_PCT[loyalty] ?? 0}%`, height: '100%', backgroundColor: '#F97316', borderRadius: 4 }} />
            </View>
            <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 8 }}>Continuez à expédier pour passer au niveau suivant</Text>
          </View>
        </View>

        {/* PARRAINAGE */}
        {profile?.referral_code && (
          <View style={[styles.section, { marginBottom: 30 }]}>
            <Text style={styles.sectionTitle}>Référer un ami</Text>
            <View style={[styles.card, { alignItems: 'center', gap: 12 }]}>
              <Text style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center' }}>Partagez votre code et gagnez des réductions</Text>
              <View style={{ backgroundColor: '#0D0D0D', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12, borderWidth: 1, borderColor: '#2A2A2A' }}>
                <Text style={{ fontSize: 20, fontWeight: '800', color: '#F97316', letterSpacing: 3 }}>{profile.referral_code}</Text>
              </View>
              <TouchableOpacity style={{ backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10, flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <Share2 size={16} color={ACCENT} strokeWidth={2} />
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>Partager via WhatsApp</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* BOTTOM SHEET — sélection de ville */}
      <Modal
        visible={cityModal}
        transparent
        animationType="slide"
        onRequestClose={() => setCityModal(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setCityModal(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Votre ville de retrait</Text>
            <Text style={styles.sheetSub}>Sélectionnez où vous récupérez vos colis</Text>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.sheetGroup}>🇭🇹 Haïti</Text>
              {CITIES_HT.map((c) => {
                const active = profile?.destination_city === c;
                return (
                  <TouchableOpacity key={c} style={styles.cityRow} onPress={() => selectCity('haiti', c)} disabled={savingCity}>
                    <Text style={[styles.cityName, active && { color: ACCENT, fontWeight: '700' }]}>{c}</Text>
                    {active && <Check size={18} color={ACCENT} strokeWidth={2.5} />}
                  </TouchableOpacity>
                );
              })}

              <Text style={[styles.sheetGroup, { marginTop: 8 }]}>🇩🇴 République Dominicaine</Text>
              {CITIES_RD.map((c) => {
                const active = profile?.destination_city === c;
                return (
                  <TouchableOpacity key={c} style={styles.cityRow} onPress={() => selectCity('dr', c)} disabled={savingCity}>
                    <Text style={[styles.cityName, active && { color: ACCENT, fontWeight: '700' }]}>{c}</Text>
                    {active && <Check size={18} color={ACCENT} strokeWidth={2.5} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingTop: 20, paddingBottom: 12 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#F97316', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#0D0D0D' },
  greeting: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  location: { fontSize: 12, color: '#9CA3AF' },
  bellBtn: { width: 40, height: 40, backgroundColor: '#1A1A1A', borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2A2A2A' },
  storiesRow: { paddingHorizontal: 20, paddingVertical: 16, gap: 16 },
  storyItem: { alignItems: 'center', gap: 8 },
  storyCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#2A2A2A' },
  storyCircleActive: { borderColor: '#F97316' },
  storyLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '600' },
  quickIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(249,115,22,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#161616', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 34 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#3A3A3A', alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  sheetSub: { fontSize: 13, color: '#9CA3AF', marginTop: 4, marginBottom: 12 },
  sheetGroup: { fontSize: 13, fontWeight: '700', color: '#9CA3AF', marginVertical: 8 },
  cityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#222' },
  cityName: { fontSize: 15, color: '#FFFFFF' },
  banner: { borderRadius: 16, padding: 20, marginRight: 12 },
  bannerTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', marginBottom: 6, lineHeight: 24 },
  bannerSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 16 },
  bannerBtn: { alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99 },
  bannerBtnText: { fontSize: 13, fontWeight: '700' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2A2A2A' },
  dotActive: { width: 18, backgroundColor: '#F97316' },
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#FFFFFF', marginBottom: 12 },
  seeAll: { fontSize: 13, color: '#F97316', fontWeight: '600' },
  card: { backgroundColor: '#1A1A1A', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#242424' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quickCard: { width: (width - 40 - 12) / 2, backgroundColor: '#1A1A1A', borderRadius: 16, padding: 16, alignItems: 'flex-start', borderWidth: 1, borderColor: '#242424' },
  quickLabel: { fontSize: 13, fontWeight: '700', color: '#FFFFFF', lineHeight: 19 },
});
