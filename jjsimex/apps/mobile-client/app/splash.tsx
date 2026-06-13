// Écran Splash — placeholder jusqu'à l'étape 11
import { View, Text } from 'react-native';

export default function SplashScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0D0D0D', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#FFFFFF', fontSize: 32, fontWeight: '800' }}>
        JJ<Text style={{ color: '#F97316' }}>'s</Text> IMEX
      </Text>
      <Text style={{ color: '#F97316', fontSize: 14, marginTop: 8, letterSpacing: 2 }}>
        BEYOND JUST SHIPPING
      </Text>
    </View>
  );
}
