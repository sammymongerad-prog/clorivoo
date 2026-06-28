import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

export default function EnvoyerTab() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  useEffect(() => {
    router.replace('/screens/create-shipment');
  }, []);

  return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
}
