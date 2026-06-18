import 'react-native-url-polyfill/auto';

import React, { useEffect } from 'react';
import { registerRootComponent } from 'expo';
import { View, Text } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

// Hide splash immediately at module load (belt)
SplashScreen.hideAsync().catch(() => {});

function App() {
  useEffect(() => {
    // Hide splash after mount (suspenders)
    SplashScreen.hideAsync().catch(() => {});
    const t = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 500);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#FF6600', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#FFFFFF', fontSize: 48, fontWeight: 'bold' }}>CA MARCHE</Text>
      <Text style={{ color: '#FFFFFF', fontSize: 20, marginTop: 20 }}>Splash cache avec succes</Text>
    </View>
  );
}

registerRootComponent(App);
