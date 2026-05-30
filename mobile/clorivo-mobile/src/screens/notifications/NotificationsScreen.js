import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, RADIUS } from '../../lib/tokens';
import { EmptyState } from '../../components/UI';
import { getNotifications, markNotificationRead } from '../../lib/supabase';
import { useSession } from '../../hooks/useSession';

const NOTIF_ICONS = { order: '📦', message: '💬', promo: '🎁', system: '🔔' };

function relTime(iso) {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'maintenant';
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  return `${Math.floor(diff / 86400)} j`;
}

export default function NotificationsScreen({ navigation }) {
  const session = useSession();
  const [notifs, setNotifs]   = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    if (!session?.user) { setLoading(false); return; }
    getNotifications(session.user.id).then(data => {
      setNotifs(data ?? []);
      setLoading(false);
    });
  }, [session]));

  async function handlePress(notif) {
    if (!notif.read_at) {
      await markNotificationRead(notif.id);
      setNotifs(prev => prev.map(n => n.id === notif.id ? { ...n, read_at: new Date().toISOString() } : n));
    }
    if (notif.data?.order_id) navigation.navigate('Tracking', { orderId: notif.data.order_id });
    else if (notif.data?.conversation_id) navigation.navigate('Chat', { conversationId: notif.data.conversation_id });
  }

  if (loading) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={COLORS.primary} size="large" />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.paper }} edges={['top']}>
      <View style={{ backgroundColor: COLORS.white, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.hairline, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 22, color: COLORS.ink }}>←</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.ink }}>Notifications</Text>
      </View>

      {notifs.length === 0 ? (
        <EmptyState icon="🔔" title="Aucune notification" subtitle="Vos alertes commandes et messages apparaîtront ici" />
      ) : (
        <ScrollView style={{ flex: 1 }}>
          {notifs.map(n => (
            <TouchableOpacity key={n.id} onPress={() => handlePress(n)}
              style={{ backgroundColor: n.read_at ? COLORS.white : '#F5F3FF', flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.hairline }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
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
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginTop: 6 }} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
