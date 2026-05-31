import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, RADIUS } from '../../lib/tokens';
import { EmptyState } from '../../components/UI';
import { useNotifications } from '../../hooks/useNotifications';

const NOTIF_ICONS  = { order: '📦', message: '💬', promo: '🎁', system: '🔔', marketing: '📣' };
const NOTIF_COLORS = { order: '#10B981', message: '#3B82F6', promo: '#F59E0B', system: '#6B7280', marketing: '#EC4899' };
const FILTERS = ['Tout', 'Commandes', 'Messages', 'Promos'];
const FILTER_TYPES = [null, 'order', 'message', 'promo'];

function relTime(iso) {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'maintenant';
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} j`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function groupByDate(notifs) {
  const today     = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const weekAgo   = new Date(today); weekAgo.setDate(today.getDate() - 7);
  const groups = { "Aujourd'hui": [], 'Cette semaine': [], 'Plus ancien': [] };
  for (const n of notifs) {
    const d = new Date(n.created_at);
    if (d >= today) groups["Aujourd'hui"].push(n);
    else if (d >= weekAgo) groups['Cette semaine'].push(n);
    else groups['Plus ancien'].push(n);
  }
  return groups;
}

export default function NotificationsScreen({ navigation }) {
  const { notifications, loading, markRead, markAllRead, unreadCount } = useNotifications();
  const [filter, setFilter] = useState(0);

  const filtered = FILTER_TYPES[filter]
    ? notifications.filter(n => n.type === FILTER_TYPES[filter])
    : notifications;

  const groups = groupByDate(filtered);

  async function handlePress(notif) {
    if (!notif.read_at) await markRead(notif.id);
    if (notif.data?.order_id)        navigation.navigate('Tracking', { orderId: notif.data.order_id });
    else if (notif.data?.conversation_id) navigation.navigate('Chat', { conversationId: notif.data.conversation_id });
    else if (notif.data?.product_id) navigation.navigate('Product', { productId: notif.data.product_id });
  }

  if (loading) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={COLORS.primary} size="large" />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.paper }} edges={['top']}>
      {/* Header */}
      <View style={{ backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.hairline }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 }}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ fontSize: 22, color: COLORS.ink }}>←</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.ink, flex: 1 }}>Notifications</Text>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllRead}>
              <Text style={{ fontSize: 13, color: COLORS.primary, fontWeight: '600' }}>Tout lire</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingBottom: 12 }}>
          {FILTERS.map((f, i) => (
            <TouchableOpacity key={i} onPress={() => setFilter(i)}
              style={{ height: 30, paddingHorizontal: 14, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center',
                backgroundColor: filter === i ? COLORS.primary : COLORS.white,
                borderWidth: 1.5, borderColor: filter === i ? COLORS.primary : COLORS.hairline }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: filter === i ? '#fff' : COLORS.mute }}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {filtered.length === 0 ? (
        <EmptyState icon="🔔" title="Aucune notification" subtitle="Vos alertes commandes et messages apparaîtront ici" />
      ) : (
        <ScrollView style={{ flex: 1 }}>
          {Object.entries(groups).map(([label, items]) => items.length === 0 ? null : (
            <View key={label}>
              <View style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: COLORS.paper }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.mute, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
              </View>
              {items.map(n => {
                const iconColor = NOTIF_COLORS[n.type] ?? COLORS.primary;
                return (
                  <TouchableOpacity key={n.id} onPress={() => handlePress(n)}
                    style={{ backgroundColor: n.read_at ? COLORS.white : '#F5F3FF', flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.hairline }}>
                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: `${iconColor}20`, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 20 }}>{NOTIF_ICONS[n.type] ?? '🔔'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                        <Text style={{ fontSize: 14, fontWeight: n.read_at ? '600' : '700', color: COLORS.ink, flex: 1, marginRight: 8 }}>{n.title}</Text>
                        <Text style={{ fontSize: 11, color: COLORS.mute }}>{relTime(n.created_at)}</Text>
                      </View>
                      <Text style={{ fontSize: 13, color: COLORS.mute, lineHeight: 18 }}>{n.body}</Text>
                    </View>
                    {!n.read_at && (
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginTop: 8 }} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
