// Écran principal — Dashboard admin JJ's IMEX
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';

const { width: SW } = Dimensions.get('window');

// ─── Données statiques ──────────────────────────────────────────────────────

const PERIODES = ['Aujourd\'hui', 'Cette semaine', 'Ce mois', 'Cette année'];

const KPIS = [
  {
    icon: 'pkg',
    label: 'Colis reçus',
    value: '1,247',
    growth: '+12%',
    growthColor: '#22C55E',
    iconBg: 'rgba(249,115,22,0.12)',
    iconColor: '#F97316',
    valueColor: '#FFFFFF',
  },
  {
    icon: 'rev',
    label: 'Revenus',
    value: '$18,450',
    growth: '+8%',
    growthColor: '#22C55E',
    iconBg: 'rgba(249,115,22,0.12)',
    iconColor: '#F97316',
    valueColor: '#FFFFFF',
  },
  {
    icon: 'usr',
    label: 'Nouveaux clients',
    value: '342',
    growth: '+23%',
    growthColor: '#22C55E',
    iconBg: 'rgba(249,115,22,0.12)',
    iconColor: '#F97316',
    valueColor: '#FFFFFF',
  },
  {
    icon: 'clk',
    label: 'En attente',
    value: '47',
    growth: '+5 hier',
    growthColor: '#EF4444',
    iconBg: 'rgba(239,68,68,0.12)',
    iconColor: '#EF4444',
    valueColor: '#F97316',
  },
];

const DERNIERS_COLIS = [
  {
    id: 'JJI-2025-00847',
    client: 'Jean Paul',
    poids: '2.4 lbs',
    mode: '✈ Avion',
    statut: 'En transit',
    statutBg: 'rgba(249,115,22,0.14)',
    statutColor: '#F97316',
  },
  {
    id: 'JJI-2025-00848',
    client: 'Marie Claire',
    poids: '5.1 lbs',
    mode: '🚢 Bateau',
    statut: 'Reçu USA',
    statutBg: '#2A2A2A',
    statutColor: '#C9CDD3',
  },
  {
    id: 'JJI-2025-00849',
    client: 'Pierre Louis',
    poids: '1.8 lbs',
    mode: '✈ Avion',
    statut: 'Livré ✓',
    statutBg: 'rgba(34,197,94,0.14)',
    statutColor: '#22C55E',
  },
  {
    id: 'JJI-2025-00850',
    client: 'Rose Noel',
    poids: '3.2 lbs',
    mode: '✈ Avion',
    statut: 'En transit',
    statutBg: 'rgba(249,115,22,0.14)',
    statutColor: '#F97316',
  },
];

const SUCCURSALES = [
  { nom: 'Miami – Entrepôt principal', stats: '489 colis', pct: 0.78 },
  { nom: 'Orlando – Bureau secondaire', stats: '312 colis', pct: 0.51 },
  { nom: 'New York – Dépôt Est', stats: '278 colis', pct: 0.45 },
  { nom: 'Boston – Bureau Nord', stats: '168 colis', pct: 0.27 },
];

// ─── Icônes SVG inline (via composants légers) ───────────────────────────────

// Composant icône KPI — rendu en Text car SVG natif nécessite react-native-svg
// On utilise des émojis/caractères unicode comme fallback léger
function KpiIcon({ icon, color }: { icon: string; color: string }) {
  const map: Record<string, string> = {
    pkg: '📦',
    rev: '$',
    usr: '👥',
    clk: '⏱',
  };
  return (
    <Text style={{ fontSize: 18, color }}>
      {map[icon] ?? '•'}
    </Text>
  );
}

// ─── Composant barre de progression ──────────────────────────────────────────

function ProgressBar({
  pct,
  color = '#F97316',
  height = 5,
}: {
  pct: number;
  color?: string;
  height?: number;
}) {
  return (
    <View style={{ height, borderRadius: 99, backgroundColor: '#2A2A2A', overflow: 'hidden', marginTop: 12 }}>
      <View style={{ width: `${Math.min(pct * 100, 100)}%`, height: '100%', borderRadius: 99, backgroundColor: color }} />
    </View>
  );
}

// ─── Bottom Nav partagé ───────────────────────────────────────────────────────

function BottomNav({ active }: { active: 'dashboard' | 'colis' | 'scanner' | 'clients' | 'gestion' }) {
  const tabColor = (key: string) => (active === key ? '#F97316' : '#666666');

  return (
    <View style={styles.bottomNav}>
      {/* Dashboard */}
      <TouchableOpacity style={styles.navBtn} activeOpacity={0.7}>
        <View style={[styles.navItem, { opacity: active === 'dashboard' ? 1 : 0.6 }]}>
          <Text style={{ fontSize: 20, color: tabColor('dashboard') }}>⊞</Text>
          <Text style={[styles.navLabel, { color: tabColor('dashboard') }]}>Dashboard</Text>
        </View>
      </TouchableOpacity>

      {/* Colis */}
      <TouchableOpacity style={styles.navBtn} activeOpacity={0.7}>
        <View style={styles.navItem}>
          <Text style={{ fontSize: 20, color: tabColor('colis') }}>📦</Text>
          <Text style={[styles.navLabel, { color: tabColor('colis') }]}>Colis</Text>
        </View>
      </TouchableOpacity>

      {/* FAB Scanner — central */}
      <TouchableOpacity style={styles.navBtn} activeOpacity={0.85}>
        <View style={styles.fab}>
          <Text style={{ fontSize: 22, color: '#0D0D0D' }}>📷</Text>
        </View>
      </TouchableOpacity>

      {/* Clients */}
      <TouchableOpacity style={styles.navBtn} activeOpacity={0.7}>
        <View style={styles.navItem}>
          <Text style={{ fontSize: 20, color: tabColor('clients') }}>👥</Text>
          <Text style={[styles.navLabel, { color: tabColor('clients') }]}>Clients</Text>
        </View>
      </TouchableOpacity>

      {/* Gestion */}
      <TouchableOpacity style={styles.navBtn} activeOpacity={0.7}>
        <View style={styles.navItem}>
          <Text style={{ fontSize: 20, color: tabColor('gestion') }}>⚙</Text>
          <Text style={[styles.navLabel, { color: tabColor('gestion') }]}>Gestion</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const [periodActive, setPeriodActive] = useState(0);

  return (
    <View style={styles.root}>
      {/* Zone scrollable */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 1. Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>MJ</Text>
            </View>
            <View>
              <Text style={styles.headerName}>Marie Joseph</Text>
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>SUPER ADMIN</Text>
              </View>
            </View>
          </View>
          <View style={styles.headerRight}>
            {/* Bouton notification */}
            <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
              <Text style={{ color: '#FFFFFF', fontSize: 18 }}>🔔</Text>
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>5</Text>
              </View>
            </TouchableOpacity>
            {/* Bouton recherche */}
            <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
              <Text style={{ color: '#FFFFFF', fontSize: 18 }}>🔍</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 2. Période tabs ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.periodRow}
        >
          {PERIODES.map((p, i) => (
            <TouchableOpacity
              key={p}
              onPress={() => setPeriodActive(i)}
              activeOpacity={0.7}
              style={[
                styles.periodPill,
                i === periodActive ? styles.periodPillActive : styles.periodPillInactive,
              ]}
            >
              <Text
                style={[
                  styles.periodText,
                  i === periodActive ? styles.periodTextActive : styles.periodTextInactive,
                ]}
              >
                {p}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── 3. KPI cards ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.kpiRow}
        >
          {KPIS.map((k) => (
            <View key={k.label} style={styles.kpiCard}>
              {/* Icône */}
              <View style={[styles.kpiIconCircle, { backgroundColor: k.iconBg }]}>
                <KpiIcon icon={k.icon} color={k.iconColor} />
              </View>
              {/* Label */}
              <Text style={styles.kpiLabel}>{k.label}</Text>
              {/* Valeur */}
              <Text style={[styles.kpiValue, { color: k.valueColor }]}>{k.value}</Text>
              {/* Croissance */}
              <View style={styles.kpiGrowthRow}>
                <Text style={{ color: k.growthColor, fontSize: 11 }}>↑ </Text>
                <Text style={[styles.kpiGrowth, { color: k.growthColor }]}>{k.growth}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* ── 4. Alertes ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Alertes</Text>
          <View style={styles.alertCountBadge}>
            <Text style={styles.alertCountText}>3</Text>
          </View>
        </View>

        <View style={styles.sectionBody}>
          {/* Alerte 1 — Vol presque complet */}
          <View style={[styles.alertCard, { borderLeftColor: '#EF4444' }]}>
            <View style={styles.alertRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.alertTitle}>Vol 14 Juin presque complet</Text>
                <Text style={styles.alertSub}>47 lbs restantes sur 500 lbs</Text>
              </View>
              <TouchableOpacity style={styles.alertBtnOrange} activeOpacity={0.7}>
                <Text style={styles.alertBtnOrangeText}>Gérer →</Text>
              </TouchableOpacity>
            </View>
            <ProgressBar pct={0.9} color="#F97316" />
          </View>

          {/* Alerte 2 — Personal Shopper */}
          <View style={[styles.alertCard, { borderLeftColor: '#F97316' }]}>
            <View style={styles.alertRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.alertTitle}>8 Personal Shopper en attente</Text>
                <Text style={styles.alertSub}>En attente de devis depuis +2h</Text>
              </View>
              <TouchableOpacity style={styles.alertBtnOrange} activeOpacity={0.7}>
                <Text style={styles.alertBtnOrangeText}>Traiter →</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Alerte 3 — Paiement non confirmé */}
          <View style={[styles.alertCard, { borderLeftColor: '#EAB308' }]}>
            <View style={styles.alertRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.alertTitle}>Paiement non confirmé</Text>
                <Text style={styles.alertSub}>JJI-2025-00851 — $24.50</Text>
              </View>
              <TouchableOpacity style={styles.alertBtnGray} activeOpacity={0.7}>
                <Text style={styles.alertBtnGrayText}>Vérifier →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── 5. Derniers colis ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Derniers colis</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.sectionLink}>Voir tout →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionBody}>
          {DERNIERS_COLIS.map((c) => (
            <TouchableOpacity key={c.id} style={styles.colisCard} activeOpacity={0.75}>
              <View style={{ flex: 1 }}>
                <Text style={styles.colisId}>{c.id}</Text>
                <Text style={styles.colisClient}>{c.client}</Text>
                <Text style={styles.colisMeta}>{c.poids} — {c.mode}</Text>
              </View>
              <View style={[styles.statutBadge, { backgroundColor: c.statutBg }]}>
                <Text style={[styles.statutBadgeText, { color: c.statutColor }]}>{c.statut}</Text>
              </View>
              <Text style={{ color: '#6B7280', fontSize: 16, marginLeft: 6 }}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── 6. Prochains départs ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Prochains départs</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.sectionLink}>Gérer →</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.sectionBody, { gap: 12 }]}>
          {/* Vol avion */}
          <View style={styles.departCard}>
            <View style={styles.departTopBorder} />
            <View style={styles.departRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, flex: 1 }}>
                <Text style={{ fontSize: 18, color: '#F97316' }}>✈</Text>
                <View>
                  <Text style={styles.departName}>Vol Miami → Port-au-Prince</Text>
                  <Text style={styles.departDate}>Vendredi 14 Juin 2025</Text>
                </View>
              </View>
              <View style={styles.departBadgeRed}>
                <Text style={styles.departBadgeRedText}>Bientôt complet !</Text>
              </View>
            </View>
            <View style={{ height: 6, borderRadius: 99, backgroundColor: '#2A2A2A', overflow: 'hidden', marginTop: 14 }}>
              <View style={{ width: '90%', height: '100%', borderRadius: 99, backgroundColor: '#F97316' }} />
            </View>
            <Text style={styles.departMeta}>453 / 500 lbs</Text>
            <TouchableOpacity style={styles.departBtnOrange} activeOpacity={0.8}>
              <Text style={styles.departBtnOrangeText}>Ajouter des colis</Text>
            </TouchableOpacity>
          </View>

          {/* Bateau */}
          <View style={[styles.departCard, { borderTopWidth: 0 }]}>
            <View style={styles.departRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, flex: 1 }}>
                <Text style={{ fontSize: 18, color: '#9CA3AF' }}>🚢</Text>
                <View>
                  <Text style={styles.departName}>Bateau Miami → PAP</Text>
                  <Text style={styles.departDate}>Lundi 24 Juin 2025</Text>
                </View>
              </View>
              <View style={styles.departBadgeGreen}>
                <Text style={styles.departBadgeGreenText}>Places disponibles</Text>
              </View>
            </View>
            <View style={{ height: 6, borderRadius: 99, backgroundColor: '#2A2A2A', overflow: 'hidden', marginTop: 14 }}>
              <View style={{ width: '23%', height: '100%', borderRadius: 99, backgroundColor: '#22C55E' }} />
            </View>
            <Text style={styles.departMeta}>1,840 / 8,000 lbs</Text>
            <TouchableOpacity style={styles.departBtnGray} activeOpacity={0.8}>
              <Text style={styles.departBtnGrayText}>Ajouter des colis</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 7. Succursales ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Succursales</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.sectionLink}>Voir tout →</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.sectionBody, { paddingHorizontal: 0 }]}>
          <View style={styles.succursalesCard}>
            {SUCCURSALES.map((s, i) => (
              <View
                key={s.nom}
                style={[
                  styles.succursaleRow,
                  i < SUCCURSALES.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#1F1F1F' },
                ]}
              >
                <Text style={{ fontSize: 14, color: '#F97316', marginRight: 12 }}>📍</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.succursaleNom}>{s.nom}</Text>
                  <View style={{ height: 4, borderRadius: 99, backgroundColor: '#2A2A2A', overflow: 'hidden', marginTop: 7 }}>
                    <View style={{ width: `${s.pct * 100}%`, height: '100%', borderRadius: 99, backgroundColor: '#F97316' }} />
                  </View>
                </View>
                <Text style={styles.succursaleStats}>{s.stats}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* ── Bottom nav ── */}
      <BottomNav active="dashboard" />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  scroll: {
    position: 'absolute',
    top: 0,
    bottom: 84,
    left: 0,
    right: 0,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 18,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#0D0D0D',
    fontWeight: '700',
    fontSize: 16,
  },
  headerName: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
    lineHeight: 18,
  },
  adminBadge: {
    backgroundColor: '#F97316',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  adminBadgeText: {
    color: '#0D0D0D',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 10,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: 6,
    right: 7,
    minWidth: 15,
    height: 15,
    borderRadius: 99,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0D0D0D',
    paddingHorizontal: 2,
  },
  notifBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },

  // Période tabs
  periodRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 22,
  },
  periodPill: {
    borderRadius: 99,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
  },
  periodPillActive: {
    backgroundColor: '#F97316',
    borderColor: '#F97316',
  },
  periodPillInactive: {
    backgroundColor: '#1A1A1A',
    borderColor: '#2A2A2A',
  },
  periodText: {
    fontSize: 13,
  },
  periodTextActive: {
    color: '#0D0D0D',
    fontWeight: '700',
  },
  periodTextInactive: {
    color: '#9CA3AF',
    fontWeight: '500',
  },

  // KPI
  kpiRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 22,
    paddingTop: 18,
  },
  kpiCard: {
    width: 160,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#1F1F1F',
    borderRadius: 16,
    padding: 16,
  },
  kpiIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 12,
  },
  kpiValue: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginTop: 2,
  },
  kpiGrowthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  kpiGrowth: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 26,
    marginBottom: 12,
    paddingHorizontal: 22,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F97316',
  },
  alertCountBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 99,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
  },
  alertCountText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  // Section body
  sectionBody: {
    paddingHorizontal: 22,
    gap: 10,
    flexDirection: 'column',
  },

  // Alerte card
  alertCard: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#1F1F1F',
    borderLeftWidth: 3,
    borderRadius: 16,
    padding: 14,
    paddingHorizontal: 16,
    marginBottom: 0,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  alertSub: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  alertBtnOrange: {
    backgroundColor: '#F97316',
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 8,
    flexShrink: 0,
  },
  alertBtnOrangeText: {
    color: '#0D0D0D',
    fontSize: 12,
    fontWeight: '700',
  },
  alertBtnGray: {
    backgroundColor: '#2A2A2A',
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 8,
    flexShrink: 0,
  },
  alertBtnGrayText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  // Colis card (liste)
  colisCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#1F1F1F',
    borderRadius: 16,
    padding: 14,
    marginBottom: 0,
  },
  colisId: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  colisClient: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  colisMeta: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 3,
  },
  statutBadge: {
    borderRadius: 99,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  statutBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },

  // Départ card
  departCard: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#1F1F1F',
    borderTopWidth: 3,
    borderTopColor: '#F97316',
    borderRadius: 16,
    padding: 16,
    overflow: 'hidden',
  },
  departTopBorder: {
    // handled via borderTopWidth in departCard
  },
  departRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  departName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  departDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 1,
  },
  departBadgeRed: {
    backgroundColor: 'rgba(239,68,68,0.14)',
    borderRadius: 99,
    paddingHorizontal: 9,
    paddingVertical: 4,
    flexShrink: 0,
  },
  departBadgeRedText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '700',
  },
  departBadgeGreen: {
    backgroundColor: 'rgba(34,197,94,0.14)',
    borderRadius: 99,
    paddingHorizontal: 9,
    paddingVertical: 4,
    flexShrink: 0,
  },
  departBadgeGreenText: {
    color: '#22C55E',
    fontSize: 10,
    fontWeight: '700',
  },
  departMeta: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 7,
  },
  departBtnOrange: {
    marginTop: 12,
    height: 42,
    backgroundColor: '#F97316',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  departBtnOrangeText: {
    color: '#0D0D0D',
    fontSize: 13,
    fontWeight: '700',
  },
  departBtnGray: {
    marginTop: 12,
    height: 42,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  departBtnGrayText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },

  // Succursales
  succursalesCard: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#1F1F1F',
    borderRadius: 16,
    marginHorizontal: 22,
    paddingHorizontal: 16,
  },
  succursaleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
  },
  succursaleNom: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  succursaleStats: {
    fontSize: 11,
    color: '#9CA3AF',
    marginLeft: 10,
    flexShrink: 0,
  },

  // Bottom nav
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 84,
    backgroundColor: '#111111',
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
    paddingTop: 12,
    zIndex: 10,
  },
  navBtn: {
    width: 56,
    alignItems: 'center',
  },
  navItem: {
    alignItems: 'center',
    gap: 5,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -22,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 12,
    borderWidth: 4,
    borderColor: '#111111',
  },
});
