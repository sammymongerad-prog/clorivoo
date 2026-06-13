import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '@/contexts/AuthContext';
import {
  configureNotifications,
  handleNotificationReceived,
  handleNotificationTapped,
} from '@jjsimex/ui/notifications';
import '../global.css';

function NotificationAwareLayout() {
  const router = useRouter();

  useEffect(() => {
    configureNotifications();

    const setupNotifications = async () => {
      // Configuration complete
    };

    setupNotifications();
  }, []);

  useEffect(() => {
    const unsubscribe = handleNotificationReceived((notification) => {
      console.log('Notification reçue:', notification);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = handleNotificationTapped((data) => {
      console.log('Notification tapée:', data);

      if (data.screen === 'detail' && data.package_id) {
        router.push(`/colis/${data.package_id}`);
      } else if (data.screen === 'payments') {
        router.push('/paiements');
      } else if (data.screen === 'shopper' && data.request_id) {
        router.push(`/shopper/${data.request_id}`);
      } else if (data.screen === 'dashboard') {
        router.push('/(tabs)/');
      }
    });

    return unsubscribe;
  }, [router]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0D0D0D' } }} />
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#0D0D0D' }}>
      <StatusBar style="light" backgroundColor="#0D0D0D" />
      <AuthProvider>
        <NotificationAwareLayout />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
