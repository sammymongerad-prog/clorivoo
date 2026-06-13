import { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, NativeScrollEvent, NativeSyntheticEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { getMyPackages } from '@jjsimex/supabase/packages';
import type { PackageStatus } from '@jjsimex/supabase/packages';

// ─── Helpers ────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  received_usa:  { bg: '#2A2A2A', color: '#C9CDD3', label: 'Reçu USA' },
  in_transit:    { bg: 'rgba(249,115,22,0.18)', color: '#F97316', label: 'En transit' },
  arrived:       { bg: 'rgba(168,85,247,0.18)', color: '#A855F7', label: 'Arrivé' },
  ready_pickup:  { bg: 'rgba(6,182,212,0.18)', color: '#06B6D4', label: 'Prêt' },
  delivered:     { bg: '#22C55E', color: '#052E14', label: 'Livré ✓' },
  pending:       { bg: '#2A2A2A', color: '#C9CDD3', label: 'En attente' },
};

const STORIES = [
  { icon: '🏷️', label: 'Offres', unread: true },
  { icon: '✈️', label: 'Départs', unread: true },
  { icon: '📖', label: 'Guide', unread: true },
  { icon: '📰', label: 'Nouvelles', unread: false },
  { icon: '🎁', label: 'Parrainage', unread: false },
];

const BANNERS = [
  { bg: '#1E1B4B', btnBg: '#FFFFFF', btnColor: '#1E1B4B', title: '15% de réduction sur le mode bateau', sub: 'Offre limitée — expire bientôt', cta: 'En profiter' },
  { bg: '#14532D', btnBg: '#FFFFFF', btnColor: '#14532D', title: 'Nouvelle destination Punta Cana', sub: 'Livraisons disponibles dès maintenant', cta: 'Découvrir' },
  { bg: '#7C2D12', btnBg: '#FFFFFF', btnColor: '#7C2D12', title: 'Personal Shopper gratuit ce weekend', sub: 'Frais offerts pour toute commande +$50', cta: 'Commander' },
];

const QUICK_ACTIONS = [
  { icon: '📦', label: 'Tracker un colis', route: '/(tabs)/tracker' as const },
  { icon: '🛒', label: 'Personal Shopper', route: '/(tabs)/home' as const },
  { icon: '🧮', label: 'Calculateur', route: '/(tabs)/home' as const },
  { icon: '📍', label: 'Mes adresses US', route: '/(tabs)/home' as const },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Pkg = any;

export default function HomeScreen() {
  const router = useRouter();
  const { session, profile } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [activePackage, setActivePackage] = useState<Pkg>(null);
  const [recentPackages, setRecentPackages] = useState<Pkg[]>([]);
  const [bannerDot, setBannerDot] = useState(0);

  async function loadData() {
    if (!session?.user.id) return;
    try {
      const result = await getMyPackages(session.user.id, { page: 1 });
      const pkgs: Pkg[] = result.data;
      const active = pkgs.find(p => ['in_transit', 'arrived', 'ready_pickup', 'received_usa'].includes(p.status));
      setActivePackage(active ?? null);
      setRecentPackages(pkgs.slice(0, 3));
    } catch {
      // Non critique
    }
  }

  useEffect(() => { loadData(); }, [session?.user.id]);

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  function onBannersScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const x = e.nativeEvent.contentOffset.x;
    setBannerDot(Math.round(x / 270));
  }

  const firstName = profile?.first_name ?? 'vous';
  const suiteCode = profile?.suite_code ?? '—';

  return (
    <View style={styles.container}>
      {/* 1. HEADER FIXE */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(profile?.first_name?.[0] ?? '') + (profile?.last_name?.[0] ?? 'U')}
            </Text>
          </View>
          <View>
            <Text style={styles.greeting}>Bonjour, {firstName} 👋</Text>
            <View style={styles.locationRow}>
              <Text style={styles.locationText}>Port-au-Prince, Haïti</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.notifBtn} onPress={() => router.push('/(tabs)/colis' as any)}>
          <Text style={{ color: '#fff', fontSize: 18 }}>🔔</Text>
          <View style={styles.notifBadge}><Text style={styles.notifBadgeText}>3</Text></View>
        </TouchableOpacity>
      </View>

      {/* SCROLL */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F97316" />}
      >
        {/* 2. STORIES */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stories}>
          {STORIES.map((s, i) => (
            <TouchableOpacity key={i} style={styles.storyItem} activeOpacity={0.8}>
              <View style={[styles.storyCircle, { borderColor: s.unread ? '#F97316' : '#2E2E2E' }]}>
                <View style={[styles.storyInner, { backgroundColor: '#1A1A1A' }]}>
                  <Text style={{ fontSize: 20 }}>{s.icon}</Text>
                </View>
              </View>
              <Text style={[styles.storyLabel, { color: s.unread ? '#C9CDD3' : '#6B7280' }]}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 3. BANNIÈRES PROMO */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.banners}
          onScroll={onBannersScroll}
          scrollEventThrottle={16}
          decelerationRate="fast"
          snapToInterval={282}
        >
          {BANNERS.map((b, i) => (
            <View key={i} style={[styles.banner, { backgroundColor: b.bg }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerTitle}>{b.title}</Text>
                <Text style={styles.bannerSub}>{b.sub}</Text>
                <TouchableOpacity style={[styles.bannerBtn, { backgroundColor: b.btnBg }]}>
                  <Text style={[styles.bannerBtnText, { color: b.btnColor }]}>{b.cta}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.bannerImg}>
                <Text style={styles.bannerImgText}>img</Text>
              </View>
            </View>
          ))}
        </ScrollView>
        <View style={styles.bannerDots}>
          {BANNERS.map((_, i) => (
            <View key={i} style={[styles.bannerDot, i === bannerDot && styles.bannerDotActive]} />
          ))}
        </View>

        {/* 4. ACTIONS RAPIDES */}
        <View style={styles.quickGrid}>
          {QUICK_ACTIONS.map((a, i) => (
            <TouchableOpacity key={i} style={styles.quickCard} onPress={() => router.push(a.route)} activeOpacity={0.8}>
              <View style={styles.quickIcon}>
                <Text style={{ fontSize: 21 }}>{a.icon}</Text>
              </View>
              <Text style={styles.quickLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 5. TAUX DE CHANGE */}
        <View style={styles.rateCard}>
          <View style={styles.rateIcon}>
            <Text style={{ fontSize: 20 }}>↔️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rateMain}>1 USD = 132 HTG</Text>
            <Text style={styles.rateSub}>1 USD = 58.5 DOP</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <View style={styles.rateLive}>
              <View style={styles.rateDot} />
              <Text style={styles.rateLiveText}>En direct</Text>
            </View>
            <Text style={styles.rateTime}>Mis à jour il y a 5 min</Text>
          </View>
        </View>

        {/* 6. PROCHAIN DÉPART */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Prochain départ</Text>
          <TouchableOpacity><Text style={styles.sectionLink}>Voir calendrier →</Text></TouchableOpacity>
        </View>
        <View style={styles.departures}>
          {/* Avion */}
          <View style={[styles.departCard, { borderColor: '#F97316' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ color: '#F97316', fontSize: 17 }}>✈️</Text>
              <Text style={styles.departMode}>Avion</Text>
            </View>
            <Text style={styles.departDate}>Ven 14 Juin</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '70%', backgroundColor: '#F97316' }]} />
            </View>
            <Text style={[styles.departRemaining, { color: '#F97316' }]}>47 lbs restantes</Text>
            <View style={styles.departBadge}>
              <Text style={styles.departBadgeRed}>Bientôt complet !</Text>
            </View>
          </View>
          {/* Bateau */}
          <View style={[styles.departCard, { borderColor: '#2A2A2A' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ color: '#9CA3AF', fontSize: 17 }}>⛵</Text>
              <Text style={styles.departMode}>Bateau</Text>
            </View>
            <Text style={styles.departDate}>Lun 24 Juin</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '30%', backgroundColor: '#9CA3AF' }]} />
            </View>
            <Text style={[styles.departRemaining, { color: '#22C55E' }]}>320 lbs restantes</Text>
            <View style={styles.departBadge}>
              <Text style={styles.departBadgeGreen}>Places disponibles</Text>
            </View>
          </View>
        </View>

        {/* 7. COLIS EN COURS */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Colis en cours</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/colis')}><Text style={styles.sectionLink}>Voir tout →</Text></TouchableOpacity>
        </View>

        {activePackage ? (
          <TouchableOpacity
            style={styles.activePkg}
            onPress={() => router.push(`/colis/${activePackage.id}` as any)}
            activeOpacity={0.9}
          >
            <View style={styles.activePkgHeader}>
              <View>
                <Text style={styles.activePkgLabel}>Numéro de suivi</Text>
                <Text style={styles.activePkgId}>{activePackage.tracking_number}</Text>
              </View>
              <View style={styles.activePkgStatus}>
                <Text style={styles.activePkgStatusText}>
                  {STATUS_BADGE[activePackage.status]?.label ?? activePackage.status}
                </Text>
              </View>
            </View>

            <View style={styles.activePkgRoute}>
              <View style={{ flex: 1 }}>
                <Text style={styles.activePkgRouteLabel}>Départ</Text>
                <Text style={styles.activePkgRouteVal} numberOfLines={1}>Miami Warehouse</Text>
              </View>
              <Text style={{ color: '#1A0D02', fontWeight: '700' }}>→</Text>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={styles.activePkgRouteLabel}>Destination</Text>
                <Text style={styles.activePkgRouteVal} numberOfLines={1}>{activePackage.destination_city}</Text>
              </View>
            </View>

            <View style={styles.activePkgMeta}>
              <Text style={styles.activePkgMetaText}>{activePackage.weight_real} lbs</Text>
              <View style={styles.metaDot} />
              <Text style={styles.activePkgMetaText}>{activePackage.transport_mode === 'air' ? 'Avion' : 'Bateau'}</Text>
            </View>

            {/* Timeline 4 étapes */}
            <View style={styles.timeline}>
              {['Reçu', 'Transit', 'Arrivé', 'Livré'].map((step, i) => {
                const done = i <= ['received_usa', 'in_transit', 'arrived', 'ready_pickup', 'delivered'].indexOf(activePackage.status);
                return (
                  <View key={i} style={{ alignItems: 'center', flex: 1 }}>
                    <View style={[styles.timelineDot, done && styles.timelineDotDone]}>
                      {done && <Text style={{ color: '#F97316', fontSize: 9, fontWeight: '900' }}>✓</Text>}
                    </View>
                    <Text style={[styles.timelineLabel, { color: done ? '#1A0D02' : 'rgba(26,13,2,0.5)' }]}>{step}</Text>
                  </View>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.activePkgBtn}
              onPress={() => router.push(`/colis/${activePackage.id}` as any)}
            >
              <Text style={styles.activePkgBtnText}>Suivre en détail →</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ) : (
          <View style={[styles.activePkg, { alignItems: 'center', paddingVertical: 28 }]}>
            <Text style={{ color: 'rgba(26,13,2,0.6)', fontSize: 14 }}>Aucun colis en cours</Text>
          </View>
        )}

        {/* 8. RÉCENTS */}
        {recentPackages.length > 0 && (
          <>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Récents</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/colis')}><Text style={styles.sectionLink}>Voir tout →</Text></TouchableOpacity>
            </View>
            <View style={styles.recentList}>
              {recentPackages.map((pkg: Pkg) => {
                const badge = STATUS_BADGE[pkg.status] ?? STATUS_BADGE.pending;
                return (
                  <TouchableOpacity key={pkg.id} style={styles.recentCard} onPress={() => router.push(`/colis/${pkg.id}` as any)}>
                    <View style={styles.recentIcon}>
                      <Text style={{ color: '#9CA3AF', fontSize: 20 }}>📦</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.recentId}>{pkg.tracking_number}</Text>
                      <Text style={styles.recentSub} numberOfLines={1}>{pkg.destination_city}</Text>
                    </View>
                    <View style={[styles.recentBadge, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.recentBadgeText, { color: badge.color }]}>{badge.label}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* 9. SUCCURSALES */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Nos succursales</Text>
          <TouchableOpacity><Text style={styles.sectionLink}>Voir la carte →</Text></TouchableOpacity>
        </View>
        <View style={styles.recentList}>
          {[
            { name: 'Delmas 31, Port-au-Prince', time: 'Ferme à 18h00 · 2.3 km' },
            { name: 'Cap-Haïtien Centre', time: 'Ferme à 17h00 · 0.8 km' },
          ].map((b, i) => (
            <View key={i} style={styles.branchCard}>
              <View style={styles.branchIcon}>
                <Text style={{ color: '#F97316', fontSize: 20 }}>📍</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.branchName}>{b.name}</Text>
                <View style={styles.branchRow}>
                  <View style={styles.openBadge}><Text style={styles.openBadgeText}>Ouvert maintenant</Text></View>
                  <Text style={styles.branchTime}>{b.time}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.dirBtn}><Text style={styles.dirBtnText}>Itinéraire</Text></TouchableOpacity>
            </View>
          ))}
        </View>

        {/* 10. FIDÉLITÉ */}
        <View style={styles.loyaltyCard}>
          <View style={styles.loyaltyHeader}>
            <View style={styles.loyaltyLeft}>
              <View style={styles.loyaltyIcon}><Text style={{ fontSize: 19 }}>🏆</Text></View>
              <Text style={styles.loyaltyTitle}>Programme fidélité</Text>
            </View>
            <View style={styles.loyaltyLevel}><Text style={styles.loyaltyLevelText}>Bronze</Text></View>
          </View>
          <View style={styles.loyaltyLevels}>
            <Text style={styles.loyaltyLevelFrom}>Bronze</Text>
            <Text style={styles.loyaltyLevelTo}>Silver</Text>
          </View>
          <View style={styles.loyaltyBar}>
            <View style={styles.loyaltyFill} />
          </View>
          <Text style={styles.loyaltySub}>Encore 3 colis pour passer Silver</Text>
          <View style={styles.loyaltyTags}>
            {['5% de réduction', 'Priorité traitement', 'Support dédié'].map(t => (
              <View key={t} style={styles.loyaltyTag}><Text style={styles.loyaltyTagText}>{t}</Text></View>
            ))}
          </View>
        </View>

        {/* 11. PARRAINAGE */}
        <View style={styles.referralCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.referralTitle}>Parrainez un ami</Text>
            <Text style={styles.referralSub}>Gagnez $5 pour chaque ami inscrit</Text>
            <TouchableOpacity style={styles.referralCode}>
              <Text style={styles.referralCodeText}>{profile?.referral_code ?? 'JJI-CODE'}</Text>
              <Text style={{ color: '#9CA3AF', fontSize: 15 }}>⎘</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.referralShare}>
            <Text style={{ fontSize: 16 }}>💬</Text>
            <Text style={styles.referralShareText}>Partager</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },

  // Header
  header: {
    height: 76, backgroundColor: '#0D0D0D', borderBottomWidth: 1, borderBottomColor: '#161616',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 22, paddingTop: 20,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: '#1A1A1A',
    borderWidth: 1, borderColor: '#2A2A2A', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#F97316', fontWeight: '700', fontSize: 17 },
  greeting: { fontWeight: '700', fontSize: 17, color: '#FFFFFF', lineHeight: 21 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  locationText: { fontSize: 13, color: '#9CA3AF' },
  notifBtn: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: '#1A1A1A',
    borderWidth: 1, borderColor: '#2A2A2A', alignItems: 'center', justifyContent: 'center',
  },
  notifBadge: {
    position: 'absolute', top: 8, right: 9, minWidth: 16, height: 16, paddingHorizontal: 4,
    borderRadius: 99, backgroundColor: '#F97316', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#0D0D0D',
  },
  notifBadgeText: { color: '#0D0D0D', fontSize: 10, fontWeight: '700' },

  scroll: { flex: 1 },

  // Stories
  stories: { paddingHorizontal: 22, paddingTop: 18, gap: 16 },
  storyItem: { alignItems: 'center', gap: 6 },
  storyCircle: { width: 62, height: 62, borderRadius: 31, borderWidth: 2, padding: 3 },
  storyInner: { flex: 1, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  storyLabel: { fontSize: 11 },

  // Banners
  banners: { paddingHorizontal: 22, paddingTop: 20, gap: 12 },
  banner: {
    flexDirection: 'row', width: 270, borderRadius: 16,
    padding: 18, gap: 12,
  },
  bannerTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', lineHeight: 20 },
  bannerSub: { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 6 },
  bannerBtn: { marginTop: 'auto', alignSelf: 'flex-start', borderRadius: 99, paddingHorizontal: 14, paddingVertical: 8, marginTop: 12 },
  bannerBtnText: { fontSize: 12, fontWeight: '700' },
  bannerImg: {
    width: 64, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
  },
  bannerImgText: { fontSize: 9, color: 'rgba(255,255,255,0.5)' },
  bannerDots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12 },
  bannerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)' },
  bannerDotActive: { width: 18, backgroundColor: '#F97316' },

  // Quick actions
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, padding: 22, paddingTop: 22 },
  quickCard: {
    width: '47%', backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#1F1F1F',
    borderRadius: 16, padding: 18, gap: 14,
  },
  quickIcon: {
    width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(249,115,22,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  quickLabel: { fontWeight: '600', fontSize: 14, color: '#FFFFFF' },

  // Exchange rate
  rateCard: {
    marginHorizontal: 22, marginTop: 2, backgroundColor: '#1A1A1A',
    borderWidth: 1, borderColor: '#1F1F1F', borderRadius: 16,
    padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  rateIcon: {
    width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(249,115,22,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  rateMain: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  rateSub: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },
  rateLive: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  rateDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#22C55E' },
  rateLiveText: { fontSize: 11, fontWeight: '600', color: '#22C55E' },
  rateTime: { fontSize: 10, color: '#6B7280', marginTop: 3 },

  // Sections
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 22, marginTop: 26, marginBottom: 12 },
  sectionTitle: { fontWeight: '700', fontSize: 18, color: '#FFFFFF' },
  sectionLink: { fontFamily: undefined, fontSize: 13, fontWeight: '600', color: '#F97316' },

  // Departures
  departures: { flexDirection: 'row', gap: 12, paddingHorizontal: 22 },
  departCard: {
    flex: 1, backgroundColor: '#1A1A1A', borderWidth: 1, borderRadius: 16, padding: 14,
  },
  departMode: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },
  departDate: { fontSize: 15, fontWeight: '800', color: '#FFFFFF', marginTop: 10 },
  progressBar: { height: 4, borderRadius: 99, backgroundColor: '#2A2A2A', marginTop: 10, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 99 },
  departRemaining: { fontSize: 11, fontWeight: '600', marginTop: 8 },
  departBadge: { marginTop: 10 },
  departBadgeRed: { backgroundColor: 'rgba(239,68,68,0.14)', color: '#EF4444', fontSize: 11, fontWeight: '600', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 99, alignSelf: 'flex-start' },
  departBadgeGreen: { backgroundColor: 'rgba(34,197,94,0.14)', color: '#22C55E', fontSize: 11, fontWeight: '600', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 99, alignSelf: 'flex-start' },

  // Active package (orange card)
  activePkg: {
    marginHorizontal: 22, backgroundColor: '#F97316', borderRadius: 16, padding: 20,
    color: '#1A0D02',
  },
  activePkgHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  activePkgLabel: { fontSize: 12, fontWeight: '500', color: 'rgba(26,13,2,0.6)' },
  activePkgId: { fontWeight: '800', fontSize: 19, letterSpacing: -0.3, marginTop: 2, color: '#1A0D02' },
  activePkgStatus: { backgroundColor: '#C2600A', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99 },
  activePkgStatusText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  activePkgRoute: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18,
    padding: 12, backgroundColor: 'rgba(26,13,2,0.10)', borderRadius: 12,
  },
  activePkgRouteLabel: { fontSize: 11, color: 'rgba(26,13,2,0.55)' },
  activePkgRouteVal: { fontSize: 13, fontWeight: '600', color: '#1A0D02' },
  activePkgMeta: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 14, fontSize: 13 },
  activePkgMetaText: { fontSize: 13, fontWeight: '600', color: '#1A0D02' },
  metaDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(26,13,2,0.4)' },
  timeline: { flexDirection: 'row', marginTop: 20 },
  timelineDot: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.30)',
    alignItems: 'center', justifyContent: 'center',
  },
  timelineDotDone: { backgroundColor: '#FFFFFF' },
  timelineLabel: { fontSize: 11, fontWeight: '600', marginTop: 6 },
  activePkgBtn: {
    marginTop: 16, width: '100%', height: 46, borderRadius: 12,
    backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
  },
  activePkgBtnText: { color: '#F97316', fontWeight: '700', fontSize: 14 },

  // Recent packages
  recentList: { paddingHorizontal: 22, gap: 12 },
  recentCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#1A1A1A',
    borderWidth: 1, borderColor: '#1F1F1F', borderRadius: 16, padding: 14,
  },
  recentIcon: {
    width: 42, height: 42, borderRadius: 12, backgroundColor: '#222222',
    alignItems: 'center', justifyContent: 'center',
  },
  recentId: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  recentSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  recentBadge: { paddingHorizontal: 11, paddingVertical: 5, borderRadius: 99 },
  recentBadgeText: { fontSize: 11, fontWeight: '700' },

  // Branches
  branchCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#1A1A1A',
    borderWidth: 1, borderColor: '#1F1F1F', borderRadius: 16, padding: 14, marginBottom: 12,
  },
  branchIcon: {
    width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(249,115,22,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  branchName: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  branchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5 },
  openBadge: { backgroundColor: 'rgba(34,197,94,0.14)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  openBadgeText: { color: '#22C55E', fontSize: 10, fontWeight: '600' },
  branchTime: { fontSize: 11, color: '#6B7280' },
  dirBtn: { backgroundColor: '#2A2A2A', borderRadius: 10, paddingHorizontal: 13, paddingVertical: 9 },
  dirBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },

  // Loyalty
  loyaltyCard: {
    margin: 22, marginBottom: 0, backgroundColor: '#1A1A1A', borderWidth: 1,
    borderColor: '#1F1F1F', borderRadius: 16, padding: 18,
  },
  loyaltyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  loyaltyLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  loyaltyIcon: {
    width: 38, height: 38, borderRadius: 11, backgroundColor: 'rgba(249,115,22,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  loyaltyTitle: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  loyaltyLevel: { backgroundColor: '#F97316', paddingHorizontal: 11, paddingVertical: 5, borderRadius: 99 },
  loyaltyLevelText: { color: '#0D0D0D', fontSize: 11, fontWeight: '700' },
  loyaltyLevels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  loyaltyLevelFrom: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },
  loyaltyLevelTo: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  loyaltyBar: { height: 6, borderRadius: 99, backgroundColor: '#2A2A2A', marginTop: 8, overflow: 'hidden' },
  loyaltyFill: { width: '60%', height: '100%', borderRadius: 99, backgroundColor: '#F97316' },
  loyaltySub: { fontSize: 12, color: '#9CA3AF', marginTop: 10 },
  loyaltyTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  loyaltyTag: { backgroundColor: '#2A2A2A', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 },
  loyaltyTagText: { color: '#9CA3AF', fontSize: 11, fontWeight: '500' },

  // Referral
  referralCard: {
    margin: 22, marginTop: 14, backgroundColor: '#1A1A1A', borderWidth: 1,
    borderColor: '#1F1F1F', borderRadius: 16, padding: 18,
    flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  referralTitle: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  referralSub: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  referralCode: {
    marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#2A2A2A', borderRadius: 8, paddingHorizontal: 13, paddingVertical: 9,
    alignSelf: 'flex-start',
  },
  referralCodeText: { fontSize: 13, fontWeight: '700', color: '#F97316', letterSpacing: 0.5 },
  referralShare: {
    backgroundColor: '#F97316', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
    alignItems: 'center', gap: 6,
  },
  referralShareText: { color: '#0D0D0D', fontSize: 13, fontWeight: '700' },
});
