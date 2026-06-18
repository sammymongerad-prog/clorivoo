import 'react-native-url-polyfill/auto';

import React from 'react';
import { registerRootComponent } from 'expo';
import { View, Text } from 'react-native';

function App() {
  return (
    <View style={{ flex: 1, backgroundColor: '#FF6600', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#FFFFFF', fontSize: 48, fontWeight: 'bold' }}>CA MARCHE</Text>
      <Text style={{ color: '#FFFFFF', fontSize: 20, marginTop: 20 }}>React Native fonctionne</Text>
    </View>
  );
}

registerRootComponent(App);
