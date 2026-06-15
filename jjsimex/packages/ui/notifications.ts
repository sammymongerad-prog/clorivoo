import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { createClient } from '@supabase/supabase-js';

// ─── Client ───────────────────────────────────────────────────────────────────

function getClient() {
  return createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NotificationData {
  screen?: string;
  package_id?: string;
  payment_id?: string;
  request_id?: string;
  [key: string]: any;
}

export type NotificationHandler = (notification: Notifications.Notification) => void;
export type NotificationTapHandler = (response: Notifications.NotificationResponse) => void;

// ─── Configuration ────────────────────────────────────────────────────────────

export async function configureNotifications() {
  // Configurer le channel Android
  if (Device.osName === 'Android') {
    await Notifications.setNotificationChannelAsync('jjsimex', {
      name: "JJ's IMEX",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F97316',
      sound: 'default',
      enableLights: true,
      enableVibration: true,
    });
  }

  // Définir les options par défaut
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      };
    },
  });
}

// ─── registerForPushNotifications ──────────────────────────────────────────

export async function registerForPushNotifications(userId: string): Promise<string | null> {
  try {
    // Vérifier si c'est un device physique
    if (!Device.isDevice) {
      console.log('Les notifications push ne fonctionnent que sur un appareil physique');
      return null;
    }

    // Demander les permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Permission refusée pour les notifications push');
      return null;
    }

    // Obtenir le token Expo
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      console.log('EAS projectId non configuré');
      return null;
    }

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    console.log('Expo Push Token:', token);

    // Sauvegarder le token dans Supabase
    const supabase = getClient();
    const platform = Device.osName === 'iOS' ? 'ios' : 'android';

    const { error } = await supabase.from('push_tokens').upsert(
      {
        user_id: userId,
        token,
        platform,
        is_active: true,
      },
      { onConflict: 'token' },
    );

    if (error) {
      console.error('Erreur sauvegarde token:', error);
    } else {
      console.log('Token push enregistré avec succès');
    }

    return token;
  } catch (error) {
    console.error('Erreur enregistrement notifications:', error);
    return null;
  }
}

// ─── handleNotificationReceived ────────────────────────────────────────────

export function handleNotificationReceived(handler: NotificationHandler): () => void {
  const subscription = Notifications.addNotificationReceivedListener((notification) => {
    handler(notification);
  });

  return () => subscription.remove();
}

// ─── handleNotificationTapped ──────────────────────────────────────────────

export function handleNotificationTapped(
  handler: (data: NotificationData) => void,
): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as NotificationData;
    handler(data);
  });

  return () => subscription.remove();
}

// ─── updateBadgeCount ─────────────────────────────────────────────────────

export async function updateBadgeCount(count: number): Promise<void> {
  try {
    if (Device.osName === 'iOS') {
      await Notifications.setBadgeCountAsync(count);
    } else if (Device.osName === 'Android') {
      // Sur Android, le badge est géré via le channel
      // et les notifications individuelles
    }
  } catch (error) {
    console.error('Erreur mise à jour badge:', error);
  }
}

// ─── Utilitaires ──────────────────────────────────────────────────────────

export async function unregisterPushNotifications(userId: string): Promise<void> {
  try {
    const supabase = getClient();
    const { data: tokens } = await supabase
      .from('push_tokens')
      .select('token')
      .eq('user_id', userId);

    if (tokens && tokens.length > 0) {
      await supabase
        .from('push_tokens')
        .update({ is_active: false })
        .eq('user_id', userId);
    }
  } catch (error) {
    console.error('Erreur désenregistrement notifications:', error);
  }
}

// ─── Afficher notification locale (debug) ──────────────────────────────────

export async function sendLocalNotification(
  title: string,
  body: string,
  data?: NotificationData,
): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: 'default',
        badge: 1,
      },
      trigger: { seconds: 1 },
    });
  } catch (error) {
    console.error('Erreur notification locale:', error);
  }
}
