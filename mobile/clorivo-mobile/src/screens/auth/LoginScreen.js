import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { COLORS, RADIUS } from '../../lib/tokens';
import { Btn, Input } from '../../components/UI';
import { signIn, signInWithOAuth } from '../../lib/supabase';

// Logos SVG Google et Apple en inline (web-compatible)
function GoogleLogo() {
  return (
    <View style={{ width: 18, height: 18 }}>
      {/* Cercles colorés simplifiés */}
      <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E8E6F0', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 12, lineHeight: 14 }}>G</Text>
      </View>
    </View>
  );
}

export default function LoginScreen({ navigation }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading]   = useState(false);
  const [oauthLoading, setOAuthLoading] = useState(null); // 'google' | 'apple'
  const [error, setError]       = useState('');

  async function handleLogin() {
    setError('');
    if (!email || !password) { setError('Remplissez tous les champs.'); return; }
    setLoading(true);
    const { error: err } = await signIn(email.trim(), password);
    setLoading(false);
    if (err) {
      if (err.message.includes('Invalid login credentials')) setError('Email ou mot de passe incorrect.');
      else if (err.message.includes('Email not confirmed'))  setError('Confirmez votre email avant de vous connecter.');
      else setError(err.message);
    } else {
      navigation.replace('Tabs');
    }
  }

  async function handleOAuth(provider) {
    setError('');
    setOAuthLoading(provider);
    const { error: err } = await signInWithOAuth(provider);
    setOAuthLoading(null);
    if (err) setError(err.message);
    // Sur web : Supabase redirige automatiquement vers le provider
    // La session est récupérée au retour via onAuthStateChange
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: COLORS.white }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 60 }} keyboardShouldPersistTaps="handled">

        {/* Back */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 22, color: COLORS.mute }}>←</Text>
        </TouchableOpacity>

        {/* Title */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 28, fontWeight: '800', color: COLORS.ink, letterSpacing: -0.5, marginBottom: 6 }}>Bon retour 👋</Text>
          <Text style={{ fontSize: 15, color: COLORS.mute }}>Connectez-vous pour continuer</Text>
        </View>

        {/* Boutons sociaux EN PREMIER */}
        <View style={{ gap: 12, marginBottom: 20 }}>
          {/* Google */}
          <TouchableOpacity
            onPress={() => handleOAuth('google')}
            disabled={!!oauthLoading}
            style={{ height: 52, borderWidth: 1.5, borderColor: COLORS.hairline, borderRadius: 14, backgroundColor: COLORS.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: oauthLoading === 'google' ? 0.6 : 1 }}>
            <View style={{ width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#4285F4' }}>G</Text>
            </View>
            <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.ink }}>
              {oauthLoading === 'google' ? 'Redirection…' : 'Continuer avec Google'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: COLORS.hairline }} />
          <Text style={{ fontSize: 12, color: COLORS.mute }}>ou avec un email</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: COLORS.hairline }} />
        </View>

        {/* Error */}
        {error ? (
          <View style={{ backgroundColor: '#FEE2E2', borderRadius: RADIUS.md, padding: 12, marginBottom: 16 }}>
            <Text style={{ color: '#B91C1C', fontSize: 14, fontWeight: '500' }}>⚠️ {error}</Text>
          </View>
        ) : null}

        {/* Fields */}
        <View style={{ gap: 14 }}>
          <Input label="Adresse e-mail" value={email} onChangeText={setEmail}
            placeholder="vous@mail.com" keyboardType="email-address" iconLeft="✉️" />
          <Input label="Mot de passe" value={password} onChangeText={setPassword}
            placeholder="••••••••" secureTextEntry iconLeft="🔒" />
        </View>

        {/* Remember + Forgot */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, marginBottom: 24 }}>
          <TouchableOpacity onPress={() => setRemember(r => !r)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 18, height: 18, borderRadius: 5, borderWidth: 1.5,
              borderColor: remember ? COLORS.primary : COLORS.hairline,
              backgroundColor: remember ? COLORS.primarySoft : 'transparent',
              alignItems: 'center', justifyContent: 'center' }}>
              {remember && <Text style={{ fontSize: 11, color: COLORS.primary, fontWeight: '900' }}>✓</Text>}
            </View>
            <Text style={{ fontSize: 13, color: COLORS.mute }}>Se souvenir de moi</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.primary }}>Mot de passe oublié ?</Text>
          </TouchableOpacity>
        </View>

        <Btn size="lg" onPress={handleLogin} disabled={loading}>
          {loading ? 'Connexion…' : 'Se connecter'}
        </Btn>

        <View style={{ alignItems: 'center', marginTop: 24 }}>
          <Text style={{ fontSize: 14, color: COLORS.mute }}>
            Nouveau ici ?{' '}
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
