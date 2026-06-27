import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View } from 'react-native';

export default function EnvoyerTab() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/screens/create-shipment');
  }, []);

  return <View style={{ flex: 1, backgroundColor: '#0D0D0D' }} />;
}
