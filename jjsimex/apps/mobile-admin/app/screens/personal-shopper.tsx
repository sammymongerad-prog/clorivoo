import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAllShopperRequests, sendQuote, cancelRequest } from '@jjsimex/supabase';
import { supabase } from '@/lib/supabase';
import { BackButton } from '@/components/layout/BackButton';
import { useToast } from '@/components/ui/Toast';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { UrgencyBanner } from '@/components/ui/UrgencyBanner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ShopperRequest {
  id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  product_description: string;
  budget?: number;
  currency?: string;
  urls?: string[];
  client_name?: string;
  client_avatar_initials?: string;
  client_phone?: string;
  user_id?: string;
  note?: string;
}

type TabKey = 'pending' | 'in_progress' | 'completed';

// ─── Component ────────────────────────────────────────────────────────────────

export default function PersonalShopper() {
  const { showToast } = useToast();

  const [requests, setRequests] = useState<ShopperRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('pending');

  // Quote bottom sheet state
  const [quoteSheetVisible, setQuoteSheetVisible] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [quoteAmount, setQuoteAmount] = useState('');
  const [quoteNote, setQuoteNote] = useState('');
  const [sendingQuote, setSendingQuote] = useState(false);

  // Realtime subscription ref
  const subscriptionRef = useRef<any>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllShopperRequests();
      setRequests((data as ShopperRequest[]) ?? []);
    } catch (err: any) {
      showToast(err?.message ?? 'Erreur de chargement', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Realtime subscription ──────────────────────────────────────────────────

  useEffect(() => {
    fetchRequests();

    const channel = supabase
      .channel('shopper_requests_admin')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shopper_requests' },
        (payload) => {
          const eventType = payload.eventType;
          if (eventType === 'INSERT') {
            setRequests((prev) => [payload.new as ShopperRequest, ...prev]);
          } else if (eventType === 'UPDATE') {
            setRequests((prev) =>
              prev.map((r) =>
                r.id === (payload.new as ShopperRequest).id
                  ? (payload.new as ShopperRequest)
                  : r,
              ),
            );
          } else if (eventType === 'DELETE') {
            setRequests((prev) =>
              prev.filter((r) => r.id !== (payload.old as ShopperRequest).id),
            );
          }
        },
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRequests]);

  // ── Derived tab data ───────────────────────────────────────────────────────

  const pending = requests.filter((r) => r.status === 'pending');
  const inProgress = requests.filter((r) => r.status === 'in_progress');
  const completed = requests.filter((r) => r.status === 'completed');

  const urgentCount = pending.length;

  const tabData: Record<TabKey, ShopperRequest[]> = {
    pending,
    in_progress: inProgress,
    completed,
  };

  const currentList = tabData[activeTab];

  // ── Quote actions ──────────────────────────────────────────────────────────

  const openQuoteSheet = (requestId: string) => {
    setSelectedRequestId(requestId);
    setQuoteAmount('');
    setQuoteNote('');
    setQuoteSheetVisible(true);
  };

  const handleSendQuote = async () => {
    if (!selectedRequestId || !quoteAmount.trim()) return;
    const amount = parseFloat(quoteAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast('Montant invalide', 'error');
      return;
    }
    setSendingQuote(true);
    try {
      await sendQuote(selectedRequestId, amount, quoteNote.trim());
      showToast('Devis envoyé', 'success');
      setQuoteSheetVisible(false);
      // Update local state
      setRequests((prev) =>
        prev.map((r) =>
          r.id === selectedRequestId ? { ...r, status: 'in_progress' } : r,
        ),
      );
    } catch (err: any) {
      showToast(err?.message ?? 'Erreur lors de l\'envoi', 'error');
    } finally {
      setSendingQuote(false);
    }
  };

  // ── Cancel actions ─────────────────────────────────────────────────────────

  const handleCancel = (requestId: string) => {
    Alert.prompt(
      'Annuler la demande',
      'Veuillez indiquer la raison de l\'annulation (optionnel)',
      [
        {
          text: 'Confirmer',
          style: 'destructive',
          onPress: async (reason?: string) => {
            try {
              await cancelRequest(requestId, reason ?? '');
              showToast('Demande annulée', 'success');
              setRequests((prev) =>
                prev.map((r) =>
                  r.id === requestId ? { ...r, status: 'cancelled' } : r,
                ),
              );
            } catch (err: any) {
              showToast(err?.message ?? 'Erreur lors de l\'annulation', 'error');
            }
          },
        },
        { text: 'Retour', style: 'cancel' },
      ],
      'plain-text',
    );
  };

  // ── Helpers ────────────────────────────────────────────────────────────────

  const timeSince = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}j`;
  };

  const openUrl = (url: string) => {
    Linking.openURL(url).catch(() =>
      showToast('Impossible d\'ouvrir le lien', 'error'),
    );
  };

  // ── Request card ───────────────────────────────────────────────────────────

  const renderRequestCard = (item: ShopperRequest) => (
    <View key={item.id} style={styles.requestCard}>
      {/* Card header */}
      <View style={styles.cardHeader}>
        <View style={styles.clientRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>
              {item.client_avatar_initials ?? '??'}
            </Text>
          </View>
          <View style={styles.clientInfo}>
            <Text style={styles.clientName}>
              {item.client_name ?? 'Client inconnu'}
            </Text>
            <Text style={styles.timeSince}>{timeSince(item.created_at)}</Text>
          </View>
          <StatusBadge status={item.status} />
        </View>
      </View>

      {/* Description */}
      <Text style={styles.productDescription}>{item.product_description}</Text>

      {/* Budget */}
      {item.budget != null && (
        <View style={styles.budgetRow}>
          <Text style={styles.budgetLabel}>Budget</Text>
          <Text style={styles.budgetValue}>
            {item.currency ?? '$'}{item.budget}
          </Text>
        </View>
      )}

      {/* URLs */}
      {item.urls && item.urls.length > 0 && (
        <View style={styles.urlsBlock}>
          {item.urls.map((url, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => openUrl(url)}
              style={styles.urlRow}
            >
              <Text style={styles.urlText} numberOfLines={1}>
                🔗 {url}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Note */}
      {item.note && (
        <Text style={styles.requestNote}>{item.note}</Text>
      )}

      {/* Actions for pending */}
      {item.status === 'pending' && (
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.actionDevis}
            onPress={() => openQuoteSheet(item.id)}
          >
            <Text style={styles.actionDevisText}>Envoyer un devis</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionAnnuler}
            onPress={() => handleCancel(item.id)}
          >
            <Text style={styles.actionAnnulerText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Personal Shopper</Text>
      </View>

      {/* ── Urgency Banner ── */}
      {urgentCount > 0 && (
        <UrgencyBanner count={urgentCount} />
      )}

      {/* ── Tab bar ── */}
      <View style={styles.tabBar}>
        {(
          [
            { key: 'pending' as TabKey, label: 'En attente', count: pending.length },
            { key: 'in_progress' as TabKey, label: 'En cours', count: inProgress.length },
            { key: 'completed' as TabKey, label: 'Complétées', count: completed.length },
          ]
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
            </Text>
            {tab.count > 0 && (
              <View
                style={[
                  styles.tabBadge,
                  activeTab === tab.key && styles.tabBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.tabBadgeText,
                    activeTab === tab.key && styles.tabBadgeTextActive,
                  ]}
                >
                  {tab.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Content ── */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#F97316" />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {currentList.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>
                {activeTab === 'pending'
                  ? '📭'
                  : activeTab === 'in_progress'
                  ? '⏳'
                  : '✅'}
              </Text>
              <Text style={styles.emptyStateText}>
                {activeTab === 'pending'
                  ? 'Aucune demande en attente'
                  : activeTab === 'in_progress'
                  ? 'Aucune demande en cours'
                  : 'Aucune demande complétée'}
              </Text>
            </View>
          ) : (
            currentList.map((item) => renderRequestCard(item))
          )}
          <View style={styles.bottomPadding} />
        </ScrollView>
      )}

      {/* ── Quote Bottom Sheet ── */}
      <Modal
        visible={quoteSheetVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setQuoteSheetVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setQuoteSheetVisible(false)}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.bottomSheet}
        >
          <View style={styles.bottomSheetHandle} />
          <Text style={styles.bottomSheetTitle}>Envoyer un devis</Text>

          <Text style={styles.inputLabel}>Montant (USD)</Text>
          <TextInput
            style={styles.sheetInput}
            value={quoteAmount}
            onChangeText={setQuoteAmount}
            placeholder="Ex: 45.00"
            placeholderTextColor="#9CA3AF"
            keyboardType="decimal-pad"
            autoFocus
          />

          <Text style={styles.inputLabel}>Note (optionnel)</Text>
          <TextInput
            style={[styles.sheetInput, styles.sheetInputMultiline]}
            value={quoteNote}
            onChangeText={setQuoteNote}
            placeholder="Message au client..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
          />

          <View style={styles.sheetActions}>
            <TouchableOpacity
              style={styles.sheetCancelButton}
              onPress={() => setQuoteSheetVisible(false)}
            >
              <Text style={styles.sheetCancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sheetConfirmButton,
                (!quoteAmount.trim() || sendingQuote) &&
                  styles.sheetConfirmButtonDisabled,
              ]}
              onPress={handleSendQuote}
              disabled={!quoteAmount.trim() || sendingQuote}
            >
              {sendingQuote ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.sheetConfirmText}>Confirmer</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 4,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#F97316',
  },
  tabText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#F97316',
  },
  tabBadge: {
    backgroundColor: '#262626',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeActive: {
    backgroundColor: '#F97316',
  },
  tabBadgeText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '700',
  },
  tabBadgeTextActive: {
    color: '#FFFFFF',
  },

  // Request card
  requestCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    gap: 10,
  },
  cardHeader: {
    marginBottom: 2,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F97316',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  timeSince: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 1,
  },

  // Product info
  productDescription: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
  },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  budgetLabel: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  budgetValue: {
    color: '#F97316',
    fontSize: 15,
    fontWeight: '700',
  },

  // URLs
  urlsBlock: {
    gap: 4,
  },
  urlRow: {
    backgroundColor: '#262626',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  urlText: {
    color: '#60A5FA',
    fontSize: 12,
    textDecorationLine: 'underline',
  },

  // Note
  requestNote: {
    color: '#9CA3AF',
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
  },

  // Card actions
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  actionDevis: {
    flex: 1,
    backgroundColor: '#F97316',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  actionDevisText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  actionAnnuler: {
    flex: 1,
    backgroundColor: '#262626',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  actionAnnulerText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '700',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyStateIcon: {
    fontSize: 40,
  },
  emptyStateText: {
    color: '#9CA3AF',
    fontSize: 15,
    textAlign: 'center',
  },

  // Modal overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },

  // Bottom sheet
  bottomSheet: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#404040',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  bottomSheetTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
  },
  inputLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  sheetInput: {
    backgroundColor: '#262626',
    borderRadius: 10,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 15,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#404040',
  },
  sheetInputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  sheetCancelButton: {
    flex: 1,
    backgroundColor: '#262626',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  sheetCancelText: {
    color: '#9CA3AF',
    fontSize: 15,
    fontWeight: '600',
  },
  sheetConfirmButton: {
    flex: 2,
    backgroundColor: '#F97316',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  sheetConfirmButtonDisabled: {
    opacity: 0.5,
  },
  sheetConfirmText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
