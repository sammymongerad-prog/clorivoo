import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  SectionList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { BackButton } from '@/components/layout/BackButton';
import { useToast } from '@/components/ui/Toast';

// ─── Types ────────────────────────────────────────────────────────────────────

type NotifType = 'colis' | 'paiement' | 'shopper' | 'systeme';

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
  user_id?: string;
  metadata?: Record<string, any>;
}

interface NotifSection {
  title: string;
  data: Notification[];
}

type FilterTab = 'all' | NotifType;

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all',      label: 'Toutes' },
  { key: 'colis',    label: 'Colis' },
  { key: 'paiement', label: 'Paiement' },
  { key: 'shopper',  label: 'Shopper' },
  { key: 'systeme',  label: 'Système' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<NotifType, { icon: string; color: string; bg: string }> = {
  colis:    { icon: '📦', color: '#F97316', bg: '#F9731622' },
  paiement: { icon: '💳', color: '#3B82F6', bg: '#3B82F622' },
  shopper:  { icon: '🛍️', color: '#A855F7', bg: '#A855F722' },
  systeme:  { icon: '⚙️', color: '#9CA3AF', bg: '#9CA3AF22' },
};

function timeAgo(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'à l\'instant';
    if (mins < 60) return `il y a ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `il y a ${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return 'hier';
    return `il y a ${days} jours`;
  } catch {
    return iso;
  }
}

function groupByDate(notifications: Notification[]): NotifSection[] {
  const now = new Date();
  const todayStr = now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);

  const today: Notification[] = [];
  const yest: Notification[] = [];
  const week: Notification[] = [];
  const older: Notification[] = [];

  for (const n of notifications) {
    const d = new Date(n.created_at);
    const ds = d.toDateString();
    if (ds === todayStr) today.push(n);
    else if (ds === yesterdayStr) yest.push(n);
    else if (d >= weekAgo) week.push(n);
    else older.push(n);
  }

  const sections: NotifSection[] = [];
  if (today.length)  sections.push({ title: "Aujourd'hui", data: today });
  if (yest.length)   sections.push({ title: 'Hier', data: yest });
  if (week.length)   sections.push({ title: 'Cette semaine', data: week });
  if (older.length)  sections.push({ title: 'Plus anciens', data: older });
  return sections;
}

// ─── Notification Card ────────────────────────────────────────────────────────

interface NotifCardProps {
  notification: Notification;
  onRead: (id: string) => void;
  onAction: (notification: Notification) => void;
}

function NotifCard({ notification, onRead, onAction }: NotifCardProps) {
  const config = TYPE_CONFIG[notification.type] ?? { icon: '🔔', color: '#9CA3AF', bg: '#9CA3AF22' };
  const unread = !notification.is_read;

  const handlePress = () => {
    if (unread) onRead(notification.id);
  };

  const actionLabel: Record<NotifType, string> = {
    colis:    'Voir le colis →',
    paiement: 'Vérifier →',
    shopper:  'Traiter →',
    systeme:  'Voir →',
  };

  return (
    <TouchableOpacity
      style={[styles.card, unread && styles.cardUnread]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      {/* Unread dot */}
      {unread && <View style={styles.unreadDot} />}

      <View style={styles.cardInner}>
        {/* Icon */}
        <View style={[styles.iconCircle, { backgroundColor: config.bg, borderColor: config.color + '44' }]}>
          <Text style={styles.iconText}>{config.icon}</Text>
        </View>

        {/* Content */}
        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, !unread && styles.cardTitleRead]} numberOfLines={2}>
            {notification.title}
          </Text>
          <Text style={styles.cardBody} numberOfLines={2}>{notification.body}</Text>
          <Text style={styles.cardTime}>{timeAgo(notification.created_at)}</Text>

          {/* Action button */}
          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: config.color }]}
            onPress={() => onAction(notification)}
            activeOpacity={0.7}
          >
            <Text style={[styles.actionBtnText, { color: config.color }]}>
              {actionLabel[notification.type] ?? 'Voir →'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const router = useRouter();
  const { showToast } = useToast();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  const subscriptionRef = useRef<any>(null);

  // ── Data ───────────────────────────────────────────────────────────────────

  const fetchNotifications = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setNotifications((data as Notification[]) ?? []);
    } catch {
      showToast('Erreur lors du chargement des notifications', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    subscriptionRef.current = supabase
      .channel('notifications-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => {
      subscriptionRef.current?.unsubscribe();
    };
  }, [fetchNotifications]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, [fetchNotifications]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const markRead = async (id: string) => {
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch {
      showToast('Erreur', 'error');
    }
  };

  const markAllRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      if (unreadIds.length === 0) return;
      await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      showToast('Toutes les notifications marquées comme lues', 'success');
    } catch {
      showToast('Erreur', 'error');
    }
  };

  const handleAction = (notif: Notification) => {
    markRead(notif.id);
    switch (notif.type) {
      case 'colis':
        if (notif.metadata?.package_id) {
          router.push({ pathname: '/colis/[id]', params: { id: notif.metadata.package_id } } as any);
        }
        break;
      case 'paiement':
        router.push('/screens/paiements' as any);
        break;
      case 'shopper':
        // Navigate to shopper management
        break;
      default:
        break;
    }
  };

  // ── Filtering & grouping ───────────────────────────────────────────────────

  const filtered = activeFilter === 'all'
    ? notifications
    : notifications.filter(n => n.type === activeFilter);

  const sections = groupByDate(filtered);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  // ── Render ─────────────────────────────────────────────────────────────────

  const renderSectionHeader = ({ section }: { section: NotifSection }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{section.title}</Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>🔔</Text>
      <Text style={styles.emptyText}>Aucune notification</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={markAllRead} activeOpacity={0.7} style={styles.markAllBtn}>
          <Text style={styles.markAllText}>Tout lire</Text>
        </TouchableOpacity>
      </View>

      {/* Filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {FILTER_TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.filterTab, activeFilter === tab.key && styles.filterTabActive]}
            onPress={() => setActiveFilter(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterTabText, activeFilter === tab.key && styles.filterTabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      {loading ? (
        <ActivityIndicator color="#F97316" size="large" style={{ marginTop: 40 }} />
      ) : sections.length === 0 ? (
        renderEmpty()
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <NotifCard
              notification={item}
              onRead={markRead}
              onAction={handleAction}
            />
          )}
          renderSectionHeader={renderSectionHeader}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F97316" />
          }
          stickySectionHeadersEnabled={false}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#1A1A1A',
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  unreadBadge: {
    backgroundColor: '#F97316', borderRadius: 10,
    paddingHorizontal: 6, paddingVertical: 2, minWidth: 20, alignItems: 'center',
  },
  unreadBadgeText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF' },
  markAllBtn: {
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8, borderWidth: 1, borderColor: '#F9731644',
  },
  markAllText: { fontSize: 11, fontWeight: '600', color: '#F97316' },

  // Filters
  filterRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterTab: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2A2A2A', marginRight: 8,
  },
  filterTabActive: { backgroundColor: '#F97316', borderColor: '#F97316' },
  filterTabText: { fontSize: 13, fontWeight: '600', color: '#9CA3AF' },
  filterTabTextActive: { color: '#FFFFFF' },

  // Section header
  sectionHeader: { paddingVertical: 8, paddingHorizontal: 4 },
  sectionHeaderText: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8 },

  // List
  listContent: { padding: 16, paddingBottom: 40 },

  // Card
  card: {
    backgroundColor: '#1A1A1A', borderRadius: 14,
    borderWidth: 1, borderColor: '#2A2A2A',
    padding: 14, marginBottom: 10, position: 'relative', overflow: 'hidden',
  },
  cardUnread: {
    borderLeftWidth: 3, borderLeftColor: '#F97316',
    backgroundColor: '#F9731608',
  },
  unreadDot: {
    position: 'absolute', top: 12, right: 12,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#F97316',
  },
  cardInner: { flexDirection: 'row', gap: 12 },
  iconCircle: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, flexShrink: 0,
  },
  iconText: { fontSize: 20 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', marginBottom: 4, paddingRight: 16 },
  cardTitleRead: { color: '#9CA3AF', fontWeight: '500' },
  cardBody: { fontSize: 13, color: '#D1D5DB', lineHeight: 18, marginBottom: 4 },
  cardTime: { fontSize: 11, color: '#6B7280', marginBottom: 8 },

  actionBtn: {
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 8, borderWidth: 1,
  },
  actionBtnText: { fontSize: 12, fontWeight: '700' },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 80 },
  emptyIcon: { fontSize: 52, marginBottom: 14 },
  emptyText: { fontSize: 15, color: '#9CA3AF', textAlign: 'center' },
});
