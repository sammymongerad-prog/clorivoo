import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { COLORS } from '../../lib/tokens';
import { Btn, Input } from '../../components/UI';
import { signUp } from '../../lib/supabase';

export default function RegisterScreen({ navigation }) {
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed]     = useState(false);
  const [loading, setLoading]   = useState(false);

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthColors = ['', COLORS.danger, COLORS.warning, COLORS.success];
  const strengthLabels = ['', 'Faible', 'Moyen', 'Fort'];

  async function handleRegister() {
    if (!name || !email || !password) { Alert.alert('Erreur', 'Remplissez tous les champs.'); return; }
    if (password.length < 6) { Alert.alert('Erreur', 'Mot de passe trop court (6 caractères min.).'); return; }
    if (!agreed) { Alert.alert('Erreur', 'Acceptez les conditions d\'utilisation.'); return; }
    setLoading(true);
    const { error } = await signUp(email.trim(), password, name.trim());
    setLoading(false);
    if (error) Alert.alert('Inscription échouée', error.message);
    // SessionProvider handles redirect
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1, backgroundColor: COLORS.white }} contentContainerStyle={{ padding: 24, paddingTop: 60 }}>

        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 28, fontWeight: '800', color: COLORS.ink, letterSpacing: -0.5 }}>Créer un compte</Text>
          <Text style={{ fontSize: 15, color: COLORS.mute, marginTop: 4 }}>Rejoignez +2M d'acheteurs</Text>
        </View>

        <Input label="Nom complet" value={name} onChangeText={setName} placeholder="Votre prénom et nom" />
        <Input label="Adresse e-mail" value={email} onChangeText={setEmail}
          placeholder="vous@mail.com" keyboardType="email-address" />
        <Input label="Mot de passe" value={password} onChangeText={setPassword}
          placeholder="8 caractères minimum" secureTextEntry />

        {/* Strength meter */}
        {password.length > 0 && (
          <View style={{ marginTop: -8, marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', gap: 4, marginBottom: 4 }}>
              {[1,2,3].map(i => (
                <View key={i} style={{ flex: 1, height: 3, borderRadius: 9999, backgroundColor: i <= strength ? strengthColors[strength] : COLORS.hairline }} />
              ))}
            </View>
            <Text style={{ fontSize: 12, color: strengthColors[strength] }}>{strengthLabels[strength]}</Text>
          </View>
        )}

        {/* Terms */}
        <TouchableOpacity onPress={() => setAgreed(a => !a)}
          style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 24 }}>
          <View style={{ width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: agreed ? COLORS.primary : COLORS.hairline, backgroundColor: agreed ? COLORS.primary : 'transparent', alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0 }}>
            {agreed && <Text style={{ color: '#fff', fontSize: 12, fontWeight: '900' }}>✓</Text>}
          </View>
          <Text style={{ fontSize: 13, color: COLORS.mute, lineHeight: 20, flex: 1 }}>
            J'accepte les{' '}
            <Text style={{ color: COLORS.primary, fontWeight: '600' }}>conditions d'utilisation</Text>
            {' '}et la{' '}
            <Text style={{ color: COLORS.primary, fontWeight: '600' }}>politique de confidentialité</Text>
          </Text>
        </TouchableOpacity>

        <Btn size="lg" onPress={handleRegister} disabled={!agreed || loading}>
          {loading ? 'Création…' : 'Continuer →'}
        </Btn>

        <View style={{ alignItems: 'center', marginTop: 24 }}>
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
