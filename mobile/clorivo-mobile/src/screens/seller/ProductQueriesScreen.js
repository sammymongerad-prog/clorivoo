import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, RADIUS, SHADOW } from '../../lib/tokens';
import { supabase } from '../../lib/supabase';
import { useSession } from '../../hooks/useSession';
import Icon from '../../components/Icon';

const TABS = ['En attente', 'Répondues'];

export default function ProductQueriesScreen({ navigation }) {
  const session = useSession();
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('En attente');
  const [expandedId, setExpandedId] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [saving, setSaving] = useState(false);

  useFocusEffect(useCallback(() => {
    if (!session?.user) return;
    (async () => {
      const { data, error } = await supabase.from('product_queries')
        .select('*, products(title)')
        .eq('seller_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) {
        setQueries([]);
      } else {
        setQueries(data ?? []);
      }
      setLoading(false);
    })();
  }, [session]));

  const filtered = queries.filter(q => {
    if (tab === 'En attente') return !q.answer && q.status !== 'answered';
    return q.answer || q.status === 'answered';
  });

  async function handleAnswer(queryId) {
    if (!answerText.trim()) { Alert.alert('Erreur', 'Entrez une réponse.'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('product_queries').update({ answer: answerText.trim(), status: 'answered' }).eq('id', queryId);
      if (error) throw error;
      setQueries(prev => prev.map(q => q.id === queryId ? { ...q, answer: answerText.trim(), status: 'answered' } : q));
      setExpandedId(null);
      setAnswerText('');
    } catch (e) {
      Alert.alert('Erreur', e?.message ?? 'Impossible de sauvegarder la réponse.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.paper }} edges={['top']}>
      <View style={{ backgroundColor: COLORS.white, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.hairline, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrowLeft" size={22} color={COLORS.ink} />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: COLORS.ink }}>Questions produits</Text>
      </View>

      <View style={{ backgroundColor: COLORS.white, paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', gap: 8, borderBottomWidth: 1, borderBottomColor: COLORS.hairline }}>
        {TABS.map(t => (
          <TouchableOpacity key={t} onPress={() => setTab(t)}
            style={{ paddingHorizontal: 16, paddingVertical: 7, borderRadius: RADIUS.full, backgroundColor: tab === t ? COLORS.primary : COLORS.paper }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: tab === t ? '#fff' : COLORS.mute }}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <Text style={{ fontSize: 48 }}>💬</Text>
          <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.ink }}>Aucune question</Text>
          <Text style={{ fontSize: 14, color: COLORS.mute }}>Les questions de vos clients apparaîtront ici.</Text>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
          {filtered.map(q => (
            <View key={q.id} style={{ backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: 16, ...SHADOW.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.primary, marginBottom: 4 }}>
                    {q.products?.title ?? 'Produit'}
                  </Text>
                  <Text style={{ fontSize: 14, color: COLORS.ink, lineHeight: 20 }}>{q.question}</Text>
                </View>
                <TouchableOpacity onPress={() => { setExpandedId(expandedId === q.id ? null : q.id); setAnswerText(q.answer ?? ''); }} style={{ marginLeft: 10 }}>
                  <Icon name={expandedId === q.id ? 'chevronDown' : 'chevronRight'} size={18} color={COLORS.mute} />
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 12, color: COLORS.mute }}>{q.customer_name ?? 'Client'}</Text>
                <Text style={{ fontSize: 12, color: COLORS.mute }}>{new Date(q.created_at).toLocaleDateString('fr-FR')}</Text>
              </View>

              {q.answer && expandedId !== q.id && (
                <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.hairline }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.success, marginBottom: 4 }}>Votre réponse</Text>
                  <Text style={{ fontSize: 13, color: COLORS.ink, lineHeight: 20 }}>{q.answer}</Text>
                </View>
              )}

              {expandedId === q.id && (
                <View style={{ marginTop: 12, gap: 10 }}>
                  <TextInput
                    style={{ borderWidth: 1, borderColor: COLORS.primary, borderRadius: RADIUS.sm, padding: 12, fontSize: 14, color: COLORS.ink, minHeight: 80, textAlignVertical: 'top' }}
                    placeholder="Rédigez votre réponse..."
                    placeholderTextColor={COLORS.mute}
                    multiline
                    autoFocus
                    value={answerText}
                    onChangeText={setAnswerText}
                  />
                  <TouchableOpacity onPress={() => handleAnswer(q.id)} disabled={saving}
                    style={{ backgroundColor: COLORS.primary, borderRadius: RADIUS.sm, paddingVertical: 10, alignItems: 'center', opacity: saving ? 0.7 : 1 }}>
                    {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>Répondre</Text>}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
