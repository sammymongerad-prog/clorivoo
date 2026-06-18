import { useEffect } from 'react';
import { Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return <Slot />;
}
