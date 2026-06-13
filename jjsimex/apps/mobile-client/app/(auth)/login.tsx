import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    if (!email || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    setLoading(true);
    setError(null);
    const { error: err } = await signIn(email, password);
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      router.replace('/(tabs)/home');
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#0D0D0D]"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="items-center mb-10">
          <Text className="text-3xl font-bold text-white">
            JJ&apos;s <Text className="text-[#F97316]">IMEX</Text>
          </Text>
          <Text className="text-[#9CA3AF] text-sm mt-1">Service de livraison USA → Haïti & RD</Text>
        </View>

        {/* Card */}
        <View className="bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] p-6">
          <Text className="text-xl font-semibold text-white mb-6">Connexion</Text>

          {error && (
            <View className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-5">
              <Text className="text-red-400 text-sm">{error}</Text>
            </View>
          )}

          <View className="mb-4">
            <Text className="text-[#9CA3AF] text-sm mb-1.5">Adresse email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              placeholder="votre@email.com"
              placeholderTextColor="#4B5563"
              className="bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-3 text-white text-sm"
            />
          </View>

          <View className="mb-2">
            <Text className="text-[#9CA3AF] text-sm mb-1.5">Mot de passe</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              placeholder="••••••••"
              placeholderTextColor="#4B5563"
              className="bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-3 text-white text-sm"
            />
          </View>

          <TouchableOpacity
            onPress={() => router.push('/(auth)/forgot-password')}
            className="self-end mb-6"
          >
            <Text className="text-[#F97316] text-xs">Mot de passe oublié ?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            className="bg-[#F97316] rounded-xl py-3.5 items-center"
            style={{ opacity: loading ? 0.7 : 1 }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-sm">Se connecter</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Inscription */}
        <View className="flex-row justify-center mt-6">
          <Text className="text-[#9CA3AF] text-sm">Pas encore de compte ? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text className="text-[#F97316] text-sm font-semibold">S&apos;inscrire</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
