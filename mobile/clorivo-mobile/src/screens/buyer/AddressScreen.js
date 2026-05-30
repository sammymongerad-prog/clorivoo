import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SHADOW } from '../../lib/tokens';
import Icon from '../../components/Icon';
import { updateProfile, getProfile } from '../../lib/supabase';
import { useSession } from '../../hooks/useSession';
import { useFocusEffect } from '@react-navigation/native';

const DEFAULT_ADDRESSES = [
  { id: 'home', label: 'Domicile', icon: '🏠' },
  { id: 'work', label: 'Travail',  icon: '🏢' },
  { id: 'other',label: 'Autre',   icon: '📍' },
];

export default function AddressScreen({ navigation }) {
  const session = useSession();
  const [addresses, setAddresses] = useState([]);
  const [modal, setModal]         = useState(false);
  const [form, setForm]           = useState({ label: 'Domicile', street: '', city: '', zip: '', country: 'France' });
  const [saving, setSaving]       = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  useFocusEffect(React.useCallback(() => {
    if (!session?.user?.id) return;
    getProfile(session.user.id).then(p => {
      const saved = p?.addresses ?? (p?.address && typeof p.address === 'string' ? [{ id: '1', label: 'Principal', street: p.address, city: '', zip: '', country: '' }] : []);
      setAddresses(saved);
    });
  }, [session?.user?.id]));

  async function detectGps() {
    setGpsLoading(true);
    if (Platform.OS === 'web') {
      navigator.geolocation?.getCurrentPosition(async pos => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`);
          const d = await res.json();
          const addr = d.address ?? {};
          setForm(f => ({ ...f, street: `${addr.house_number ?? ''} ${addr.road ?? ''}`.trim(), city: addr.city ?? addr.town ?? '', zip: addr.postcode ?? '', country: addr.country ?? 'France' }));
        } catch {}
        setGpsLoading(false);
      }, () => setGpsLoading(false));
    } else {
      const Loc = await import('expo-location');
      const { status } = await Loc.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setGpsLoading(false); return; }
      const loc = await Loc.getCurrentPositionAsync({});
      const [place] = await Loc.reverseGeocodeAsync(loc.coords);
      if (place) setForm(f => ({ ...f, street: `${place.streetNumber ?? ''} ${place.street ?? ''}`.trim(), city: place.city ?? '', zip: place.postalCode ?? '', country: place.country ?? 'France' }));
      setGpsLoading(false);
    }
  }

  async function saveAddress() {
    if (!form.street.trim() || !form.city.trim()) return;
    setSaving(true);
    const newAddr = { ...form, id: Date.now().toString() };
    const updated = [...addresses, newAddr];
    setAddresses(updated);
    await updateProfile(session.user.id, { addresses: updated, address: `${form.street}, ${form.city}` });
    setSaving(false);
    setModal(false);
    setForm({ label: 'Domicile', street: '', city: '', zip: '', country: 'France' });
  }

  async function deleteAddress(id) {
    const updated = addresses.filter(a => a.id !== id);
    setAddresses(updated);
    await updateProfile(session.user.id, { addresses: updated });
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.paper }} edges={['top']}>
      <View style={{ backgroundColor: COLORS.white, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.hairline }}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Icon name="arrowLeft" size={22} color={COLORS.ink} /></TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.ink, flex: 1 }}>Mes adresses</Text>
        <TouchableOpacity onPress={() => setModal(true)} style={{ backgroundColor: COLORS.primary, borderRadius: RADIUS.full, paddingHorizontal: 14, paddingVertical: 7 }}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>+ Ajouter</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
        {addresses.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Text style={{ fontSize: 48 }}>📍</Text>
            <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.ink, marginTop: 12 }}>Aucune adresse</Text>
            <Text style={{ fontSize: 13, color: COLORS.mute, marginTop: 4 }}>Ajoutez une adresse de livraison</Text>
            <TouchableOpacity onPress={() => setModal(true)} style={{ backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, marginTop: 20 }}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>Ajouter une adresse</Text>
            </TouchableOpacity>
          </View>
        ) : (
          addresses.map((a, i) => (
            <View key={a.id ?? i} style={{ backgroundColor: COLORS.white, borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 12, ...SHADOW.sm }}>
              <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: COLORS.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="mapPin" size={18} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.ink }}>{a.label}</Text>
                <Text style={{ fontSize: 13, color: COLORS.mute, marginTop: 2 }}>{a.street}</Text>
                <Text style={{ fontSize: 12, color: COLORS.mute }}>{[a.zip, a.city, a.country].filter(Boolean).join(', ')}</Text>
              </View>
              <TouchableOpacity onPress={() => deleteAddress(a.id)}>
                <Icon name="trash2" size={18} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={modal} transparent animationType="slide" onRequestClose={() => setModal(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} activeOpacity={1} onPress={() => setModal(false)} />
        <View style={{ backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, position: 'absolute', bottom: 0, left: 0, right: 0 }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.hairline, alignSelf: 'center', marginBottom: 20 }} />
          <Text style={{ fontSize: 18, fontWeight: '800', color: COLORS.ink, marginBottom: 16 }}>Nouvelle adresse</Text>

          <TouchableOpacity onPress={detectGps} disabled={gpsLoading}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.primarySoft, borderRadius: 12, padding: 12, marginBottom: 14 }}>
            {gpsLoading ? <ActivityIndicator size="small" color={COLORS.primary} /> : <Icon name="mapPin" size={16} color={COLORS.primary} />}
            <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.primaryDeep }}>{gpsLoading ? 'Détection…' : 'Utiliser ma position GPS'}</Text>
          </TouchableOpacity>

          {[
            { key: 'label',  label: 'Type',         placeholder: 'Domicile / Travail / Autre' },
            { key: 'street', label: 'Rue',           placeholder: '14 rue de la Roquette' },
            { key: 'city',   label: 'Ville',         placeholder: 'Paris' },
            { key: 'zip',    label: 'Code postal',   placeholder: '75011' },
            { key: 'country',label: 'Pays',          placeholder: 'France' },
          ].map(f => (
            <View key={f.key} style={{ marginBottom: 10 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: COLORS.mute, marginBottom: 4 }}>{f.label}</Text>
              <TextInput
                value={form[f.key]} onChangeText={v => setForm(x => ({ ...x, [f.key]: v }))}
                placeholder={f.placeholder} placeholderTextColor={COLORS.mute}
                style={{ borderWidth: 1.5, borderColor: COLORS.hairline, borderRadius: 10, padding: 12, fontSize: 14, color: COLORS.ink, backgroundColor: COLORS.paper }}
              />
            </View>
          ))}

          <TouchableOpacity onPress={saveAddress} disabled={saving}
            style={{ backgroundColor: COLORS.primary, borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 6, opacity: saving ? 0.7 : 1 }}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Enregistrer</Text>}
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
