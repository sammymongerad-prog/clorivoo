import { View, Text } from 'react-native';

// TEST D'ISOLATION : écran simple, sans Supabase ni redirection.
export default function Index() {
  return (
    <View style={{ flex: 1, backgroundColor: '#FF6600', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#FFFFFF', fontSize: 40, fontWeight: 'bold' }}>TEST OK</Text>
      <Text style={{ color: '#FFFFFF', fontSize: 16, marginTop: 12 }}>sans Supabase</Text>
    </View>
  );
}
