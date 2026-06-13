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

const HAITI_CITIES = ['Port-au-Prince', 'Cap-Haïtien', 'Pétion-Ville', 'Delmas', 'Carrefour', 'Jacmel', 'Les Cayes'];
const RD_CITIES = ['Santo Domingo', 'Santiago', 'Punta Cana', 'La Romana', 'San Pedro de Macorís'];

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState<'haiti' | 'dominican_republic'>('haiti');
  const [city, setCity] = useState('');

  async function handleRegister() {
    if (!city) {
      setError('Sélectionnez une ville de destination.');
      return;
    }
    setLoading(true);
    setError(null);
    const { error: err } = await signUp({
      email,
      password,
      firstName,
      lastName,
      whatsapp,
      destinationCountry: country,
      destinationCity: city,
    });
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      router.replace('/(tabs)/home');
    }
  }

  function validateStep1() {
    if (!firstName || !lastName || !email || !whatsapp || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    setError(null);
    setStep(2);
  }

  const cities = country === 'haiti' ? HAITI_CITIES : RD_CITIES;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#0D0D0D]"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, padding: 24, paddingTop: 48 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="items-center mb-8">
          <Text className="text-3xl font-bold text-white">
            JJ&apos;s <Text className="text-[#F97316]">IMEX</Text>
          </Text>
          <Text className="text-[#9CA3AF] text-sm mt-1">Créer un compte</Text>
        </View>

        {/* Indicateur d'étape */}
        <View className="flex-row items-center justify-center mb-8 gap-2">
          <View className={`h-2 w-16 rounded-full ${step === 1 ? 'bg-[#F97316]' : 'bg-[#2A2A2A]'}`} />
          <View className={`h-2 w-16 rounded-full ${step === 2 ? 'bg-[#F97316]' : 'bg-[#2A2A2A]'}`} />
        </View>

        <View className="bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] p-6">
          {error && (
            <View className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-5">
              <Text className="text-red-400 text-sm">{error}</Text>
            </View>
          )}

          {step === 1 ? (
            <>
              <Text className="text-lg font-semibold text-white mb-5">Informations personnelles</Text>
              <Field label="Prénom" value={firstName} onChangeText={setFirstName} placeholder="Jean" />
              <Field label="Nom" value={lastName} onChangeText={setLastName} placeholder="Pierre" />
              <Field label="Adresse email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="jean@email.com" />
              <Field label="WhatsApp" value={whatsapp} onChangeText={setWhatsapp} keyboardType="phone-pad" placeholder="+509 XXXX XXXX" />
              <Field label="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry placeholder="Minimum 8 caractères" />
              <TouchableOpacity
                onPress={validateStep1}
                className="bg-[#F97316] rounded-xl py-3.5 items-center mt-2"
              >
                <Text className="text-white font-semibold text-sm">Suivant →</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text className="text-lg font-semibold text-white mb-5">Destination</Text>
              <Text className="text-[#9CA3AF] text-sm mb-2">Pays de livraison</Text>
              <View className="flex-row gap-3 mb-5">
                {(['haiti', 'dominican_republic'] as const).map((c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => { setCountry(c); setCity(''); }}
                    className={`flex-1 py-3 rounded-xl border items-center ${
                      country === c
                        ? 'border-[#F97316] bg-[#F97316]/10'
                        : 'border-[#2A2A2A] bg-[#0D0D0D]'
                    }`}
                  >
                    <Text className={`text-sm font-medium ${country === c ? 'text-[#F97316]' : 'text-[#9CA3AF]'}`}>
                      {c === 'haiti' ? '🇭🇹 Haïti' : '🇩🇴 Rép. Dom.'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text className="text-[#9CA3AF] text-sm mb-2">Ville de destination</Text>
              <View className="flex-row flex-wrap gap-2 mb-6">
                {cities.map((c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setCity(c)}
                    className={`px-3 py-2 rounded-lg border ${
                      city === c
                        ? 'border-[#F97316] bg-[#F97316]/10'
                        : 'border-[#2A2A2A] bg-[#0D0D0D]'
                    }`}
                  >
                    <Text className={`text-sm ${city === c ? 'text-[#F97316]' : 'text-[#9CA3AF]'}`}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setStep(1)}
                  className="flex-1 border border-[#2A2A2A] rounded-xl py-3.5 items-center"
                >
                  <Text className="text-[#9CA3AF] font-semibold text-sm">← Retour</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleRegister}
                  disabled={loading}
                  className="flex-1 bg-[#F97316] rounded-xl py-3.5 items-center"
                  style={{ opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white font-semibold text-sm">Créer le compte</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        <View className="flex-row justify-center mt-6">
          <Text className="text-[#9CA3AF] text-sm">Déjà un compte ? </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-[#F97316] text-sm font-semibold">Se connecter</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'words';
}) {
  return (
    <View className="mb-4">
      <Text className="text-[#9CA3AF] text-sm mb-1.5">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#4B5563"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize={autoCapitalize ?? 'words'}
        className="bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-3 text-white text-sm"
      />
    </View>
  );
}
