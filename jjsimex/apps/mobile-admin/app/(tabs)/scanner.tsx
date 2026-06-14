import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Animated,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { scanPackage } from '@jjsimex/supabase';
import { StatusChanger } from '@/components/ui/StatusChanger';
import { useAuth } from '@/contexts/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VIEWFINDER_SIZE = SCREEN_WIDTH * 0.65;
const CORNER_SIZE = 30;
const CORNER_THICKNESS = 3;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ScanResult = any;

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  received_usa: 'Reçu USA',
  in_transit: 'En transit',
  arrived: 'Arrivé',
  ready_pickup: 'Prêt à retirer',
  delivered: 'Livré',
};

const STATUS_COLORS: Record<string, string> = {
  pending: '#EAB308',
  received_usa: '#3B82F6',
  in_transit: '#F97316',
  arrived: '#A855F7',
  ready_pickup: '#06B6D4',
  delivered: '#22C55E',
};

function ViewfinderCorners() {
  return (
    <View style={styles.viewfinder}>
      {/* Top-left */}
      <View style={[styles.corner, styles.cornerTopLeft]}>
        <View style={[styles.cornerH, { top: 0, left: 0 }]} />
        <View style={[styles.cornerV, { top: 0, left: 0 }]} />
      </View>
      {/* Top-right */}
      <View style={[styles.corner, styles.cornerTopRight]}>
        <View style={[styles.cornerH, { top: 0, right: 0 }]} />
        <View style={[styles.cornerV, { top: 0, right: 0 }]} />
      </View>
      {/* Bottom-left */}
      <View style={[styles.corner, styles.cornerBottomLeft]}>
        <View style={[styles.cornerH, { bottom: 0, left: 0 }]} />
        <View style={[styles.cornerV, { bottom: 0, left: 0 }]} />
      </View>
      {/* Bottom-right */}
      <View style={[styles.corner, styles.cornerBottomRight]}>
        <View style={[styles.cornerH, { bottom: 0, right: 0 }]} />
        <View style={[styles.cornerV, { bottom: 0, right: 0 }]} />
      </View>
    </View>
  );
}

function ScanLine() {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, VIEWFINDER_SIZE - 4],
  });

  return (
    <Animated.View
      style={[
        styles.scanLine,
        { transform: [{ translateY }] },
      ]}
    />
  );
}

function InfoRow({ label, value, valueColor = '#FFFFFF' }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

export default function ScannerScreen() {
  const { session } = useAuth();
  const [trackingNumber, setTrackingNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult>(null);
  const [error, setError] = useState('');
  const [statusChangerVisible, setStatusChangerVisible] = useState(false);

  async function handleSearch() {
    const trimmed = trackingNumber.trim();
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

  async function handleStatusSelected(status: string) {
    setStatusChangerVisible(false);
    if (!result) return;
    try {
      const refreshed = await scanPackage(result.tracking_number);
      setResult(refreshed);
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Erreur lors du rafraîchissement.');
    }
  }

  const statusColor = result?.status ? (STATUS_COLORS[result.status] ?? '#9CA3AF') : '#9CA3AF';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Scanner</Text>
          <Text style={styles.subtitle}>Scanner un colis</Text>
        </View>

        {/* Viewfinder area */}
        <View style={styles.viewfinderContainer}>
          <View style={styles.viewfinderWrapper}>
            <ViewfinderCorners />
            <ScanLine />
          </View>
          <Text style={styles.viewfinderHint}>Pointez la caméra sur le QR code</Text>
        </View>

        {/* Bottom card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Saisie manuelle</Text>

          <TextInput
            style={styles.input}
            value={trackingNumber}
            onChangeText={(t) => setTrackingNumber(t.toUpperCase())}
            placeholder="Entrez le numéro de tracking"
            placeholderTextColor="#6B7280"
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />

          <TouchableOpacity
            style={[styles.searchButton, (!trackingNumber.trim() || loading) && styles.searchButtonDisabled]}
            onPress={handleSearch}
            disabled={!trackingNumber.trim() || loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.searchButtonText}>Rechercher</Text>
            )}
          </TouchableOpacity>

          {/* Error */}
          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Result card */}
          {result && (
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultTracking}>{result.tracking_number}</Text>
                <View style={[styles.statusBadge, { backgroundColor: `${statusColor}22` }]}>
                  <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                    {STATUS_LABELS[result.status] ?? result.status}
                  </Text>
                </View>
              </View>

              <View style={styles.infoSection}>
                <InfoRow
                  label="Client"
                  value={
                    result.users
                      ? `${result.users.first_name ?? ''} ${result.users.last_name ?? ''}`.trim()
                      : '—'
                  }
                />
                <InfoRow
                  label="Destination"
                  value={result.destination_city ?? '—'}
                />
                <InfoRow
                  label="Poids"
                  value={result.weight_billed != null ? `${result.weight_billed.toFixed(2)} lbs` : '—'}
                />
                <InfoRow
                  label="Prix"
                  value={result.price != null ? `$${result.price.toFixed(2)}` : '—'}
                  valueColor="#22C55E"
                />
                {result.transport_mode && (
                  <InfoRow label="Transport" value={result.transport_mode} />
                )}
              </View>

              <TouchableOpacity
                style={styles.changeStatusButton}
                onPress={() => setStatusChangerVisible(true)}
                activeOpacity={0.85}
              >
                <Text style={styles.changeStatusButtonText}>Changer le statut</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* StatusChanger bottom sheet */}
      {result && (
        <StatusChanger
          visible={statusChangerVisible}
          currentStatus={result.status ?? ''}
          trackingNumber={result.tracking_number}
          onSelect={handleStatusSelected}
          onClose={() => setStatusChangerVisible(false)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  viewfinderContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#111111',
    marginHorizontal: 24,
    borderRadius: 20,
    marginBottom: 24,
  },
  viewfinderWrapper: {
    width: VIEWFINDER_SIZE,
    height: VIEWFINDER_SIZE,
    position: 'relative',
    overflow: 'hidden',
  },
  viewfinder: {
    width: VIEWFINDER_SIZE,
    height: VIEWFINDER_SIZE,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
  },
  cornerH: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_THICKNESS,
    backgroundColor: '#F97316',
    borderRadius: 2,
  },
  cornerV: {
    position: 'absolute',
    width: CORNER_THICKNESS,
    height: CORNER_SIZE,
    backgroundColor: '#F97316',
    borderRadius: 2,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  viewfinderHint: {
    marginTop: 16,
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    marginHorizontal: 24,
    padding: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 14,
  },
  input: {
    backgroundColor: '#0D0D0D',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFFFFF',
    fontSize: 15,
    marginBottom: 12,
  },
  searchButton: {
    backgroundColor: '#F97316',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonDisabled: {
    opacity: 0.5,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  errorBox: {
    marginTop: 14,
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    padding: 14,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
  },
  resultCard: {
    marginTop: 16,
    backgroundColor: '#0D0D0D',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    padding: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  resultTracking: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F97316',
    flexShrink: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    flexShrink: 0,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  infoSection: {
    gap: 8,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  changeStatusButton: {
    backgroundColor: '#F97316',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  changeStatusButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
