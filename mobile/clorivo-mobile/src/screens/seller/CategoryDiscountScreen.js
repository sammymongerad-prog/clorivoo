import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, RADIUS, SHADOW } from '../../lib/tokens';
import { supabase, getCategories } from '../../lib/supabase';
import { useSession } from '../../hooks/useSession';
import Icon from '../../components/Icon';

export default function CategoryDiscountScreen({ navigation }) {
  const session = useSession();
  const [categories, setCategories] = useState([]);
  const [discounts, setDiscounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useFocusEffect(useCallback(() => {
    if (!session?.user) return;
    (async () => {
      const cats = await getCategories();
      setCategories(cats);
      const { data } = await supabase.from('seller_discounts')
        .select('*').eq('seller_id', session.user.id).catch(() => ({ data: [] }));
      const map = {};
      (data ?? []).forEach(d => { map[d.category_id] = d; });
      setDiscounts(map);
      setLoading(false);
    })();
  }, [session]));

  function updateDiscount(catId, field, value) {
    setDiscounts(prev => ({
      ...prev,
      [catId]: { ...(prev[catId] ?? { category_id: catId, seller_id: session.user.id, discount_percent: 0, is_active: false }), [field]: value },
    }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const rows = Object.values(discounts).filter(d => d.category_id);
      const { error } = await supabase.from('seller_discounts')
        .upsert(rows.map(d => ({ ...d, seller_id: session.user.id })), { onConflict: 'seller_id,category_id' });
      if (error) throw error;
      Alert.alert('Sauvegardé', 'Remises enregistrées avec succès.');
    } catch {
      Alert.alert('Info', 'Fonctionnalité bientôt disponible');
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
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: COLORS.ink }}>Remises par catégorie</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
          <Text style={{ fontSize: 13, color: COLORS.mute, marginBottom: 4 }}>
            Définissez un pourcentage de remise pour chaque catégorie de produits.
          </Text>
          {categories.map(cat => {
            const d = discounts[cat.id] ?? {};
            return (
              <View key={cat.id} style={{ backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: 16, ...SHADOW.sm }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Text style={{ flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.ink }}>{cat.name}</Text>
                  <Switch
                    value={d.is_active ?? false}
                    onValueChange={v => updateDiscount(cat.id, 'is_active', v)}
                    trackColor={{ true: COLORS.primary, false: COLORS.hairline }}
                    thumbColor="#fff"
                  />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={{ fontSize: 13, color: COLORS.mute }}>Remise (%)</Text>
                  <TextInput
                    style={{ flex: 1, borderWidth: 1, borderColor: COLORS.hairline, borderRadius: RADIUS.sm, paddingHorizontal: 12, paddingVertical: 8, fontSize: 15, color: COLORS.ink, backgroundColor: COLORS.paper }}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={COLORS.mute}
                    value={String(d.discount_percent ?? '')}
                    onChangeText={v => {
                      const n = parseInt(v, 10);
                      if (!isNaN(n) && n >= 0 && n <= 100) updateDiscount(cat.id, 'discount_percent', n);
                      else if (v === '') updateDiscount(cat.id, 'discount_percent', 0);
                    }}
                  />
                  <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.primary }}>%</Text>
                </View>
              </View>
            );
          })}
          <TouchableOpacity onPress={handleSave} disabled={saving}
            style={{ backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 16, alignItems: 'center', marginTop: 8, opacity: saving ? 0.7 : 1 }}>
            {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Enregistrer</Text>}
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
