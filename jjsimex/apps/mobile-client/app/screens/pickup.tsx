import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput,
  Dimensions, Platform, StatusBar, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { BackButton } from '@/components/layout/BackButton';
import { createPickupRequest, getMyPickupRequests } from '@jjsimex/supabase/pickup';
import type { PickupRequest } from '@jjsimex/supabase/pickup';
import { Truck, MapPin, Calendar, Clock, Package, MessageCircle } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const ACCENT = '#F97316';
const statusBarH = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 44;
const WA_NUMBER = '18097851234';

const STATUS_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  pending: { bg: 'rgba(249,115,22,0.14)', color: '#F97316', label: 'En attente' },
  confirmed: { bg: 'rgba(59,130,246,0.16)', color: '#60A5FA', label: 'Confirmé' },
  collected: { bg: 'rgba(34,197,94,0.14)', color: '#22C55E', label: 'Collecté' },
  cancelled: { bg: '#2A2A2A', color: '#9CA3AF', label: 'Annulé' },
};

export default function PickupScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [addr, setAddr] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<PickupRequest[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  useEffect(() => {
    if (!session?.user?.id) return;
    getMyPickupRequests(session.user.id)
      .then(setRequests)
      .catch(() => {})
      .finally(() => setLoadingList(false));
  }, [session?.user?.id]);

  async function handleSubmit() {
    if (!addr.trim() || !date || !time) {
      Alert.alert('Champs requis', 'Veuillez remplir l\'adresse, la date et l\'heure.');
      return;
    }
    if (!session?.user?.id) return;
    setLoading(true);
    try {
      const pickup = await createPickupRequest({
        pickup_address: addr.trim(),
        pickup_date: date,
        pickup_time: time,
        estimated_weight: weight ? parseFloat(weight) : undefined,
        notes: notes.trim() || undefined,
      }, session.user.id);
      setRequests((prev) => [pickup, ...prev]);
      setAddr('');
      setWeight('');
      setNotes('');
      Alert.alert('Demande envoyée', 'Votre demande de pickup a été enregistrée.');
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    } finally {
      setLoading(false);
    }
  }

  function openWhatsApp() {
    const msg = encodeURIComponent(
      `Bonjour JJ's IMEX,\n\nJe souhaite planifier un pickup à domicile.\n\n📍 Adresse : ${addr || '(à préciser)'}\n📅 Date : ${date || '(à préciser)'}\n🕐 Heure : ${time || '(à préciser)'}\n📦 Poids estimé : ${weight ? weight + ' lbs' : '(non précisé)'}\n\nMerci !`
    );
    Linking.openURL(`https://wa.me/${WA_NUMBER}?text=${msg}`);
  }

  function formatWhen(d: string, t: string) {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jui', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    try {
      const dt = new Date(d + 'T12:00:00');
      return `${dt.getDate()} ${months[dt.getMonth()]} ${dt.getFullYear()} · ${(t || '').substring(0, 5).replace(':', 'h')}`;
    } catch {
      return `${d} · ${t}`;
    }
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <BackButton />
        <Text style={s.headerTitle}>Pickup à domicile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* Banner */}
        <View style={s.banner}>
          <View style={s.bannerIcon}>
            <Truck size={26} color="#FFFFFF" strokeWidth={1.9} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.bannerTitle}>On vient chercher votre colis</Text>
            <Text style={s.bannerSub}>Plus besoin de vous déplacer, on collecte directement chez vous.</Text>
          </View>
        </View>

        {/* Form */}
        <View style={s.formCard}>
          <Text style={s.inputLabel}>Adresse de récupération</Text>
          <View style={s.inputWrap}>
            <MapPin size={17} color={ACCENT} style={s.inputIcon} />
            <TextInput
              style={s.inputWithIcon}
              value={addr}
              onChangeText={setAddr}
              placeholder="15490 NW 7th Ave, Miami, FL"
              placeholderTextColor="#5B6470"
            />
          </View>

          <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={s.inputLabel}>Date souhaitée</Text>
              <View style={s.inputWrap}>
                <Calendar size={16} color={ACCENT} style={s.inputIcon} />
                <TextInput
                  style={s.inputWithIcon}
                  value={date}
                  onChangeText={setDate}
                  placeholder="2026-06-25"
                  placeholderTextColor="#5B6470"
                />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.inputLabel}>Heure souhaitée</Text>
              <View style={s.inputWrap}>
                <Clock size={16} color={ACCENT} style={s.inputIcon} />
                <TextInput
                  style={s.inputWithIcon}
                  value={time}
                  onChangeText={setTime}
                  placeholder="14:00"
                  placeholderTextColor="#5B6470"
                />
              </View>
            </View>
          </View>

          <Text style={[s.inputLabel, { marginTop: 16 }]}>Poids estimé (lbs)</Text>
          <View style={s.inputWrap}>
            <Package size={17} color={ACCENT} style={s.inputIcon} />
            <TextInput
              style={s.inputWithIcon}
              value={weight}
              onChangeText={(t) => setWeight(t.replace(/[^0-9.]/g, ''))}
              placeholder="2.4"
              placeholderTextColor="#5B6470"
              keyboardType="numeric"
            />
          </View>

          <Text style={[s.inputLabel, { marginTop: 16 }]}>Notes pour le livreur</Text>
          <TextInput
            style={s.textarea}
            value={notes}
            onChangeText={setNotes}
            placeholder="Étage, code d'accès, instructions spéciales..."
            placeholderTextColor="#5B6470"
            multiline
          />
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={[s.ctaBtn, (!addr.trim() || !date || !time) && { opacity: 0.4 }]}
          onPress={handleSubmit}
          activeOpacity={0.85}
          disabled={!addr.trim() || !date || !time || loading}
        >
          {loading ? <ActivityIndicator color="#0D0D0D" /> : <Text style={s.ctaBtnText}>Envoyer la demande</Text>}
        </TouchableOpacity>

        {/* WhatsApp option */}
        <View style={s.waCard}>
          <Text style={s.waCardTitle}>Ou contactez-nous directement</Text>
          <TouchableOpacity style={s.waBtn} onPress={openWhatsApp} activeOpacity={0.85}>
            <MessageCircle size={18} color="#22C55E" strokeWidth={1.9} />
            <Text style={s.waBtnText}>Planifier via WhatsApp</Text>
          </TouchableOpacity>
        </View>

        {/* Requests list */}
        <Text style={s.listTitle}>Mes demandes de pickup</Text>

        {loadingList ? (
          <ActivityIndicator color={ACCENT} style={{ marginTop: 20 }} />
        ) : requests.length === 0 ? (
          <Text style={s.emptyText}>Aucune demande de pickup pour le moment.</Text>
        ) : (
          <View style={{ gap: 10 }}>
            {requests.map((r) => {
              const badge = STATUS_BADGE[r.status] ?? STATUS_BADGE.cancelled;
              return (
                <View key={r.id} style={s.reqCard}>
                  <View style={s.reqIcon}>
                    <Truck size={20} color={ACCENT} strokeWidth={1.8} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={s.reqAddr} numberOfLines={1}>{r.pickup_address}</Text>
                    <Text style={s.reqWhen}>{formatWhen(r.pickup_date, r.pickup_time)}</Text>
                  </View>
                  <View style={[s.badge, { backgroundColor: badge.bg }]}>
                    <Text style={[s.badgeText, { color: badge.color }]}>{badge.label}</Text>
                  </View>
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingTop: statusBarH + 10, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#1A1A1A',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },

  banner: {
    backgroundColor: ACCENT, borderRadius: 16, padding: 18,
    flexDirection: 'row', alignItems: 'center', gap: 15,
  },
  bannerIcon: {
    width: 52, height: 52, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  bannerTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', lineHeight: 20 },
  bannerSub: { fontSize: 12.5, color: 'rgba(255,255,255,0.88)', marginTop: 4, lineHeight: 18 },

  formCard: {
    backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#1F1F1F',
    borderRadius: 16, padding: 18, marginTop: 16,
  },

  inputLabel: { fontSize: 12.5, fontWeight: '600', color: '#C9CDD3', marginBottom: 8 },
  inputWrap: { position: 'relative' },
  inputIcon: { position: 'absolute', left: 13, top: 15, zIndex: 1 },
  inputWithIcon: {
    width: '100%', height: 48, backgroundColor: '#111111',
    borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 8,
    color: '#FFFFFF', paddingLeft: 40, paddingRight: 14,
    fontSize: 14,
  },
  textarea: {
    width: '100%', height: 78, backgroundColor: '#111111',
    borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 8,
    color: '#FFFFFF', padding: 12, paddingTop: 12,
    fontSize: 14, textAlignVertical: 'top', lineHeight: 21,
  },

  ctaBtn: {
    marginTop: 16, width: '100%', height: 54,
    backgroundColor: ACCENT, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  ctaBtnText: { fontSize: 15, fontWeight: '700', color: '#0D0D0D' },

  waCard: {
    marginTop: 16, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#1F1F1F',
    borderRadius: 14, padding: 16, alignItems: 'center',
  },
  waCardTitle: { fontSize: 12.5, color: '#9CA3AF', marginBottom: 12 },
  waBtn: {
    width: '100%', height: 48, backgroundColor: 'rgba(34,197,94,0.12)', borderRadius: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  waBtnText: { fontSize: 14, fontWeight: '700', color: '#22C55E' },

  listTitle: { fontWeight: '700', fontSize: 17, color: '#FFFFFF', marginTop: 28, marginBottom: 12 },
  emptyText: { fontSize: 13, color: '#666', textAlign: 'center', marginTop: 12 },

  reqCard: {
    flexDirection: 'row', alignItems: 'center', gap: 13,
    backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#1F1F1F',
    borderRadius: 16, padding: 14,
  },
  reqIcon: {
    width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(249,115,22,0.10)',
    alignItems: 'center', justifyContent: 'center',
  },
  reqAddr: { fontSize: 13.5, fontWeight: '700', color: '#FFFFFF' },
  reqWhen: { fontSize: 12, color: '#9CA3AF', marginTop: 3 },

  badge: { paddingHorizontal: 11, paddingVertical: 5, borderRadius: 99 },
  badgeText: { fontSize: 10.5, fontWeight: '700' },
});
