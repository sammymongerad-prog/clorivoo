import '@expo/metro-runtime';
import React from 'react';
import { Text, View } from 'react-native';
import { registerRootComponent } from 'expo';

function Root() {
  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#FF0000', fontSize: 40, fontWeight: 'bold' }}>TEST OK</Text>
      <Text style={{ color: '#000000', fontSize: 18, marginTop: 20 }}>Si tu vois ceci, le splash etait le probleme.</Text>
    </View>
  );
}

registerRootComponent(Root);
