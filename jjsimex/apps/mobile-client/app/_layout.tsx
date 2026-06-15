import { View, Text } from 'react-native';

export default function RootLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#F97316', fontSize: 32, fontWeight: 'bold' }}>APP OK</Text>
    </View>
  );
}
