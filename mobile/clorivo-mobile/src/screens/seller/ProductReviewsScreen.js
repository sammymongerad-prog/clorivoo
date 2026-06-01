import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, RADIUS, SHADOW } from '../../lib/tokens';
import { supabase } from '../../lib/supabase';
import { useSession } from '../../hooks/useSession';
import Icon from '../../components/Icon';

const TABS = ['Tous', '5★', '4★', '≤3★'];

function Stars({ rating }) {
  return (
    <Text style={{ fontSize: 13, color: '#F59E0B', letterSpacing: 1 }}>
      {Array.from({ length: 5 }, (_, i) => i < rating ? '★' : '☆').join('')}
    </Text>
  );
}

export default function ProductReviewsScreen({ navigation }) {
  const session = useSession();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('Tous');

  useFocusEffect(useCallback(() => {
    if (!session?.user) return;
    (async () => {
      const { data, error } = await supabase.from('reviews')
        .select('*, products(title), profiles(full_name)')
        .eq('seller_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) {
        setReviews([]);
      } else {
        setReviews(data ?? []);
      }
      setLoading(false);
    })();
  }, [session]));

  const filtered = reviews.filter(r => {
    if (tab === '5★') return r.rating === 5;
    if (tab === '4★') return r.rating === 4;
    if (tab === '≤3★') return r.rating <= 3;
    return true;
  });

  const avg = reviews.length ? (reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / reviews.length).toFixed(1) : '-';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.paper }} edges={['top']}>
      <View style={{ backgroundColor: COLORS.white, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.hairline, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrowLeft" size={22} color={COLORS.ink} />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: COLORS.ink }}>Avis produits</Text>
        <Text style={{ fontSize: 16, fontWeight: '800', color: '#F59E0B' }}>★ {avg}</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : (
        <>
          <View style={{ backgroundColor: COLORS.white, paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', gap: 8, borderBottomWidth: 1, borderBottomColor: COLORS.hairline }}>
            {TABS.map(t => (
              <TouchableOpacity key={t} onPress={() => setTab(t)}
                style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: RADIUS.full, backgroundColor: tab === t ? COLORS.primary : COLORS.paper }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: tab === t ? '#fff' : COLORS.mute }}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {filtered.length === 0 ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <Text style={{ fontSize: 40 }}>⭐</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.ink }}>Aucun avis pour l'instant</Text>
              <Text style={{ fontSize: 14, color: COLORS.mute }}>Les avis de vos clients apparaîtront ici</Text>
            </View>
          ) : (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
              {filtered.map(r => (
                <View key={r.id} style={{ backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: 16, ...SHADOW.sm }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.ink }} numberOfLines={1}>
                      {r.products?.title ?? 'Produit'}
                    </Text>
                    <Stars rating={r.rating ?? 5} />
                  </View>
                  {r.comment ? <Text style={{ fontSize: 14, color: COLORS.ink, lineHeight: 20, marginBottom: 8 }}>{r.comment}</Text> : null}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 12, color: COLORS.mute }}>{r.profiles?.full_name ?? 'Client'}</Text>
                    <Text style={{ fontSize: 12, color: COLORS.mute }}>
                      {new Date(r.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                  </View>
                </View>
              ))}
              <View style={{ height: 40 }} />
            </ScrollView>
          )}
        </>
      )}
    </SafeAreaView>
  );
}
