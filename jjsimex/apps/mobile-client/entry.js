import '@expo/metro-runtime';
import React from 'react';
import { Text, View, ScrollView, AppRegistry } from 'react-native';

// Step 1: capture ALL errors before anything else
const _errors = [];

global.ErrorUtils?.setGlobalHandler?.((error, isFatal) => {
  _errors.push(String(error?.message || error) + '\n' + String(error?.stack || ''));
});

// Step 2: error display
function ErrorScreen() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#FFFFFF', paddingTop: 60, paddingHorizontal: 16 }}>
      <Text style={{ fontSize: 24, color: '#FF0000', fontWeight: 'bold', marginBottom: 20 }}>
        {_errors.length > 0 ? 'ERREURS (' + _errors.length + ')' : 'AUCUNE ERREUR - App montee OK'}
      </Text>
      {_errors.map((e, i) => (
        <Text key={i} style={{ fontSize: 11, color: '#333', marginBottom: 16 }}>{e}</Text>
      ))}
    </ScrollView>
  );
}

// Step 3: try loading expo, if it fails use AppRegistry directly
try {
  const { registerRootComponent } = require('expo');
  registerRootComponent(ErrorScreen);
} catch (e) {
  _errors.push('EXPO IMPORT FAILED: ' + String(e?.message || e));
  AppRegistry.registerComponent('main', () => ErrorScreen);
}
