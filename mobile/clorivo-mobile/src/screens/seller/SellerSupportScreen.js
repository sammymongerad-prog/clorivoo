import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, RADIUS, SHADOW } from '../../lib/tokens';
import { supabase } from '../../lib/supabase';
import { useSession } from '../../hooks/useSession';
import Icon from '../../components/Icon';

const PRIORITIES = ['low', 'medium', 'high'];
const PRIORITY_LABEL = { low: 'Faible', medium: 'Moyen', high: 'Élevé' };
const PRIORITY_COLOR = { low: COLORS.success, medium: '#F59E0B', high: COLORS.danger };
const STATUS_COLOR = { open: '#F59E0B', in_progress: COLORS.primary, resolved: COLORS.success, closed: COLORS.mute };
const STATUS_LABEL = { open: 'Ouvert', in_progress: 'En cours', resolved: 'Résolu', closed: 'Fermé' };

export default function SellerSupportScreen({ navigation }) {
  const session = useSession();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailTicket, setDetailTicket] = useState(null);
  const [form, setForm] = useState({ subject: '', priority: 'medium', message: '' });
  const [saving, setSaving] = useState(false);

  async function loadTickets() {
    if (!session?.user) return;
    const { data, error } = await supabase.from('support_tickets')
      .select('*').eq('seller_id', session.user.id)
      .order('created_at', { ascending: false }).limit(50);
    if (!error) setTickets(data ?? []);
    else setTickets([]);
    setLoading(false);
  }

  useFocusEffect(useCallback(() => {
    setLoading(true);
    loadTickets();
  }, [session]));

  async function handleCreate() {
    if (!form.subject.trim()) { Alert.alert('Erreur', 'Le sujet est requis.'); return; }
    if (!form.message.trim()) { Alert.alert('Erreur', 'Le message est requis.'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('support_tickets').insert({
        seller_id: session.user.id,
        subject: form.subject.trim(),
        message: form.message.trim(),
        priority: form.priority,
        status: 'open',
      });
      if (error) throw error;
      setModalVisible(false);
      setForm({ subject: '', priority: 'medium', message: '' });
      await loadTickets();
    } catch (e) {
      Alert.alert('Erreur', e?.message ?? 'Impossible de créer le ticket.');
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
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: COLORS.ink }}>Support vendeur</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
          {tickets.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 80, gap: 12 }}>
              <Text style={{ fontSize: 48 }}>🎧</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.ink }}>Aucun ticket</Text>
              <Text style={{ fontSize: 14, color: COLORS.mute }}>Créez un ticket pour contacter notre équipe support.</Text>
            </View>
          ) : tickets.map(ticket => {
            const sc = STATUS_COLOR[ticket.status] ?? COLORS.mute;
            const pc = PRIORITY_COLOR[ticket.priority] ?? COLORS.mute;
            return (
              <TouchableOpacity key={ticket.id} onPress={() => setDetailTicket(ticket)}
                style={{ backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: 16, ...SHADOW.sm }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 }}>
                  <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.ink }} numberOfLines={1}>{ticket.subject}</Text>
                  <View style={{ backgroundColor: sc + '20', borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 8 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: sc }}>{STATUS_LABEL[ticket.status] ?? ticket.status}</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 13, color: COLORS.mute, lineHeight: 18 }} numberOfLines={2}>{ticket.message}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 10 }}>
                  <View style={{ backgroundColor: pc + '20', borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: pc }}>{PRIORITY_LABEL[ticket.priority] ?? ticket.priority}</Text>
                  </View>
                  <Text style={{ fontSize: 12, color: COLORS.mute }}>{new Date(ticket.created_at).toLocaleDateString('fr-FR')}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
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
            <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: COLORS.ink }}>Nouveau ticket</Text>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
            <View>
              <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.ink, marginBottom: 6 }}>Sujet *</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: COLORS.hairline, borderRadius: RADIUS.sm, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: COLORS.ink, backgroundColor: COLORS.white }}
                placeholder="Décrivez brièvement votre problème"
                placeholderTextColor={COLORS.mute}
                value={form.subject}
                onChangeText={v => setForm(p => ({ ...p, subject: v }))}
              />
            </View>

            <View>
              <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.ink, marginBottom: 8 }}>Priorité</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {PRIORITIES.map(pr => {
                  const c = PRIORITY_COLOR[pr];
                  const selected = form.priority === pr;
                  return (
                    <TouchableOpacity key={pr} onPress={() => setForm(p => ({ ...p, priority: pr }))}
                      style={{ flex: 1, paddingVertical: 10, borderRadius: RADIUS.sm, alignItems: 'center', backgroundColor: selected ? c + '20' : COLORS.white, borderWidth: 1, borderColor: selected ? c : COLORS.hairline }}>
                      <Text style={{ fontWeight: '600', fontSize: 13, color: selected ? c : COLORS.mute }}>{PRIORITY_LABEL[pr]}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View>
              <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.ink, marginBottom: 6 }}>Message *</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: COLORS.hairline, borderRadius: RADIUS.sm, padding: 14, fontSize: 14, color: COLORS.ink, minHeight: 120, textAlignVertical: 'top', backgroundColor: COLORS.white }}
                placeholder="Décrivez votre problème en détail..."
                placeholderTextColor={COLORS.mute}
                multiline
                value={form.message}
                onChangeText={v => setForm(p => ({ ...p, message: v }))}
              />
            </View>

            <TouchableOpacity onPress={handleCreate} disabled={saving}
              style={{ backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 16, alignItems: 'center', opacity: saving ? 0.7 : 1 }}>
              {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Envoyer le ticket</Text>}
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal visible={!!detailTicket} animationType="slide" presentationStyle="pageSheet">
        {detailTicket && (
          <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.paper }} edges={['top']}>
            <View style={{ backgroundColor: COLORS.white, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.hairline, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity onPress={() => setDetailTicket(null)}>
                <Icon name="arrowLeft" size={22} color={COLORS.ink} />
              </TouchableOpacity>
              <Text style={{ flex: 1, fontSize: 16, fontWeight: '700', color: COLORS.ink }} numberOfLines={1}>{detailTicket.subject}</Text>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
              <View style={{ backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: 16, ...SHADOW.sm }}>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                  <View style={{ backgroundColor: (STATUS_COLOR[detailTicket.status] ?? COLORS.mute) + '20', borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: STATUS_COLOR[detailTicket.status] ?? COLORS.mute }}>{STATUS_LABEL[detailTicket.status] ?? detailTicket.status}</Text>
                  </View>
                  <View style={{ backgroundColor: (PRIORITY_COLOR[detailTicket.priority] ?? COLORS.mute) + '20', borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: PRIORITY_COLOR[detailTicket.priority] ?? COLORS.mute }}>{PRIORITY_LABEL[detailTicket.priority] ?? detailTicket.priority}</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 14, color: COLORS.ink, lineHeight: 22 }}>{detailTicket.message}</Text>
                <Text style={{ fontSize: 12, color: COLORS.mute, marginTop: 10 }}>{new Date(detailTicket.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
              </View>
              {detailTicket.response && (
                <View style={{ backgroundColor: COLORS.primarySoft, borderRadius: RADIUS.md, padding: 16 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.primary, marginBottom: 6 }}>Réponse du support</Text>
                  <Text style={{ fontSize: 14, color: COLORS.ink, lineHeight: 22 }}>{detailTicket.response}</Text>
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>
    </SafeAreaView>
  );
}
