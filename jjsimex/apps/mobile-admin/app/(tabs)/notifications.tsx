import { useEffect, useState, useContext } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { AuthContext } from '@/contexts/AuthContext';
import { createClient } from '@supabase/supabase-js';

type Tab = 'tous' | 'colis' | 'paiements' | 'clients' | 'systeme';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  action_url?: string;
  is_read: boolean;
  created_at: string;
}

const TABS: { key: Tab; label: string }[] = [
  { key: 'tous', label: 'Tous' },
  { key: 'colis', label: 'Colis' },
  { key: 'paiements', label: 'Paiements' },
  { key: 'clients', label: 'Clients' },
  { key: 'systeme', label: 'Système' },
];

function formatTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'À l\'instant';
  if (diffMins < 60) return `Il y a ${diffMins}m`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
}

function groupByDate(notifications: Notification[]): Record<string, Notification[]> {
  const grouped: Record<string, Notification[]> = {};
  notifications.forEach(n => {
    const date = new Date(n.created_at);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let key = 'Cette semaine';
    if (date.toDateString() === today.toDateString()) {
      key = "Aujourd'hui";
    } else if (date.toDateString() === yesterday.toDateString()) {
      key = 'Hier';
    }

    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(n);
  });
  return grouped;
}

function NavItem({ icon, label, active, badge }: { icon: string; label: string; active?: boolean; badge?: number }) {
  return (
    <View style={{ alignItems: 'center', gap: 5, width: 56 }}>
      <View>
        <Text style={{ fontSize: 22, color: active ? '#F97316' : '#666666' }}>{icon}</Text>
        {badge ? (
          <View style={{ position: 'absolute', top: -4, right: -7, minWidth: 15, height: 15, borderRadius: 99, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '700' }}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <Text style={{ fontSize: 10, fontWeight: '600', color: active ? '#F97316' : '#666666' }}>{label}</Text>
    </View>
  );
}

export default function NotificationsAdminScreen() {
  const authContext = useContext(AuthContext);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('tous');

  useEffect(() => {
    if (!authContext?.user) return;
    loadNotifications();
  }, [authContext?.user]);

  async function loadNotifications() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', authContext!.user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications((data ?? []) as Notification[]);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(notifId: string) {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notifId);

      setNotifications(prev =>
        prev.map(n => n.id === notifId ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }

  async function markAllRead() {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', authContext!.user!.id);

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }

  const unread = notifications.filter(n => !n.is_read).length;
  const grouped = groupByDate(notifications);
  const filtered = Object.entries(grouped).reduce((acc, [section, items]) => {
    const filtered = items.filter(n => tab === 'tous' || n.type === tab);
    if (filtered.length > 0) {
      acc[section] = filtered;
    }
    return acc;
  }, {} as Record<string, Notification[]>);

  if (loading) {
    return (
      <View style={[S.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color="#F97316" size="large" />
      </View>
    );
  }

  return (
    <View style={S.container}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 24, paddingBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={{ fontSize: 24, fontWeight: '700', letterSpacing: -0.5, color: '#FFFFFF' }}>Notifications</Text>
            {unread > 0 && (
              <View style={{ minWidth: 22, height: 22, paddingHorizontal: 7, borderRadius: 99, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700' }}>{unread}</Text>
              </View>
            )}
          </View>
          {unread > 0 && (
            <TouchableOpacity onPress={markAllRead} activeOpacity={0.8}>
              <Text style={{ color: '#F97316', fontSize: 13, fontWeight: '600' }}>Tout lire</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 22 }}>
          <View style={{ flexDirection: 'row', gap: 8, paddingRight: 22 }}>
            {TABS.map(t => (
              <TouchableOpacity key={t.key} onPress={() => setTab(t.key)} activeOpacity={0.8}
                style={[S.tab, tab === t.key && S.tabActive]}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: tab === t.key ? '#F97316' : '#9CA3AF' }}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Sections */}
        {notifications.length === 0 ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>🔔</Text>
            <Text style={{ fontSize: 14, color: '#9CA3AF', textAlign: 'center' }}>Aucune notification</Text>
          </View>
        ) : (
          Object.entries(filtered).map(([section, items]) => (
            <View key={section} style={{ paddingHorizontal: 22, marginTop: 20 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>{section}</Text>
              <View style={{ gap: 10 }}>
                {items.map(n => (
                  <TouchableOpacity key={n.id} activeOpacity={0.8} onPress={() => markAsRead(n.id)}
                    style={[S.notifCard, !n.is_read && S.notifCardUnread]}>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(249,115,22,0.14)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Text style={{ fontSize: 18 }}>🔔</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                          <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF', flex: 1, lineHeight: 18 }}>{n.title}</Text>
                          {!n.is_read && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#F97316', marginTop: 4 }} />}
                        </View>
                        <Text style={{ fontSize: 12, color: '#9CA3AF', lineHeight: 18, marginTop: 4 }}>{n.message}</Text>
                        <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 7 }}>{formatTime(n.created_at)}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Bottom nav */}
      <View style={S.bottomNav}>
        <NavItem icon="⬛" label="Dashboard" badge={unread > 0 ? unread : undefined} />
        <NavItem icon="📦" label="Colis" />
        <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: '#F97316', alignItems: 'center', justifyContent: 'center', marginTop: -22, borderWidth: 4, borderColor: '#111111', shadowColor: '#F97316', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 18, elevation: 10 }}>
          <Text style={{ fontSize: 22, color: '#0D0D0D' }}>📷</Text>
        </View>
        <NavItem icon="👥" label="Clients" />
        <NavItem icon="⚙️" label="Gestion" />
      </View>
    </View>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  tab: { height: 38, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 20, paddingHorizontal: 16, justifyContent: 'center' },
  tabActive: { backgroundColor: 'rgba(249,115,22,0.12)', borderColor: '#F97316' },
  notifCard: { backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#1F1F1F', borderRadius: 14, padding: 14 },
  notifCardUnread: { borderColor: 'rgba(249,115,22,0.3)', backgroundColor: 'rgba(249,115,22,0.05)' },
  bottomNav: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 84, backgroundColor: '#111111', borderTopWidth: 1, borderTopColor: '#2A2A2A', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-around', paddingTop: 12 },
});
