import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { COLORS, RADIUS } from '../../lib/tokens';
import { Btn, Input } from '../../components/UI';
import { signIn } from '../../lib/supabase';

export default function LoginScreen({ navigation }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  async function handleLogin() {
    setError('');
    if (!email || !password) { setError('Remplissez tous les champs.'); return; }
    setLoading(true);
    const { error: err } = await signIn(email.trim(), password);
    setLoading(false);
    if (err) {
      if (err.message.includes('Invalid login credentials')) {
        setError('Email ou mot de passe incorrect.');
      } else if (err.message.includes('Email not confirmed')) {
        setError('Confirmez votre email avant de vous connecter.');
      } else {
        setError(err.message);
      }
    }
    // onAuthStateChange in SessionProvider handles redirect on success
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1, backgroundColor: COLORS.white }} contentContainerStyle={{ padding: 24, paddingTop: 60 }}>

        {/* Logo */}
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <View style={{ width: 72, height: 72, borderRadius: 20, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 14, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8 }}>
            <Text style={{ fontWeight: '800', fontSize: 42, color: '#fff' }}>c</Text>
          </View>
          <Text style={{ fontSize: 28, fontWeight: '800', color: COLORS.ink, letterSpacing: -0.5 }}>Bon retour 👋</Text>
          <Text style={{ fontSize: 15, color: COLORS.mute, marginTop: 4 }}>Connectez-vous pour continuer</Text>
        </View>

        {error ? (
          <View style={{ backgroundColor: '#FEE2E2', borderRadius: RADIUS.md, padding: 12, marginBottom: 16 }}>
            <Text style={{ color: '#B91C1C', fontSize: 14, fontWeight: '500' }}>⚠️ {error}</Text>
          </View>
        ) : null}

        <Input label="Adresse e-mail" value={email} onChangeText={setEmail}
          placeholder="vous@mail.com" keyboardType="email-address" />
        <Input label="Mot de passe" value={password} onChangeText={setPassword}
          placeholder="••••••••" secureTextEntry />

        <TouchableOpacity style={{ alignSelf: 'flex-end', marginBottom: 24, marginTop: -6 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.primary }}>Mot de passe oublié ?</Text>
        </TouchableOpacity>

        <Btn size="lg" onPress={handleLogin} disabled={loading}>
          {loading ? 'Connexion…' : 'Se connecter'}
        </Btn>

        <View style={{ alignItems: 'center', marginTop: 24 }}>
          <Text style={{ fontSize: 14, color: COLORS.mute }}>
            Nouveau ?{' '}
            <Text style={{ color: COLORS.primary, fontWeight: '700' }}
              onPress={() => navigation.navigate('Register')}>
              Créer un compte
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
