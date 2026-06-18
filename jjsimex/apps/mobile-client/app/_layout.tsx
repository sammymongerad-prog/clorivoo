import { useEffect } from 'react';
import { View, Text } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#FF0000', fontSize: 40, fontWeight: 'bold' }}>TEST OK</Text>
      <Text style={{ color: '#000000', fontSize: 18, marginTop: 20 }}>Le splash est cache</Text>
    </View>
  );
}
