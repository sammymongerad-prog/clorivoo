import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { COLORS, RADIUS } from '../../lib/tokens';
import { Btn, Input } from '../../components/UI';
import { signUp } from '../../lib/supabase';

export default function RegisterScreen({ navigation }) {
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState(false);

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthColors = ['', COLORS.danger, COLORS.warning, COLORS.success];
  const strengthLabels = ['', 'Faible', 'Moyen', 'Fort'];

  async function handleRegister() {
    setError('');
    if (!name || !email || !password) { setError('Remplissez tous les champs.'); return; }
    if (password.length < 6) { setError('Mot de passe trop court (6 caractères min.).'); return; }
    if (!agreed) { setError("Acceptez les conditions d'utilisation."); return; }
    setLoading(true);
    const { error: err } = await signUp(email.trim(), password, name.trim());
    setLoading(false);
    if (err) {
      if (err.message.includes('already registered') || err.message.includes('already been registered'))
        setError('Cet email est déjà utilisé. Connectez-vous.');
      else setError(err.message);
    } else {
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Text style={{ fontSize: 56, marginBottom: 16 }}>✅</Text>
        <Text style={{ fontSize: 22, fontWeight: '800', color: COLORS.ink, textAlign: 'center', marginBottom: 8 }}>Compte créé !</Text>
        <Text style={{ fontSize: 15, color: COLORS.mute, textAlign: 'center', marginBottom: 32, lineHeight: 22 }}>
          Vérifiez votre boîte mail et confirmez votre adresse pour vous connecter.
        </Text>
        <Btn size="lg" onPress={() => navigation.replace('Login')}>Se connecter</Btn>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: COLORS.white }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 60 }} keyboardShouldPersistTaps="handled">

        {/* Back */}
        <TouchableOpacity onPress={() => navigation.goBack()}
          style={{ marginBottom: 24, flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 22, color: COLORS.mute }}>←</Text>
        </TouchableOpacity>

        {/* Title */}
        <View style={{ marginBottom: 28 }}>
          <Text style={{ fontSize: 28, fontWeight: '800', color: COLORS.ink, letterSpacing: -0.5, marginBottom: 6 }}>Créer un compte</Text>
          <Text style={{ fontSize: 15, color: COLORS.mute }}>Rejoignez +2M d'acheteurs</Text>
        </View>

        {/* Error */}
        {error ? (
          <View style={{ backgroundColor: '#FEE2E2', borderRadius: RADIUS.md, padding: 12, marginBottom: 16 }}>
            <Text style={{ color: '#B91C1C', fontSize: 14, fontWeight: '500' }}>⚠️ {error}</Text>
          </View>
        ) : null}

        {/* Fields */}
        <View style={{ gap: 14 }}>
          <Input label="Nom complet" value={name} onChangeText={setName} placeholder="Votre prénom et nom" />
          <Input label="Adresse e-mail" value={email} onChangeText={setEmail}
            placeholder="vous@mail.com" keyboardType="email-address" iconLeft="✉️" />
          <View>
            <Input label="Mot de passe" value={password} onChangeText={setPassword}
              placeholder="8 caractères minimum" secureTextEntry iconLeft="🔒" />
            {password.length > 0 && (
              <View style={{ marginTop: 8 }}>
                <View style={{ flexDirection: 'row', gap: 4, marginBottom: 4 }}>
                  {[1, 2, 3].map(i => (
                    <View key={i} style={{ flex: 1, height: 3, borderRadius: 9999, backgroundColor: i <= strength ? strengthColors[strength] : COLORS.hairline }} />
                  ))}
                </View>
                <Text style={{ fontSize: 12, color: strengthColors[strength] }}>{strengthLabels[strength]}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Terms */}
        <TouchableOpacity onPress={() => setAgreed(a => !a)}
          style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 18 }}>
          <View style={{ width: 20, height: 20, borderRadius: 6, borderWidth: 2,
            borderColor: agreed ? COLORS.primary : COLORS.hairline,
            backgroundColor: agreed ? COLORS.primary : 'transparent',
            alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0 }}>
            {agreed && <Text style={{ color: '#fff', fontSize: 12, fontWeight: '900' }}>✓</Text>}
          </View>
          <Text style={{ fontSize: 13, color: COLORS.mute, lineHeight: 20, flex: 1 }}>
            J'accepte les{' '}
            <Text style={{ color: COLORS.primary, fontWeight: '600' }}>conditions d'utilisation</Text>
            {' '}et la{' '}
            <Text style={{ color: COLORS.primary, fontWeight: '600' }}>politique de confidentialité</Text>
          </Text>
        </TouchableOpacity>

        <View style={{ marginTop: 24 }}>
          <Btn size="lg" onPress={handleRegister} disabled={!agreed || loading}>
            {loading ? 'Création…' : 'Continuer →'}
          </Btn>
        </View>

        <View style={{ alignItems: 'center', marginTop: 20 }}>
          <Text style={{ fontSize: 14, color: COLORS.mute }}>
            Déjà un compte ?{' '}
            <Text style={{ color: COLORS.primary, fontWeight: '700' }}
              onPress={() => navigation.goBack()}>
              Se connecter
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
