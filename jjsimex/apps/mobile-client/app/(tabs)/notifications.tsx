import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import Svg, { Path, Line, Polyline, Circle, Rect, Polygon } from 'react-native-svg';

// ─── Icon components ─────────────────────────────────────────────────────────

function IconPlane({ color = '#FFFFFF', size = 18 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
    </Svg>
  );
}

function IconBox({ color = '#FFFFFF', size = 18 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <Path d="m3.27 6.96 8.73 5.05 8.73-5.05" />
      <Path d="M12 22.08V12" />
    </Svg>
  );
}

function IconDollar({ color = '#FFFFFF', size = 18 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <Line x1="12" y1="1" x2="12" y2="23" />
      <Path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </Svg>
  );
}

function IconCheck({ color = '#FFFFFF', size = 18 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="20 6 9 17 4 12" />
    </Svg>
  );
}

function IconCart({ color = '#FFFFFF', size = 18 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="8" cy="21" r="1" />
      <Circle cx="19" cy="21" r="1" />
      <Path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </Svg>
  );
}

function IconTag({ color = '#FFFFFF', size = 18 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <Line x1="7" y1="7" x2="7" y2="7" />
    </Svg>
  );
}

function IconBell({ color = '#FFFFFF', size = 22 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </Svg>
  );
}

function IconSmallCheck({ color = '#052E14', size = 13 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="20 6 9 17 4 12" />
    </Svg>
  );
}

function IconX({ color = '#FFFFFF', size = 13 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <Line x1="18" y1="6" x2="6" y2="18" />
      <Line x1="6" y1="6" x2="18" y2="18" />
    </Svg>
  );
}

// Bottom nav icons
function IconHome({ color = '#666666' }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <Path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <Polyline points="9 22 9 12 15 12 15 22" />
    </Svg>
  );
}

function IconPackage({ color = '#666666' }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <Path d="m3.27 6.96 8.73 5.05 8.73-5.05" />
      <Path d="M12 22.08V12" />
    </Svg>
  );
}

function IconQr() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#0D0D0D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Rect x="3" y="3" width="7" height="7" rx="1" />
      <Rect x="14" y="3" width="7" height="7" rx="1" />
      <Rect x="3" y="14" width="7" height="7" rx="1" />
      <Line x1="14" y1="14" x2="14" y2="17" />
      <Line x1="21" y1="14" x2="21" y2="17" />
      <Line x1="14" y1="21" x2="17" y2="21" />
      <Line x1="21" y1="18" x2="21" y2="21" />
    </Svg>
  );
}

function IconUser({ color = '#666666' }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <Circle cx="12" cy="7" r="4" />
    </Svg>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Filter = 'all' | 'colis' | 'paiement' | 'promo' | 'systeme';

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const router = useRouter();
  const { } = useAuth();

  const [filter, setFilter] = useState<Filter>('all');
  const [allRead, setAllRead] = useState(false);

  const vis = (cat: Filter) => filter === 'all' || filter === cat;

  const showN1 = vis('colis');
  const showN2 = vis('colis');
  const showN3 = vis('paiement');
  const showN4 = vis('colis');
  const showN5 = vis('paiement');
  const showN6 = vis('promo');

  const showToday = showN1 || showN2 || showN3;
  const showYesterday = showN4 || showN5;
  const showWeek = showN6;
  const showEmpty = filter === 'systeme';

  const hasUnread = !allRead;

  const unreadCardStyle = {
    ...styles.card,
    borderLeftWidth: 3,
    borderLeftColor: allRead ? '#1F1F1F' : '#F97316',
  };

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: 'Tout' },
    { key: 'colis', label: 'Colis' },
    { key: 'paiement', label: 'Paiement' },
    { key: 'promo', label: 'Promotions' },
    { key: 'systeme', label: 'Système' },
  ];

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Notifications</Text>
          <TouchableOpacity onPress={() => setAllRead(true)}>
            <Text style={styles.markRead}>Tout marquer lu</Text>
          </TouchableOpacity>
        </View>

        {/* FILTER TABS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {filters.map(f => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[styles.filterTab, filter === f.key && styles.filterTabActive]}
            >
              <Text style={[styles.filterTabText, filter === f.key && styles.filterTabTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* SCROLL */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* AUJOURD'HUI */}
        {showToday && (
          <View>
            <Text style={styles.sectionLabel}>Aujourd'hui</Text>

            {/* N1: transit */}
            {showN1 && (
              <View style={unreadCardStyle}>
                {hasUnread && <View style={styles.unreadDot} />}
                <View style={styles.cardRow}>
                  <View style={[styles.iconCircle, { backgroundColor: '#F97316' }]}>
                    <IconPlane />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>Colis en transit</Text>
                    <Text style={styles.cardBody}>
                      Votre colis{' '}
                      <Text style={styles.highlight}>JJI-2025-00847</Text>
                      {' '}est en route vers Port-au-Prince. Arrivée estimée : 15 Juin 2025.
                    </Text>
                    <Text style={styles.cardTime}>Il y a 23 min</Text>
                    <TouchableOpacity style={styles.btnOrange}>
                      <Text style={styles.btnOrangeText}>Suivre mon colis →</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* N2: reçu Miami */}
            {showN2 && (
              <View style={unreadCardStyle}>
                {hasUnread && <View style={styles.unreadDot} />}
                <View style={styles.cardRow}>
                  <View style={[styles.iconCircle, { backgroundColor: '#22C55E' }]}>
                    <IconBox />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>Colis reçu à Miami</Text>
                    <Text style={styles.cardBody}>
                      Votre commande Nike{' '}
                      <Text style={styles.highlight}>JJI-2025-00834</Text>
                      {' '}est arrivée dans notre entrepôt. Poids : 1.8 lbs.
                    </Text>
                    <Text style={styles.cardTime}>Il y a 2h</Text>
                    <TouchableOpacity style={styles.btnDark}>
                      <Text style={styles.btnDarkText}>Voir les détails →</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* N3: paiement */}
            {showN3 && (
              <View style={unreadCardStyle}>
                {hasUnread && <View style={styles.unreadDot} />}
                <View style={styles.cardRow}>
                  <View style={[styles.iconCircle, { backgroundColor: '#2563EB' }]}>
                    <IconDollar />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>Paiement confirmé</Text>
                    <Text style={styles.cardBody}>
                      Votre paiement MonCash de{' '}
                      <Text style={styles.highlight}>$18.50</Text>
                      {' '}a été reçu pour JJI-2025-00847.
                    </Text>
                    <Text style={styles.cardTime}>Il y a 3h</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        {/* HIER */}
        {showYesterday && (
          <View>
            <Text style={[styles.sectionLabel, { marginTop: 18 }]}>Hier</Text>

            {/* N4: livré */}
            {showN4 && (
              <View style={[styles.card, styles.cardRead]}>
                <View style={styles.cardRow}>
                  <View style={[styles.iconCircle, { backgroundColor: '#2A2A2A' }]}>
                    <IconCheck color="#C9CDD3" />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>Colis livré avec succès</Text>
                    <Text style={styles.cardBody}>
                      Votre commande Shein{' '}
                      <Text style={styles.highlight}>JJI-2025-00621</Text>
                      {' '}a été retirée à la succursale de Santo Domingo.
                    </Text>
                    <Text style={styles.cardTime}>Hier, 14:32</Text>
                    <TouchableOpacity style={styles.btnDark}>
                      <Text style={styles.btnDarkText}>Laisser un avis →</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* N5: devis shopper */}
            {showN5 && (
              <View style={[styles.card, styles.cardRead]}>
                <View style={styles.cardRow}>
                  <View style={[styles.iconCircle, { backgroundColor: '#F97316' }]}>
                    <IconCart />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>Devis Personal Shopper prêt</Text>
                    <Text style={styles.cardBody}>
                      Votre demande pour Air Force 1 White Nike est évaluée à{' '}
                      <Text style={styles.highlight}>$145</Text>
                      . Confirmez pour procéder à l'achat.
                    </Text>
                    <Text style={styles.cardTime}>Hier, 09:15</Text>
                    <View style={styles.actionRow}>
                      <TouchableOpacity style={styles.btnGreen}>
                        <IconSmallCheck />
                        <Text style={styles.btnGreenText}>Confirmer</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.btnDark}>
                        <IconX />
                        <Text style={styles.btnDarkText}>Annuler</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        {/* CETTE SEMAINE */}
        {showWeek && (
          <View>
            <Text style={[styles.sectionLabel, { marginTop: 18 }]}>Cette semaine</Text>

            {/* N6: promo */}
            {showN6 && (
              <View style={[styles.card, styles.cardRead]}>
                <View style={styles.cardRow}>
                  <View style={[styles.iconCircle, { backgroundColor: '#F97316' }]}>
                    <IconTag />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>Offre spéciale</Text>
                    <Text style={styles.cardBody}>
                      Expédiez avant le 20 Juin et bénéficiez de{' '}
                      <Text style={{ color: '#F97316', fontWeight: '700' }}>15% de réduction</Text>
                      {' '}sur le mode bateau.
                    </Text>
                    <Text style={styles.cardTime}>8 Jun, 10:00</Text>
                    <TouchableOpacity style={styles.btnOrange}>
                      <Text style={styles.btnOrangeText}>En profiter →</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        {/* ÉTAT VIDE */}
        {showEmpty && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <IconBell color="#6B7280" size={34} />
              <Text style={styles.emptyZzz}>z z z</Text>
            </View>
            <Text style={styles.emptyTitle}>Aucune notification</Text>
            <Text style={styles.emptyText}>Vous êtes à jour ! On vous préviendra dès qu'un colis bougera.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },

  // Header
  header: {
    backgroundColor: '#0D0D0D',
    paddingTop: 22,
    paddingHorizontal: 22,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
  markRead: { fontSize: 13, fontWeight: '600', color: '#F97316' },

  filterRow: { flexDirection: 'row', gap: 8, paddingVertical: 16 },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  filterTabActive: {
    backgroundColor: '#F97316',
    borderColor: '#F97316',
  },
  filterTabText: { fontSize: 13, fontWeight: '600', color: '#9CA3AF' },
  filterTabTextActive: { color: '#0D0D0D' },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 22, paddingTop: 6, paddingBottom: 28 },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 10,
  },

  // Cards
  card: {
    position: 'relative',
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#1F1F1F',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardRead: {
    backgroundColor: '#0D0D0D',
    borderColor: '#2A2A2A',
    opacity: 0.78,
  },
  unreadDot: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F97316',
  },
  cardRow: { flexDirection: 'row', gap: 12 },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardContent: { flex: 1 },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    paddingRight: 16,
  },
  cardBody: {
    fontSize: 12.5,
    lineHeight: 19,
    color: '#9CA3AF',
    marginTop: 4,
  },
  highlight: { color: '#FFFFFF', fontWeight: '600' },
  cardTime: { fontSize: 11, color: '#6B7280', marginTop: 8 },

  // Buttons
  btnOrange: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: '#F97316',
    borderRadius: 99,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  btnOrangeText: { color: '#0D0D0D', fontSize: 12, fontWeight: '700' },

  btnDark: {
    marginTop: 10,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2A2A2A',
    borderRadius: 99,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  btnDarkText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },

  btnGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#22C55E',
    borderRadius: 99,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  btnGreenText: { color: '#052E14', fontSize: 12, fontWeight: '700' },

  actionRow: { flexDirection: 'row', gap: 8, marginTop: 10 },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: 90,
    paddingHorizontal: 30,
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyZzz: {
    position: 'absolute',
    top: -6,
    right: -14,
    fontSize: 13,
    fontWeight: '700',
    color: '#F97316',
    letterSpacing: 1,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 22,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#9CA3AF',
    marginTop: 8,
    maxWidth: 240,
    textAlign: 'center',
  },
});
