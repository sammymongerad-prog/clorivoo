import { useState, useContext } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { blockUser } from '@jjsimex/supabase/users';
import { AuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';

const COLIS_RECENTS = [
  { id: 'JJI-2025-00847', desc: 'Chaussures Nike', statut: 'En transit', statutColor: '#F97316', date: '10 juin 2025', montant: '$22.80' },
  { id: 'JJI-2025-00812', desc: 'Vêtements Shein', statut: 'Livré', statutColor: '#22C55E', date: '2 juin 2025', montant: '$18.50' },
  { id: 'JJI-2025-00784', desc: 'Produits Amazon', statut: 'Livré', statutColor: '#22C55E', date: '15 mai 2025', montant: '$31.20' },
];

function NavItem({ icon, label, active }: { icon: string; label: string; active?: boolean }) {
  return (
    <View style={{ alignItems: 'center', gap: 5, width: 56 }}>
      <Text style={{ fontSize: 22, color: active ? '#F97316' : '#666666' }}>{icon}</Text>
      <Text style={{ fontSize: 10, fontWeight: '600', color: active ? '#F97316' : '#666666' }}>{label}</Text>
    </View>
  );
}

export default function ProfilClientAdminScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const authContext = useContext(AuthContext);
  const { showToast } = useToast();
  const [tab, setTab] = useState<'colis' | 'paiements' | 'notes'>('colis');

  const handleBlockClient = () => {
    Alert.alert('Bloquer', 'Bloquer ce client ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Bloquer',
        style: 'destructive',
        onPress: async () => {
          if (!id || !authContext?.profile?.id) return;
          try {
            await blockUser(id, authContext.profile.id);
            showToast('Client bloqué', 'success');
          } catch {
            showToast('Erreur lors du blocage', 'error');
          }
        },
      },
    ]);
  };

  return (
    <View style={S.container}>
      {/* Header */}
      <View style={S.header}>
        <TouchableOpacity style={S.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Text style={{ color: '#FFFFFF', fontSize: 20 }}>←</Text>
        </TouchableOpacity>
        <Text style={S.headerTitle}>Profil client</Text>
        <TouchableOpacity style={S.backBtn} activeOpacity={0.8}>
          <Text style={{ color: '#FFFFFF', fontSize: 16 }}>⋮</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 22, paddingBottom: 106 }}>
        {/* Identité */}
        <View style={{ backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#1F1F1F', borderRadius: 20, padding: 24, alignItems: 'center' }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#F97316', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#0D0D0D', fontWeight: '700', fontSize: 24 }}>JP</Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#FFFFFF', marginTop: 12 }}>Jean Paul</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 12 }}>
            <View style={{ backgroundColor: 'rgba(34,197,94,0.14)', borderRadius: 99, paddingHorizontal: 11, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Text style={{ color: '#22C55E', fontSize: 11, fontWeight: '600' }}>✓ Vérifié</Text>
            </View>
            <View style={{ backgroundColor: 'rgba(249,115,22,0.14)', borderRadius: 99, paddingHorizontal: 11, paddingVertical: 5 }}>
              <Text style={{ color: '#F97316', fontSize: 11, fontWeight: '600' }}>⭐ Bronze</Text>
            </View>
            <View style={{ backgroundColor: 'rgba(59,130,246,0.14)', borderRadius: 99, paddingHorizontal: 11, paddingVertical: 5 }}>
              <Text style={{ color: '#3B82F6', fontSize: 11, fontWeight: '600' }}>Client depuis 2023</Text>
            </View>
          </View>

          {/* Stats 2x2 */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, width: '100%', marginTop: 18 }}>
            {[['24', 'Colis envoyés'], ['2', 'En cours'], ['$312.50', 'Total dépensé'], ['4.8★', 'Note client']].map(([v, l]) => (
              <View key={l} style={{ flex: 1, minWidth: '45%', backgroundColor: '#222222', borderRadius: 12, padding: 13, alignItems: 'center' }}>
                <Text style={{ fontSize: 19, fontWeight: '800', color: '#F97316' }}>{v}</Text>
                <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 3 }}>{l}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Contact */}
        <View style={[S.section, { marginTop: 14 }]}>
          <Text style={S.sectionTitle}>Coordonnées</Text>
          {[
            ['Email', 'jean.paul@gmail.com'],
            ['WhatsApp', '+509 34 12 34 56'],
            ['ID Client', 'JJI-00247'],
            ['Adresse livraison', 'Delmas 31, Port-au-Prince'],
          ].map(([k, v]) => (
            <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#242424' }}>
              <Text style={{ fontSize: 13, color: '#9CA3AF' }}>{k}</Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#FFFFFF', flex: 1, textAlign: 'right', marginLeft: 12 }}>{v}</Text>
            </View>
          ))}
        </View>

        {/* Actions rapides */}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
          <TouchableOpacity style={{ flex: 1, height: 46, backgroundColor: '#22C55E', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }} activeOpacity={0.8}>
            <Text style={{ color: '#052E14', fontSize: 13, fontWeight: '700' }}>💬 WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ flex: 1, height: 46, backgroundColor: '#2A2A2A', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }} activeOpacity={0.8}>
            <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>📋 Créer colis</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Alert.alert('Bloquer', 'Bloquer ce client ?')} style={{ width: 46, height: 46, backgroundColor: '#2D0A0A', borderWidth: 1, borderColor: 'rgba(239,68,68,0.4)', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }} activeOpacity={0.8}>
            <Text style={{ color: '#EF4444', fontSize: 18 }}>🔒</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 18 }}>
          {(['colis', 'paiements', 'notes'] as const).map(t => (
            <TouchableOpacity key={t} onPress={() => setTab(t)} activeOpacity={0.8}
              style={{ flex: 1, height: 38, borderRadius: 10, borderWidth: 1,
                backgroundColor: tab === t ? 'rgba(249,115,22,0.12)' : '#1A1A1A',
                borderColor: tab === t ? '#F97316' : '#2A2A2A',
                alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: tab === t ? '#F97316' : '#9CA3AF', textTransform: 'capitalize' }}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Colis récents */}
        {tab === 'colis' && (
          <View style={{ marginTop: 14, gap: 10 }}>
            {COLIS_RECENTS.map(c => (
              <TouchableOpacity key={c.id} activeOpacity={0.8}
                style={{ backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#1F1F1F', borderRadius: 14, padding: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>{c.id}</Text>
                  <View style={{ backgroundColor: `${c.statutColor}22`, borderRadius: 99, paddingHorizontal: 9, paddingVertical: 3 }}>
                    <Text style={{ color: c.statutColor, fontSize: 11, fontWeight: '600' }}>{c.statut}</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>{c.desc}</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                  <Text style={{ fontSize: 11, color: '#6B7280' }}>{c.date}</Text>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>{c.montant}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Paiements */}
        {tab === 'paiements' && (
          <View style={{ marginTop: 14 }}>
            <View style={{ backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#1F1F1F', borderRadius: 14, padding: 14 }}>
              {[
                ['Total dépensé', '$312.50', '#F97316'],
                ['Dernier paiement', '$22.80 · MonCash', '#FFFFFF'],
                ['Méthode préférée', 'MonCash', '#FFFFFF'],
                ['Paiements en attente', '$0', '#22C55E'],
              ].map(([k, v, c]) => (
                <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#242424' }}>
                  <Text style={{ fontSize: 13, color: '#9CA3AF' }}>{k}</Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: c }}>{v}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Notes */}
        {tab === 'notes' && (
          <View style={{ marginTop: 14 }}>
            <View style={{ backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#1F1F1F', borderRadius: 14, padding: 14 }}>
              <Text style={{ fontSize: 13, color: '#9CA3AF', fontStyle: 'italic' }}>Aucune note pour ce client. Appuyez sur "+" pour ajouter une note.</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom nav */}
      <View style={S.bottomNav}>
        <NavItem icon="⬛" label="Dashboard" />
        <NavItem icon="📦" label="Colis" />
        <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: '#F97316', alignItems: 'center', justifyContent: 'center', marginTop: -22, borderWidth: 4, borderColor: '#111111' }}>
          <Text style={{ fontSize: 22, color: '#0D0D0D' }}>📷</Text>
        </View>
        <NavItem icon="👥" label="Clients" active />
        <NavItem icon="⚙️" label="Gestion" />
      </View>
    </View>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  header: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: '#1A1A1A', backgroundColor: '#0D0D0D' },
  backBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2A2A2A', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  section: { backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#1F1F1F', borderRadius: 16, padding: 18 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 },
  bottomNav: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 84, backgroundColor: '#111111', borderTopWidth: 1, borderTopColor: '#2A2A2A', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-around', paddingTop: 12 },
});
