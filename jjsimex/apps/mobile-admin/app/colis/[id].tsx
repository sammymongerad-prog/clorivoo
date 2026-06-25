import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';

type Statut = 'awaiting_arrival' | 'received_usa' | 'in_transit' | 'arrived' | 'ready_pickup' | 'delivered' | 'pending';

const STATUT_INFO: Record<Statut, { label: string; color: string; bg: string }> = {
  awaiting_arrival: { label: 'En attente', color: '#FBBF24', bg: '#78350F' },
  received_usa: { label: 'Reçu Miami', color: '#3B82F6', bg: '#1E3A5F' },
  in_transit: { label: 'En transit', color: '#F97316', bg: '#C2600A' },
  arrived: { label: 'Arrivé', color: '#8B5CF6', bg: '#4C1D95' },
  ready_pickup: { label: 'Prêt à retirer', color: '#22C55E', bg: '#14532D' },
  delivered: { label: 'Livré', color: '#22C55E', bg: '#14532D' },
  pending: { label: 'En attente', color: '#9CA3AF', bg: '#374151' },
};

function NavItem({ icon, label, active }: { icon: string; label: string; active?: boolean }) {
  return (
    <View style={{ alignItems: 'center', gap: 5, width: 56 }}>
      <Text style={{ fontSize: 22, color: active ? '#F97316' : '#666666' }}>{icon}</Text>
      <Text style={{ fontSize: 10, fontWeight: '600', color: active ? '#F97316' : '#666666' }}>{label}</Text>
    </View>
  );
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function DetailColisAdminScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [pkg, setPkg] = useState<Record<string, any> | null>(null);
  const [timeline, setTimeline] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!id) {
      setError('Colis introuvable');
      setLoading(false);
      return;
    }

    async function fetchData() {
      setLoading(true);
      setError(null);

      const [pkgRes, histRes] = await Promise.all([
        supabase
          .from('packages')
          .select('*, users!client_id(full_name, email, phone_whatsapp)')
          .eq('id', id)
          .single(),
        supabase
          .from('package_status_history')
          .select('*')
          .eq('package_id', id)
          .order('created_at', { ascending: true }),
      ]);

      if (pkgRes.error || !pkgRes.data) {
        setError('Colis introuvable');
        setLoading(false);
        return;
      }

      setPkg(pkgRes.data);
      setTimeline(histRes.data ?? []);
      setLoading(false);
    }

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <View style={[S.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#F97316" />
        <Text style={{ color: '#9CA3AF', marginTop: 12, fontSize: 14 }}>Chargement...</Text>
      </View>
    );
  }

  if (error || !pkg) {
    return (
      <View style={[S.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>📦</Text>
        <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}>Colis introuvable</Text>
        <Text style={{ color: '#9CA3AF', fontSize: 14, marginTop: 8 }}>Ce colis n'existe pas ou a été supprimé.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 24, backgroundColor: '#F97316', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 }}>
          <Text style={{ color: '#0D0D0D', fontWeight: '700', fontSize: 14 }}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statut = (pkg.status as Statut) ?? 'pending';
  const si = STATUT_INFO[statut] ?? STATUT_INFO.pending;
  const client = pkg.users as { full_name?: string; email?: string; phone_whatsapp?: string } | null;
  const clientName = client?.full_name ?? 'Client inconnu';
  const clientInitials = getInitials(clientName);
  const trackingNumber = pkg.tracking_number ?? pkg.request_number ?? '-';
  const transportLabel = pkg.transport_mode === 'air' ? 'Avion ✈️' : pkg.transport_mode === 'sea' ? 'Bateau 🚢' : '-';
  const destination = [pkg.destination_city, pkg.destination_country === 'haiti' ? 'Haiti' : pkg.destination_country === 'dominican_republic' ? 'RD' : ''].filter(Boolean).join(', ');

  const handleStatusChange = async (newStatus: Statut) => {
    const { error: updateErr } = await supabase
      .from('packages')
      .update({ status: newStatus })
      .eq('id', id);

    if (updateErr) {
      Alert.alert('Erreur', 'Impossible de mettre à jour le statut.');
      return;
    }

    setPkg(prev => prev ? { ...prev, status: newStatus } : prev);
    setShowStatusModal(false);
  };

  return (
    <View style={S.container}>
      {/* Header */}
      <View style={S.header}>
        <TouchableOpacity style={S.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Text style={{ color: '#FFFFFF', fontSize: 20 }}>←</Text>
        </TouchableOpacity>
        <Text style={S.headerTitle}>{trackingNumber}</Text>
        <TouchableOpacity style={S.backBtn} activeOpacity={0.8}>
          <Text style={{ color: '#FFFFFF', fontSize: 16 }}>⋮</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 22, paddingBottom: 106 }}>
        {/* Hero */}
        <View style={{ backgroundColor: '#F97316', borderRadius: 20, padding: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontWeight: '800', fontSize: 18, letterSpacing: -0.3, color: '#1A0D02' }}>{trackingNumber}</Text>
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
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#1A0D02' }}>{destination || '-'}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
            {[
              ['Poids réel', pkg.real_weight_lbs != null ? `${pkg.real_weight_lbs} lbs` : '-'],
              ['Poids facturé', pkg.billed_weight_lbs != null ? `${pkg.billed_weight_lbs} lbs` : '-'],
              ['Mode', transportLabel],
              ['Créé le', pkg.created_at ? new Date(pkg.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'],
            ].map(([k, v]) => (
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
              <Text style={{ color: '#0D0D0D', fontWeight: '700', fontSize: 16 }}>{clientInitials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>{clientName}</Text>
              <Text style={{ fontSize: 13, color: '#9CA3AF', marginTop: 2 }}>{client?.email ?? '-'}</Text>
              <Text style={{ fontSize: 13, color: '#9CA3AF', marginTop: 1 }}>{client?.phone_whatsapp ?? '-'}</Text>
            </View>
            <View style={{ backgroundColor: 'rgba(34,197,94,0.14)', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ color: '#22C55E', fontSize: 11, fontWeight: '600' }}>✓ Actif</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
            <TouchableOpacity style={{ flex: 1, height: 40, backgroundColor: '#2A2A2A', borderRadius: 10, alignItems: 'center', justifyContent: 'center' }} activeOpacity={0.8}>
              <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>💬 WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => pkg.client_id && router.push(`/client/${pkg.client_id}`)}
              style={{ flex: 1, height: 40, backgroundColor: '#2A2A2A', borderRadius: 10, alignItems: 'center', justifyContent: 'center' }} activeOpacity={0.8}>
              <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>👤 Voir profil</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Informations */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Informations</Text>
          {[
            ['Description', pkg.description ?? pkg.category ?? '-'],
            ['Valeur déclarée', pkg.declared_value != null ? `$${Number(pkg.declared_value).toFixed(2)}` : '-'],
            ['Tarif appliqué', pkg.shipping_rate != null ? `$${Number(pkg.shipping_rate).toFixed(2)}` : '-'],
            ['Destination', pkg.recipient_address ?? destination ?? '-'],
            ['Mode transport', transportLabel],
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
            ['Frais d\'expédition', pkg.shipping_rate != null ? `$${Number(pkg.shipping_rate).toFixed(2)}` : '-'],
            ['Assurance', pkg.insurance_amount ? `$${Number(pkg.insurance_amount).toFixed(2)}` : 'Gratuit'],
            ['Total', pkg.total_price != null ? `$${Number(pkg.total_price).toFixed(2)}` : '-'],
          ].map(([k, v]) => (
            <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#242424' }}>
              <Text style={{ fontSize: 13, color: '#9CA3AF' }}>{k}</Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#FFFFFF' }}>{v}</Text>
            </View>
          ))}
        </View>

        {/* Suivi / Timeline */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Suivi</Text>
          {timeline.length === 0 ? (
            <Text style={{ fontSize: 13, color: '#9CA3AF', fontStyle: 'italic' }}>Aucun historique de suivi disponible.</Text>
          ) : (
            timeline.map((step, i) => {
              const stepInfo = STATUT_INFO[step.status as Statut];
              const isLast = i === timeline.length - 1;
              return (
                <View key={step.id ?? i} style={{ flexDirection: 'row', gap: 14 }}>
                  <View style={{ alignItems: 'center', width: 20 }}>
                    <View style={{
                      width: 14, height: 14, borderRadius: 7,
                      backgroundColor: isLast ? '#F97316' : '#F97316',
                      borderWidth: isLast ? 3 : 0,
                      borderColor: '#F9731633',
                    }} />
                    {i < timeline.length - 1 && <View style={{ width: 2, flex: 1, backgroundColor: '#F97316', minHeight: 28 }} />}
                  </View>
                  <View style={{ flex: 1, paddingBottom: 20 }}>
                    <Text style={{ fontSize: 13, fontWeight: isLast ? '700' : '600', color: '#FFFFFF' }}>
                      {stepInfo?.label ?? step.status}
                    </Text>
                    {step.notes && (
                      <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{step.notes}</Text>
                    )}
                    <Text style={{ fontSize: 11, color: isLast ? '#F97316' : '#6B7280', marginTop: 2 }}>
                      {step.created_at ? formatDateTime(step.created_at) : '-'}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Note admin */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Note interne</Text>
          {pkg.internal_notes && (
            <Text style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 10, whiteSpace: 'pre-wrap' } as any}>{pkg.internal_notes}</Text>
          )}
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
                onPress={() => handleStatusChange(key)}
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
