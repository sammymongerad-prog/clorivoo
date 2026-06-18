import 'react-native-url-polyfill/auto';

import React from 'react';
import { registerRootComponent } from 'expo';
import { View, Text, ScrollView } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

// Capture every error before anything else
const _errors = [];
const _prev = global.ErrorUtils?.getGlobalHandler?.();
global.ErrorUtils?.setGlobalHandler?.((error, isFatal) => {
  _errors.push((isFatal ? '[FATAL] ' : '[ERR] ') + String(error?.message || error) + '\n' + String(error?.stack || ''));
  _prev?.(error, isFatal);
});

// Hide splash so we can actually see content
SplashScreen.hideAsync().catch((e) => { _errors.push('hideAsync: ' + String(e?.message || e)); });

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { err: null };
  }
  componentDidCatch(error, info) {
    _errors.push('[RENDER] ' + String(error?.message || error) + '\n' + String(info?.componentStack || ''));
    this.setState({ err: error });
  }
  static getDerivedStateFromError(error) {
    return { err: error };
  }
  render() {
    if (this.state.err || _errors.length > 0) {
      return (
        <ScrollView style={{ flex: 1, backgroundColor: '#FFFFFF', paddingTop: 60, paddingHorizontal: 16 }}>
          <Text style={{ fontSize: 22, color: '#CC0000', fontWeight: 'bold', marginBottom: 16 }}>
            ERREURS ({_errors.length})
          </Text>
          {_errors.map((e, i) => (
            <Text key={i} style={{ fontSize: 11, color: '#222', marginBottom: 14 }}>{e}</Text>
          ))}
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

function Inner() {
  React.useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);
  return (
    <View style={{ flex: 1, backgroundColor: '#FF6600', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#FFFFFF', fontSize: 48, fontWeight: 'bold' }}>CA MARCHE</Text>
      <Text style={{ color: '#FFFFFF', fontSize: 18, marginTop: 16 }}>Aucune erreur</Text>
    </View>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Inner />
    </ErrorBoundary>
  );
}

registerRootComponent(App);
