import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Modal, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

type Statut = 'en_transit' | 'arrive' | 'en_attente' | 'livre' | 'retenu';

const STATUT_INFO: Record<Statut, { label: string; color: string; bg: string }> = {
  en_transit: { label: 'En transit', color: '#F97316', bg: '#C2600A' },
  arrive: { label: 'Arrivé entrepôt', color: '#22C55E', bg: '#14532D' },
  en_attente: { label: 'En attente', color: '#FBBF24', bg: '#78350F' },
  livre: { label: 'Livré', color: '#22C55E', bg: '#14532D' },
  retenu: { label: 'Retenu douane', color: '#EF4444', bg: '#7F1D1D' },
};

const TIMELINE = [
  { label: 'Enregistré', date: '10 juin 2025 09:14', done: true },
  { label: 'Entrepôt Miami', date: '10 juin 2025 14:30', done: true },
  { label: 'Départ vol', date: '14 juin 2025 07:00', done: true },
  { label: 'En transit', date: 'En cours', done: false, active: true },
  { label: 'Arrivé PAP', date: 'Prévu 14 juin ~18h', done: false },
  { label: 'Livraison', date: 'Prévu 15-16 juin', done: false },
];

function NavItem({ icon, label, active }: { icon: string; label: string; active?: boolean }) {
  return (
    <View style={{ alignItems: 'center', gap: 5, width: 56 }}>
      <Text style={{ fontSize: 22, color: active ? '#F97316' : '#666666' }}>{icon}</Text>
      <Text style={{ fontSize: 10, fontWeight: '600', color: active ? '#F97316' : '#666666' }}>{label}</Text>
    </View>
  );
}

export default function DetailColisAdminScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [statut, setStatut] = useState<Statut>('en_transit');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [note, setNote] = useState('');

  const colisId = id ?? 'JJI-2025-00847';
  const si = STATUT_INFO[statut];

  return (
    <View style={S.container}>
      {/* Header */}
      <View style={S.header}>
        <TouchableOpacity style={S.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Text style={{ color: '#FFFFFF', fontSize: 20 }}>←</Text>
        </TouchableOpacity>
        <Text style={S.headerTitle}>{colisId}</Text>
        <TouchableOpacity style={S.backBtn} activeOpacity={0.8}>
          <Text style={{ color: '#FFFFFF', fontSize: 16 }}>⋮</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 22, paddingBottom: 106 }}>
        {/* Hero */}
        <View style={{ backgroundColor: '#F97316', borderRadius: 20, padding: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontWeight: '800', fontSize: 18, letterSpacing: -0.3, color: '#1A0D02' }}>{colisId}</Text>
            <View style={{ backgroundColor: si.bg, borderRadius: 99, paddingHorizontal: 11, paddingVertical: 5 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '600' }}>{si.label}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14, backgroundColor: 'rgba(26,13,2,0.10)', borderRadius: 12, padding: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 10, color: 'rgba(26,13,2,0.55)' }}>Départ</Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#1A0D02' }}>Miami Warehouse</Text>
            </View>
            <Text style={{ color: '#1A0D02', fontSize: 18 }}>→</Text>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 10, color: 'rgba(26,13,2,0.55)' }}>Destination</Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#1A0D02' }}>Delmas 31, PAP</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
            {[['Poids réel', '2.4 lbs'], ['Poids facturé', '2.4 lbs'], ['Mode', 'Avion ✈️'], ['Départ', '14 Juin 2025']].map(([k, v]) => (
              <View key={k} style={{ minWidth: '45%' }}>
                <Text style={{ fontSize: 10, color: 'rgba(26,13,2,0.55)' }}>{k}</Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#1A0D02', marginTop: 2 }}>{v}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Client */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Client</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#F97316', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#0D0D0D', fontWeight: '700', fontSize: 16 }}>JP</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>Jean Paul</Text>
              <Text style={{ fontSize: 13, color: '#9CA3AF', marginTop: 2 }}>jean.paul@gmail.com</Text>
              <Text style={{ fontSize: 13, color: '#9CA3AF', marginTop: 1 }}>+509 34 12 34 56 · ID: JJI-00247</Text>
            </View>
            <View style={{ backgroundColor: 'rgba(34,197,94,0.14)', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ color: '#22C55E', fontSize: 11, fontWeight: '600' }}>✓ Actif</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
            <TouchableOpacity style={{ flex: 1, height: 40, backgroundColor: '#2A2A2A', borderRadius: 10, alignItems: 'center', justifyContent: 'center' }} activeOpacity={0.8}>
              <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>💬 WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 1, height: 40, backgroundColor: '#2A2A2A', borderRadius: 10, alignItems: 'center', justifyContent: 'center' }} activeOpacity={0.8}>
              <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>👤 Voir profil</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Informations */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Informations</Text>
          {[
            ['Description', 'Chaussures Nike Air Max x1'],
            ['Valeur déclarée', '$120.00'],
            ['Assurance', 'Gratuite (jusqu\'à $100)'],
            ['Entrepôt', 'Miami — Doral, FL'],
            ['Vol assigné', 'AA1234 · 14 Juin 2025'],
            ['Tarif appliqué', '$9.50/lb · Avion Haiti'],
          ].map(([k, v]) => (
            <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#242424' }}>
              <Text style={{ fontSize: 13, color: '#9CA3AF' }}>{k}</Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#FFFFFF', textAlign: 'right', flex: 1, marginLeft: 12 }}>{v}</Text>
            </View>
          ))}
        </View>

        {/* Paiement */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Paiement</Text>
          {[
            ['Frais d\'expédition', '$22.80'],
            ['Assurance', 'Gratuit'],
            ['Total', '$22.80'],
            ['Méthode', 'MonCash'],
            ['Statut paiement', 'Payé ✓'],
          ].map(([k, v]) => (
            <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#242424' }}>
              <Text style={{ fontSize: 13, color: '#9CA3AF' }}>{k}</Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: v.includes('✓') ? '#22C55E' : '#FFFFFF' }}>{v}</Text>
            </View>
          ))}
        </View>

        {/* Suivi */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Suivi</Text>
          {TIMELINE.map((step, i) => (
            <View key={step.label} style={{ flexDirection: 'row', gap: 14, marginBottom: i < TIMELINE.length - 1 ? 0 : 0 }}>
              <View style={{ alignItems: 'center', width: 20 }}>
                <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: step.done ? '#F97316' : step.active ? '#F97316' : '#2A2A2A', borderWidth: step.active ? 3 : 0, borderColor: '#F9731633' }} />
                {i < TIMELINE.length - 1 && <View style={{ width: 2, flex: 1, backgroundColor: step.done ? '#F97316' : '#2A2A2A', minHeight: 28 }} />}
              </View>
              <View style={{ flex: 1, paddingBottom: 20 }}>
                <Text style={{ fontSize: 13, fontWeight: step.active ? '700' : '600', color: step.done || step.active ? '#FFFFFF' : '#6B7280' }}>{step.label}</Text>
                <Text style={{ fontSize: 11, color: step.active ? '#F97316' : '#6B7280', marginTop: 2 }}>{step.date}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Note admin */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Note interne</Text>
          <TextInput
            style={{ backgroundColor: '#141414', borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 10, color: '#FFFFFF', padding: 12, fontSize: 13, height: 80, textAlignVertical: 'top' }}
            value={note} onChangeText={setNote}
            placeholder="Ajouter une note..." placeholderTextColor="#5B6470" multiline
          />
          <TouchableOpacity style={{ marginTop: 10, height: 40, backgroundColor: '#2A2A2A', borderRadius: 10, alignItems: 'center', justifyContent: 'center' }} activeOpacity={0.8}>
            <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>Sauvegarder la note</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom actions */}
      <View style={{ position: 'absolute', bottom: 84, left: 0, right: 0, padding: 16, backgroundColor: '#0D0D0D', borderTopWidth: 1, borderTopColor: '#1A1A1A', flexDirection: 'row', gap: 10 }}>
        <TouchableOpacity onPress={() => setShowStatusModal(true)} style={{ flex: 1, height: 48, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }} activeOpacity={0.8}>
          <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>Changer statut</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ flex: 1.4, height: 48, backgroundColor: '#F97316', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }} activeOpacity={0.9}>
          <Text style={{ color: '#0D0D0D', fontSize: 13, fontWeight: '700' }}>Notifier client</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom nav */}
      <View style={S.bottomNav}>
        <NavItem icon="⬛" label="Dashboard" />
        <NavItem icon="📦" label="Colis" active />
        <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: '#F97316', alignItems: 'center', justifyContent: 'center', marginTop: -22, borderWidth: 4, borderColor: '#111111' }}>
          <Text style={{ fontSize: 22, color: '#0D0D0D' }}>📷</Text>
        </View>
        <NavItem icon="👥" label="Clients" />
        <NavItem icon="⚙️" label="Gestion" />
      </View>

      {/* Status modal */}
      <Modal visible={showStatusModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#1A1A1A', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
            <View style={{ width: 36, height: 4, backgroundColor: '#2A2A2A', borderRadius: 2, alignSelf: 'center', marginBottom: 20 }} />
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginBottom: 14 }}>Changer le statut</Text>
            {(Object.entries(STATUT_INFO) as [Statut, typeof STATUT_INFO[Statut]][]).map(([key, info]) => (
              <TouchableOpacity key={key} activeOpacity={0.8}
                onPress={() => { setStatut(key); setShowStatusModal(false); }}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#2A2A2A' }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>{info.label}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ backgroundColor: `${info.color}22`, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 }}>
                    <Text style={{ color: info.color, fontSize: 11, fontWeight: '700' }}>{info.label}</Text>
                  </View>
                  {statut === key && <Text style={{ color: '#F97316' }}>✓</Text>}
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setShowStatusModal(false)} style={{ marginTop: 16, height: 48, backgroundColor: '#2A2A2A', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }} activeOpacity={0.8}>
              <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  header: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: '#1A1A1A', backgroundColor: '#0D0D0D' },
  backBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2A2A2A', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  section: { backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#1F1F1F', borderRadius: 16, padding: 18, marginTop: 14 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 },
  bottomNav: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 84, backgroundColor: '#111111', borderTopWidth: 1, borderTopColor: '#2A2A2A', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-around', paddingTop: 12 },
});
