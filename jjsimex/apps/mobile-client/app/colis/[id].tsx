import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { getPackageDetail } from '@jjsimex/supabase/packages';
import type { PackageStatus } from '@jjsimex/supabase/packages';

const STATUS_LABELS: Record<PackageStatus, string> = {
  pending: 'En attente',
  received_usa: 'Reçu USA',
  in_transit: 'En transit',
  arrived: 'Arrivé',
  ready_pickup: 'Prêt à retirer',
  delivered: 'Livré',
};

const STATUS_COLORS: Record<PackageStatus, string> = {
  pending: '#EAB308',
  received_usa: '#3B82F6',
  in_transit: '#F97316',
  arrived: '#A855F7',
  ready_pickup: '#06B6D4',
  delivered: '#22C55E',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PackageDetail = any;

export default function ColisDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const router = useRouter();
  const [pkg, setPkg] = useState<PackageDetail>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session?.user.id || !id) return;
    getPackageDetail(id, session.user.id)
      .then(setPkg)
      .catch((e) => setError(e instanceof Error ? e.message : 'Erreur lors du chargement.'))
      .finally(() => setLoading(false));
  }, [id, session?.user.id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#F97316" />
      </View>
    );
  }

  if (error || !pkg) {
    return (
      <View style={[styles.centered, { paddingHorizontal: 20 }]}>
        <Text style={{ color: '#EF4444', textAlign: 'center' }}>{error || 'Colis introuvable.'}</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: '#F97316' }}>← Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const color = STATUS_COLORS[pkg.status as PackageStatus] ?? '#9CA3AF';

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingTop: 56 }}>
      {/* Bouton retour */}
      <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 20 }}>
        <Text style={{ color: '#F97316', fontSize: 16 }}>← Retour</Text>
      </TouchableOpacity>

      {/* En-tête */}
      <View style={styles.card}>
        <Text style={styles.tracking}>{pkg.tracking_number}</Text>
        <View style={[styles.badge, { backgroundColor: `${color}20` }]}>
          <Text style={[styles.badgeText, { color }]}>{STATUS_LABELS[pkg.status as PackageStatus]}</Text>
        </View>
        {pkg.estimated_delivery && (
          <Text style={styles.eta}>
            Livraison estimée : {new Date(pkg.estimated_delivery).toLocaleDateString('fr-FR')}
          </Text>
        )}
      </View>

      {/* Détails */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Informations</Text>
        <InfoRow label="Transport" value={pkg.transport_mode === 'air' ? 'Aérien' : 'Maritime'} />
        <InfoRow label="Destination" value={`${pkg.destination_city}`} />
        <InfoRow label="Poids réel" value={`${pkg.weight_real} lbs`} />
        <InfoRow label="Poids facturé" value={`${pkg.weight_billed?.toFixed(2)} lbs`} />
        <InfoRow label="Prix total" value={`$${pkg.price?.toFixed(2)}`} valueColor="#22C55E" />
      </View>

      {/* Départ */}
      {pkg.departures && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Départ</Text>
          <InfoRow label="Mode" value={pkg.departures.transport_mode === 'air' ? 'Aérien' : 'Maritime'} />
          <InfoRow label="Date départ" value={pkg.departures.departure_date ? new Date(pkg.departures.departure_date).toLocaleDateString('fr-FR') : '—'} />
          <InfoRow label="Statut" value={pkg.departures.status} />
        </View>
      )}

      {/* Historique */}
      {pkg.package_status_history?.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Historique</Text>
          {pkg.package_status_history.map((h: { id: string; status: PackageStatus; notes?: string; created_at: string }) => (
            <View key={h.id} style={styles.historyRow}>
              <View style={[styles.dot, { backgroundColor: STATUS_COLORS[h.status] ?? '#9CA3AF' }]} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '500' }}>
                    {STATUS_LABELS[h.status]}
                  </Text>
                  <Text style={{ color: '#6B7280', fontSize: 11 }}>
                    {new Date(h.created_at).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
                {h.notes && <Text style={{ color: '#9CA3AF', fontSize: 13, marginTop: 2 }}>{h.notes}</Text>}
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function InfoRow({ label, value, valueColor = '#fff' }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#2A2A2A' }}>
      <Text style={{ color: '#9CA3AF', fontSize: 13 }}>{label}</Text>
      <Text style={{ color: valueColor, fontSize: 13, fontWeight: '500' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  centered: { flex: 1, backgroundColor: '#0D0D0D', justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: '#1A1A1A', borderRadius: 16, borderWidth: 1,
    borderColor: '#2A2A2A', padding: 16, marginBottom: 12,
  },
  tracking: { color: '#F97316', fontSize: 22, fontWeight: '800', marginBottom: 8 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, marginBottom: 8 },
  badgeText: { fontSize: 13, fontWeight: '600' },
  eta: { color: '#9CA3AF', fontSize: 13 },
  sectionTitle: { color: '#9CA3AF', fontSize: 11, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  historyRow: { flexDirection: 'row', gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#2A2A2A' },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6, flexShrink: 0 },
});
