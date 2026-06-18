import React from 'react';
import { AppRegistry, View, Text } from 'react-native';

function App() {
  return (
    <View style={{ flex: 1, backgroundColor: '#FF6600', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#FFFFFF', fontSize: 48, fontWeight: 'bold' }}>BARE TEST</Text>
      <Text style={{ color: '#FFFFFF', fontSize: 20, marginTop: 20 }}>No Expo Router</Text>
    </View>
  );
}

AppRegistry.registerComponent('main', () => App);
