import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, RADIUS, SHADOW } from '../../lib/tokens';
import { supabase } from '../../lib/supabase';
import { useSession } from '../../hooks/useSession';
import Icon from '../../components/Icon';

const METHODS = ['Mobile Money', 'Virement bancaire', 'PayPal'];
const STATUS_COLOR = { pending: '#F59E0B', approved: COLORS.success, rejected: COLORS.danger };
const STATUS_LABEL = { pending: 'En attente', approved: 'Approuvé', rejected: 'Refusé' };

export default function WithdrawScreen({ navigation }) {
  const session = useSession();
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState(METHODS[0]);
  const [accountDetails, setAccountDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    if (!session?.user) return;
    try {
      const since = new Date(Date.now() - 30 * 86400_000).toISOString();
      const { data: items } = await supabase.from('order_items').select('unit_price,quantity').eq('seller_id', session.user.id).gte('created_at', since);
      const rev = (items ?? []).reduce((s, i) => s + (i.unit_price ?? 0) * (i.quantity ?? 1), 0);
      setBalance(rev);
    } catch {}
    try {
      const { data } = await supabase.from('withdrawal_requests').select('*').eq('seller_id', session.user.id).order('created_at', { ascending: false }).limit(20);
      setHistory(data ?? []);
    } catch {
      setHistory([]);
    }
    setLoading(false);
  }

  useFocusEffect(useCallback(() => {
    setLoading(true);
    loadData();
  }, [session]));

  async function handleSubmit() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { Alert.alert('Erreur', 'Entrez un montant valide.'); return; }
    if (!accountDetails.trim()) { Alert.alert('Erreur', 'Entrez les détails du compte.'); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('withdrawal_requests').insert({
        seller_id: session.user.id,
        amount: amt,
        method,
        account_details: accountDetails.trim(),
        status: 'pending',
      });
      if (error) throw error;
      Alert.alert('Demande envoyée', 'Votre demande de retrait a été soumise avec succès.');
      setAmount('');
      setAccountDetails('');
      await loadData();
    } catch (e) {
      Alert.alert('Erreur', e?.message ?? 'Impossible de soumettre la demande.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.paper }} edges={['top']}>
      <View style={{ backgroundColor: COLORS.white, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.hairline, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrowLeft" size={22} color={COLORS.ink} />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: COLORS.ink }}>Demande de retrait</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 16 }}>
          <View style={{ backgroundColor: COLORS.primary, borderRadius: RADIUS.md, padding: 24, alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '600' }}>Solde disponible</Text>
            <Text style={{ fontSize: 36, fontWeight: '900', color: '#fff', letterSpacing: -1 }}>${balance.toFixed(2)}</Text>
          </View>

          <View style={{ backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: 16, gap: 14, ...SHADOW.sm }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.ink }}>Nouveau retrait</Text>

            <View>
              <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.ink, marginBottom: 6 }}>Montant ($)</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: COLORS.hairline, borderRadius: RADIUS.sm, paddingHorizontal: 14, paddingVertical: 12, fontSize: 20, fontWeight: '700', color: COLORS.ink }}
                placeholder="0.00"
                placeholderTextColor={COLORS.mute}
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
            </View>

            <View>
              <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.ink, marginBottom: 8 }}>Méthode de paiement</Text>
              <View style={{ gap: 8 }}>
                {METHODS.map(m => (
                  <TouchableOpacity key={m} onPress={() => setMethod(m)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: method === m ? COLORS.primary : COLORS.hairline, backgroundColor: method === m ? COLORS.primarySoft : COLORS.white }}>
                    <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: method === m ? COLORS.primary : COLORS.hairline, alignItems: 'center', justifyContent: 'center' }}>
                      {method === m && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary }} />}
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: method === m ? COLORS.primary : COLORS.ink }}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View>
              <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.ink, marginBottom: 6 }}>Détails du compte</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: COLORS.hairline, borderRadius: RADIUS.sm, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: COLORS.ink, minHeight: 80, textAlignVertical: 'top' }}
                placeholder="Numéro de téléphone, IBAN, ou email PayPal..."
                placeholderTextColor={COLORS.mute}
                multiline
                value={accountDetails}
                onChangeText={setAccountDetails}
              />
            </View>

            <TouchableOpacity onPress={handleSubmit} disabled={submitting}
              style={{ backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 16, alignItems: 'center', opacity: submitting ? 0.7 : 1 }}>
              {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Demander le retrait</Text>}
            </TouchableOpacity>
          </View>

          {history.length > 0 && (
            <View style={{ backgroundColor: COLORS.white, borderRadius: RADIUS.md, overflow: 'hidden', ...SHADOW.sm }}>
              <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.hairline }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.ink }}>Historique des demandes</Text>
              </View>
              {history.map((h, i) => {
                const color = STATUS_COLOR[h.status] ?? COLORS.mute;
                return (
                  <View key={h.id ?? i} style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: i < history.length - 1 ? 1 : 0, borderBottomColor: COLORS.hairline }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.ink }}>{h.method}</Text>
                      <Text style={{ fontSize: 12, color: COLORS.mute }}>{new Date(h.created_at).toLocaleDateString('fr-FR')}</Text>
                    </View>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: COLORS.primary, marginRight: 10 }}>${Number(h.amount).toFixed(2)}</Text>
                    <View style={{ backgroundColor: color + '20', borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color }}>{STATUS_LABEL[h.status] ?? h.status}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
