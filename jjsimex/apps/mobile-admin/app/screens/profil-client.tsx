import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
import { supabase } from '@/lib/supabase';
import { BackButton } from '@/components/layout/BackButton';
import { useToast } from '@/components/ui/Toast';
import { StatusBadge } from '@/components/ui/StatusBadge';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Client {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  suite_number?: string;
  created_at: string;
  status?: string;
}

interface Package {
  id: string;
  tracking_number: string;
  status: string;
  created_at: string;
  declared_value?: number;
  transport_mode?: string;
}

interface Payment {
  id: string;
  amount: number;
  currency?: string;
  method?: string;
  status: string;
  created_at: string;
  description?: string;
}

interface Activity {
  id: string;
  action: string;
  created_at: string;
}

interface ClientNote {
  id: string;
  content: string;
  created_at: string;
  author?: string;
}

type TabKey = 'colis' | 'paiements' | 'activite';

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProfilClient() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { showToast } = useToast();

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('colis');

  const [packages, setPackages] = useState<Package[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(false);

  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  const [notes, setNotes] = useState<ClientNote[]>([]);
  const [noteText, setNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // ── Derived stats ──────────────────────────────────────────────────────────

  const totalPaid = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + (p.amount ?? 0), 0);

  // ── Fetch client ───────────────────────────────────────────────────────────

  const fetchClient = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      setClient(data as Client);
    } catch (err: any) {
      showToast(err?.message ?? 'Erreur de chargement', 'error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // ── Fetch packages ─────────────────────────────────────────────────────────

  const fetchPackages = useCallback(async () => {
    if (!id) return;
    setPackagesLoading(true);
    try {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPackages((data as Package[]) ?? []);
    } catch (err: any) {
      showToast(err?.message ?? 'Erreur colis', 'error');
    } finally {
      setPackagesLoading(false);
    }
  }, [id]);

  // ── Fetch payments ─────────────────────────────────────────────────────────

  const fetchPayments = useCallback(async () => {
    if (!id) return;
    setPaymentsLoading(true);
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPayments((data as Payment[]) ?? []);
    } catch (err: any) {
      showToast(err?.message ?? 'Erreur paiements', 'error');
    } finally {
      setPaymentsLoading(false);
    }
  }, [id]);

  // ── Fetch activities ───────────────────────────────────────────────────────

  const fetchActivities = useCallback(async () => {
    if (!id) return;
    setActivitiesLoading(true);
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      setActivities((data as Activity[]) ?? []);
    } catch (err: any) {
      showToast(err?.message ?? 'Erreur activité', 'error');
    } finally {
      setActivitiesLoading(false);
    }
  }, [id]);

  // ── Fetch notes ────────────────────────────────────────────────────────────

  const fetchNotes = useCallback(async () => {
    if (!id) return;
    try {
      const { data, error } = await supabase
        .from('client_notes')
        .select('*')
        .eq('client_id', id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setNotes((data as ClientNote[]) ?? []);
    } catch (err: any) {
      showToast(err?.message ?? 'Erreur notes', 'error');
    }
  }, [id]);

  useEffect(() => {
    fetchClient();
    fetchPackages();
    fetchPayments();
    fetchActivities();
    fetchNotes();
  }, [fetchClient, fetchPackages, fetchPayments, fetchActivities, fetchNotes]);

  // ── Add note ───────────────────────────────────────────────────────────────

  const handleAddNote = async () => {
    if (!id || !noteText.trim()) return;
    setAddingNote(true);
    try {
      const { error } = await supabase.from('client_notes').insert({
        client_id: id,
        content: noteText.trim(),
      });
      if (error) throw error;
      setNoteText('');
      showToast('Note ajoutée', 'success');
      fetchNotes();
    } catch (err: any) {
      showToast(err?.message ?? 'Erreur d\'ajout', 'error');
    } finally {
      setAddingNote(false);
    }
  };

  // ── Actions ────────────────────────────────────────────────────────────────

  const openWhatsApp = () => {
    if (!client?.phone) return;
    const cleaned = client.phone.replace(/\D/g, '');
    Linking.openURL(`https://wa.me/${cleaned}`).catch(() =>
      showToast('Impossible d\'ouvrir WhatsApp', 'error'),
    );
  };

  const handleModifierStatut = () => {
    Alert.alert(
      'Modifier le statut',
      'Choisir un statut pour ce client',
      [
        { text: 'Actif', onPress: () => updateClientStatus('active') },
        { text: 'Inactif', onPress: () => updateClientStatus('inactive') },
        { text: 'Annuler', style: 'cancel' },
      ],
    );
  };

  const updateClientStatus = async (status: string) => {
    if (!id) return;
    try {
      const { error } = await supabase
        .from('users')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
      setClient((prev) => (prev ? { ...prev, status } : prev));
      showToast('Statut mis à jour', 'success');
    } catch (err: any) {
      showToast(err?.message ?? 'Erreur', 'error');
    }
  };

  const handleBloquer = () => {
    Alert.alert(
      'Bloquer ce client',
      'Cette action bloquera l\'accès de ce client à l\'application.',
      [
        {
          text: 'Bloquer',
          style: 'destructive',
          onPress: () => updateClientStatus('blocked'),
        },
        { text: 'Annuler', style: 'cancel' },
      ],
    );
  };

  const handleMenuPress = () => {
    Alert.alert('Actions', '', [
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  // ── Helpers ────────────────────────────────────────────────────────────────

  const getInitials = (name: string) =>
    name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  // ── Tab content renderers ──────────────────────────────────────────────────

  const renderPackageItem = ({ item }: { item: Package }) => (
    <View style={styles.listCard}>
      <View style={styles.listCardRow}>
        <Text style={styles.trackingNumber}>{item.tracking_number}</Text>
        <StatusBadge status={item.status} />
      </View>
      <View style={styles.listCardRow}>
        <Text style={styles.mutedText}>{formatDate(item.created_at)}</Text>
        {item.declared_value != null && (
          <Text style={styles.mutedText}>${item.declared_value}</Text>
        )}
      </View>
    </View>
  );

  const renderPaymentItem = ({ item }: { item: Payment }) => (
    <View style={styles.listCard}>
      <View style={styles.listCardRow}>
        <Text style={styles.listCardTitle}>
          {item.description ?? 'Paiement'}
        </Text>
        <Text
          style={[
            styles.paymentAmount,
            item.status === 'paid' ? styles.paidText : styles.pendingText,
          ]}
        >
          {item.currency ?? '$'}{item.amount}
        </Text>
      </View>
      <View style={styles.listCardRow}>
        <Text style={styles.mutedText}>{formatDate(item.created_at)}</Text>
        <Text style={styles.mutedText}>{item.method ?? '-'}</Text>
      </View>
    </View>
  );

  const renderActivityItem = ({ item }: { item: Activity }) => (
    <View style={styles.activityItem}>
      <View style={styles.activityDot} />
      <View style={styles.activityContent}>
        <Text style={styles.activityAction}>{item.action}</Text>
        <Text style={styles.activityDate}>{formatDateTime(item.created_at)}</Text>
      </View>
    </View>
  );

  // ── Loading / not found ────────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#F97316" />
        </View>
      </SafeAreaView>
    );
  }

  if (!client) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <BackButton />
          <Text style={styles.headerTitle}>Profil Client</Text>
        </View>
        <View style={styles.centered}>
          <Text style={styles.mutedText}>Client introuvable</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Profil Client</Text>
        <TouchableOpacity style={styles.menuButton} onPress={handleMenuPress}>
          <Text style={styles.menuButtonText}>⋮</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {/* ── Avatar & Info ── */}
        <View style={styles.profileBlock}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeInitials}>
              {getInitials(client.full_name)}
            </Text>
          </View>
          <Text style={styles.clientName}>{client.full_name}</Text>
          {client.email && (
            <Text style={styles.clientEmail}>{client.email}</Text>
          )}
          {client.phone && (
            <Text style={styles.clientPhone}>{client.phone}</Text>
          )}
          {client.suite_number && (
            <View style={styles.suiteBadge}>
              <Text style={styles.suiteBadgeText}>{client.suite_number}</Text>
            </View>
          )}
        </View>

        {/* ── Stats row ── */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{packages.length}</Text>
            <Text style={styles.statLabel}>Colis</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>${totalPaid.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Total payé</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {formatDate(client.created_at)}
            </Text>
            <Text style={styles.statLabel}>Membre depuis</Text>
          </View>
        </View>

        {/* ── Action buttons ── */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionWhatsApp} onPress={openWhatsApp}>
            <Text style={styles.actionButtonText}>WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionModifier}
            onPress={handleModifierStatut}
          >
            <Text style={styles.actionButtonText}>Modifier statut</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBloquer} onPress={handleBloquer}>
            <Text style={styles.actionButtonText}>Bloquer</Text>
          </TouchableOpacity>
        </View>

        {/* ── Tab bar ── */}
        <View style={styles.tabBar}>
          {(
            [
              { key: 'colis', label: 'Colis', count: packages.length },
              { key: 'paiements', label: 'Paiements', count: payments.length },
              { key: 'activite', label: 'Activité' },
            ] as { key: TabKey; label: string; count?: number }[]
          ).map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.key && styles.tabTextActive,
                ]}
              >
                {tab.label}
                {tab.count != null ? ` (${tab.count})` : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Tab content ── */}
        <View style={styles.tabContent}>
          {/* Colis */}
          {activeTab === 'colis' && (
            <>
              {packagesLoading ? (
                <ActivityIndicator
                  size="small"
                  color="#F97316"
                  style={styles.tabLoader}
                />
              ) : packages.length === 0 ? (
                <Text style={[styles.mutedText, styles.emptyState]}>
                  Aucun colis
                </Text>
              ) : (
                packages.map((pkg) => (
                  <View key={pkg.id}>{renderPackageItem({ item: pkg })}</View>
                ))
              )}
            </>
          )}

          {/* Paiements */}
          {activeTab === 'paiements' && (
            <>
              {paymentsLoading ? (
                <ActivityIndicator
                  size="small"
                  color="#F97316"
                  style={styles.tabLoader}
                />
              ) : payments.length === 0 ? (
                <Text style={[styles.mutedText, styles.emptyState]}>
                  Aucun paiement
                </Text>
              ) : (
                payments.map((payment) => (
                  <View key={payment.id}>
                    {renderPaymentItem({ item: payment })}
                  </View>
                ))
              )}
            </>
          )}

          {/* Activité */}
          {activeTab === 'activite' && (
            <>
              {activitiesLoading ? (
                <ActivityIndicator
                  size="small"
                  color="#F97316"
                  style={styles.tabLoader}
                />
              ) : activities.length === 0 ? (
                <Text style={[styles.mutedText, styles.emptyState]}>
                  Aucune activité récente
                </Text>
              ) : (
                activities.map((activity) => (
                  <View key={activity.id}>
                    {renderActivityItem({ item: activity })}
                  </View>
                ))
              )}
            </>
          )}
        </View>

        {/* ── Admin Notes ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes admin</Text>
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

          {notes.length > 0 ? (
            <View style={styles.notesList}>
              {notes.map((note) => (
                <View key={note.id} style={styles.noteItem}>
                  <View style={styles.noteHeader}>
                    {note.author && (
                      <Text style={styles.noteAuthor}>{note.author}</Text>
                    )}
                    <Text style={styles.noteDate}>
                      {formatDateTime(note.created_at)}
                    </Text>
                  </View>
                  <Text style={styles.noteContent}>{note.content}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.mutedText}>Aucune note admin</Text>
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
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    marginLeft: 12,
  },
  menuButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuButtonText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },

  // Profile block
  profileBlock: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F97316',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarLargeInitials: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
  clientName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  clientEmail: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 2,
  },
  clientPhone: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 10,
  },
  suiteBadge: {
    backgroundColor: 'rgba(249,115,22,0.15)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#F97316',
  },
  suiteBadgeText: {
    color: '#F97316',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    marginBottom: 16,
    paddingVertical: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  statLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#262626',
    marginVertical: 4,
  },

  // Action buttons
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  actionWhatsApp: {
    flex: 1,
    backgroundColor: '#16A34A',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionModifier: {
    flex: 1,
    backgroundColor: '#F97316',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionBloquer: {
    flex: 1,
    backgroundColor: '#DC2626',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    padding: 4,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 7,
  },
  tabActive: {
    backgroundColor: '#F97316',
  },
  tabText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },

  // Tab content
  tabContent: {
    minHeight: 120,
    marginBottom: 20,
  },
  tabLoader: {
    marginTop: 20,
  },
  emptyState: {
    textAlign: 'center',
    paddingVertical: 24,
  },

  // List card
  listCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    gap: 6,
  },
  listCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listCardTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  trackingNumber: {
    color: '#F97316',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  paymentAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  paidText: {
    color: '#22C55E',
  },
  pendingText: {
    color: '#F97316',
  },

  // Activity
  activityItem: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F97316',
    marginTop: 5,
  },
  activityContent: {
    flex: 1,
  },
  activityAction: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 18,
  },
  activityDate: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 2,
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
    fontSize: 13,
  },
});
