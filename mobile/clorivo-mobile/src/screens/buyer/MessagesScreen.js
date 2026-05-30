import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, RADIUS } from '../../lib/tokens';
import { Avatar, EmptyState } from '../../components/UI';
import { getConversations } from '../../lib/supabase';
import { useSession } from '../../hooks/useSession';

function relTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'maintenant';
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}j`;
}

export default function MessagesScreen({ navigation }) {
  const session = useSession();
  const [convos, setConvos]   = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    if (!session?.user) { setLoading(false); return; }
    setLoading(true);
    getConversations(session.user.id).then(data => {
      setConvos(data ?? []);
      setLoading(false);
    });
  }, [session]));

  if (loading) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={COLORS.primary} size="large" />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.paper }} edges={['top']}>
      <View style={{ backgroundColor: COLORS.white, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.hairline }}>
        <Text style={{ fontSize: 20, fontWeight: '800', color: COLORS.ink, letterSpacing: -0.5 }}>Messages</Text>
      </View>

      {convos.length === 0 ? (
        <EmptyState icon="💬" title="Aucun message" subtitle="Vos conversations avec les vendeurs apparaîtront ici" />
      ) : (
        <ScrollView style={{ flex: 1 }}>
          {convos.map(c => {
            const other = c.buyer_id === session.user.id ? c.shops : c.profiles;
            const name = other?.name ?? other?.full_name ?? 'Vendeur';
            const unread = c.messages?.filter(m => !m.read_at && m.sender_id !== session.user.id).length ?? 0;
            const last = c.messages?.[0];
            return (
              <TouchableOpacity key={c.id}
                onPress={() => navigation.navigate('Chat', { conversationId: c.id, name, productTitle: c.products?.title })}
                style={{ backgroundColor: COLORS.white, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.hairline }}>
                <Avatar size={48} initials={name[0]?.toUpperCase() ?? '?'} bg={COLORS.primary} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                    <Text style={{ fontSize: 15, fontWeight: unread ? '700' : '600', color: COLORS.ink }}>{name}</Text>
                    <Text style={{ fontSize: 12, color: COLORS.mute }}>{relTime(last?.created_at)}</Text>
                  </View>
                  {c.products?.title && <Text style={{ fontSize: 11, color: COLORS.primary, marginBottom: 2 }}>{c.products.title}</Text>}
                  <Text style={{ fontSize: 13, color: unread ? COLORS.ink : COLORS.mute, fontWeight: unread ? '600' : '400' }} numberOfLines={1}>
                    {last?.content ?? 'Démarrer une conversation…'}
                  </Text>
                </View>
                {unread > 0 && (
                  <View style={{ backgroundColor: COLORS.primary, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>{unread}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
