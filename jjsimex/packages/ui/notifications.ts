let Notifications: typeof import('expo-notifications') | null = null;
let Device: typeof import('expo-device') | null = null;
let Constants: typeof import('expo-constants')['default'] | null = null;

try {
  Notifications = require('expo-notifications');
  Device = require('expo-device');
  Constants = require('expo-constants').default ?? require('expo-constants');
} catch {
  // Native modules not available (Expo Go) — push features disabled
}

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

export type NotificationHandler = (notification: any) => void;
export type NotificationTapHandler = (response: any) => void;

// ─── Configuration ────────────────────────────────────────────────────────────

export async function configureNotifications() {
  if (!Notifications || !Device) return;

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

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

// ─── registerForPushNotifications ──────────────────────────────────────────

export async function registerForPushNotifications(userId: string, supabaseClient?: any): Promise<string | null> {
  if (!Notifications || !Device || !Constants) return null;

  try {
    if (!Device.isDevice) return null;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return null;

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId ??
      '2295bfc8-8b70-4363-bbca-b986a77a880f';

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    console.log('Push token obtained:', token);

    const supabase = supabaseClient ?? getClient();
    const platform = Device.osName === 'iOS' ? 'ios' : 'android';

    // Delete any existing row for this token (may belong to a previous user)
    await supabase.from('push_tokens').delete().eq('token', token);
    // Insert fresh row for current user
    const { error: insertError } = await supabase.from('push_tokens').insert(
      { user_id: userId, token, platform, is_active: true },
    );
    if (insertError) console.error('Push token insert error:', insertError);

    return token;
  } catch (error) {
    console.error('Erreur enregistrement notifications:', error);
    return null;
  }
}

// ─── handleNotificationReceived ────────────────────────────────────────────

export function handleNotificationReceived(handler: NotificationHandler): () => void {
  if (!Notifications) return () => {};
  const subscription = Notifications.addNotificationReceivedListener(handler);
  return () => subscription.remove();
}

// ─── handleNotificationTapped ──────────────────────────────────────────────

export function handleNotificationTapped(handler: (data: NotificationData) => void): () => void {
  if (!Notifications) return () => {};
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    handler(response.notification.request.content.data as NotificationData);
  });
  return () => subscription.remove();
}

// ─── updateBadgeCount ─────────────────────────────────────────────────────

export async function updateBadgeCount(count: number): Promise<void> {
  if (!Notifications || !Device) return;
  try {
    if (Device.osName === 'iOS') {
      await Notifications.setBadgeCountAsync(count);
    }
  } catch {}
}

// ─── unregisterPushNotifications ──────────────────────────────────────────

export async function unregisterPushNotifications(userId: string): Promise<void> {
  try {
    const supabase = getClient();
    await supabase
      .from('push_tokens')
      .update({ is_active: false })
      .eq('user_id', userId);
  } catch {}
}

// ─── Notification locale (debug) ──────────────────────────────────────────

export async function sendLocalNotification(
  title: string,
  body: string,
  data?: NotificationData,
): Promise<void> {
  if (!Notifications) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data: data || {}, sound: 'default', badge: 1 },
      trigger: { seconds: 1 },
    });
  } catch {}
}
