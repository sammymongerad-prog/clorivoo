import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  FlatList, Dimensions, RefreshControl, Platform, StatusBar,
  Modal, TextInput, KeyboardAvoidingView, Animated, PanResponder, Linking, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, ChevronDown, Tag, Plane, BookOpen, Newspaper, Gift, MapPin, Package, ShoppingCart, Calculator, MapPinned, ArrowLeftRight, Ship, Calendar, Check, Navigation, ChevronRight } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { getMyPackages } from '@jjsimex/supabase/packages';
import { getExchangeRates, subscribeToExchangeRates } from '@jjsimex/supabase/shipping';
import { getNextDepartures, subscribeToDepartures } from '@jjsimex/supabase/departures';
import { getActiveBranches, isBranchOpen, getClosingTime } from '@jjsimex/supabase/branches';
import type { ExchangeRate } from '@jjsimex/supabase/shipping';
import type { Departure } from '@jjsimex/supabase/departures';
import type { Branch } from '@jjsimex/supabase/branches';
import { StatusBadge } from '@/components/ui/StatusBadge';

const { width } = Dimensions.get('window');

const STORIES = [
  { Icon: Tag, label: 'Offres', unread: true },
  { Icon: Plane, label: 'Départs', unread: true },
  { Icon: BookOpen, label: 'Guide', unread: true },
  { Icon: Newspaper, label: 'Nouvelles', unread: false },
  { Icon: Gift, label: 'Parrainage', unread: false },
];

const BANNER_W = width * 0.88;
const BANNER_GAP = 12;
const BANNERS = [
  require('../../assets/images/banner/banner1.png'),
  require('../../assets/images/banner/banner2.png'),
  require('../../assets/images/banner/banner3.png'),
];

const QUICK_ACTIONS = [
  { Icon: Package, label: 'Tracker un colis', route: '/(tabs-client)/colis', darkIcon: true },
  { Icon: ShoppingCart, label: 'Personal Shopper', route: '/screens/personal-shopper' },
  { Icon: Calculator, label: 'Calculateur', route: '/screens/calculateur' },
  { Icon: MapPinned, label: 'Mes adresses US', route: '/screens/adresses-us', darkIcon: true },
];

const CITY_SECTIONS = [
  { flag: '\u{1F1ED}\u{1F1F9}', country: 'haiti', title: 'Haïti', cities: ['Port-au-Prince', 'Cap-Haïtien', 'Pétion-Ville', 'Les Cayes', 'Gonaïves', 'Jacmel'] },
  { flag: '\u{1F1E9}\u{1F1F4}', country: 'dr', title: 'Rép. Dom.', cities: ['Santo Domingo', 'Santiago', 'Punta Cana'] },
];

const STATUS_STEPS = ['awaiting_arrival', 'received_usa', 'in_transit', 'arrived', 'ready_pickup', 'delivered'];
const STATUS_LABELS: Record<string, string> = {
  awaiting_arrival: 'En attente', received_usa: 'Reçu USA', in_transit: 'En transit', arrived: 'Arrivé', ready_pickup: 'Prêt retrait', delivered: 'Livré',
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
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const STORY_KEYS = ['offers', 'departures', 'guide', 'news', 'sponsorship'];
  const ACTION_KEYS = ['track_package', 'personal_shopper', 'rate_calculator', 'my_us_addresses'];

  const statusLabel = (s: string) => {
    const map: Record<string, string> = { awaiting_arrival: t('status_awaiting'), received_usa: t('status_received'), in_transit: t('status_transit'), arrived: t('status_arrived'), ready_pickup: t('status_ready'), delivered: t('status_delivered') };
    return map[s] ?? s;
  };
  const [refreshing, setRefreshing] = useState(false);
  const [citySheetOpen, setCitySheetOpen] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [activePackage, setActivePackage] = useState<Pkg>(null);
  const [recentPackages, setRecentPackages] = useState<Pkg[]>([]);
  const [rates, setRates] = useState<ExchangeRate | null>(null);
  const [airDeparture, setAirDeparture] = useState<Departure | null>(null);
  const [seaDeparture, setSeaDeparture] = useState<Departure | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [bannerDot, setBannerDot] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [rateTabOpen, setRateTabOpen] = useState(false);
  const rateSlide = useRef(new Animated.Value(0)).current;
  const dragPos = useRef(new Animated.ValueXY({ x: width - 32, y: 300 })).current;
  const dragStartRef = useRef({ x: 0, y: 0 });
  const wasDragged = useRef(false);

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 5 || Math.abs(g.dy) > 5,
    onPanResponderGrant: () => {
      wasDragged.current = false;
      dragStartRef.current = { x: (dragPos.x as any)._value, y: (dragPos.y as any)._value };
    },
    onPanResponderMove: (_, g) => {
      if (Math.abs(g.dx) > 5 || Math.abs(g.dy) > 5) wasDragged.current = true;
      dragPos.setValue({ x: dragStartRef.current.x + g.dx, y: dragStartRef.current.y + g.dy });
    },
    onPanResponderRelease: () => {
      if (!wasDragged.current) {
        toggleRateTab();
      }
    },
  })).current;

  function toggleRateTab() {
    const toValue = rateTabOpen ? 0 : 1;
    setRateTabOpen(!rateTabOpen);
    Animated.spring(rateSlide, { toValue, useNativeDriver: true, tension: 80, friction: 12 }).start();
  }

  async function loadData() {
    if (!session?.user.id) return;
    try {
      const result = await getMyPackages(session.user.id, { page: 1 });
      const pkgs: Pkg[] = Array.isArray(result) ? result : result.data ?? [];
      const active = pkgs.find((p: Pkg) => ['awaiting_arrival', 'in_transit', 'arrived', 'ready_pickup', 'received_usa'].includes(p.status));
      setActivePackage(active ?? null);
      setRecentPackages(pkgs.slice(0, 3));
    } catch {}
    try {
      const { air, sea } = await getNextDepartures();
      setAirDeparture(air);
      setSeaDeparture(sea);
    } catch {}
    try {
      const b = await getActiveBranches();
      setBranches(b);
    } catch {}
    try {
      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .eq('is_read', false);
      setUnreadCount(count ?? 0);
    } catch {}
  }

  useEffect(() => {
    getExchangeRates().then(setRates).catch(() => {});
    const unsub = subscribeToExchangeRates(setRates);
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = subscribeToDepartures(() => {
      getNextDepartures().then(({ air, sea }) => {
        setAirDeparture(air);
        setSeaDeparture(sea);
      }).catch(() => {});
    });
    return unsub;
  }, []);

  useEffect(() => { loadData(); }, [session?.user.id]);

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  async function pickCity(country: string, city: string) {
    await updateDestination(country, city);
    setCitySheetOpen(false);
    setCitySearch('');
  }

  const nameParts = profile?.full_name?.split(' ') ?? [];
  const firstName = nameParts[0] ?? 'vous';
  const initials = nameParts.length >= 2 ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase() : (nameParts[0]?.[0]?.toUpperCase() ?? '?');
  const loyalty = profile?.loyalty_level ?? 'bronze';
  const stepIdx = activePackage ? STATUS_STEPS.indexOf(activePackage.status) : -1;

  const statusBarH = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 44;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F97316" />}
      >
        {/* HEADER */}
        <View style={[styles.header, { paddingTop: statusBarH + 18 }]}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Text style={[styles.avatarText, { color: colors.bg }]}>{initials}</Text>
            </View>
            <View>
              <Text style={[styles.greeting, { color: colors.text }]}>{t('hello')}, {firstName} 👋</Text>
              <TouchableOpacity onPress={() => setCitySheetOpen(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }} activeOpacity={0.7}>
                <MapPin size={13} color={colors.textSecondary} strokeWidth={2} />
                <Text style={[styles.location, { color: colors.textSecondary }]}>{profile?.destination_city ?? 'Port-au-Prince'}, {profile?.destination_country === 'dr' ? 'Rép. Dom.' : 'Haïti'}</Text>
                <ChevronDown size={13} color={colors.textSecondary} strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs-client)/notifications')} style={[styles.bellBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Bell size={22} color={colors.text} strokeWidth={1.8} />
            {unreadCount > 0 && <View style={styles.bellBadge}><Text style={styles.bellBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text></View>}
          </TouchableOpacity>
        </View>

        {/* STORIES */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesRow}>
          {STORIES.map((s, i) => (
            <TouchableOpacity key={i} style={styles.storyItem} activeOpacity={0.8}>
              <View style={[styles.storyCircle, { backgroundColor: colors.card, borderColor: colors.border }, s.unread && styles.storyCircleActive]}>
                <s.Icon size={26} color={s.unread ? '#F97316' : colors.textSecondary} strokeWidth={1.8} />
              </View>
              <Text style={[styles.storyLabel, { color: colors.textSecondary }]}>{t(STORY_KEYS[i])}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* BANNERS */}
        <FlatList
          data={BANNERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, i) => String(i)}
          snapToInterval={BANNER_W + BANNER_GAP}
          decelerationRate="fast"
          onMomentumScrollEnd={e => setBannerDot(Math.round(e.nativeEvent.contentOffset.x / (BANNER_W + BANNER_GAP)))}
          contentContainerStyle={{ paddingHorizontal: 20 }}
          renderItem={({ item }) => (
            <View style={{ width: BANNER_W, height: 140, borderRadius: 16, overflow: 'hidden', marginRight: BANNER_GAP }}>
              <Image source={item} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            </View>
          )}
        />
        <View style={styles.dots}>
          {BANNERS.map((_, i) => (
            <View key={i} style={[styles.dot, { backgroundColor: colors.border }, i === bannerDot && styles.dotActive]} />
          ))}
        </View>

        {/* QUICK ACTIONS */}
        <View style={styles.section}>
          <View style={styles.quickGrid}>
            {QUICK_ACTIONS.map((a, i) => (
              <TouchableOpacity key={i} onPress={() => router.push(a.route as never)} style={[styles.quickCard, { backgroundColor: colors.card, borderColor: colors.border }]} activeOpacity={0.8}>
                <View style={[styles.quickIconWrap, a.darkIcon && { backgroundColor: colors.card }]}>
                  <a.Icon size={22} color="#F97316" strokeWidth={1.8} />
                </View>
                <Text style={[styles.quickLabel, { color: colors.text }]}>{t(ACTION_KEYS[i])}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ─── NOUVEAUTÉS ─── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('whats_new')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            {/* Card 1: GIF animé */}
            <View style={{ width: 200, height: 220, borderRadius: 20, overflow: 'hidden' }}>
              <Image
                source={require('../../assets/images/card-flip.gif')}
                style={{ width: 200, height: 220 }}
                resizeMode="cover"
              />
            </View>

            {/* Card 2: Pickup */}
            <TouchableOpacity onPress={() => router.push('/screens/pickup')} style={{ width: 200, borderRadius: 16, backgroundColor: colors.card, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }} activeOpacity={0.85}>
              <View style={{ height: 160 }}>
                <Image source={require('../../assets/images/options/pickup.png')} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              </View>
              <View style={{ padding: 12 }}>
                <Text style={{ fontSize: 11, fontWeight: '500', color: colors.textSecondary, marginBottom: 4 }}>{t('service')}</Text>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>{t('home_pickup')}</Text>
              </View>
            </TouchableOpacity>

            {/* Card 3: Drop-off */}
            <TouchableOpacity onPress={() => router.push('/screens/dropoff')} style={{ width: 200, borderRadius: 16, backgroundColor: colors.card, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }} activeOpacity={0.85}>
              <View style={{ height: 160 }}>
                <Image source={require('../../assets/images/options/dropoff.png')} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              </View>
              <View style={{ padding: 12 }}>
                <Text style={{ fontSize: 11, fontWeight: '500', color: colors.textSecondary, marginBottom: 4 }}>{t('service')}</Text>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>{t('dropoff_points')}</Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* ─── SECTION 1: PROCHAIN DÉPART ─── */}
        {(() => {
          const formatDep = (dep: Departure | null, fallbackDays: number, fallbackCap: number) => {
            const d = dep ? new Date(dep.departure_date) : new Date(Date.now() + fallbackDays * 24 * 60 * 60 * 1000);
            const capacity = dep?.capacity_lbs ?? fallbackCap;
            const used = dep?.current_weight ?? 0;
            const remaining = capacity - used;
            const pct = (used / capacity) * 100;
            const urgent = pct > 80;
            const dayName = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][d.getDay()];
            const monthName = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'][d.getMonth()];
            return { dateStr: `${dayName} ${d.getDate()} ${monthName}`, remaining, pct, urgent };
          };
          const air = formatDep(airDeparture, 7, 500);
          const sea = formatDep(seaDeparture, 14, 8000);

          const renderCard = (mode: 'air' | 'sea', data: typeof air) => {
            const label = mode === 'air' ? t('airplane') : t('boat');
            const IconComp = mode === 'air' ? Plane : Ship;
            return (
              <View style={{
                flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 14,
                borderWidth: data.urgent ? 1.5 : 1, borderColor: data.urgent ? '#F97316' : colors.border,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <IconComp size={16} color={data.urgent ? '#F97316' : colors.textSecondary} strokeWidth={2} />
                  <Text style={{ fontSize: 13, fontWeight: '500', color: colors.textSecondary }}>{label}</Text>
                </View>
                <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 10 }}>{data.dateStr}</Text>
                <View style={{ height: 5, backgroundColor: colors.border, borderRadius: 99, overflow: 'hidden', marginBottom: 6 }}>
                  <View style={{ width: `${Math.max(Math.min(data.pct, 100), 3)}%`, height: '100%', backgroundColor: data.urgent ? '#F97316' : '#22C55E', borderRadius: 99 }} />
                </View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: data.urgent ? '#F97316' : '#22C55E', marginBottom: 10 }}>{data.remaining.toFixed(0)} {t('lbs_remaining')}</Text>
                <View style={{ backgroundColor: data.urgent ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10, alignSelf: 'flex-start' }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: data.urgent ? '#EF4444' : '#22C55E' }}>{data.urgent ? t('almost_full') : t('spots_available')}</Text>
                </View>
              </View>
            );
          };

          return (
            <View style={styles.section}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>{t('next_departure')}</Text>
                <TouchableOpacity><Text style={{ fontSize: 13, fontWeight: '600', color: '#F97316' }}>{t('view_calendar')}</Text></TouchableOpacity>
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {renderCard('air', air)}
                {renderCard('sea', sea)}
              </View>
            </View>
          );
        })()}

        {/* ─── SECTION 2: COLIS EN COURS ─── */}
        {activePackage && (() => {
          const origin = activePackage.origin ?? 'Miami';
          const dest = activePackage.destination_city ?? profile?.destination_city ?? '—';
          const mode = activePackage.transport_mode === 'sea' ? '🚢 Bateau' : '✈️ Avion';
          const weight = activePackage.weight_billed ?? activePackage.weight_real ?? '—';
          const estimated = activePackage.estimated_delivery ?? null;
          return (
            <View style={styles.section}>
              <View style={styles.sectionRow}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('active_package')}</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs-client)/colis')}><Text style={styles.seeAll}>{t('view_all')}</Text></TouchableOpacity>
              </View>
              <View style={{ backgroundColor: '#F97316', borderRadius: 16, padding: 18, gap: 14 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{t('tracking_number')}</Text>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: '#FFFFFF', marginTop: 2 }}>{activePackage.tracking_number}</Text>
                  </View>
                  <View style={{ backgroundColor: '#C2600A', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFFFFF' }}>{statusLabel(activePackage.status)}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#FFFFFF' }}>{origin}</Text>
                  <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>→</Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#FFFFFF' }}>{dest}</Text>
                </View>
                <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>{weight} lbs · {mode}</Text>
                {/* Timeline */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 0 }}>
                  {STATUS_STEPS.slice(0, 4).map((step, i) => {
                    const done = i <= stepIdx;
                    const labels = [t('received'), t('transit'), t('arrived'), t('delivered')];
                    return (
                      <React.Fragment key={step}>
                        <View style={{ alignItems: 'center', flex: 1 }}>
                          <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: done ? '#FFFFFF' : 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' }}>
                            {done && <Check size={12} color="#F97316" strokeWidth={3} />}
                          </View>
                          <Text style={{ fontSize: 9, color: done ? '#FFFFFF' : 'rgba(255,255,255,0.5)', marginTop: 4, fontWeight: done ? '700' : '400' }}>{labels[i]}</Text>
                        </View>
                        {i < 3 && <View style={{ flex: 1, height: 2, backgroundColor: i < stepIdx ? '#FFFFFF' : 'rgba(255,255,255,0.25)', marginBottom: 16 }} />}
                      </React.Fragment>
                    );
                  })}
                </View>
                {estimated && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Calendar size={14} color="rgba(255,255,255,0.7)" strokeWidth={2} />
                    <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>{t('estimated_delivery')} : {new Date(estimated).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</Text>
                  </View>
                )}
                <TouchableOpacity onPress={() => router.push(`/colis/${activePackage.id}`)} style={{ backgroundColor: '#FFFFFF', borderRadius: 12, height: 44, alignItems: 'center', justifyContent: 'center' }} activeOpacity={0.85}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#F97316' }}>{t('follow_detail')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })()}

        {/* ─── SECTION 3: RÉCENTS ─── */}
        {recentPackages.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('recent')}</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs-client)/colis')}><Text style={styles.seeAll}>{t('view_all')}</Text></TouchableOpacity>
            </View>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {recentPackages.map((pkg: Pkg, i: number) => {
                const statusColors: Record<string, { bg: string; text: string }> = {
                  awaiting_arrival: { bg: 'rgba(234,179,8,0.15)', text: '#EAB308' },
                  received_usa: { bg: 'rgba(156,163,175,0.2)', text: '#9CA3AF' },
                  in_transit: { bg: 'rgba(249,115,22,0.15)', text: '#F97316' },
                  arrived: { bg: 'rgba(59,130,246,0.15)', text: '#3B82F6' },
                  ready_pickup: { bg: 'rgba(249,115,22,0.15)', text: '#F97316' },
                  delivered: { bg: 'rgba(34,197,94,0.15)', text: '#22C55E' },
                };
                const sc = statusColors[pkg.status] ?? statusColors.received_usa;
                const desc = pkg.description ?? pkg.destination_city ?? '';
                return (
                  <TouchableOpacity key={pkg.id} onPress={() => router.push(`/colis/${pkg.id}`)} activeOpacity={0.7}
                    style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: colors.border, gap: 12 }}>
                    <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
                      <Package size={18} color={colors.textSecondary} strokeWidth={1.8} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>{pkg.tracking_number}</Text>
                      {desc ? <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }} numberOfLines={1}>{desc}</Text> : null}
                    </View>
                    <View style={{ backgroundColor: sc.bg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: sc.text }}>
                        {pkg.status === 'delivered' ? t('delivered_check') : statusLabel(pkg.status)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ─── SECTION 4: NOS SUCCURSALES ─── */}
        <View style={[styles.section, { marginBottom: 30 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>{t('our_branches')}</Text>
            <TouchableOpacity><Text style={{ fontSize: 13, fontWeight: '600', color: '#F97316' }}>{t('view_map')}</Text></TouchableOpacity>
          </View>
          <View style={{ gap: 10 }}>
            {branches.slice(0, 2).map((b, i) => {
              const open = isBranchOpen(b);
              const closeTime = getClosingTime(b);
              const isFirst = i === 0;
              const timeDistText = [
                closeTime && open ? `${t('closes_at')} ${closeTime}` : null,
                (b as any).distance ? `${(b as any).distance}` : null,
              ].filter(Boolean).join(' · ');
              return (
                <View key={b.id} style={{ backgroundColor: colors.card, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: isFirst ? 'rgba(249,115,22,0.15)' : colors.border, alignItems: 'center', justifyContent: 'center' }}>
                      <MapPin size={20} color={isFirst ? '#F97316' : colors.textSecondary} strokeWidth={1.8} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 6 }}>{b.name}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <View style={{ backgroundColor: open ? 'rgba(34,197,94,0.15)' : 'rgba(156,163,175,0.15)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                          <Text style={{ fontSize: 11, fontWeight: '600', color: open ? '#22C55E' : colors.textSecondary }}>{open ? t('open_now') : t('closed')}</Text>
                        </View>
                        {timeDistText ? (
                          <Text style={{ fontSize: 11, fontWeight: '500', color: colors.textSecondary }}>{timeDistText}</Text>
                        ) : null}
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      if (b.latitude && b.longitude) Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${b.latitude},${b.longitude}`);
                      else if (b.address) Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.address)}`);
                    }}
                    style={{ backgroundColor: colors.border, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10, marginLeft: 10 }} activeOpacity={0.7}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>{t('directions')}</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>

        {/* ─── LEGAL FOOTER ─── */}
        <View style={{ paddingHorizontal: 20, paddingVertical: 16, marginTop: 8 }}>
          <Text style={{ fontSize: 11, lineHeight: 16, color: colors.textSecondary, textAlign: 'center' }}>
            {t('legal_footer')}
          </Text>
          <TouchableOpacity onPress={() => Linking.openURL('https://jjsimex.com/conditions')} style={{ alignSelf: 'center', marginTop: 6 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#F97316', textDecorationLine: 'underline' }}>{t('shipping_terms')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* CITY PICKER BOTTOM SHEET */}
      <Modal visible={citySheetOpen} transparent animationType="slide" onRequestClose={() => setCitySheetOpen(false)}>
        <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={() => setCitySheetOpen(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <TouchableOpacity activeOpacity={1} onPress={() => {}}>
              <View style={[styles.sheetContainer, { backgroundColor: colors.card }]}>
                <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
                <Text style={[styles.sheetTitle, { color: colors.text }]}>{t('choose_city')}</Text>
                <TextInput
                  style={[styles.sheetInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                  placeholder={t('type_city')}
                  placeholderTextColor={colors.textMuted}
                  value={citySearch}
                  onChangeText={setCitySearch}
                  autoCapitalize="words"
                />
                <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
                  {CITY_SECTIONS.map(section => {
                    const filtered = section.cities.filter(c => c.toLowerCase().includes(citySearch.toLowerCase()));
                    if (filtered.length === 0) return null;
                    return (
                      <View key={section.country} style={{ marginBottom: 16 }}>
                        <Text style={[styles.sheetSectionTitle, { color: colors.textSecondary }]}>{section.flag} {section.title}</Text>
                        {filtered.map(c => (
                          <TouchableOpacity key={c} onPress={() => pickCity(section.country, c)} style={[styles.sheetCity, profile?.destination_city === c && styles.sheetCityActive]} activeOpacity={0.7}>
                            <Text style={[styles.sheetCityText, { color: colors.text }, profile?.destination_city === c && { color: '#F97316', fontWeight: '700' }]}>{c}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    );
                  })}
                </ScrollView>
                {citySearch.length > 0 && (
                  <TouchableOpacity onPress={() => pickCity(profile?.destination_country ?? 'haiti', citySearch)} style={styles.sheetConfirmBtn} activeOpacity={0.85}>
                    <Text style={styles.sheetConfirmText}>{t('confirm')} "{citySearch}"</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>

      {/* FLOATING EXCHANGE RATE TAB — draggable */}
      {rates && (
        <Animated.View
          {...panResponder.panHandlers}
          style={[styles.floatingWrap, { transform: dragPos.getTranslateTransform() }]}
        >
          <Animated.View style={[styles.floatingRow, {
            transform: [{ translateX: rateSlide.interpolate({ inputRange: [0, 1], outputRange: [0, -280] }) }],
          }]}>
            <View style={styles.floatingPanel}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 12 }}>
                {[
                  { currency: 'USD', value: rates.usd_to_htg?.toFixed(1), unit: 'HTG', up: true },
                  { currency: 'CAD', value: rates.cad_to_htg?.toFixed(1) ?? '—', unit: 'HTG', up: true },
                  { currency: 'EUR', value: rates.eur_to_htg?.toFixed(1), unit: 'HTG', up: true },
                  { currency: 'USD', value: rates.usd_to_dop?.toFixed(1), unit: 'DOP', up: false },
                ].map((r, i, arr) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ alignItems: 'center', paddingHorizontal: 14 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#9CA3AF' }}>{r.currency}</Text>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: '#FFFFFF', marginVertical: 1 }}>{r.value}</Text>
                      <Text style={{ fontSize: 10, fontWeight: '600', color: '#F97316' }}>{r.unit} {r.up ? '▲' : '▼'}</Text>
                    </View>
                    {i < arr.length - 1 && <View style={{ width: 1, height: 36, backgroundColor: colors.border }} />}
                  </View>
                ))}
              </ScrollView>
            </View>
            <View style={[styles.floatingTab, { backgroundColor: colors.card }]}>
              <ArrowLeftRight size={16} color="#F97316" strokeWidth={2} />
              <Text style={styles.floatingTabText}>USD</Text>
            </View>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingTop: 18, paddingBottom: 10 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F97316', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 17, fontWeight: '700', color: '#0D0D0D' },
  greeting: { fontSize: 19, fontWeight: '800', color: '#FFFFFF' },
  location: { fontSize: 13, color: '#9CA3AF' },
  bellBtn: { width: 44, height: 44, backgroundColor: '#1A1A1A', borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2A2A2A' },
  bellBadge: { position: 'absolute', top: -2, right: -2, backgroundColor: '#F97316', borderRadius: 9, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  bellBadgeText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF' },
  storiesRow: { paddingHorizontal: 20, paddingVertical: 14, gap: 18 },
  storyItem: { alignItems: 'center', gap: 8 },
  storyCircle: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#2A2A2A' },
  storyCircleActive: { borderColor: '#F97316' },
  storyLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2A2A2A' },
  dotActive: { width: 18, backgroundColor: '#F97316' },
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#FFFFFF', marginBottom: 12 },
  seeAll: { fontSize: 13, color: '#F97316', fontWeight: '600' },
  card: { backgroundColor: '#1A1A1A', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#242424' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickCard: { width: (width - 40 - 10) / 2, backgroundColor: '#1A1A1A', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 14, alignItems: 'flex-start', borderWidth: 1, borderColor: '#242424' },
  quickIconWrap: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(249,115,22,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  quickLabel: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheetContainer: { backgroundColor: '#141414', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#3A3A3A', alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 16 },
  sheetInput: { height: 48, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 12, color: '#FFFFFF', paddingHorizontal: 16, fontSize: 15, marginBottom: 16 },
  sheetSectionTitle: { fontSize: 14, fontWeight: '700', color: '#9CA3AF', marginBottom: 8 },
  sheetCity: { paddingVertical: 12, paddingHorizontal: 12, borderRadius: 10 },
  sheetCityActive: { backgroundColor: 'rgba(249,115,22,0.1)' },
  sheetCityText: { fontSize: 15, color: '#E5E7EB' },
  sheetConfirmBtn: { backgroundColor: '#F97316', borderRadius: 14, height: 50, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  sheetConfirmText: { fontSize: 15, fontWeight: '700', color: '#0D0D0D' },
  floatingWrap: { position: 'absolute', left: 0, top: 0, zIndex: 100 },
  floatingRow: { flexDirection: 'row', alignItems: 'center' },
  floatingTab: { width: 32, height: 80, backgroundColor: '#1A1A1A', borderLeftWidth: 2, borderLeftColor: '#F97316', borderTopLeftRadius: 12, borderBottomLeftRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 6 },
  floatingTabText: { fontSize: 10, fontWeight: '800', color: '#F97316', transform: [{ rotate: '-90deg' }] },
  floatingPanel: { width: 280, height: 80, backgroundColor: '#111827', borderTopLeftRadius: 16, borderBottomLeftRadius: 16, justifyContent: 'center', marginRight: -1 },
});
