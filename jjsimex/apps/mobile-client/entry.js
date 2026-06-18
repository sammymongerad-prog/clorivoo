// CUSTOM ENTRY — wraps everything in error capture
import '@expo/metro-runtime';
import React from 'react';
import { Text, View, ScrollView } from 'react-native';
import { registerRootComponent } from 'expo';

// ── Step 1: Capture module-level errors ──────────────────────────────────────
const _earlyErrors = [];

global.ErrorUtils?.setGlobalHandler?.((error, isFatal) => {
  _earlyErrors.push({
    msg: String(error?.message || error),
    stack: String(error?.stack || ''),
    fatal: !!isFatal,
  });
});

// ── Step 2: Try to import the expo-router App ─────────────────────────────────
let RouterApp = null;
try {
  RouterApp = require('expo-router/build/qualified-entry').App;
} catch (e) {
  _earlyErrors.push({
    msg: 'IMPORT CRASH: ' + String(e?.message || e),
    stack: String(e?.stack || ''),
    fatal: true,
  });
}

// ── Step 3: Error display component ──────────────────────────────────────────
function ErrorScreen({ errors }) {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#FFF', paddingTop: 60, paddingHorizontal: 16 }}
      contentContainerStyle={{ paddingBottom: 80 }}>
      <View style={{ backgroundColor: '#FF0000', padding: 12, borderRadius: 8, marginBottom: 16 }}>
        <Text style={{ color: '#FFF', fontSize: 20, fontWeight: 'bold' }}>
          ERREURS ({errors.length})
        </Text>
      </View>
      {errors.map((err, i) => (
        <View key={i} style={{ marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#CCC', paddingBottom: 12 }}>
          <Text style={{ fontSize: 13, color: '#CC0000', fontWeight: 'bold' }}>
            {err.fatal ? '[FATAL] ' : ''}{err.msg}
          </Text>
          <Text style={{ fontSize: 9, color: '#666', marginTop: 4 }}>
            {err.stack}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

// ── Step 4: Error Boundary ───────────────────────────────────────────────────
class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    const allErrors = [..._earlyErrors];
    if (this.state.error) {
      allErrors.push({
        msg: 'RENDER: ' + String(this.state.error?.message || this.state.error),
        stack: String(this.state.error?.stack || ''),
        fatal: true,
      });
    }
    if (allErrors.length > 0) {
      return <ErrorScreen errors={allErrors} />;
    }
    return this.props.children;
  }
}

// ── Step 5: Root component ──────────────────────────────────────────────────
function Root() {
  // Show early errors even if RouterApp loaded
  if (_earlyErrors.length > 0) {
    return <ErrorScreen errors={_earlyErrors} />;
  }
  if (!RouterApp) {
    return <ErrorScreen errors={[{ msg: 'RouterApp failed to load', stack: '', fatal: true }]} />;
  }
  return (
    <RootErrorBoundary>
      <RouterApp />
    </RootErrorBoundary>
  );
}

registerRootComponent(Root);
