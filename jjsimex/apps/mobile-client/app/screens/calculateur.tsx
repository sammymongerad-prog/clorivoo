import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { calculateShipping, getShippingRates } from '@jjsimex/supabase/shipping';
import type { ShippingRate } from '@jjsimex/supabase/shipping';
import { BackButton } from '@/components/layout/BackButton';
import { Slider } from '@/components/ui/Slider';

const LOYALTY_DISCOUNT: Record<string, number> = { bronze: 0, silver: 0.05, gold: 0.10, platinum: 0.15 };

export default function CalculateurScreen() {
  const router = useRouter();
  const { session, profile } = useAuth();

  const [transport, setTransport] = useState<'air' | 'sea'>('air');
  const [weight, setWeight] = useState(5);
  const [declaredValue, setDeclaredValue] = useState(50);
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [selectedCountry, setSelectedCountry] = useState('HT');
  const [selectedCity, setSelectedCity] = useState('');
  const [result, setResult] = useState<{ base: number; insurance: number; total: number; estimatedDelivery: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const priceAnim = useRef(new Animated.Value(0)).current;
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const countries = [...new Set(rates.map(r => r.destination_country))];
  const cities = rates.filter(r => r.destination_country === selectedCountry).map(r => r.destination_city);

  useEffect(() => {
    getShippingRates().then(r => {
      setRates(r);
      if (r.length > 0) {
        setSelectedCountry(r[0].destination_country);
        setSelectedCity(r[0].destination_city);
      }
    }).catch(() => {});
  }, []);

  const calculate = useCallback(async () => {
    if (!selectedCity) return;
    setLoading(true);
    try {
      const res = await calculateShipping({
        weight_lbs: weight,
        destination_country: selectedCountry,
        destination_city: selectedCity,
        transport_mode: transport,
        declared_value: declaredValue,
      });
      const discount = profile ? (LOYALTY_DISCOUNT[profile.loyalty_level ?? 'bronze'] ?? 0) : 0;
      const discountedBase = res.shipping_cost * (1 - discount);
      const insurance = res.insurance_cost ?? 0;
      setResult({ base: discountedBase, insurance, total: discountedBase + insurance, estimatedDelivery: res.estimated_delivery ?? '' });
      Animated.sequence([
        Animated.timing(priceAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.spring(priceAnim, { toValue: 1, useNativeDriver: true, damping: 15, stiffness: 200 }),
      ]).start();
    } catch {}
    setLoading(false);
  }, [weight, selectedCountry, selectedCity, transport, declaredValue, profile]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(calculate, 300);
    return () => clearTimeout(debounceRef.current);
  }, [calculate]);

  const loyaltyLevel = profile?.loyalty_level ?? 'bronze';
  const discount = LOYALTY_DISCOUNT[loyaltyLevel] ?? 0;

  const estimatedDays = transport === 'air' ? '5-7 jours' : '3-4 semaines';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton />
        <View style={{ marginLeft: 12 }}>
          <Text style={styles.title}>Calculateur</Text>
          <Text style={styles.subtitle}>Estimez vos frais d'expédition</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Transport toggle */}
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Mode de transport</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            {([['air', '✈️ Avion', '5-7 jours'], ['sea', '🚢 Bateau', '3-4 semaines']] as const).map(([mode, label, sub]) => (
              <TouchableOpacity
                key={mode}
                onPress={() => setTransport(mode)}
                style={[styles.modeBtn, transport === mode && styles.modeBtnActive]}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: transport === mode ? '#0D0D0D' : '#FFFFFF' }}>{label}</Text>
                <Text style={{ fontSize: 11, color: transport === mode ? 'rgba(0,0,0,0.6)' : '#9CA3AF', marginTop: 2 }}>{sub}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Destination */}
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Destination</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: 10, paddingVertical: 2 }}>
            {countries.map(c => (
              <TouchableOpacity
                key={c}
                onPress={() => {
                  setSelectedCountry(c);
                  const first = rates.find(r => r.destination_country === c);
                  if (first) setSelectedCity(first.destination_city);
                }}
                style={[styles.countryChip, selectedCountry === c && styles.chipActive]}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: selectedCountry === c ? '#0D0D0D' : '#9CA3AF' }}>
                  {c === 'HT' ? '🇭🇹 Haïti' : c === 'DO' ? '🇩🇴 Rép. Dom.' : c}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {cities.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: 10, paddingVertical: 2 }}>
              {cities.map(city => (
                <TouchableOpacity
                  key={city}
                  onPress={() => setSelectedCity(city)}
                  style={[styles.cityChip, selectedCity === city && styles.chipActive]}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: selectedCity === city ? '#0D0D0D' : '#9CA3AF' }}>{city}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Sliders */}
        <View style={styles.card}>
          <Slider
            min={0.5}
            max={50}
            value={weight}
            onChange={setWeight}
            step={0.5}
            label="Poids estimé"
            formatValue={v => `${v} lbs`}
          />
          <View style={{ height: 24 }} />
          <Slider
            min={0}
            max={500}
            value={declaredValue}
            onChange={setDeclaredValue}
            step={10}
            label="Valeur déclarée (pour assurance)"
            formatValue={v => `$${v}`}
          />
        </View>

        {/* Result */}
        {result && (
          <Animated.View style={[styles.resultCard, { transform: [{ scale: priceAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }], opacity: priceAnim }]}>
            <Text style={styles.resultLabel}>Estimation totale</Text>
            <Text style={styles.resultPrice}>${result.total.toFixed(2)}</Text>

            <View style={styles.resultRows}>
              <View style={styles.resultRow}>
                <Text style={styles.resultRowLabel}>Frais d'expédition</Text>
                <Text style={styles.resultRowValue}>${result.base.toFixed(2)}</Text>
              </View>
              {result.insurance > 0 && (
                <View style={styles.resultRow}>
                  <Text style={styles.resultRowLabel}>Assurance</Text>
                  <Text style={styles.resultRowValue}>${result.insurance.toFixed(2)}</Text>
                </View>
              )}
              {discount > 0 && (
                <View style={styles.resultRow}>
                  <Text style={[styles.resultRowLabel, { color: '#22C55E' }]}>Réduction fidélité ({(discount * 100).toFixed(0)}%)</Text>
                  <Text style={[styles.resultRowValue, { color: '#22C55E' }]}>−${(result.base / (1 - discount) * discount).toFixed(2)}</Text>
                </View>
              )}
            </View>

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
              <View style={styles.pill}><Text style={styles.pillText}>{weight} lbs</Text></View>
              <View style={styles.pill}><Text style={styles.pillText}>{transport === 'air' ? '✈️' : '🚢'} {transport === 'air' ? 'Avion' : 'Bateau'}</Text></View>
              <View style={styles.pill}><Text style={styles.pillText}>{selectedCity || selectedCountry}</Text></View>
              <View style={styles.pill}><Text style={styles.pillText}>📅 {estimatedDays}</Text></View>
            </View>

            {!session && (
              <View style={{ backgroundColor: 'rgba(249,115,22,0.1)', borderRadius: 10, padding: 12, marginTop: 14, borderWidth: 1, borderColor: 'rgba(249,115,22,0.2)' }}>
                <Text style={{ fontSize: 13, color: '#F97316', textAlign: 'center' }}>
                  Connectez-vous pour bénéficier de vos réductions fidélité 🎁
                </Text>
              </View>
            )}
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 },
  title: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  subtitle: { fontSize: 13, color: '#9CA3AF' },
  content: { padding: 20, gap: 14, paddingBottom: 50 },
  card: { backgroundColor: '#1A1A1A', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#242424' },
  fieldLabel: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  modeBtn: { flex: 1, backgroundColor: '#0D0D0D', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#2A2A2A' },
  modeBtnActive: { backgroundColor: '#F97316', borderColor: '#F97316' },
  countryChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#0D0D0D', borderWidth: 1, borderColor: '#2A2A2A' },
  cityChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#0D0D0D', borderWidth: 1, borderColor: '#2A2A2A' },
  chipActive: { backgroundColor: '#F97316', borderColor: '#F97316' },
  resultCard: { backgroundColor: '#1A1A1A', borderRadius: 20, padding: 22, borderWidth: 1, borderColor: 'rgba(249,115,22,0.3)', alignItems: 'center' },
  resultLabel: { fontSize: 13, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 },
  resultPrice: { fontSize: 48, fontWeight: '800', color: '#F97316', letterSpacing: -1, marginVertical: 8 },
  resultRows: { width: '100%', gap: 8, marginTop: 4 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between' },
  resultRowLabel: { fontSize: 13, color: '#9CA3AF' },
  resultRowValue: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },
  pill: { backgroundColor: '#0D0D0D', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#2A2A2A' },
  pillText: { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },
});
