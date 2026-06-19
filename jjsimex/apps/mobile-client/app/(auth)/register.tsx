import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

const CITIES_HT = ['Port-au-Prince', 'Cap-Haïtien', 'Gonaïves', 'Saint-Marc', 'Pétion-Ville', 'Delmas', 'Jacmel', 'Les Cayes', 'Jérémie'];
const CITIES_RD = ['Santo Domingo', 'Santiago', 'Punta Cana', 'La Romana', 'San Pedro de Macorís', 'Puerto Plata'];

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [dest, setDest] = useState<'HT' | 'DO'>('HT');
  const [city, setCity] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const cities = dest === 'HT' ? CITIES_HT : CITIES_RD;

  async function handleRegister() {
    if (!firstName || !lastName || !email || !password) {
      setError('Veuillez remplir tous les champs obligatoires.'); return;
    }
    setError(''); setLoading(true);
    try {
      const { error: err } = await signUp({ email, password, firstName, lastName, whatsapp: phone, destinationCountry: dest === 'HT' ? 'haiti' : 'dr', destinationCity: city || cities[0] });
      if (err) { setError(err); return; }
      router.replace('/(tabs)/');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={{ flex: 1, backgroundColor: '#0D0D0D' }} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={{ color: '#F97316', fontSize: 24 }}>←</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Créer mon compte</Text>
        <Text style={styles.subtitle}>Rejoignez JJ's IMEX et recevez votre adresse US gratuite</Text>

        <View style={styles.form}>
          {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Prénom *</Text>
              <TextInput style={styles.input} placeholder="Jean" placeholderTextColor="#6B7280" value={firstName} onChangeText={setFirstName} autoCapitalize="words" />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Nom *</Text>
              <TextInput style={styles.input} placeholder="Paul" placeholderTextColor="#6B7280" value={lastName} onChangeText={setLastName} autoCapitalize="words" />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email *</Text>
            <TextInput style={styles.input} placeholder="votre@email.com" placeholderTextColor="#6B7280" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Téléphone WhatsApp</Text>
            <TextInput style={styles.input} placeholder="+509 XXXX-XXXX" placeholderTextColor="#6B7280" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Mot de passe *</Text>
            <View style={{ position: 'relative' }}>
              <TextInput style={styles.input} placeholder="8 caractères minimum" placeholderTextColor="#6B7280" value={password} onChangeText={setPassword} secureTextEntry={!showPw} />
              <TouchableOpacity onPress={() => setShowPw(s => !s)} style={styles.eyeBtn}>
                <Text style={{ fontSize: 18 }}>{showPw ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Destination</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(['HT', 'DO'] as const).map(d => (
                <TouchableOpacity
                  key={d}
                  onPress={() => { setDest(d); setCity(''); }}
                  style={{ flex: 1, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: dest === d ? '#F97316' : '#1A1A1A', borderWidth: 1, borderColor: dest === d ? '#F97316' : '#2A2A2A' }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '700', color: dest === d ? '#0D0D0D' : '#9CA3AF' }}>{d === 'HT' ? '🇭🇹 Haïti' : '🇩🇴 Rép. Dom.'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Ville de retrait</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
              {cities.map(c => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setCity(c)}
                  style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: city === c ? '#F97316' : '#1A1A1A', borderWidth: 1, borderColor: city === c ? '#F97316' : '#2A2A2A' }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: city === c ? '#0D0D0D' : '#9CA3AF' }}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <TouchableOpacity onPress={handleRegister} disabled={loading} style={[styles.btnPrimary, loading && { opacity: 0.6 }]} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color="#0D0D0D" /> : <Text style={styles.btnPrimaryText}>Créer mon compte</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Déjà un compte ? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.footerLink}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 28, gap: 20 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: '800', color: '#FFFFFF' },
  subtitle: { fontSize: 14, color: '#9CA3AF', lineHeight: 20 },
  form: { gap: 14 },
  errorBox: { backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: '#EF4444', borderRadius: 10, padding: 12 },
  errorText: { color: '#EF4444', fontSize: 13 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: '#9CA3AF' },
  input: { height: 50, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 12, color: '#FFFFFF', paddingHorizontal: 16, fontSize: 15 },
  eyeBtn: { position: 'absolute', right: 14, top: 0, height: 50, justifyContent: 'center' },
  btnPrimary: { height: 52, backgroundColor: '#F97316', borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  btnPrimaryText: { fontSize: 15, fontWeight: '700', color: '#0D0D0D' },
  footer: { flexDirection: 'row', justifyContent: 'center', paddingBottom: 20 },
  footerText: { fontSize: 14, color: '#9CA3AF' },
  footerLink: { fontSize: 14, fontWeight: '700', color: '#F97316' },
});
