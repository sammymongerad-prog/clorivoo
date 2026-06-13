import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { getAllShopperRequests, sendQuote, markAsPurchased, type ShopperRequest } from '@jjsimex/supabase/shopper';
import { useAuth } from '@/contexts/AuthContext';

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  tabsContainer: { flexDirection: 'row', backgroundColor: '#1A1A1A', borderBottomWidth: 1, borderBottomColor: '#2A2A2A', paddingHorizontal: 0 },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#F97316' },
  tabLabel: { fontSize: 12, fontWeight: '500', color: '#9CA3AF' },
  tabLabelActive: { color: '#F97316', fontWeight: '600' },
  listContainer: { padding: 12 },
  requestCard: { background: '#1A1A1A', borderWidth: 1, borderColor: '#222', borderRadius: 12, padding: 14, marginBottom: 10 },
  requestCardSelected: { borderColor: '#F97316', backgroundColor: '#1F1F1F' },
  clientInitials: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F97316' },
  clientName: { fontSize: 13, fontWeight: '600', color: '#fff', marginLeft: 10 },
  status: { fontSize: 11, color: '#9CA3AF', marginLeft: 10 },
  detailsContainer: { padding: 16 },
  detailsTitle: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#222' },
  detailLabel: { fontSize: 12, color: '#9CA3AF' },
  detailValue: { fontSize: 12, color: '#fff', fontWeight: '600' },
  button: { height: 44, backgroundColor: '#F97316', borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  buttonText: { color: '#0D0D0D', fontWeight: '700', fontSize: 14 },
  input: { backgroundColor: '#141414', borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 8, color: '#fff', padding: 10, marginVertical: 10, fontSize: 14 },
});

export default function ShopperTab() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ShopperRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quotePrice, setQuotePrice] = useState('');
  const [quoteLoading, setQuoteLoading] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    try {
      setLoading(true);
      const data = await getAllShopperRequests();
      setRequests(data);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendQuote() {
    if (!user || !selectedId || !quotePrice) return;
    try {
      setQuoteLoading(true);
      await sendQuote(selectedId, parseFloat(quotePrice), user.id);
      await loadRequests();
      setShowQuoteModal(false);
      setQuotePrice('');
      setSelectedId(null);
    } catch (error) {
      alert('Error: ' + (error instanceof Error ? error.message : 'Failed to send quote'));
    } finally {
      setQuoteLoading(false);
    }
  }

  const filteredRequests = requests.filter(r => {
    if (activeTab === 'pending') return r.status === 'pending';
    if (activeTab === 'processing') return r.status === 'quoted';
    if (activeTab === 'completed') return r.status === 'shipped';
    return true;
  });

  const selected = requests.find(r => r.id === selectedId);

  const statusCounts = {
    pending: requests.filter(r => r.status === 'pending').length,
    processing: requests.filter(r => r.status === 'quoted').length,
    completed: requests.filter(r => r.status === 'shipped').length,
  };

  return (
    <View style={S.container}>
      {/* Tabs */}
      <View style={S.tabsContainer}>
        {[
          { id: 'pending', label: 'En attente', count: statusCounts.pending },
          { id: 'processing', label: 'En cours', count: statusCounts.processing },
          { id: 'completed', label: 'Complétées', count: statusCounts.completed },
        ].map(tab => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setActiveTab(tab.id)}
            style={[S.tab, activeTab === tab.id && S.tabActive]}
          >
            <Text style={[S.tabLabel, activeTab === tab.id && S.tabLabelActive]}>
              {tab.label} ({tab.count})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#F97316" size="large" />
        </View>
      ) : (
        <ScrollView style={S.listContainer} showsVerticalScrollIndicator={false}>
          {filteredRequests.map(req => {
            const initials = req.request_number.slice(0, 2);
            const isSelected = selectedId === req.id;
            return (
              <TouchableOpacity
                key={req.id}
                onPress={() => setSelectedId(isSelected ? null : req.id)}
                style={[S.requestCard, isSelected && S.requestCardSelected]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={S.clientInitials}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#0D0D0D' }}>{initials}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={S.clientName}>{req.request_number}</Text>
                    <Text style={S.status}>{req.destination_city}</Text>
                  </View>
                  <Text style={{ fontSize: 14 }}>{req.transport_mode === 'air' ? '✈️' : '🚢'}</Text>
                </View>
                {isSelected && (
                  <View style={S.detailsContainer}>
                    <Text style={S.detailsTitle}>Détails</Text>
                    <View style={S.detailRow}>
                      <Text style={S.detailLabel}>Marchand</Text>
                      <Text style={S.detailValue}>{req.merchant}</Text>
                    </View>
                    <View style={S.detailRow}>
                      <Text style={S.detailLabel}>Quantité</Text>
                      <Text style={S.detailValue}>{req.quantity}</Text>
                    </View>
                    <View style={S.detailRow}>
                      <Text style={S.detailLabel}>Prix estimé</Text>
                      <Text style={S.detailValue}>${req.estimated_price?.toFixed(2) ?? '—'}</Text>
                    </View>
                    {req.status === 'pending' && (
                      <TouchableOpacity style={S.button} onPress={() => setShowQuoteModal(true)}>
                        <Text style={S.buttonText}>Envoyer un devis</Text>
                      </TouchableOpacity>
                    )}
                    {req.status === 'quoted' && (
                      <TouchableOpacity style={S.button} onPress={() => markAsPurchased(req.id, user?.id || '')}>
                        <Text style={S.buttonText}>Marquer acheté</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Quote Modal */}
      {showQuoteModal && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end', zIndex: 1000 }}>
          <View style={{ backgroundColor: '#1A1A1A', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 16, color: '#fff' }}>Envoyer un devis</Text>
            <Text style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 12 }}>Prix final du produit</Text>
            <TextInput
              style={S.input}
              placeholder="$0.00"
              placeholderTextColor="#5B6470"
              keyboardType="decimal-pad"
              value={quotePrice}
              onChangeText={setQuotePrice}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => setShowQuoteModal(false)}
                style={[S.button, { flex: 1, backgroundColor: '#2A2A2A' }]}
              >
                <Text style={[S.buttonText, { color: '#fff' }]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSendQuote}
                disabled={!quotePrice || quoteLoading}
                style={[S.button, { flex: 1, opacity: !quotePrice || quoteLoading ? 0.5 : 1 }]}
              >
                <Text style={S.buttonText}>{quoteLoading ? 'Envoi...' : 'Envoyer'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
