import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { savePushToken } from './supabase';

// expo-notifications n'est pas supporté sur web — on guard tout
if (Platform.OS !== 'web') {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch {}
}

export async function registerForPushNotifications(userId) {
  if (Platform.OS === 'web') return null;
  if (!Device.isDevice) return null;

  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Clorivo',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6C4DFF',
      });
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    if (userId) await savePushToken(userId, token);
    return token;
  } catch {
    return null;
  }
}

export async function sendLocalNotification(title, body, data = {}) {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data, sound: true },
      trigger: null,
    });
  } catch {}
}

export function useNotificationListeners(onNotification, onResponse) {
  const { useEffect } = require('react');
  if (Platform.OS === 'web') return;
  useEffect(() => {
    const sub1 = Notifications.addNotificationReceivedListener(onNotification);
    const sub2 = Notifications.addNotificationResponseReceivedListener(onResponse);
    return () => { sub1.remove(); sub2.remove(); };
  }, []);
}
