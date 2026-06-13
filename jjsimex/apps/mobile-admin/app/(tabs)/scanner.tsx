import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Alert,
} from 'react-native';
import { scanPackage, updatePackageStatus } from '@jjsimex/supabase/packages';
import type { PackageStatus } from '@jjsimex/supabase/packages';
import { useAuth } from '@/contexts/AuthContext';

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

const ACTION_LABELS: Record<string, string> = {
  mark_received_usa: 'Reçu USA',
  mark_in_transit: 'Mettre en transit',
  mark_arrived: 'Marquer arrivé',
  mark_ready_pickup: 'Prêt à retirer',
  mark_delivered: 'Livré',
};

const ACTION_STATUS_MAP: Record<string, PackageStatus> = {
  mark_received_usa: 'received_usa',
  mark_in_transit: 'in_transit',
  mark_arrived: 'arrived',
  mark_ready_pickup: 'ready_pickup',
  mark_delivered: 'delivered',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ScanResult = any;

export default function ScannerScreen() {
  const { session } = useAuth();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [result, setResult] = useState<ScanResult>(null);
  const [error, setError] = useState('');

  async function handleScan() {
    const trimmed = input.trim();
    if (!trimmed) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await scanPackage(trimmed);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Colis introuvable.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(action: string) {
    if (!result || !session?.user.id) return;
    const newStatus = ACTION_STATUS_MAP[action];
    if (!newStatus) return;

    Alert.alert(
      'Confirmer',
      `Changer le statut en "${STATUS_LABELS[newStatus]}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            setActionLoading(action);
            try {
              await updatePackageStatus(result.id, newStatus, undefined, session.user.id);
              const refreshed = await scanPackage(result.tracking_number);
              setResult(refreshed);
            } catch (e) {
              Alert.alert('Erreur', e instanceof Error ? e.message : 'Erreur lors du changement.');
            } finally {
              setActionLoading('');
            }
          },
        },
      ],
    );
  }

  const color = result?.status ? STATUS_COLORS[result.status as PackageStatus] : '#9CA3AF';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#0D0D0D' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 56 }} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Scanner</Text>
        <Text style={styles.subtitle}>Entrez ou scannez un numéro de suivi.</Text>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={(t) => setInput(t.toUpperCase())}
            placeholder="Numéro de suivi..."
            placeholderTextColor="#6B7280"
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={handleScan}
          />
          <TouchableOpacity
            onPress={handleScan}
            disabled={loading || !input.trim()}
            style={[styles.scanBtn, (!input.trim() || loading) && { opacity: 0.5 }]}
          >
            {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.scanBtnText}>Scan</Text>}
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {result && (
          <View style={{ gap: 12 }}>
            {/* Résultat */}
            <View style={styles.card}>
              <Text style={styles.tracking}>{result.tracking_number}</Text>
              <View style={[styles.badge, { backgroundColor: `${color}20` }]}>
                <Text style={[styles.badgeText, { color }]}>{STATUS_LABELS[result.status as PackageStatus]}</Text>
              </View>
              <View style={{ marginTop: 12, gap: 6 }}>
                <Row label="Client" value={result.users ? `${result.users.first_name} ${result.users.last_name}` : '—'} />
                <Row label="Destination" value={result.destination_city} />
                <Row label="Poids" value={`${result.weight_billed?.toFixed(2)} lbs`} />
                <Row label="Prix" value={`$${result.price?.toFixed(2)}`} valueColor="#22C55E" />
              </View>
            </View>

            {/* Actions disponibles */}
            {result.available_actions?.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Actions disponibles</Text>
                <View style={{ gap: 8 }}>
                  {result.available_actions.map((action: string) => (
                    <TouchableOpacity
                      key={action}
                      onPress={() => handleAction(action)}
                      disabled={actionLoading === action}
                      style={styles.actionBtn}
                    >
                      {actionLoading === action ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.actionBtnText}>{ACTION_LABELS[action] ?? action}</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Row({ label, value, valueColor = '#fff' }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
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
    color: '#fff', fontSize: 15,
  },
  scanBtn: {
    backgroundColor: '#F97316', borderRadius: 12, paddingHorizontal: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  scanBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
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
  sectionTitle: { color: '#9CA3AF', fontSize: 11, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
  actionBtn: {
    backgroundColor: '#F97316', borderRadius: 12, padding: 14,
    alignItems: 'center',
  },
  actionBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
