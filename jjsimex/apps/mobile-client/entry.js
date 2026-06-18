import React, { useEffect } from 'react';
import { AppRegistry, View, Text } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.hideAsync().catch(() => {});

function App() {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#FF6600', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#FFFFFF', fontSize: 48, fontWeight: 'bold' }}>BARE TEST</Text>
      <Text style={{ color: '#FFFFFF', fontSize: 20, marginTop: 20 }}>Sans Expo Router</Text>
    </View>
  );
}

AppRegistry.registerComponent('main', () => App);
