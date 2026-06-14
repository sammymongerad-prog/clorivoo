import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { updatePackageStatus, addInternalNote } from '@jjsimex/supabase';
import { supabase } from '@/lib/supabase';
import { BackButton } from '@/components/layout/BackButton';
import { useToast } from '@/components/ui/Toast';
import { StatusBadge } from '@/components/ui/StatusBadge';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TrackingStep {
  id: string;
  status: string;
  created_at: string;
  employee_name?: string;
  icon?: string;
  note?: string;
}

interface InternalNote {
  id: string;
  content: string;
  created_at: string;
  author?: string;
}

interface PackageUser {
  id: string;
  full_name: string;
  phone?: string;
  email?: string;
}

interface Package {
  id: string;
  tracking_number: string;
  status: string;
  transport_mode: 'air' | 'sea';
  weight?: number;
  declared_value?: number;
  merchant?: string;
  description?: string;
  dimensions?: string;
  insurance?: number;
  amount_due?: number;
  payment_method?: string;
  payment_status?: string;
  created_at: string;
  tracking_steps?: TrackingStep[];
  internal_notes?: InternalNote[];
  users?: PackageUser;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUSES = [
  { key: 'received_usa', label: 'Reçu USA' },
  { key: 'in_transit', label: 'En transit' },
  { key: 'arrived_pap', label: 'Arrivé PAP' },
  { key: 'in_customs', label: 'En douane' },
  { key: 'delivered', label: 'Livré' },
  { key: 'returned', label: 'Retourné' },
  { key: 'lost', label: 'Perdu' },
  { key: 'on_hold', label: 'En attente' },
  { key: 'cancelled', label: 'Annulé' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function DetailColis() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { showToast } = useToast();

  const [pkg, setPkg] = useState<Package | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchPackage = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('packages')
        .select('*, users(*), tracking_steps(*), internal_notes(*)')
        .eq('id', id)
        .single();

      if (error) throw error;
      setPkg(data as Package);
    } catch (err: any) {
      showToast(err?.message ?? 'Erreur lors du chargement', 'error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPackage();
  }, [fetchPackage]);

  // ── Status update ──────────────────────────────────────────────────────────

  const handleStatusChange = async (newStatus: string) => {
    if (!id || !pkg || pkg.status === newStatus) return;
    setStatusUpdating(true);
    try {
      await updatePackageStatus(id, newStatus);
      setPkg((prev) => (prev ? { ...prev, status: newStatus } : prev));
      showToast('Statut mis à jour', 'success');
    } catch (err: any) {
      showToast(err?.message ?? 'Erreur de mise à jour', 'error');
    } finally {
      setStatusUpdating(false);
    }
  };

  // ── Internal note ──────────────────────────────────────────────────────────

  const handleAddNote = async () => {
    if (!id || !noteText.trim()) return;
    setAddingNote(true);
    try {
      await addInternalNote(id, noteText.trim());
      setNoteText('');
      showToast('Note ajoutée', 'success');
      fetchPackage();
    } catch (err: any) {
      showToast(err?.message ?? 'Erreur lors de l\'ajout', 'error');
    } finally {
      setAddingNote(false);
    }
  };

  // ── WhatsApp ───────────────────────────────────────────────────────────────

  const openWhatsApp = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    Linking.openURL(`https://wa.me/${cleaned}`).catch(() =>
      showToast('Impossible d\'ouvrir WhatsApp', 'error'),
    );
  };

  // ── Helpers ────────────────────────────────────────────────────────────────

  const getInitials = (name: string) =>
    name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#F97316" />
        </View>
      </SafeAreaView>
    );
  }

  if (!pkg) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <BackButton />
          <Text style={styles.headerTitle}>Détail Colis</Text>
        </View>
        <View style={styles.centered}>
          <Text style={styles.mutedText}>Colis introuvable</Text>
        </View>
      </SafeAreaView>
    );
  }

  const client = pkg.users;
  const trackingSteps: TrackingStep[] = (pkg as any).tracking_steps ?? [];
  const internalNotes: InternalNote[] = (pkg as any).internal_notes ?? [];

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <BackButton />
        <View style={styles.headerTextBlock}>
          <Text style={styles.headerTitle}>Détail Colis</Text>
          <Text style={styles.headerSubtitle}>{pkg.tracking_number}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Card ── */}
        <View style={styles.heroCard}>
          <Text style={styles.trackingId}>{pkg.tracking_number}</Text>
          <View style={styles.badgeRow}>
            <StatusBadge status={pkg.status} />
            <View style={styles.transportBadge}>
              <Text style={styles.transportText}>
                {pkg.transport_mode === 'air' ? '✈ Aérien' : '🚢 Maritime'}
              </Text>
            </View>
          </View>
          <View style={styles.heroDetails}>
            {pkg.weight != null && (
              <View style={styles.heroDetailItem}>
                <Text style={styles.heroDetailLabel}>Poids</Text>
                <Text style={styles.heroDetailValue}>{pkg.weight} kg</Text>
              </View>
            )}
            {pkg.declared_value != null && (
              <View style={styles.heroDetailItem}>
                <Text style={styles.heroDetailLabel}>Valeur déclarée</Text>
                <Text style={styles.heroDetailValue}>${pkg.declared_value}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Client Info ── */}
        {client && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Client</Text>
            <View style={styles.clientRow}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitials}>
                  {getInitials(client.full_name)}
                </Text>
              </View>
              <View style={styles.clientInfo}>
                <Text style={styles.clientName}>{client.full_name}</Text>
                {client.phone && (
                  <Text style={styles.clientPhone}>{client.phone}</Text>
                )}
              </View>
              {client.phone && (
                <TouchableOpacity
                  style={styles.whatsappButton}
                  onPress={() => openWhatsApp(client.phone!)}
                >
                  <Text style={styles.whatsappButtonText}>WhatsApp</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* ── Status Grid ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Changer le statut</Text>
          {statusUpdating && (
            <ActivityIndicator
              size="small"
              color="#F97316"
              style={{ marginBottom: 8 }}
            />
          )}
          <View style={styles.statusGrid}>
            {STATUSES.map((s) => {
              const isActive = pkg.status === s.key;
              return (
                <TouchableOpacity
                  key={s.key}
                  style={[
                    styles.statusPill,
                    isActive && styles.statusPillActive,
                  ]}
                  onPress={() => handleStatusChange(s.key)}
                  disabled={statusUpdating}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      isActive && styles.statusPillTextActive,
                    ]}
                  >
                    {s.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Tracking Timeline ── */}
        {trackingSteps.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Historique de suivi</Text>
            {trackingSteps.map((step, index) => (
              <View key={step.id} style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                  <View style={styles.timelineDot} />
                  {index < trackingSteps.length - 1 && (
                    <View style={styles.timelineLine} />
                  )}
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineStatus}>
                    {step.icon ? `${step.icon} ` : ''}
                    {step.status}
                  </Text>
                  <Text style={styles.timelineDate}>
                    {formatDate(step.created_at)}
                  </Text>
                  {step.employee_name && (
                    <Text style={styles.timelineEmployee}>
                      par {step.employee_name}
                    </Text>
                  )}
                  {step.note && (
                    <Text style={styles.timelineNote}>{step.note}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── Package Details ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détails du colis</Text>
          <View style={styles.card}>
            {pkg.merchant && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Marchand</Text>
                <Text style={styles.detailValue}>{pkg.merchant}</Text>
              </View>
            )}
            {pkg.description && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Description</Text>
                <Text style={styles.detailValue}>{pkg.description}</Text>
              </View>
            )}
            {pkg.dimensions && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Dimensions</Text>
                <Text style={styles.detailValue}>{pkg.dimensions}</Text>
              </View>
            )}
            {pkg.insurance != null && pkg.insurance > 0 && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Assurance</Text>
                <Text style={styles.detailValue}>${pkg.insurance}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Payment ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paiement</Text>
          <View style={styles.card}>
            {pkg.amount_due != null && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Montant dû</Text>
                <Text style={styles.detailValue}>${pkg.amount_due}</Text>
              </View>
            )}
            {pkg.payment_method && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Méthode</Text>
                <Text style={styles.detailValue}>{pkg.payment_method}</Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Statut</Text>
              <Text
                style={[
                  styles.detailValue,
                  pkg.payment_status === 'paid'
                    ? styles.paidText
                    : styles.pendingText,
                ]}
              >
                {pkg.payment_status === 'paid' ? 'Payé ✓' : 'En attente'}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Internal Notes ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes internes</Text>
          <View style={styles.noteInputRow}>
            <TextInput
              style={styles.noteInput}
              value={noteText}
              onChangeText={setNoteText}
              placeholder="Ajouter une note..."
              placeholderTextColor="#9CA3AF"
              multiline
            />
            <TouchableOpacity
              style={[
                styles.addNoteButton,
                (!noteText.trim() || addingNote) && styles.addNoteButtonDisabled,
              ]}
              onPress={handleAddNote}
              disabled={!noteText.trim() || addingNote}
            >
              {addingNote ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.addNoteButtonText}>Ajouter</Text>
              )}
            </TouchableOpacity>
          </View>

          {internalNotes.length > 0 && (
            <View style={styles.notesList}>
              {internalNotes.map((note) => (
                <View key={note.id} style={styles.noteItem}>
                  <View style={styles.noteHeader}>
                    {note.author && (
                      <Text style={styles.noteAuthor}>{note.author}</Text>
                    )}
                    <Text style={styles.noteDate}>
                      {formatDate(note.created_at)}
                    </Text>
                  </View>
                  <Text style={styles.noteContent}>{note.content}</Text>
                </View>
              ))}
            </View>
          )}

          {internalNotes.length === 0 && (
            <Text style={styles.mutedText}>Aucune note interne</Text>
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  bottomPadding: {
    height: 40,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  headerTextBlock: {
    flex: 1,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 2,
  },

  // Hero card
  heroCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 20,
    borderTopWidth: 3,
    borderTopColor: '#F97316',
    marginBottom: 16,
  },
  trackingId: {
    color: '#F97316',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  transportBadge: {
    backgroundColor: '#262626',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  transportText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  heroDetails: {
    flexDirection: 'row',
    gap: 24,
  },
  heroDetailItem: {
    gap: 2,
  },
  heroDetailLabel: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  heroDetailValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  // Section
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },

  // Client
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F97316',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  clientPhone: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 2,
  },
  whatsappButton: {
    backgroundColor: '#16A34A',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  whatsappButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },

  // Status grid
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusPill: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#262626',
  },
  statusPillActive: {
    backgroundColor: '#F97316',
    borderColor: '#F97316',
  },
  statusPillText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '500',
  },
  statusPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Timeline
  timelineItem: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 0,
  },
  timelineLeft: {
    alignItems: 'center',
    width: 20,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F97316',
    marginTop: 4,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#262626',
    marginTop: 4,
    marginBottom: 0,
    minHeight: 24,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 20,
  },
  timelineStatus: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  timelineDate: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  timelineEmployee: {
    color: '#9CA3AF',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 1,
  },
  timelineNote: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 4,
    backgroundColor: '#1A1A1A',
    borderRadius: 6,
    padding: 8,
  },

  // Card / detail rows
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  detailLabel: {
    color: '#9CA3AF',
    fontSize: 13,
    flex: 1,
  },
  detailValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  paidText: {
    color: '#22C55E',
  },
  pendingText: {
    color: '#F97316',
  },

  // Notes
  noteInputRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  noteInput: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 14,
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#262626',
  },
  addNoteButton: {
    backgroundColor: '#F97316',
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  addNoteButtonDisabled: {
    opacity: 0.5,
  },
  addNoteButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  notesList: {
    gap: 8,
  },
  noteItem: {
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#F97316',
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  noteAuthor: {
    color: '#F97316',
    fontSize: 12,
    fontWeight: '600',
  },
  noteDate: {
    color: '#9CA3AF',
    fontSize: 11,
  },
  noteContent: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 18,
  },
  mutedText: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 16,
  },
});
