import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { COLORS, RADIUS } from '../../lib/tokens';
import { supabase } from '../../lib/supabase';

const RESEND_DELAY = 60;

export default function OtpScreen({ navigation, route }) {
  const { email } = route.params ?? {};
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_DELAY);
  const refs = useRef([]);
  const intervalRef = useRef(null);

  useEffect(() => {
    startCountdown();
    return () => clearInterval(intervalRef.current);
  }, []);

  function startCountdown() {
    setCountdown(RESEND_DELAY);
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(intervalRef.current); return 0; }
        return c - 1;
      });
    }, 1000);
  }

  function handleDigitChange(value, index) {
    setError('');
    // Handle paste: if value length > 1, fill all digits
    if (value.length > 1) {
      const clean = value.replace(/\D/g, '').slice(0, 6);
      const newDigits = [...digits];
      for (let i = 0; i < 6; i++) newDigits[i] = clean[i] ?? '';
      setDigits(newDigits);
      const nextFocus = Math.min(clean.length, 5);
      refs.current[nextFocus]?.focus();
      if (clean.length === 6) submitOtp(clean);
      return;
    }

    const clean = value.replace(/\D/g, '');
    const newDigits = [...digits];
    newDigits[index] = clean;
    setDigits(newDigits);

    if (clean && index < 5) refs.current[index + 1]?.focus();
    if (newDigits.every(d => d !== '')) submitOtp(newDigits.join(''));
  }

  function handleKeyPress(e, index) {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  }

  async function submitOtp(code) {
    if (loading) return;
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'signup',
    });
    setLoading(false);
    if (err) {
      setError(
        err.message.includes('expired') ? 'Code expiré. Renvoyez un nouveau code.'
          : err.message.includes('invalid') || err.message.includes('Invalid') ? 'Code incorrect. Vérifiez et réessayez.'
          : err.message
      );
      setDigits(['', '', '', '', '', '']);
      setTimeout(() => refs.current[0]?.focus(), 100);
    } else {
      setSuccess(true);
      setTimeout(() => navigation.replace('Tabs'), 1200);
    }
  }

  async function handleResend() {
    setResending(true);
    setError('');
    const { error: err } = await supabase.auth.resend({ type: 'signup', email });
    setResending(false);
    if (err) {
      setError('Impossible de renvoyer le code. Réessayez plus tard.');
    } else {
      startCountdown();
      setDigits(['', '', '', '', '', '']);
      setTimeout(() => refs.current[0]?.focus(), 100);
    }
  }

  function handleVerifyPress() {
    const code = digits.join('');
    if (code.length < 6) { setError('Entrez les 6 chiffres du code.'); return; }
    submitOtp(code);
  }

  const code = digits.join('');
  const isComplete = code.length === 6;

  if (success) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <Text style={{ fontSize: 40 }}>✓</Text>
        </View>
        <Text style={{ fontSize: 24, fontWeight: '800', color: COLORS.ink, marginBottom: 8 }}>Email vérifié !</Text>
        <Text style={{ fontSize: 15, color: COLORS.mute }}>Redirection en cours…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: COLORS.white }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, paddingTop: 60 }} keyboardShouldPersistTaps="handled">

        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 22, color: COLORS.mute }}>←</Text>
        </TouchableOpacity>

        {/* Icon */}
        <View style={{ alignItems: 'center', marginBottom: 28 }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <Text style={{ fontSize: 36 }}>✉️</Text>
          </View>
          <Text style={{ fontSize: 26, fontWeight: '800', color: COLORS.ink, letterSpacing: -0.5, marginBottom: 8 }}>
            Vérifiez votre email
          </Text>
          <Text style={{ fontSize: 15, color: COLORS.mute, textAlign: 'center', lineHeight: 22 }}>
            Nous avons envoyé un code à{'\n'}
            <Text style={{ fontWeight: '700', color: COLORS.ink }}>{email}</Text>
          </Text>
        </View>

        {/* Error */}
        {error ? (
          <View style={{ backgroundColor: '#FEF2F2', borderRadius: RADIUS.md, padding: 14, marginBottom: 20, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <Text style={{ fontSize: 16 }}>⚠️</Text>
            <Text style={{ flex: 1, color: '#B91C1C', fontSize: 14, fontWeight: '500' }}>{error}</Text>
          </View>
        ) : null}

        {/* OTP inputs */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 32 }}>
          {digits.map((digit, i) => (
            <TextInput
              key={i}
              ref={r => refs.current[i] = r}
              style={{
                width: 48, height: 58, borderRadius: RADIUS.md,
                borderWidth: digit ? 2 : 1.5,
                borderColor: error ? COLORS.danger : digit ? COLORS.primary : COLORS.hairline,
                textAlign: 'center', fontSize: 24, fontWeight: '800',
                color: COLORS.ink, backgroundColor: digit ? COLORS.primarySoft : COLORS.white,
              }}
              value={digit}
              onChangeText={v => handleDigitChange(v, i)}
              onKeyPress={e => handleKeyPress(e, i)}
              keyboardType="number-pad"
              maxLength={6}
              selectTextOnFocus
              autoFocus={i === 0}
            />
          ))}
        </View>

        {/* Verify button */}
        <TouchableOpacity
          onPress={handleVerifyPress}
          disabled={loading || !isComplete}
          style={{
            backgroundColor: isComplete ? COLORS.primary : COLORS.hairline,
            borderRadius: RADIUS.md, paddingVertical: 16,
            alignItems: 'center', marginBottom: 24,
          }}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={{ color: isComplete ? '#fff' : COLORS.mute, fontWeight: '700', fontSize: 16 }}>
                Vérifier le code
              </Text>}
        </TouchableOpacity>

        {/* Resend */}
        <View style={{ alignItems: 'center' }}>
          {countdown > 0 ? (
            <Text style={{ fontSize: 14, color: COLORS.mute }}>
              Renvoyer le code dans{' '}
              <Text style={{ fontWeight: '700', color: COLORS.ink }}>{countdown}s</Text>
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResend} disabled={resending}>
              {resending
                ? <ActivityIndicator color={COLORS.primary} size="small" />
                : <Text style={{ fontSize: 14, color: COLORS.primary, fontWeight: '700' }}>
                    Renvoyer le code
                  </Text>}
            </TouchableOpacity>
          )}
        </View>

        {/* Help */}
        <Text style={{ fontSize: 12, color: COLORS.mute, textAlign: 'center', marginTop: 32, lineHeight: 18 }}>
          Vérifiez vos spams si vous ne trouvez pas l'email.{'\n'}
          Le code est valable 10 minutes.
        </Text>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}
