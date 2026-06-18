import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { trackPackage } from '@jjsimex/supabase/packages';
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

const ALL_STATUSES: PackageStatus[] = ['received_usa', 'in_transit', 'arrived', 'ready_pickup', 'delivered'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PackageData = any;

export default function TrackerScreen() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PackageData>(null);
  const [error, setError] = useState('');

  async function handleTrack() {
    const trimmed = input.trim();
    if (!trimmed) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await trackPackage(trimmed);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors du suivi.');
    } finally {
      setLoading(false);
    }
  }

  const currentStatus = result?.status as PackageStatus | undefined;
  const currentIndex = currentStatus ? ALL_STATUSES.indexOf(currentStatus) : -1;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#0D0D0D' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 56 }} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Tracker un colis</Text>
        <Text style={styles.subtitle}>Entrez votre numéro de suivi pour voir l'état de votre colis.</Text>

        {/* Champ de saisie */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={(t) => setInput(t.toUpperCase())}
            placeholder="Ex : JJI-2025-00123"
            placeholderTextColor="#6B7280"
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={handleTrack}
          />
          <TouchableOpacity
            onPress={handleTrack}
            disabled={loading || !input.trim()}
            style={[styles.searchBtn, (!input.trim() || loading) && { opacity: 0.5 }]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.searchBtnText}>Suivre</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Erreur */}
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Résultat */}
        {result && (
          <View style={{ gap: 12 }}>
            {/* En-tête résultat */}
            <View style={styles.card}>
              <Text style={styles.tracking}>{result.tracking_number}</Text>
              <View style={[styles.badge, { backgroundColor: `${STATUS_COLORS[currentStatus!]}20` }]}>
                <Text style={[styles.badgeText, { color: STATUS_COLORS[currentStatus!] }]}>
                  {STATUS_LABELS[currentStatus!]}
                </Text>
              </View>
              {result.estimated_delivery && (
                <Text style={styles.eta}>
                  Livraison estimée : {new Date(result.estimated_delivery).toLocaleDateString('fr-FR')}
                </Text>
              )}
            </View>

            {/* Barre de progression */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Progression</Text>
              <View style={{ gap: 0 }}>
                {ALL_STATUSES.map((s, i) => {
                  const done = i <= currentIndex;
                  const active = i === currentIndex;
                  const color = done ? STATUS_COLORS[s] : '#2A2A2A';
                  return (
                    <View key={s} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                      <View style={{ alignItems: 'center', width: 20 }}>
                        <View style={[styles.stepDot, { backgroundColor: color, borderColor: color }]}>
                          {active && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#0D0D0D' }} />}
                        </View>
                        {i < ALL_STATUSES.length - 1 && (
                          <View style={{ width: 2, height: 24, backgroundColor: done && i < currentIndex ? color : '#2A2A2A' }} />
                        )}
                      </View>
                      <Text style={[styles.stepLabel, { color: done ? '#fff' : '#6B7280' }]}>
                        {STATUS_LABELS[s]}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Infos */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Détails</Text>
              <InfoRow label="Transport" value={result.transport_mode === 'air' ? 'Aérien' : 'Maritime'} />
              <InfoRow label="Destination" value={result.destination_city} />
              <InfoRow label="Poids facturé" value={`${result.weight_billed?.toFixed(2)} lbs`} />
              <InfoRow label="Prix" value={`$${result.price?.toFixed(2)}`} valueColor="#22C55E" />
            </View>

            {/* Départ */}
            {result.departures && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Départ</Text>
                <InfoRow label="Mode" value={result.departures.transport_mode === 'air' ? 'Aérien' : 'Maritime'} />
                {result.departures.departure_date && (
                  <InfoRow label="Date" value={new Date(result.departures.departure_date).toLocaleDateString('fr-FR')} />
                )}
                <InfoRow label="Origine" value={result.departures.origin ?? 'Miami, FL'} />
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
  title: { color: '#fff', fontSize: 24, fontWeight: '700', marginBottom: 6 },
  subtitle: { color: '#9CA3AF', fontSize: 14, marginBottom: 24 },
  inputRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  input: {
    flex: 1, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2A2A2A',
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12,
    color: '#fff', fontSize: 14,
  },
  searchBtn: {
    backgroundColor: '#F97316', borderRadius: 12, paddingHorizontal: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  searchBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  errorBox: {
    backgroundColor: '#EF444420', borderRadius: 12, borderWidth: 1,
    borderColor: '#EF444450', padding: 14, marginBottom: 16,
  },
  errorText: { color: '#EF4444', fontSize: 14 },
  card: {
    backgroundColor: '#1A1A1A', borderRadius: 16, borderWidth: 1,
    borderColor: '#2A2A2A', padding: 16,
  },
  tracking: { color: '#F97316', fontSize: 22, fontWeight: '800', marginBottom: 8 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, marginBottom: 8 },
  badgeText: { fontSize: 13, fontWeight: '600' },
  eta: { color: '#9CA3AF', fontSize: 13 },
  sectionTitle: { color: '#9CA3AF', fontSize: 11, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 },
  stepDot: {
    width: 14, height: 14, borderRadius: 7, borderWidth: 2,
    justifyContent: 'center', alignItems: 'center',
  },
  stepLabel: { fontSize: 13, paddingTop: 0, paddingBottom: 16 },
});
