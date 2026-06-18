import '@expo/metro-runtime';
import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import { registerRootComponent } from 'expo';
import * as SplashScreen from 'expo-splash-screen';

function Root() {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#FF0000', fontSize: 40, fontWeight: 'bold' }}>TEST OK</Text>
      <Text style={{ color: '#000000', fontSize: 18, marginTop: 20 }}>Si tu vois ceci, le splash screen est réglé.</Text>
    </View>
  );
}

registerRootComponent(Root);
