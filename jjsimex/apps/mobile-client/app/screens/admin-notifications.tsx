import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Platform, StatusBar, ActivityIndicator, RefreshControl, Alert, TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft, Bell, Send, Users, Globe, MapPin,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

const statusBarH = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 44;
const ACCENT = '#F97316';

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  action_url: string | null;
  created_at: string;
  user?: { full_name?: string };
}

const TYPE_LABELS: Record<string, { label: string; bg: string; color: string }> = {
  package: { label: 'Colis', bg: 'rgba(59,130,246,0.14)', color: '#3B82F6' },
  payment: { label: 'Paiement', bg: 'rgba(34,197,94,0.14)', color: '#22C55E' },
  personal_shopper: { label: 'Shopper', bg: 'rgba(168,85,247,0.14)', color: '#A855F7' },
  system: { label: 'Système', bg: 'rgba(249,115,22,0.14)', color: ACCENT },
  promo: { label: 'Promo', bg: 'rgba(236,72,153,0.14)', color: '#EC4899' },
};

export default function AdminNotifications() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState<'all' | 'haiti' | 'dr'>('all');
  const [sending, setSending] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*, user:user_id(full_name)')
        .order('created_at', { ascending: false })
        .limit(50);
      setNotifications((data ?? []) as Notification[]);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  async function onRefresh() {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  }

  async function handleSend() {
    if (!title.trim() || !message.trim()) {
      Alert.alert('Erreur', 'Titre et message requis.');
      return;
    }

    Alert.alert(
      'Envoyer la notification',
      `Envoyer à ${target === 'all' ? 'tous les clients' : target === 'haiti' ? 'clients Haïti' : 'clients RD'} ?`,
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Envoyer',
          onPress: async () => {
            setSending(true);
            try {
              let userQuery = supabase.from('users').select('id').eq('role', 'client');
              if (target === 'haiti') userQuery = userQuery.eq('destination_country', 'haiti');
              else if (target === 'dr') userQuery = userQuery.eq('destination_country', 'dominican_republic');

              const { data: users } = await userQuery;
              if (users && users.length > 0) {
                await supabase.from('notifications').insert(
                  users.map((u: any) => ({
                    user_id: u.id,
                    type: 'system',
                    title: title.trim(),
                    message: message.trim(),
                  }))
                );
              }

              setTitle('');
              setMessage('');
              setShowSend(false);
              fetchNotifications();
              Alert.alert('Envoyé', `Notification envoyée à ${users?.length ?? 0} clients.`);
            } catch (e: any) {
              Alert.alert('Erreur', e.message);
            }
            setSending(false);
          },
        },
      ]
    );
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={20} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Notifications</Text>
        <TouchableOpacity
          style={[s.sendToggle, showSend && { backgroundColor: ACCENT }]}
          onPress={() => setShowSend(!showSend)}
          activeOpacity={0.7}
        >
          <Send size={16} color={showSend ? '#0D0D0D' : '#FFFFFF'} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />}
      >
        {showSend && (
          <View style={s.sendCard}>
            <Text style={s.sendLabel}>Nouvelle notification</Text>
            <TextInput
              style={s.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Titre"
              placeholderTextColor="#5B6470"
            />
            <TextInput
              style={[s.input, { height: 80, textAlignVertical: 'top' }]}
              value={message}
              onChangeText={setMessage}
              placeholder="Message..."
              placeholderTextColor="#5B6470"
              multiline
            />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
              {([
                { key: 'all', label: 'Tous', icon: Globe },
                { key: 'haiti', label: 'Haïti', icon: MapPin },
                { key: 'dr', label: 'RD', icon: MapPin },
              ] as const).map((t) => (
                <TouchableOpacity
                  key={t.key}
                  style={[s.targetBtn, target === t.key && s.targetBtnActive]}
                  onPress={() => setTarget(t.key)}
                  activeOpacity={0.8}
                >
                  <t.icon size={12} color={target === t.key ? '#0D0D0D' : '#9CA3AF'} strokeWidth={2} />
                  <Text style={[s.targetText, target === t.key && s.targetTextActive]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[s.sendBtn, sending && { opacity: 0.5 }]}
              onPress={handleSend}
              disabled={sending}
              activeOpacity={0.7}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#0D0D0D" />
              ) : (
                <>
                  <Send size={14} color="#0D0D0D" strokeWidth={2} />
                  <Text style={s.sendBtnText}>Envoyer</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        <Text style={s.sectionTitle}>Historique récent</Text>

        {loading ? (
          <ActivityIndicator color={ACCENT} style={{ marginTop: 40 }} />
        ) : notifications.length === 0 ? (
          <Text style={s.emptyText}>Aucune notification.</Text>
        ) : (
          <View style={{ paddingHorizontal: 18, gap: 8 }}>
            {notifications.map((n) => {
              const typeBadge = TYPE_LABELS[n.type] ?? TYPE_LABELS.system;
              return (
                <View key={n.id} style={s.card}>
                  <View style={s.cardTop}>
                    <View style={[s.typeBadge, { backgroundColor: typeBadge.bg }]}>
                      <Text style={[s.typeText, { color: typeBadge.color }]}>{typeBadge.label}</Text>
                    </View>
                    <Text style={s.cardTime}>
                      {new Date(n.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <Text style={s.cardTitle}>{n.title}</Text>
                  <Text style={s.cardMessage} numberOfLines={2}>{n.message}</Text>
                  {n.user?.full_name && (
                    <Text style={s.cardUser}>→ {n.user.full_name}</Text>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 18, paddingTop: statusBarH + 10, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: '#1A1A1A',
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', flex: 1 },
  sendToggle: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: '#1A1A1A',
    alignItems: 'center', justifyContent: 'center',
  },

  sendCard: {
    margin: 18, backgroundColor: '#1A1A1A', borderRadius: 14,
    borderWidth: 1, borderColor: '#1F1F1F', padding: 16, gap: 10,
  },
  sendLabel: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  input: {
    height: 44, backgroundColor: '#0D0D0D', borderRadius: 10,
    borderWidth: 1, borderColor: '#2A2A2A', color: '#FFFFFF',
    paddingHorizontal: 14, fontSize: 13,
  },
  targetBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    height: 34, borderRadius: 8, backgroundColor: '#0D0D0D',
    borderWidth: 1, borderColor: '#2A2A2A',
  },
  targetBtnActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  targetText: { fontSize: 11, fontWeight: '600', color: '#9CA3AF' },
  targetTextActive: { color: '#0D0D0D' },
  sendBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 42, backgroundColor: ACCENT, borderRadius: 10, marginTop: 4,
  },
  sendBtnText: { fontSize: 13, fontWeight: '700', color: '#0D0D0D' },

  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', paddingHorizontal: 18, marginTop: 14, marginBottom: 10 },

  emptyText: { fontSize: 13, color: '#666', textAlign: 'center', marginTop: 40 },

  card: {
    backgroundColor: '#1A1A1A', borderRadius: 12, borderWidth: 1, borderColor: '#1F1F1F',
    padding: 14,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  typeText: { fontSize: 10, fontWeight: '700' },
  cardTime: { fontSize: 10, color: '#4B5563' },
  cardTitle: { fontSize: 13, fontWeight: '700', color: '#FFFFFF', marginBottom: 3 },
  cardMessage: { fontSize: 12, color: '#9CA3AF', lineHeight: 17 },
  cardUser: { fontSize: 11, color: '#6B7280', marginTop: 6 },
});
