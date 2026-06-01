import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { COLORS, RADIUS } from '../../lib/tokens';
import { Input } from '../../components/UI';
import { supabase } from '../../lib/supabase';

export default function ResetPasswordScreen({ navigation }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  // On web, Supabase puts the recovery token in the URL hash.
  // onAuthStateChange fires with event PASSWORD_RECOVERY when the token is valid.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setSessionReady(true);
    });
    // Also check if session already exists (page reload after redirect)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthColors = ['', COLORS.danger, '#F59E0B', COLORS.success];
  const strengthLabels = ['', 'Faible', 'Moyen', 'Fort'];

  async function handleReset() {
    setError('');
    if (!password) { setError('Entrez un nouveau mot de passe.'); return; }
    if (password.length < 8) { setError('Le mot de passe doit contenir au moins 8 caractères.'); return; }
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return; }

    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) {
      if (err.message.includes('same password')) setError('Le nouveau mot de passe doit être différent de l\'ancien.');
      else setError(err.message);
    } else {
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          <Text style={{ fontSize: 40 }}>✅</Text>
        </View>
        <Text style={{ fontSize: 24, fontWeight: '800', color: COLORS.ink, marginBottom: 10, textAlign: 'center' }}>
          Mot de passe mis à jour !
        </Text>
        <Text style={{ fontSize: 15, color: COLORS.mute, textAlign: 'center', lineHeight: 22, marginBottom: 32 }}>
          Votre mot de passe a été réinitialisé avec succès.
        </Text>
        <TouchableOpacity
          onPress={() => navigation.replace('Tabs')}
          style={{ backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 14, paddingHorizontal: 32 }}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Accéder à mon compte</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!sessionReady) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <ActivityIndicator color={COLORS.primary} size="large" />
        <Text style={{ fontSize: 15, color: COLORS.mute, marginTop: 16 }}>Vérification du lien…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: COLORS.white }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, paddingTop: 60 }} keyboardShouldPersistTaps="handled">

        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <Text style={{ fontSize: 36 }}>🔑</Text>
          </View>
          <Text style={{ fontSize: 26, fontWeight: '800', color: COLORS.ink, letterSpacing: -0.5, marginBottom: 8 }}>
            Nouveau mot de passe
          </Text>
          <Text style={{ fontSize: 15, color: COLORS.mute, textAlign: 'center' }}>
            Choisissez un mot de passe sécurisé.
          </Text>
        </View>

        {error ? (
          <View style={{ backgroundColor: '#FEF2F2', borderRadius: RADIUS.md, padding: 14, marginBottom: 16, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <Text style={{ fontSize: 16 }}>⚠️</Text>
            <Text style={{ flex: 1, color: '#B91C1C', fontSize: 14, fontWeight: '500' }}>{error}</Text>
          </View>
        ) : null}

        <View style={{ gap: 16 }}>
          <View>
            <Input
              label="Nouveau mot de passe"
              value={password}
              onChangeText={v => { setPassword(v); setError(''); }}
              placeholder="8 caractères minimum"
              secureTextEntry
            />
            {password.length > 0 && (
              <View style={{ marginTop: 8 }}>
                <View style={{ flexDirection: 'row', gap: 4, marginBottom: 4 }}>
                  {[1, 2, 3].map(i => (
                    <View key={i} style={{ flex: 1, height: 3, borderRadius: 99, backgroundColor: i <= strength ? strengthColors[strength] : COLORS.hairline }} />
                  ))}
                </View>
                <Text style={{ fontSize: 12, color: strengthColors[strength], fontWeight: '600' }}>
                  {strengthLabels[strength]}
                </Text>
              </View>
            )}
          </View>

          <Input
            label="Confirmer le mot de passe"
            value={confirm}
            onChangeText={v => { setConfirm(v); setError(''); }}
            placeholder="Répétez le mot de passe"
            secureTextEntry
          />

          {confirm.length > 0 && password !== confirm && (
            <Text style={{ fontSize: 13, color: COLORS.danger, marginTop: -8 }}>
              Les mots de passe ne correspondent pas.
            </Text>
          )}
        </View>

        <TouchableOpacity
          onPress={handleReset}
          disabled={loading}
          style={{ backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 16, alignItems: 'center', marginTop: 28, opacity: loading ? 0.75 : 1 }}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Réinitialiser le mot de passe</Text>}
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}
