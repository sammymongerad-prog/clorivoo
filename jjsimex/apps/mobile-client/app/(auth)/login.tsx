import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

type Mode = 'login' | 'signup';
type Dest = 'ht' | 'rd';

export default function AuthScreen() {
  const router = useRouter();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [showPw, setShowPw] = useState(false);
  const [dest, setDest] = useState<Dest>('ht');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Champs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  function switchMode() {
    setMode(m => m === 'login' ? 'signup' : 'login');
    setError('');
    setShowPw(false);
  }

  async function handleSubmit() {
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        if (!email || !password) { setError('Veuillez remplir tous les champs.'); return; }
        const { error: err } = await signIn(email, password);
        if (err) { setError(err); return; }
        router.replace('/(tabs)/home');
      } else {
        if (!firstName || !lastName || !email || !password) {
          setError('Veuillez remplir tous les champs obligatoires.');
          return;
        }
        const { error: err } = await signUp(email, password, {
          first_name: firstName,
          last_name: lastName,
          phone_whatsapp: phone || undefined,
          destination_country: dest === 'ht' ? 'haiti' : 'dominican_republic',
        });
        if (err) { setError(err); return; }
        router.replace('/(tabs)/home');
      }
    } finally {
      setLoading(false);
    }
  }

  const segStyle = (active: boolean) => ({
    ...styles.seg,
    backgroundColor: active ? 'rgba(249,115,22,0.12)' : '#1A1A1A',
    borderColor: active ? '#F97316' : '#2A2A2A',
  });
  const segTextStyle = (active: boolean) => ({
    ...styles.segText,
    color: active ? '#F97316' : '#9CA3AF',
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 26 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoRow}>
          <Text style={styles.logoJJ}>JJ</Text>
          <Text style={styles.logoOrange}>'s</Text>
          <Text style={styles.logoJJ}> IMEX</Text>
        </View>

        {mode === 'login' ? (
          <View>
            <Text style={styles.h1}>Bon retour 👋</Text>
            <Text style={styles.sub}>Connectez-vous pour suivre vos colis.</Text>

            <Text style={styles.label}>Adresse email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="vous@email.com"
              placeholderTextColor="#5B6470"
            />

            <Text style={styles.label}>Mot de passe</Text>
            <View style={{ position: 'relative', marginBottom: 12 }}>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPw}
                placeholder="••••••••"
                placeholderTextColor="#5B6470"
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPw(v => !v)}>
                <Text style={{ color: '#9CA3AF', fontSize: 13 }}>{showPw ? 'Cacher' : 'Voir'}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={{ alignSelf: 'flex-end', marginBottom: 28 }}>
              <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.ctaBtn, loading && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.9}
            >
              {loading
                ? <ActivityIndicator color="#0D0D0D" />
                : <Text style={styles.ctaBtnText}>Se connecter</Text>
              }
            </TouchableOpacity>

            {/* Séparateur */}
            <View style={styles.separator}>
              <View style={styles.sepLine} />
              <Text style={styles.sepText}>ou continuer avec</Text>
              <View style={styles.sepLine} />
            </View>

            <View style={styles.socialRow}>
              <TouchableOpacity style={styles.socialBtn} activeOpacity={0.85}>
                <Text style={styles.socialBtnText}>🔵 Google</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialBtn} activeOpacity={0.85}>
                <Text style={styles.socialBtnText}>🍎 Apple</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchText}>Pas encore de compte ? </Text>
              <TouchableOpacity onPress={switchMode}>
                <Text style={styles.switchLink}>Créer un compte</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View>
            <Text style={styles.h1}>Créer mon compte</Text>
            <Text style={styles.sub}>Quelques infos et c'est parti.</Text>

            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Prénom</Text>
                <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="Jean" placeholderTextColor="#5B6470" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Nom</Text>
                <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="Pierre" placeholderTextColor="#5B6470" />
              </View>
            </View>

            <Text style={styles.label}>Adresse email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="vous@email.com"
              placeholderTextColor="#5B6470"
            />

            <Text style={styles.label}>Numéro WhatsApp</Text>
            <View style={styles.phoneRow}>
              <View style={styles.phonePre}>
                <Text style={styles.phonePreText}>+509</Text>
              </View>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="34 12 34 56"
                placeholderTextColor="#5B6470"
              />
            </View>

            <Text style={styles.label}>Mot de passe</Text>
            <View style={{ position: 'relative', marginBottom: 18 }}>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPw}
                placeholder="••••••••"
                placeholderTextColor="#5B6470"
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPw(v => !v)}>
                <Text style={{ color: '#9CA3AF', fontSize: 13 }}>{showPw ? 'Cacher' : 'Voir'}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Pays de destination</Text>
            <View style={styles.segRow}>
              <TouchableOpacity style={segStyle(dest === 'ht')} onPress={() => setDest('ht')}>
                <Text style={segTextStyle(dest === 'ht')}>Haïti</Text>
              </TouchableOpacity>
              <TouchableOpacity style={segStyle(dest === 'rd')} onPress={() => setDest('rd')}>
                <Text style={segTextStyle(dest === 'rd')}>Rép. Dominicaine</Text>
              </TouchableOpacity>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.ctaBtn, loading && { opacity: 0.7 }, { marginTop: 28 }]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.9}
            >
              {loading
                ? <ActivityIndicator color="#0D0D0D" />
                : <Text style={styles.ctaBtnText}>Créer mon compte</Text>
              }
            </TouchableOpacity>

            <View style={[styles.switchRow, { paddingBottom: 8 }]}>
              <Text style={styles.switchText}>Déjà un compte ? </Text>
              <TouchableOpacity onPress={switchMode}>
                <Text style={styles.switchLink}>Se connecter</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const S = StyleSheet;
const styles = S.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  logoRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', paddingTop: 38, paddingBottom: 26 },
  logoJJ: { color: '#FFFFFF', fontWeight: '800', fontSize: 26, letterSpacing: -0.8 },
  logoOrange: { color: '#F97316', fontWeight: '800', fontSize: 26, letterSpacing: -0.8 },
  h1: { fontWeight: '700', fontSize: 28, letterSpacing: -0.6, color: '#FFFFFF', marginBottom: 6 },
  sub: { fontSize: 15, color: '#9CA3AF', marginBottom: 30 },
  label: { fontSize: 13, fontWeight: '500', color: '#9CA3AF', marginBottom: 8 },
  input: {
    width: '100%', height: 50, backgroundColor: '#1A1A1A', borderWidth: 1,
    borderColor: '#2A2A2A', borderRadius: 8, color: '#FFFFFF', paddingHorizontal: 14,
    fontSize: 15, marginBottom: 18,
  },
  eyeBtn: {
    position: 'absolute', right: 6, top: '50%', marginTop: -18,
    width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
  },
  forgotText: { color: '#9CA3AF', fontSize: 13 },
  errorText: { color: '#EF4444', fontSize: 13, marginBottom: 16 },
  ctaBtn: {
    width: '100%', height: 54, borderRadius: 12, backgroundColor: '#F97316',
    alignItems: 'center', justifyContent: 'center',
  },
  ctaBtnText: { color: '#0D0D0D', fontWeight: '700', fontSize: 16 },
  separator: { flexDirection: 'row', alignItems: 'center', gap: 14, marginVertical: 26 },
  sepLine: { flex: 1, height: 1, backgroundColor: '#2A2A2A' },
  sepText: { fontSize: 12, color: '#6B7280' },
  socialRow: { flexDirection: 'row', gap: 12 },
  socialBtn: {
    flex: 1, height: 50, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 12,
  },
  socialBtnText: { color: '#FFFFFF', fontWeight: '500', fontSize: 14 },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 30 },
  switchText: { fontSize: 14, color: '#9CA3AF' },
  switchLink: { color: '#F97316', fontWeight: '600', fontSize: 14 },
  row2: { flexDirection: 'row', gap: 12, marginBottom: 0 },
  phoneRow: { flexDirection: 'row', gap: 10, marginBottom: 0 },
  phonePre: {
    height: 50, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2A2A2A',
    borderRadius: 8, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 18,
  },
  phonePreText: { color: '#FFFFFF', fontSize: 15, fontWeight: '500' },
  segRow: { flexDirection: 'row', gap: 12, marginBottom: 0 },
  seg: {
    flex: 1, height: 50, borderRadius: 8, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  segText: { fontWeight: '600', fontSize: 14 },
});
