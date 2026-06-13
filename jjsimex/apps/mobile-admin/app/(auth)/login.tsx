import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminLoginScreen() {
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
      router.replace('/(tabs)/dashboard');
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#0D0D0D]"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="flex-1 p-6 justify-center">
        {/* Header */}
        <View className="items-center mb-10">
          <Text className="text-3xl font-bold text-white">
            JJ&apos;s <Text className="text-[#F97316]">IMEX</Text>
          </Text>
          <View className="bg-[#F97316]/10 border border-[#F97316]/30 px-3 py-1 rounded-full mt-2">
            <Text className="text-[#F97316] text-xs font-semibold tracking-wider">ADMIN</Text>
          </View>
        </View>

        <View className="bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] p-6">
          <Text className="text-xl font-semibold text-white mb-6">Connexion Personnel</Text>

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
              placeholder="admin@jjsimex.com"
              placeholderTextColor="#4B5563"
              className="bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-3 text-white text-sm"
            />
          </View>

          <View className="mb-6">
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

        <Text className="text-center text-xs text-[#4B5563] mt-8">
          Accès réservé au personnel JJ&apos;s IMEX
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}
