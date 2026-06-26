import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import {
  configureNotifications,
  handleNotificationTapped,
} from '@jjsimex/ui/notifications';
import { setClient } from '@jjsimex/supabase/client';
import { supabase } from '@/lib/supabase';

setClient(supabase);

const ALLOWED_ROLES = ['admin', 'super_admin', 'employee'] as const;
type AllowedRole = (typeof ALLOWED_ROLES)[number];

function UnauthorizedScreen({ onSignOut }: { onSignOut: () => void }) {
  return (
    <View style={styles.unauthorizedContainer}>
      <View style={styles.unauthorizedShieldCircle}>
        <Text style={styles.unauthorizedShieldIcon}>🛡️</Text>
      </View>
      <Text style={styles.unauthorizedTitle}>Accès non autorisé</Text>
      <Text style={styles.unauthorizedMessage}>
        Votre compte ne dispose pas des permissions nécessaires pour accéder à cette application.
        Veuillez contacter l'administrateur système.
      </Text>
      <TouchableOpacity
        style={styles.signOutButton}
        onPress={onSignOut}
        activeOpacity={0.85}
      >
        <Text style={styles.signOutButtonText}>Se déconnecter</Text>
      </TouchableOpacity>
    </View>
  );
}

function RootNavigator() {
  const router = useRouter();
  const { session, profile, loading, signOut } = useAuth();

  // Set up notifications
  useEffect(() => {
    configureNotifications();
  }, []);

  // Handle notification taps and route to appropriate screen
  useEffect(() => {
    const unsubscribe = handleNotificationTapped((data) => {
      if (!session) return;

      if (data.screen === 'detail' && data.package_id) {
        router.push({
          pathname: '/screens/detail-colis',
          params: { id: data.package_id },
        });
      } else if (data.screen === 'payments') {
        router.push('/screens/paiements');
      } else if (data.screen === 'shopper' && data.request_id) {
        router.push({
          pathname: '/screens/personal-shopper',
          params: { id: data.request_id },
        });
      } else if (data.screen === 'notifications') {
        router.push('/screens/notifications');
      } else if (data.screen === 'dashboard') {
        router.push('/(tabs)/');
      } else if (data.screen === 'departs') {
        router.push('/screens/departs');
      }
    });

    return unsubscribe;
  }, [router, session]);

  // Auth routing guard
  useEffect(() => {
    if (loading) return;

    if (!session) {
      router.replace('/(auth)/login');
      return;
    }

    if (profile) {
      const isAllowed = ALLOWED_ROLES.includes(profile.role as AllowedRole);
      if (!isAllowed) {
        // Stay on current screen — UnauthorizedScreen will render below
        return;
      }
      // Valid session + valid role → tabs
      // expo-router handles the initial route via file structure;
      // we only explicitly redirect if we detect we're on the auth screen
    }
  }, [session, profile, loading, router]);

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#F97316" size="large" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  // Session exists but role is not allowed
  if (session && profile && !ALLOWED_ROLES.includes(profile.role as AllowedRole)) {
    return <UnauthorizedScreen onSignOut={signOut} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0D0D0D' } }}>
      {/* Auth group */}
      <Stack.Screen name="(auth)" />

      {/* Main tab navigator */}
      <Stack.Screen name="(tabs)" />

      {/* Detail screens */}
      <Stack.Screen
        name="screens/profil-client"
        options={{ presentation: 'card', animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="screens/departs"
        options={{ presentation: 'card', animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="screens/notifications"
        options={{ presentation: 'card', animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="screens/profil-admin"
        options={{ presentation: 'card', animation: 'slide_from_right' }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <StatusBar style="light" backgroundColor="#0D0D0D" />
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  unauthorizedContainer: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  unauthorizedShieldCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 2,
    borderColor: 'rgba(239,68,68,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  unauthorizedShieldIcon: {
    fontSize: 40,
  },
  unauthorizedTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  unauthorizedMessage: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  signOutButton: {
    backgroundColor: '#EF4444',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  signOutButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
