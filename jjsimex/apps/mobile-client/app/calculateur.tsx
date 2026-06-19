import { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, PanResponder, LayoutChangeEvent, ActivityIndicator, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plane, Ship, Calendar, Shield, Check, AlertTriangle, ArrowRight } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { calculateShipping, getDestinationCities } from '@jjsimex/supabase/shipping';
import type { TransportMode, DestinationCountry, ShippingResult } from '@jjsimex/supabase/shipping';

// ─── Custom Slider ─────────────────────────────────────────────────────────────

function CustomSlider({ min, max, step, value, onChange }: {
  min: number; max: number; step: number; value: number; onChange: (v: number) => void;
}) {
  const trackWidth = useRef(0);
  const percent = (value - min) / (max - min);

  const pan = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (_, gs) => {
      if (!trackWidth.current) return;
      const pct = Math.max(0, Math.min(1, gs.x0 / trackWidth.current));
      onChange(Math.round((min + pct * (max - min)) / step) * step);
    },
    onPanResponderMove: (_, gs) => {
      if (!trackWidth.current) return;
      const pct = Math.max(0, Math.min(1, gs.moveX / trackWidth.current));
      onChange(Math.round((min + pct * (max - min)) / step) * step);
    },
  });

  return (
    <View style={{ height: 40, justifyContent: 'center' }}
      onLayout={(e: LayoutChangeEvent) => { trackWidth.current = e.nativeEvent.layout.width; }}
      {...pan.panHandlers}>
      <View style={{ height: 4, borderRadius: 2, backgroundColor: '#2A2A2A' }}>
        <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${percent * 100}%`, backgroundColor: '#F97316', borderRadius: 2 }} />
        <View style={{
          position: 'absolute', top: -8, left: `${percent * 100}%`, marginLeft: -10,
          width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFFFFF',
          shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4,
        }} />
      </View>
    </View>
  );
}

// ─── Badges fidélité ───────────────────────────────────────────────────────────

const LEVEL_STYLE = {
  bronze: { bg: 'rgba(180,100,40,0.2)', color: '#CD7F32', label: '🥉 Bronze' },
  silver: { bg: 'rgba(150,150,150,0.2)', color: '#C0C0C0', label: '🥈 Silver — 5% de réduction' },
  gold:   { bg: 'rgba(249,180,0,0.2)',   color: '#FFD700', label: '🥇 Gold — 10% de réduction' },
};

// ─── Écran principal ───────────────────────────────────────────────────────────

export default function CalculateurScreen() {
  const router = useRouter();
  const { profile } = useAuth();

  const [mode, setMode] = useState<TransportMode>('air');
  const [dest, setDest] = useState<DestinationCountry>('haiti');
  const [city, setCity] = useState('Port-au-Prince');
  const [weight, setWeight] = useState(5);
  const [value, setValue] = useState(50);
  const [cities, setCities] = useState<{ haiti: string[]; dr: string[] }>({
    haiti: ['Port-au-Prince', 'Cap-Haïtien', 'Pétion-Ville', 'Les Cayes', 'Gonaïves', 'Jacmel'],
    dr: ['Santo Domingo', 'Santiago', 'Punta Cana'],
  });

  const [result, setResult] = useState<ShippingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Charger les villes depuis Supabase au montage
  useEffect(() => {
    getDestinationCities().then(c => {
      setCities(c);
      if (!c.haiti.includes(city)) setCity(c.haiti[0] ?? 'Port-au-Prince');
    }).catch(() => {});
  }, []);

  // Recalcul avec debounce 300ms
  const recalculate = useCallback((
    w: number, m: TransportMode, d: DestinationCountry, c: string,
  ) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await calculateShipping({
          destination_city: c,
          destination_country: d,
          transport_mode: m,
          real_weight_lbs: w,
          user_id: profile?.id,
        });
        setResult(res);
      } catch {
        // Calcul local en fallback
        const rates: Record<DestinationCountry, { air: number; sea: number }> = {
          haiti: { air: 9.5, sea: 4.5 },
          dr: { air: 11, sea: 5.5 },
        };
        const rate = m === 'air' ? rates[d].air : rates[d].sea;
        const base = Math.max(5, Math.round(w * rate * 100) / 100);
        setResult({
          volumetric_weight: 0, billed_weight: w, base_price: base,
          loyalty_discount_percent: 0, loyalty_discount_amount: 0, final_price: base,
          transport_mode: m, estimated_days_min: m === 'air' ? 5 : 21, estimated_days_max: m === 'air' ? 7 : 28,
          estimated_delivery_date: '', rate_per_lb_used: rate, loyalty_level: null,
        });
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [profile?.id]);

  // Déclenche au changement de n'importe quel paramètre
  useEffect(() => { recalculate(weight, mode, dest, city); }, [weight, mode, dest, city, recalculate]);

  function handleModeChange(m: TransportMode) {
    setMode(m);
  }

  function handleDestChange(d: DestinationCountry) {
    setDest(d);
    const available = cities[d];
    setCity(available[0] ?? '');
  }

  const currentCities = cities[dest] ?? [];
  const hasInsurance = value <= 100;
  const ls = result?.loyalty_level ? LEVEL_STYLE[result.loyalty_level] : null;
  const price = result?.final_price ?? 0;
  const deliveryText = mode === 'air'
    ? `${result?.estimated_days_min ?? 5}-${result?.estimated_days_max ?? 7} jours ouvrés`
    : `${Math.round((result?.estimated_days_min ?? 21) / 7)}-${Math.round((result?.estimated_days_max ?? 28) / 7)} semaines`;

  return (
    <SafeAreaView style={S.container}>
      <View style={S.header}>
        <TouchableOpacity style={S.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <ArrowLeft size={22} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={S.headerTitle}>Calculateur de tarif</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 22, paddingBottom: 40 }}>

        {/* Mode transport */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {([['air', 'Avion', '5-7 jours'], ['sea', 'Bateau', '3-4 semaines']] as [TransportMode, string, string][]).map(([m, label, sub]) => (
            <TouchableOpacity key={m} onPress={() => handleModeChange(m)} activeOpacity={0.8}
              style={[S.modeBtn, mode === m && S.modeBtnActive]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {m === 'air'
                  ? <Plane size={16} color={mode === m ? '#F97316' : '#FFFFFF'} strokeWidth={2} />
                  : <Ship size={16} color={mode === m ? '#F97316' : '#FFFFFF'} strokeWidth={2} />}
                <Text style={{ fontWeight: '700', fontSize: 15, color: mode === m ? '#F97316' : '#FFFFFF' }}>{label}</Text>
              </View>
              <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Destination pays */}
        <Text style={S.label}>Destination</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
          {(['haiti', 'dr'] as DestinationCountry[]).map(d => (
            <TouchableOpacity key={d} onPress={() => handleDestChange(d)} activeOpacity={0.8}
              style={[S.destBtn, dest === d && S.destBtnActive]}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: dest === d ? '#F97316' : '#9CA3AF' }}>
                {d === 'haiti' ? '🇭🇹 Haïti' : '🇩🇴 Rép. Dominicaine'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sélecteur ville */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 22 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {currentCities.map(c => (
              <TouchableOpacity key={c} onPress={() => setCity(c)} activeOpacity={0.8}
                style={{ height: 36, borderRadius: 99, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: city === c ? '#F97316' : '#1A1A1A',
                  borderWidth: 1, borderColor: city === c ? '#F97316' : '#2A2A2A' }}>
                <Text style={{ color: city === c ? '#0D0D0D' : '#9CA3AF', fontSize: 13, fontWeight: '600' }}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Slider poids */}
        <View style={{ marginBottom: 26 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
            <Text style={S.label}>Poids du colis</Text>
            <Text style={{ fontSize: 24, fontWeight: '800', color: '#F97316', letterSpacing: -0.5 }}>{weight.toFixed(1)} lbs</Text>
          </View>
          <CustomSlider min={0.5} max={150} step={0.5} value={weight} onChange={setWeight} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            {['0.5', '25', '50', '75', '100+'].map(v => (
              <Text key={v} style={{ fontSize: 11, color: '#6B7280' }}>{v}</Text>
            ))}
          </View>
        </View>

        {/* Slider valeur déclarée */}
        <View style={{ marginBottom: 26 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
            <Text style={S.label}>Valeur du colis</Text>
            <Text style={{ fontSize: 24, fontWeight: '800', color: '#F97316', letterSpacing: -0.5 }}>${value}</Text>
          </View>
          <CustomSlider min={0} max={500} step={5} value={value} onChange={setValue} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            {['$0', '$100', '$200', '$500'].map(v => (
              <Text key={v} style={{ fontSize: 11, color: '#6B7280' }}>{v}</Text>
            ))}
          </View>
          <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 8 }}>
            Assurance incluse jusqu'à $100 automatiquement
          </Text>
        </View>

        {/* Carte résultat */}
        <View style={S.resultCard}>
          <Text style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center' }}>Votre estimation</Text>

          {loading ? (
            <View style={{ alignItems: 'center', paddingVertical: 16 }}>
              <ActivityIndicator color="#F97316" size="large" />
            </View>
          ) : (
            <>
              {/* Prix avant réduction */}
              {result && result.loyalty_discount_percent > 0 && (
                <Text style={{ fontSize: 18, color: '#6B7280', textAlign: 'center', marginTop: 8, textDecorationLine: 'line-through' }}>
                  ${result.base_price.toFixed(2)}
                </Text>
              )}
              <Text style={{ fontSize: 52, fontWeight: '800', color: '#FFFFFF', textAlign: 'center', letterSpacing: -1.5, lineHeight: 60, marginTop: 4 }}>
                ${price.toFixed(2)}
              </Text>

              {/* Badge fidélité */}
              {ls && (
                <View style={{ alignSelf: 'center', backgroundColor: ls.bg, borderRadius: 99, paddingHorizontal: 14, paddingVertical: 6, marginTop: 8 }}>
                  <Text style={{ color: ls.color, fontSize: 12, fontWeight: '700' }}>{ls.label}</Text>
                </View>
              )}

              {/* Si non connecté */}
              {!profile && (
                <TouchableOpacity onPress={() => router.push('/(auth)/login')} activeOpacity={0.8}
                  style={{ marginTop: 10, backgroundColor: '#1F1F1F', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, alignSelf: 'center' }}>
                  <Text style={{ color: '#9CA3AF', fontSize: 11, textAlign: 'center' }}>
                    Connectez-vous pour voir{'\n'}vos réductions fidélité
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 16 }}>
            <View style={{ backgroundColor: '#2A2A2A', borderRadius: 99, paddingHorizontal: 13, paddingVertical: 7 }}>
              <Text style={{ color: '#C9CDD3', fontSize: 12, fontWeight: '600' }}>{weight.toFixed(1)} lbs facturés</Text>
            </View>
            <View style={{ backgroundColor: '#C2600A', borderRadius: 99, paddingHorizontal: 13, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              {mode === 'air'
                ? <Plane size={14} color="#FFFFFF" strokeWidth={2} />
                : <Ship size={14} color="#FFFFFF" strokeWidth={2} />}
              <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>{mode === 'air' ? 'Avion' : 'Bateau'}</Text>
            </View>
            <View style={{ backgroundColor: '#2A2A2A', borderRadius: 99, paddingHorizontal: 13, paddingVertical: 7 }}>
              <Text style={{ color: '#C9CDD3', fontSize: 12, fontWeight: '600' }}>{city}</Text>
            </View>
          </View>

          <View style={{ height: 1, backgroundColor: '#2A2A2A', marginVertical: 20 }} />

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
            <Calendar size={16} color="#F97316" strokeWidth={2} />
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Livraison ~ {deliveryText}</Text>
          </View>

          {result?.estimated_delivery_date ? (
            <Text style={{ fontSize: 12, color: '#6B7280', textAlign: 'center', marginTop: 6 }}>
              Estimé le {result.estimated_delivery_date}
            </Text>
          ) : null}

          {/* Mini timeline */}
          <View style={{ marginTop: 18 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {['Départ', 'Transit', 'Arrivée', 'Livraison'].map((step, i) => (
                <View key={step} style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: i === 0 ? '#F97316' : '#2E2E2E' }} />
                  {i < 3 && <View style={{ flex: 1, height: 2, backgroundColor: '#2E2E2E' }} />}
                </View>
              ))}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              {['Départ', 'Transit', 'Arrivée', 'Livraison'].map((step, i) => (
                <Text key={step} style={{ fontSize: 10, color: i === 0 ? '#F97316' : '#6B7280', fontWeight: i === 0 ? '600' : '400', width: 50, textAlign: i === 0 ? 'left' : i === 3 ? 'right' : 'center' }}>{step}</Text>
              ))}
            </View>
          </View>
        </View>

        {/* Assurance dynamique */}
        {hasInsurance ? (
          <View style={{ backgroundColor: 'rgba(34,197,94,0.12)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 }}>
            <Shield size={22} color="#22C55E" strokeWidth={2} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Check size={16} color="#22C55E" strokeWidth={2} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#22C55E' }}>Votre colis est couvert à 100%</Text>
              </View>
              <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Assurance gratuite jusqu'à $100</Text>
            </View>
            <View style={{ backgroundColor: 'rgba(34,197,94,0.2)', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 4 }}>
              <Text style={{ color: '#22C55E', fontSize: 11, fontWeight: '700' }}>Inclus</Text>
            </View>
          </View>
        ) : (
          <View style={{ backgroundColor: 'rgba(249,115,22,0.10)', borderWidth: 1, borderColor: 'rgba(249,115,22,0.25)', borderRadius: 12, padding: 14, marginTop: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <AlertTriangle size={16} color="#F97316" strokeWidth={2} />
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#F97316' }}>Valeur dépasse $100</Text>
            </View>
            <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Assurance supplémentaire recommandée pour ${value - 100} de couverture additionnelle.</Text>
            <TouchableOpacity activeOpacity={0.8} style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 12, color: '#F97316', fontWeight: '600', textDecorationLine: 'underline' }}>Ajouter une couverture</Text>
              <ArrowRight size={14} color="#F97316" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        )}

        {/* Détail tarif */}
        <View style={{ backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 12, padding: 16, marginTop: 14 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF', marginBottom: 10 }}>Détail du tarif</Text>
          {[
            [`Frais d'expédition (${weight.toFixed(1)} lbs × $${result?.rate_per_lb_used?.toFixed(2) ?? '—'}/lb)`, `$${result?.base_price?.toFixed(2) ?? '—'}`],
            ['Assurance (jusqu\'à $100)', 'Gratuit'],
            ...(result && result.loyalty_discount_percent > 0
              ? [[`Réduction ${result.loyalty_level} (−${result.loyalty_discount_percent}%)`, `−$${result.loyalty_discount_amount.toFixed(2)}`]]
              : []),
            ['Manutention', 'Inclus'],
          ].map(([k, v]) => (
            <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
              <Text style={{ fontSize: 12, color: '#9CA3AF', flex: 1 }}>{k}</Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: v.startsWith('−') ? '#F97316' : v === 'Gratuit' || v === 'Inclus' ? '#22C55E' : '#FFFFFF' }}>{v}</Text>
            </View>
          ))}
          {result && result.loyalty_discount_percent > 0 && (
            <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#2A2A2A', flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>Total</Text>
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#F97316' }}>${result.final_price.toFixed(2)}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity onPress={() => router.push('/shopper')} activeOpacity={0.9}
          style={{ marginTop: 22, height: 54, backgroundColor: '#F97316', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#0D0D0D', fontWeight: '700', fontSize: 16 }}>Commander maintenant</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  header: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: '#1A1A1A', backgroundColor: '#0D0D0D' },
  backBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2A2A2A', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  label: { fontSize: 13, fontWeight: '500', color: '#9CA3AF', marginBottom: 8 },
  modeBtn: { flex: 1, borderWidth: 1.5, borderRadius: 12, padding: 14, backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', marginBottom: 22 },
  modeBtnActive: { backgroundColor: 'rgba(249,115,22,0.12)', borderColor: '#F97316' },
  destBtn: { flex: 1, height: 46, borderRadius: 10, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2A2A2A', alignItems: 'center', justifyContent: 'center' },
  destBtnActive: { backgroundColor: 'rgba(249,115,22,0.12)', borderColor: '#F97316' },
  resultCard: { backgroundColor: '#1A1A1A', borderWidth: 1.5, borderColor: '#F97316', borderRadius: 20, padding: 24, shadowColor: '#F97316', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 30, elevation: 8 },
});
