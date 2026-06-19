import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Linking, SafeAreaView,
} from 'react-native';
import { Plane, Ship, ShoppingCart } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { createShopperRequest, getMyShopperRequests } from '@jjsimex/supabase/shopper';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { BackButton } from '@/components/layout/BackButton';
import { useToast } from '@/components/ui/Toast';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Request = any;

const TABS = ['Nouvelle demande', 'En cours', 'Complétées'] as const;
type Tab = (typeof TABS)[number];

const ACTIVE_STATUSES = ['pending', 'quoted', 'purchased', 'shipped'];
const DONE_STATUSES = ['delivered', 'cancelled'];

export default function PersonalShopperScreen() {
  const router = useRouter();
  const { session, profile } = useAuth();
  const { show, ToastEl } = useToast();

  const [tab, setTab] = useState<Tab>('Nouvelle demande');
  const [requests, setRequests] = useState<Request[]>([]);
  const [loadingReqs, setLoadingReqs] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [productUrl, setProductUrl] = useState('');
  const [merchant, setMerchant] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [variant, setVariant] = useState('');
  const [transport, setTransport] = useState<'air' | 'sea'>('air');
  const [notes, setNotes] = useState('');

  const loadRequests = useCallback(async () => {
    if (!session?.user.id) return;
    try {
      const data = await getMyShopperRequests(session.user.id);
      setRequests(Array.isArray(data) ? data : []);
    } catch {}
    setLoadingReqs(false);
  }, [session?.user.id]);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  async function handleSubmit() {
    if (!productUrl.trim() || !merchant.trim()) {
      show('Veuillez remplir le lien produit et le marchand', 'error'); return;
    }
    if (!session?.user.id) return;
    setSubmitting(true);
    try {
      await createShopperRequest({
        user_id: session.user.id,
        product_url: productUrl.trim(),
        merchant: merchant.trim(),
        quantity,
        variant: variant.trim() || undefined,
        transport_mode: transport,
        destination_country: profile?.destination_country ?? 'HT',
        destination_city: profile?.destination_city ?? '',
        notes: notes.trim() || undefined,
      });
      show('Demande envoyée ! On vous contactera sous 24h.', 'success');
      setProductUrl(''); setMerchant(''); setQuantity(1); setVariant(''); setNotes('');
      setTab('En cours');
      loadRequests();
    } catch (e: unknown) {
      show((e instanceof Error ? e.message : 'Erreur lors de l\'envoi'), 'error');
    } finally {
      setSubmitting(false);
    }
  }

  const activeReqs = requests.filter((r: Request) => ACTIVE_STATUSES.includes(r.status));
  const doneReqs = requests.filter((r: Request) => DONE_STATUSES.includes(r.status));

  return (
    <SafeAreaView style={styles.container}>
      {ToastEl}

      {/* Header */}
      <View style={styles.header}>
        <BackButton />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.title}>Personal Shopper</Text>
          <Text style={styles.subtitle}>On achète pour vous aux USA</Text>
        </View>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
        {TABS.map(t => (
          <TouchableOpacity key={t} onPress={() => setTab(t)} style={[styles.tabBtn, tab === t && styles.tabBtnActive]} activeOpacity={0.8}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {tab === 'Nouvelle demande' && (
        <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.infoBox}>
            <Text style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 19 }}>
              Envoyez-nous le lien du produit que vous souhaitez et nous l'achèterons pour vous. Délai de réponse : 24h ouvrées.
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Lien du produit *</Text>
            <TextInput style={styles.input} placeholder="https://amazon.com/dp/..." placeholderTextColor="#6B7280" value={productUrl} onChangeText={setProductUrl} autoCapitalize="none" keyboardType="url" />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Marchand / Site *</Text>
            <TextInput style={styles.input} placeholder="Amazon, Nike, Shein..." placeholderTextColor="#6B7280" value={merchant} onChangeText={setMerchant} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Quantité</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <TouchableOpacity onPress={() => setQuantity(q => Math.max(1, q - 1))} style={styles.qtyBtn} activeOpacity={0.8}>
                <Text style={styles.qtyBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#FFFFFF', minWidth: 30, textAlign: 'center' }}>{quantity}</Text>
              <TouchableOpacity onPress={() => setQuantity(q => q + 1)} style={styles.qtyBtn} activeOpacity={0.8}>
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Variante (taille, couleur...)</Text>
            <TextInput style={styles.input} placeholder="Ex: Taille L, Noir" placeholderTextColor="#6B7280" value={variant} onChangeText={setVariant} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Mode de transport</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {([['air', 'Avion', '5-7 jours'], ['sea', 'Bateau', '3-4 semaines']] as const).map(([mode, label, sub]) => {
                const Icon = mode === 'air' ? Plane : Ship;
                return (
                  <TouchableOpacity
                    key={mode}
                    onPress={() => setTransport(mode)}
                    style={[styles.transportBtn, transport === mode && styles.transportBtnActive]}
                    activeOpacity={0.8}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Icon size={16} color={transport === mode ? '#0D0D0D' : '#9CA3AF'} strokeWidth={2} />
                      <Text style={{ fontSize: 13, fontWeight: '700', color: transport === mode ? '#0D0D0D' : '#FFFFFF' }}>{label}</Text>
                    </View>
                    <Text style={{ fontSize: 11, color: transport === mode ? 'rgba(0,0,0,0.6)' : '#9CA3AF', marginTop: 2 }}>{sub}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Notes supplémentaires</Text>
            <TextInput
              style={[styles.input, { height: 90, paddingTop: 12, textAlignVertical: 'top' }]}
              placeholder="Instructions spéciales, lien alternatif..."
              placeholderTextColor="#6B7280"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
          </View>

          <TouchableOpacity onPress={handleSubmit} disabled={submitting} style={[styles.btnSubmit, submitting && { opacity: 0.6 }]} activeOpacity={0.85}>
            {submitting ? <ActivityIndicator color="#0D0D0D" /> : (
              <>
                <ShoppingCart size={18} color="#0D0D0D" strokeWidth={2} />
                <Text style={styles.btnSubmitText}>Envoyer ma demande</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}

      {tab !== 'Nouvelle demande' && (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {loadingReqs && <ActivityIndicator color="#F97316" style={{ marginTop: 40 }} />}
          {!loadingReqs && (tab === 'En cours' ? activeReqs : doneReqs).length === 0 && (
            <View style={{ alignItems: 'center', paddingTop: 60, gap: 12 }}>
              <ShoppingCart size={36} color="#F97316" strokeWidth={2} />
              <Text style={{ fontSize: 17, fontWeight: '700', color: '#FFFFFF' }}>Aucune demande</Text>
              <TouchableOpacity onPress={() => setTab('Nouvelle demande')}>
                <Text style={{ color: '#F97316', fontWeight: '600', fontSize: 14 }}>Faire une demande →</Text>
              </TouchableOpacity>
            </View>
          )}
          {(tab === 'En cours' ? activeReqs : doneReqs).map((req: Request) => (
            <View key={req.id} style={styles.reqCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>{req.merchant}</Text>
                  <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }} numberOfLines={1}>{req.product_url}</Text>
                </View>
                <StatusBadge status={req.status} />
              </View>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Text style={{ fontSize: 12, color: '#9CA3AF' }}>Qté: {req.quantity}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  {req.transport_mode === 'air'
                    ? <Plane size={14} color="#9CA3AF" strokeWidth={2} />
                    : <Ship size={14} color="#9CA3AF" strokeWidth={2} />}
                  <Text style={{ fontSize: 12, color: '#9CA3AF' }}>{req.transport_mode === 'air' ? 'Avion' : 'Bateau'}</Text>
                </View>
                {req.total_price && <Text style={{ fontSize: 12, color: '#F97316', fontWeight: '600' }}>${req.total_price}</Text>}
              </View>
              {req.status === 'quoted' && (
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                  <TouchableOpacity style={[styles.reqBtn, { backgroundColor: '#22C55E', flex: 1 }]} activeOpacity={0.85}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#052E14' }}>✓ Confirmer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.reqBtn, { backgroundColor: '#1A1A1A', flex: 1, borderWidth: 1, borderColor: '#2A2A2A' }]} activeOpacity={0.8}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#9CA3AF' }}>✕ Annuler</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 },
  title: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  subtitle: { fontSize: 13, color: '#9CA3AF' },
  tabsRow: { paddingHorizontal: 20, paddingBottom: 12, gap: 8 },
  tabBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2A2A2A' },
  tabBtnActive: { backgroundColor: '#F97316', borderColor: '#F97316' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#9CA3AF' },
  tabTextActive: { color: '#0D0D0D' },
  formContainer: { padding: 20, paddingBottom: 60, gap: 16 },
  infoBox: { backgroundColor: 'rgba(249,115,22,0.08)', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: 'rgba(249,115,22,0.2)' },
  field: { gap: 8 },
  label: { fontSize: 13, fontWeight: '600', color: '#9CA3AF' },
  input: { height: 50, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 12, color: '#FFFFFF', paddingHorizontal: 16, fontSize: 14 },
  qtyBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2A2A2A', alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { fontSize: 22, color: '#FFFFFF', lineHeight: 26 },
  transportBtn: { flex: 1, backgroundColor: '#1A1A1A', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#2A2A2A' },
  transportBtnActive: { backgroundColor: '#F97316', borderColor: '#F97316' },
  btnSubmit: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#F97316', borderRadius: 14, height: 54, marginTop: 8 },
  btnSubmitText: { fontSize: 16, fontWeight: '700', color: '#0D0D0D' },
  reqCard: { backgroundColor: '#1A1A1A', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#242424', marginBottom: 12 },
  reqBtn: { height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
