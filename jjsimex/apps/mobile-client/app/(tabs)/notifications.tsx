import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Package, CreditCard, Tag, Settings, Megaphone, Bell, LucideIcon } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

type FilterType = 'tous' | 'colis' | 'paiement' | 'promo' | 'systeme';

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  is_read: boolean;
  action_url?: string;
  created_at: string;
}

const FILTER_LABELS: { key: FilterType; label: string }[] = [
  { key: 'tous', label: 'Tout' },
  { key: 'colis', label: 'Colis' },
  { key: 'paiement', label: 'Paiement' },
  { key: 'promo', label: 'Promos' },
  { key: 'systeme', label: 'Système' },
];

const TYPE_ICON: Record<string, { Icon: LucideIcon; bg: string }> = {
  colis:    { Icon: Package, bg: '#F97316' },
  paiement: { Icon: CreditCard, bg: '#2563EB' },
  promo:    { Icon: Tag, bg: '#F97316' },
  systeme:  { Icon: Settings, bg: '#6B7280' },
};

function fmtTime(date: string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Il y a ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return 'Hier';
  if (diffD < 7) return `Il y a ${diffD} jours`;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [filter, setFilter] = useState<FilterType>('tous');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!session?.user.id) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setNotifications((data ?? []) as Notification[]);
    setLoading(false);
  }, [session?.user.id]);

  useEffect(() => {
    loadNotifications();
    if (!session?.user.id) return;
    const ch = supabase
      .channel(`notifs_${session.user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${session.user.id}` }, () => loadNotifications())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [loadNotifications, session?.user.id]);

  async function onRefresh() {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  }

  async function markAllRead() {
    if (!session?.user.id) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', session.user.id).eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  }

  async function markRead(id: string) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  }

  async function handleTap(notif: Notification) {
    await markRead(notif.id);
    if (notif.action_url) {
      if (notif.action_url.startsWith('http')) {
        Linking.openURL(notif.action_url);
      } else {
        router.push(notif.action_url as never);
      }
    }
  }

  const filtered = notifications.filter(n => filter === 'tous' || n.type === filter);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Group by date
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  const grouped: { label: string; items: Notification[] }[] = [];
  const todayItems = filtered.filter(n => new Date(n.created_at).toDateString() === today);
  const yesterdayItems = filtered.filter(n => new Date(n.created_at).toDateString() === yesterday);
  const olderItems = filtered.filter(n => new Date(n.created_at).toDateString() !== today && new Date(n.created_at).toDateString() !== yesterday);

  if (todayItems.length) grouped.push({ label: "Aujourd'hui", items: todayItems });
  if (yesterdayItems.length) grouped.push({ label: 'Hier', items: yesterdayItems });
  if (olderItems.length) grouped.push({ label: 'Cette semaine', items: olderItems });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={styles.title}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllRead}>
              <Text style={styles.markAll}>Tout marquer lu</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {FILTER_LABELS.map(f => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[styles.filterTab, filter === f.key && styles.filterTabActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F97316" />}
      >
        {loading && (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Text style={{ color: '#9CA3AF', fontSize: 14 }}>Chargement...</Text>
          </View>
        )}

        {!loading && filtered.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Bell size={48} color="#F97316" strokeWidth={2} />
            </View>
            <Text style={styles.emptyTitle}>Aucune notification</Text>
            <Text style={styles.emptyText}>Vous êtes à jour ! On vous préviendra dès qu'un colis bougera.</Text>
          </View>
        )}

        {grouped.map(group => (
          <View key={group.label}>
            <Text style={styles.groupLabel}>{group.label}</Text>
            {group.items.map(notif => {
              const ico = TYPE_ICON[notif.type] ?? { Icon: Megaphone, bg: '#9CA3AF' };
              const Ico = ico.Icon;
              return (
                <TouchableOpacity
                  key={notif.id}
                  onPress={() => handleTap(notif)}
                  activeOpacity={0.85}
                  style={[styles.card, !notif.is_read && styles.cardUnread]}
                >
                  {!notif.is_read && <View style={styles.unreadDot} />}
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={[styles.iconCircle, { backgroundColor: ico.bg }]}>
                      <Ico size={20} color="#FFFFFF" strokeWidth={2} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cardTitle, notif.is_read && { color: '#9CA3AF' }]}>{notif.title}</Text>
                      <Text style={styles.cardBody}>{notif.body}</Text>
                      <Text style={styles.cardTime}>{fmtTime(notif.created_at)}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  title: { fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
  badge: { backgroundColor: '#F97316', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#0D0D0D' },
  markAll: { fontSize: 13, fontWeight: '600', color: '#F97316' },
  filterRow: { flexDirection: 'row', gap: 8, paddingVertical: 14 },
  filterTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2A2A2A' },
  filterTabActive: { backgroundColor: '#F97316', borderColor: '#F97316' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#9CA3AF' },
  filterTextActive: { color: '#0D0D0D' },
  groupLabel: { fontSize: 12, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 16, marginBottom: 10 },
  card: { position: 'relative', backgroundColor: '#1A1A1A', borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#1F1F1F' },
  cardUnread: { borderLeftWidth: 3, borderLeftColor: '#F97316', borderColor: '#1F1F1F' },
  unreadDot: { position: 'absolute', top: 14, right: 14, width: 8, height: 8, borderRadius: 4, backgroundColor: '#F97316' },
  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', paddingRight: 16 },
  cardBody: { fontSize: 13, color: '#9CA3AF', lineHeight: 19, marginTop: 4 },
  cardTime: { fontSize: 11, color: '#6B7280', marginTop: 6 },
  emptyState: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 30 },
  emptyIcon: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2A2A2A', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#FFFFFF', marginTop: 22 },
  emptyText: { fontSize: 13, lineHeight: 20, color: '#9CA3AF', marginTop: 8, textAlign: 'center' },
});
