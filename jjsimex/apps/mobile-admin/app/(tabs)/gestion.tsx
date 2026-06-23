import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, SafeAreaView, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { UrgencyBanner } from '@/components/ui/UrgencyBanner';

interface Urgencies {
  pendingPackages: number;
  pendingShopper: number;
  pendingPayments: number;
}

export default function GestionScreen() {
  const router = useRouter();
  const [urgencies, setUrgencies] = useState<Urgencies>({ pendingPackages: 0, pendingShopper: 0, pendingPayments: 0 });

  async function loadUrgencies() {
    const [pkgRes, shopRes, payRes] = await Promise.all([
      supabase.from('packages').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('personal_shopper').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('payments').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);
    setUrgencies({
      pendingPackages: pkgRes.count ?? 0,
      pendingShopper: shopRes.count ?? 0,
      pendingPayments: payRes.count ?? 0,
    });
  }

  useEffect(() => {
    loadUrgencies();
    const ch = supabase.channel('gestion-urgencies')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'packages' }, loadUrgencies)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'personal_shopper' }, loadUrgencies)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, loadUrgencies)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const totalUrgent = urgencies.pendingPackages + urgencies.pendingShopper + urgencies.pendingPayments;

  const MENU = [
    {
      icon: '🛒',
      title: 'Personal Shopper',
      sub: urgencies.pendingShopper > 0 ? `${urgencies.pendingShopper} demande${urgencies.pendingShopper > 1 ? 's' : ''} en attente` : 'Gérer les commandes',
      badge: urgencies.pendingShopper,
      route: '/screens/personal-shopper',
      color: '#F97316',
    },
    {
      icon: '✈️',
      title: 'Départs',
      sub: 'Gérer les expéditions',
      badge: 0,
      route: '/screens/departs',
      color: '#3B82F6',
    },
    {
      icon: '💳',
      title: 'Paiements',
      sub: urgencies.pendingPayments > 0 ? `${urgencies.pendingPayments} en attente` : 'Confirmer les paiements',
      badge: urgencies.pendingPayments,
      route: '/screens/paiements',
      color: '#22C55E',
    },
    {
      icon: '🔔',
      title: 'Notifications',
      sub: 'Alertes et messages',
      badge: 0,
      route: '/screens/notifications',
      color: '#A855F7',
    },
    {
      icon: '👤',
      title: 'Mon Profil',
      sub: 'Paramètres admin',
      badge: 0,
      route: '/screens/profil-admin',
      color: '#9CA3AF',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Gestion</Text>
        <Text style={styles.subtitle}>Centre de contrôle admin</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {totalUrgent > 0 && (
          <UrgencyBanner count={totalUrgent} onPress={() => router.push('/screens/notifications')} />
        )}

        <View style={styles.grid}>
          {MENU.map((item) => (
            <TouchableOpacity
              key={item.route}
              onPress={() => router.push(item.route as never)}
              style={styles.menuCard}
              activeOpacity={0.85}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <View style={[styles.iconCircle, { backgroundColor: `${item.color}20` }]}>
                  <Text style={{ fontSize: 24 }}>{item.icon}</Text>
                </View>
                {item.badge > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.badge > 99 ? '99+' : item.badge}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSub}>{item.sub}</Text>
              <Text style={[styles.arrow, { color: item.color }]}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: '#FFFFFF' },
  subtitle: { fontSize: 14, color: '#9CA3AF', marginTop: 4 },
  content: { padding: 20, paddingBottom: 40 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  menuCard: { width: '48%', backgroundColor: '#1A1A1A', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#242424', position: 'relative' },
  iconCircle: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  badge: { backgroundColor: '#EF4444', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2, minWidth: 22, alignItems: 'center' },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  cardSub: { fontSize: 12, color: '#9CA3AF', lineHeight: 17 },
  arrow: { fontSize: 22, marginTop: 8 },
});
