import 'react-native-url-polyfill/auto';

import React from 'react';
import { View, Text } from 'react-native';
import { registerRootComponent } from 'expo';

function App() {
  return (
    <View style={{ flex: 1, backgroundColor: '#FF6600', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#FFFFFF', fontSize: 48, fontWeight: 'bold' }}>CA MARCHE</Text>
    </View>
  );
}

registerRootComponent(App);
