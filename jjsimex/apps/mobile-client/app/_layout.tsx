import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from '@/contexts/AuthContext';
import { configureNotifications } from '@jjsimex/ui/notifications';
import { setClient } from '@jjsimex/supabase/client';
import { supabase } from '@/lib/supabase';

SplashScreen.preventAutoHideAsync().catch(() => {});
configureNotifications();
setClient(supabase);

// Capte les erreurs JS globales (async) pour les afficher à l'écran
const _errors: string[] = [];
const _prev = (global as any).ErrorUtils?.getGlobalHandler?.();
(global as any).ErrorUtils?.setGlobalHandler?.((error: any, isFatal: boolean) => {
  const msg = String(error?.message || error);
  // Ignore le bruit en cascade "No callback found"
  if (!msg.includes('No callback found')) {
    _errors.push((isFatal ? '[FATAL] ' : '[ERR] ') + msg);
  }
  _prev?.(error, isFatal);
});

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { err: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { err: null };
  }
  componentDidCatch(error: Error) {
    _errors.push('[RENDER] ' + String(error?.message || error));
    this.setState({ err: error });
  }
  static getDerivedStateFromError(error: Error) {
    return { err: error };
  }
  render() {
    if (this.state.err || _errors.length > 0) {
      return (
        <View style={{ flex: 1, backgroundColor: '#FFFFFF', paddingTop: 60, paddingHorizontal: 16 }}>
          <Text style={{ fontSize: 22, color: '#CC0000', fontWeight: 'bold', marginBottom: 16 }}>
            ERREUR REELLE ({_errors.length})
          </Text>
          {this.state.err && (
            <Text style={{ fontSize: 14, color: '#000', fontWeight: 'bold', marginBottom: 14 }}>
              {String(this.state.err.message || this.state.err)}
            </Text>
          )}
          {_errors.map((e, i) => (
            <Text key={i} style={{ fontSize: 12, color: '#222', marginBottom: 14 }}>{e}</Text>
          ))}
        </View>
      );
    }
    return this.props.children;
  }
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#0D0D0D' },
          }}
        />
      </AuthProvider>
    </ErrorBoundary>
  );
}
