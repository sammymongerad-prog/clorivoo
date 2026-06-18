import 'react-native-url-polyfill/auto';

import React, { useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { registerRootComponent } from 'expo';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.hideAsync().catch(() => {});

const _errors = [];
const _prev = global.ErrorUtils?.getGlobalHandler?.();
global.ErrorUtils?.setGlobalHandler?.((error, isFatal) => {
  _errors.push((isFatal ? '[FATAL] ' : '[ERR] ') + String(error?.message || error));
  _prev?.(error, isFatal);
});

function hideSplash() {
  SplashScreen.hideAsync().catch(() => {});
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { err: null };
  }
  componentDidMount() {
    hideSplash();
  }
  componentDidCatch(error) {
    _errors.push('[RENDER] ' + String(error?.message || error));
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
            <Text key={i} style={{ fontSize: 12, color: '#222', marginBottom: 14 }}>{e}</Text>
          ))}
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

function Inner() {
  useEffect(() => {
    hideSplash();
    setTimeout(hideSplash, 300);
    setTimeout(hideSplash, 1000);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#FF6600', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#FFFFFF', fontSize: 48, fontWeight: 'bold' }}>CA MARCHE</Text>
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
