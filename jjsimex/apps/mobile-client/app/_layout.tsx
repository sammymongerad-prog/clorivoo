import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import {
  configureNotifications,
  handleNotificationReceived,
  handleNotificationTapped,
} from '@jjsimex/ui/notifications';

function RootNavigator() {
  const router = useRouter();
  const { session, loading } = useAuth();

  useEffect(() => {
    configureNotifications();
  }, []);

  useEffect(() => {
    const unsub = handleNotificationReceived(() => {});
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = handleNotificationTapped((data) => {
      if (data.screen === 'detail' && data.package_id) {
        router.push(`/colis/${data.package_id}`);
      } else if (data.screen === 'payments') {
        router.push('/paiements');
      } else if (data.screen === 'shopper' && data.request_id) {
        router.push(`/screens/personal-shopper`);
      } else if (data.screen === 'dashboard') {
        router.push('/(tabs)/');
      }
    });
    return unsub;
  }, [router]);

  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.replace('/splash');
    }
  }, [session, loading]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0D0D0D' }, animation: 'slide_from_right' }}>
      <Stack.Screen name="splash" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="colis/[id]" />
      <Stack.Screen name="screens/detail-colis" />
      <Stack.Screen name="screens/personal-shopper" />
      <Stack.Screen name="screens/calculateur" />
      <Stack.Screen name="screens/adresses-us" />
      <Stack.Screen name="screens/nouveau-colis" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#0D0D0D' }}>
      <StatusBar style="light" backgroundColor="#0D0D0D" />
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
