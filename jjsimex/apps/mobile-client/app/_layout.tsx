import { useEffect } from 'react';
import { View, Text } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#0D0D0D', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#F97316', fontSize: 36, fontWeight: 'bold' }}>JJ's IMEX</Text>
      <Text style={{ color: '#FFFFFF', fontSize: 20, marginTop: 16 }}>L'app fonctionne !</Text>
    </View>
  );
}
