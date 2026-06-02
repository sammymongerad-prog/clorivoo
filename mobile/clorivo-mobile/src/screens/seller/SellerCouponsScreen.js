import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Modal, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, RADIUS, SHADOW } from '../../lib/tokens';
import { supabase } from '../../lib/supabase';
import { useSession } from '../../hooks/useSession';
import Icon from '../../components/Icon';

const EMPTY_FORM = { code: '', discount_type: 'percent', discount_value: '', min_order_amount: '', usage_limit: '', expires_at: '', is_active: true };

export default function SellerCouponsScreen({ navigation }) {
  const session = useSession();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [shopId, setShopId] = useState(null);

  useFocusEffect(useCallback(() => {
    if (!session?.user) return;
    (async () => {
      const { data: shop } = await supabase.from('shops').select('id').eq('seller_id', session.user.id).maybeSingle();
      setShopId(shop?.id ?? null);
      try {
        const { data } = await supabase.from('coupons')
          .select('*')
          .eq('shop_id', shop?.id ?? '')
          .order('created_at', { ascending: false });
        setCoupons(data ?? []);
      } catch { setCoupons([]); }
      setLoading(false);
    })();
  }, [session]));

  async function handleCreate() {
    if (!form.code.trim()) { Alert.alert('Erreur', 'Le code est requis.'); return; }
    setSaving(true);
    try {
      const payload = {
        shop_id: shopId,
        code: form.code.trim().toUpperCase(),
        discount_type: form.discount_type,
        discount_value: parseFloat(form.discount_value) || 0,
        min_order_amount: parseFloat(form.min_order_amount) || null,
        usage_limit: parseInt(form.usage_limit, 10) || null,
        expires_at: form.expires_at || null,
        is_active: form.is_active,
        usage_count: 0,
      };
      const { error } = await supabase.from('coupons').insert(payload);
      if (error) throw error;
      const { data } = await supabase.from('coupons').select('*').eq('shop_id', shopId).order('created_at', { ascending: false });
      setCoupons(data ?? []);
      setModalVisible(false);
      setForm(EMPTY_FORM);
    } catch (e) {
      Alert.alert('Erreur', e?.message ?? 'Impossible de créer le coupon.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(coupon) {
    const updated = !coupon.is_active;
    try { await supabase.from('coupons').update({ is_active: updated }).eq('id', coupon.id); } catch {}
    setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, is_active: updated } : c));
  }

  function discountDisplay(c) {
    if (c.discount_type === 'percent') return `-${c.discount_value}%`;
    return `-$${Number(c.discount_value).toFixed(2)}`;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.paper }} edges={['top']}>
      <View style={{ backgroundColor: COLORS.white, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.hairline, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrowLeft" size={22} color={COLORS.ink} />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: COLORS.ink }}>Coupons de réduction</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
          {coupons.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 80, gap: 12 }}>
              <Text style={{ fontSize: 48 }}>🏷️</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.ink }}>Aucun coupon</Text>
              <Text style={{ fontSize: 14, color: COLORS.mute }}>Créez votre premier coupon de réduction</Text>
            </View>
          ) : coupons.map(c => (
            <View key={c.id} style={{ backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: 16, ...SHADOW.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <View style={{ backgroundColor: COLORS.primarySoft, borderRadius: RADIUS.sm, paddingHorizontal: 10, paddingVertical: 4, marginRight: 10 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: COLORS.primary, letterSpacing: 1 }}>{c.code}</Text>
                </View>
                <View style={{ backgroundColor: '#ECFDF5', borderRadius: RADIUS.sm, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.success }}>{discountDisplay(c)}</Text>
                </View>
                <View style={{ flex: 1 }} />
                <Switch
                  value={c.is_active}
                  onValueChange={() => toggleActive(c)}
                  trackColor={{ true: COLORS.primary, false: COLORS.hairline }}
                  thumbColor="#fff"
                />
              </View>
              <View style={{ flexDirection: 'row', gap: 16 }}>
                <Text style={{ fontSize: 12, color: COLORS.mute }}>
                  Utilisations: {c.usage_count ?? 0}{c.usage_limit ? `/${c.usage_limit}` : ''}
                </Text>
                {c.expires_at && (
                  <Text style={{ fontSize: 12, color: COLORS.mute }}>
                    Expire: {new Date(c.expires_at).toLocaleDateString('fr-FR')}
                  </Text>
                )}
                {c.min_order_amount && (
                  <Text style={{ fontSize: 12, color: COLORS.mute }}>Min: ${c.min_order_amount}</Text>
                )}
              </View>
            </View>
          ))}
          <View style={{ height: 80 }} />
        </ScrollView>
      )}

      <TouchableOpacity onPress={() => setModalVisible(true)}
        style={{ position: 'absolute', bottom: 32, right: 24, backgroundColor: COLORS.primary, borderRadius: RADIUS.full, width: 56, height: 56, alignItems: 'center', justifyContent: 'center', ...SHADOW.md }}>
        <Icon name="plus" size={24} color="#fff" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.paper }} edges={['top']}>
          <View style={{ backgroundColor: COLORS.white, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.hairline, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Icon name="x" size={22} color={COLORS.ink} />
            </TouchableOpacity>
            <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: COLORS.ink }}>Nouveau coupon</Text>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
            {[
              { label: 'Code coupon *', key: 'code', placeholder: 'ETE20', autoCapitalize: 'characters' },
              { label: 'Valeur de la remise *', key: 'discount_value', placeholder: '20', keyboardType: 'numeric' },
              { label: 'Commande minimum ($)', key: 'min_order_amount', placeholder: '50', keyboardType: 'numeric' },
              { label: 'Nombre max d\'utilisations', key: 'usage_limit', placeholder: '100', keyboardType: 'numeric' },
              { label: 'Date d\'expiration (YYYY-MM-DD)', key: 'expires_at', placeholder: '2026-12-31' },
            ].map(({ label, key, placeholder, keyboardType, autoCapitalize }) => (
              <View key={key}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.ink, marginBottom: 6 }}>{label}</Text>
                <TextInput
                  style={{ borderWidth: 1, borderColor: COLORS.hairline, borderRadius: RADIUS.sm, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: COLORS.ink, backgroundColor: COLORS.white }}
                  placeholder={placeholder}
                  placeholderTextColor={COLORS.mute}
                  keyboardType={keyboardType}
                  autoCapitalize={autoCapitalize ?? 'none'}
                  value={form[key]}
                  onChangeText={v => setForm(prev => ({ ...prev, [key]: v }))}
                />
              </View>
            ))}

            <View>
              <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.ink, marginBottom: 8 }}>Type de remise</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {['percent', 'fixed'].map(t => (
                  <TouchableOpacity key={t} onPress={() => setForm(prev => ({ ...prev, discount_type: t }))}
                    style={{ flex: 1, paddingVertical: 10, borderRadius: RADIUS.sm, alignItems: 'center', backgroundColor: form.discount_type === t ? COLORS.primary : COLORS.white, borderWidth: 1, borderColor: form.discount_type === t ? COLORS.primary : COLORS.hairline }}>
                    <Text style={{ fontWeight: '600', color: form.discount_type === t ? '#fff' : COLORS.ink }}>
                      {t === 'percent' ? 'Pourcentage (%)' : 'Montant fixe ($)'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.white, borderRadius: RADIUS.sm, padding: 14, borderWidth: 1, borderColor: COLORS.hairline }}>
              <Text style={{ fontSize: 15, color: COLORS.ink, fontWeight: '600' }}>Actif</Text>
              <Switch
                value={form.is_active}
                onValueChange={v => setForm(prev => ({ ...prev, is_active: v }))}
                trackColor={{ true: COLORS.primary, false: COLORS.hairline }}
                thumbColor="#fff"
              />
            </View>

            <TouchableOpacity onPress={handleCreate} disabled={saving}
              style={{ backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 16, alignItems: 'center', opacity: saving ? 0.7 : 1 }}>
              {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Créer le coupon</Text>}
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
