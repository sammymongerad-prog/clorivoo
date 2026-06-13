import { View, Text, ScrollView } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function HomeScreen() {
  const { profile } = useAuth();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0D0D0D' }} contentContainerStyle={{ padding: 20, paddingTop: 56 }}>
      <Text style={{ color: '#F97316', fontSize: 22, fontWeight: '700' }}>JJ's IMEX</Text>
      <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600', marginTop: 16 }}>
        Bonjour, {profile?.first_name ?? ''}
      </Text>
      <Text style={{ color: '#9CA3AF', fontSize: 14, marginTop: 4 }}>
        Suite : <Text style={{ color: '#F97316', fontWeight: '700' }}>{profile?.suite_code ?? '—'}</Text>
      </Text>
    </ScrollView>
  );
}
