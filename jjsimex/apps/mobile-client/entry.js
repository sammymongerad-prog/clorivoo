import 'react-native-url-polyfill/auto';

import React from 'react';
import { AppRegistry, View, Text, ScrollView } from 'react-native';

const _errors = [];
const _prev = global.ErrorUtils?.getGlobalHandler?.();
global.ErrorUtils?.setGlobalHandler?.((error, isFatal) => {
  _errors.push((isFatal ? '[FATAL] ' : '[ERR] ') + String(error?.message || error));
  _prev?.(error, isFatal);
});

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { err: null };
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

AppRegistry.registerComponent('main', () => App);
