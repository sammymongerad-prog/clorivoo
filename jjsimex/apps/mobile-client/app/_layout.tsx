import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '@/contexts/AuthContext';
import * as Notifications from 'expo-notifications';
import {
  configureNotifications,
  registerForPushNotifications,
  handleNotificationReceived,
  handleNotificationTapped,
  unregisterPushNotifications,
} from '@jjsimex/ui/notifications';
import '../global.css';

function NotificationAwareLayout() {
  const router = useRouter();

  useEffect(() => {
    // Configuration générale
    configureNotifications();

    // Récupérer l'utilisateur depuis AuthContext via le hook
    const setupNotifications = async () => {
      // Cette fonction sera appelée depuis AuthContext après connexion
      // Voir auth.tsx
    };

    setupNotifications();
  }, []);

  // Gérer les notifications reçues en foreground
  useEffect(() => {
    const unsubscribe = handleNotificationReceived((notification) => {
      // Notification reçue en foreground
      console.log('Notification reçue:', notification);
    });

    return unsubscribe;
  }, []);

  // Gérer les taps sur les notifications
  useEffect(() => {
    const unsubscribe = handleNotificationTapped((data) => {
      console.log('Notification tapée:', data);

      // Naviguer selon le type
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
