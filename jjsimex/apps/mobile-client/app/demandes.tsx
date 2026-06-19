import { useEffect, useState, useContext } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, ShoppingCart, MapPin, ShoppingBag, DollarSign } from 'lucide-react-native';
import { getMyShopperRequests, subscribeToRequests, type ShopperRequest } from '@jjsimex/supabase/shopper';
import { AuthContext } from '@/contexts/AuthContext';

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  header: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: '#1A1A1A' },
  backBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2A2A2A', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  listContainer: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#222', borderRadius: 12, padding: 14, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: '#F97316' },
  cardDate: { fontSize: 11, color: '#9CA3AF' },
  cardInfo: { fontSize: 12, color: '#D1D5DB' },
  cardInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  status: { fontSize: 11, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginTop: 8, alignSelf: 'flex-start' },
  statusPending: { backgroundColor: 'rgba(249,115,22,0.12)', color: '#F97316' },
  statusQuoted: { backgroundColor: 'rgba(59,130,246,0.12)', color: '#3B82F6' },
  statusPurchased: { backgroundColor: 'rgba(34,197,94,0.12)', color: '#22C55E' },
  statusShipped: { backgroundColor: 'rgba(34,197,94,0.12)', color: '#22C55E' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },
});

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'En attente',
    quoted: 'Devis reçu',
    confirmed: 'Confirmée',
    purchased: 'Achetée',
    shipped: 'Expédiée',
    cancelled: 'Annulée',
  };
  return labels[status] || status;
}

function getStatusStyle(status: string) {
  const styles: Record<string, { backgroundColor: string; color: string }> = {
    pending: { backgroundColor: 'rgba(249,115,22,0.12)', color: '#F97316' },
    quoted: { backgroundColor: 'rgba(59,130,246,0.12)', color: '#3B82F6' },
    confirmed: { backgroundColor: 'rgba(34,197,94,0.12)', color: '#22C55E' },
    purchased: { backgroundColor: 'rgba(34,197,94,0.12)', color: '#22C55E' },
    shipped: { backgroundColor: 'rgba(34,197,94,0.12)', color: '#22C55E' },
    cancelled: { backgroundColor: 'rgba(239,68,68,0.12)', color: '#EF4444' },
  };
  return styles[status] || styles.pending;
}

export default function DemandesScreen() {
  const router = useRouter();
  const authContext = useContext(AuthContext);
  const [requests, setRequests] = useState<ShopperRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authContext?.user) {
      router.back();
      return;
    }
    loadRequests();

    const unsubscribe = subscribeToRequests((updatedRequests) => {
      setRequests(updatedRequests.filter(r => r.user_id === authContext.user!.id).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    });

    return () => unsubscribe();
  }, [authContext?.user]);

  async function loadRequests() {
    try {
      setLoading(true);
      const data = await getMyShopperRequests(authContext!.user!.id);
      setRequests(data);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={S.container} edges={['top']}>
      <View style={S.header}>
        <TouchableOpacity style={S.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={S.headerTitle}>Mes demandes</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={S.emptyState}>
          <ActivityIndicator color="#F97316" size="large" />
        </View>
      ) : requests.length === 0 ? (
        <View style={S.emptyState}>
          <ShoppingCart size={48} color="#9CA3AF" strokeWidth={2} style={{ marginBottom: 12 }} />
          <Text style={S.emptyText}>Aucune demande pour le moment</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} style={S.listContainer}>
          {requests.map(req => {
            const statusStyle = getStatusStyle(req.status);
            return (
              <View key={req.id} style={S.card}>
                <View style={S.cardHeader}>
                  <Text style={S.cardTitle}>{req.request_number}</Text>
                  <Text style={S.cardDate}>{formatDate(req.created_at)}</Text>
                </View>
                <View style={S.cardInfoRow}>
                  <MapPin size={16} color="#F97316" strokeWidth={2} />
                  <Text style={S.cardInfo}>{req.destination_city}</Text>
                </View>
                <View style={S.cardInfoRow}>
                  <ShoppingBag size={16} color="#F97316" strokeWidth={2} />
                  <Text style={S.cardInfo}>{req.merchant} (Qté: {req.quantity})</Text>
                </View>
                {req.final_price && (
                  <View style={S.cardInfoRow}>
                    <DollarSign size={16} color="#F97316" strokeWidth={2} />
                    <Text style={S.cardInfo}>${req.final_price.toFixed(2)}</Text>
                  </View>
                )}
                {req.total_price && (
                  <Text style={[S.cardInfo, { color: '#F97316', fontWeight: '600' }]}>
                    Total: ${req.total_price.toFixed(2)}
                  </Text>
                )}
                <Text style={[S.status, { backgroundColor: statusStyle.backgroundColor, color: statusStyle.color }]}>
                  {getStatusLabel(req.status)}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
