import { useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, PanResponder, LayoutChangeEvent } from 'react-native';
import { useRouter } from 'expo-router';

type Mode = 'avion' | 'bateau';
type Dest = 'haiti' | 'rd';

const RATE_AVION_HT = 9.5;
const RATE_BATEAU_HT = 4.5;
const RATE_AVION_RD = 11;
const RATE_BATEAU_RD = 5.5;

function calcPrice(weight: number, mode: Mode, dest: Dest): number {
  const rate = mode === 'avion'
    ? (dest === 'haiti' ? RATE_AVION_HT : RATE_AVION_RD)
    : (dest === 'haiti' ? RATE_BATEAU_HT : RATE_BATEAU_RD);
  return Math.max(5, Math.round(weight * rate * 100) / 100);
}

function CustomSlider({ min, max, step, value, onChange }: {
  min: number; max: number; step: number; value: number; onChange: (v: number) => void;
}) {
  const trackWidth = useRef(0);
  const percent = (value - min) / (max - min);

  const pan = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gs) => {
      if (!trackWidth.current) return;
      const raw = gs.moveX / trackWidth.current;
      const clamped = Math.max(0, Math.min(1, raw));
      const raw2 = min + clamped * (max - min);
      const stepped = Math.round(raw2 / step) * step;
      onChange(Math.max(min, Math.min(max, stepped)));
    },
    onPanResponderGrant: (_, gs) => {
      if (!trackWidth.current) return;
      const raw = gs.x0 / trackWidth.current;
      const clamped = Math.max(0, Math.min(1, raw));
      const raw2 = min + clamped * (max - min);
      const stepped = Math.round(raw2 / step) * step;
      onChange(Math.max(min, Math.min(max, stepped)));
    },
  });

  return (
    <View
      style={{ height: 40, justifyContent: 'center' }}
      onLayout={(e: LayoutChangeEvent) => { trackWidth.current = e.nativeEvent.layout.width; }}
      {...pan.panHandlers}
    >
      <View style={{ height: 4, borderRadius: 2, backgroundColor: '#2A2A2A', position: 'relative' }}>
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

export default function CalculateurScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('avion');
  const [dest, setDest] = useState<Dest>('haiti');
  const [weight, setWeight] = useState(5);
  const [value, setValue] = useState(50);

  const price = calcPrice(weight, mode, dest);
  const deliveryText = mode === 'avion' ? '5-7 jours ouvrés' : '3-4 semaines';
  const hasInsurance = value <= 100;

  return (
    <View style={S.container}>
      <View style={S.header}>
        <TouchableOpacity style={S.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Text style={{ color: '#FFFFFF', fontSize: 20 }}>←</Text>
        </TouchableOpacity>
        <Text style={S.headerTitle}>Calculateur de tarif</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 22, paddingBottom: 40 }}>
        {/* Mode transport */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {([['avion', '✈️ Avion', '5-7 jours'], ['bateau', '🚢 Bateau', '3-4 semaines']] as [Mode, string, string][]).map(([m, label, sub]) => (
            <TouchableOpacity key={m} onPress={() => setMode(m)} activeOpacity={0.8}
              style={[S.modeBtn, mode === m && S.modeBtnActive]}>
              <Text style={{ fontWeight: '700', fontSize: 15, color: mode === m ? '#F97316' : '#FFFFFF' }}>{label}</Text>
              <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Destination */}
        <Text style={S.label}>Destination</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 18 }}>
          {(['haiti', 'rd'] as Dest[]).map(d => (
            <TouchableOpacity key={d} onPress={() => setDest(d)} activeOpacity={0.8}
              style={[S.destBtn, dest === d && S.destBtnActive]}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: dest === d ? '#F97316' : '#9CA3AF' }}>
                {d === 'haiti' ? '🇭🇹 Haïti' : '🇩🇴 Rép. Dominicaine'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Slider poids */}
        <View style={{ marginTop: 6, marginBottom: 26 }}>
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

        {/* Slider valeur */}
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
          <Text style={{ fontSize: 52, fontWeight: '800', color: '#FFFFFF', textAlign: 'center', letterSpacing: -1.5, lineHeight: 60, marginTop: 4 }}>
            ${price.toFixed(2)}
          </Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 16 }}>
            <View style={{ backgroundColor: '#2A2A2A', borderRadius: 99, paddingHorizontal: 13, paddingVertical: 7 }}>
              <Text style={{ color: '#C9CDD3', fontSize: 12, fontWeight: '600' }}>{weight.toFixed(1)} lbs facturés</Text>
            </View>
            <View style={{ backgroundColor: '#C2600A', borderRadius: 99, paddingHorizontal: 13, paddingVertical: 7 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600' }}>{mode === 'avion' ? '✈️ Avion' : '🚢 Bateau'}</Text>
            </View>
            <View style={{ backgroundColor: '#2A2A2A', borderRadius: 99, paddingHorizontal: 13, paddingVertical: 7 }}>
              <Text style={{ color: '#C9CDD3', fontSize: 12, fontWeight: '600' }}>{dest === 'haiti' ? '🇭🇹 Haïti' : '🇩🇴 Rép. Dom.'}</Text>
            </View>
          </View>

          <View style={{ height: 1, backgroundColor: '#2A2A2A', marginVertical: 20 }} />

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
            <Text style={{ color: '#F97316', fontSize: 16 }}>📅</Text>
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Livraison ~ {deliveryText}</Text>
          </View>

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

        {/* Assurance */}
        {hasInsurance ? (
          <View style={{ backgroundColor: 'rgba(34,197,94,0.12)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 }}>
            <Text style={{ fontSize: 22 }}>🛡️</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#22C55E' }}>Assurance gratuite incluse</Text>
              <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Jusqu'à $100 de couverture</Text>
            </View>
            <View style={{ backgroundColor: 'rgba(34,197,94,0.2)', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 4 }}>
              <Text style={{ color: '#22C55E', fontSize: 11, fontWeight: '700' }}>Inclus</Text>
            </View>
          </View>
        ) : (
          <View style={{ backgroundColor: 'rgba(249,115,22,0.10)', borderWidth: 1, borderColor: 'rgba(249,115,22,0.25)', borderRadius: 12, padding: 14, marginTop: 14 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#F97316' }}>Assurance recommandée</Text>
            <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Votre colis vaut +${value - 100} de plus que la couverture gratuite.</Text>
          </View>
        )}

        {/* Tarif */}
        <View style={{ backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 12, padding: 16, marginTop: 14 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF', marginBottom: 10 }}>Détail du tarif</Text>
          {[
            [`Frais d'expédition (${weight.toFixed(1)} lbs × $${mode === 'avion' ? (dest === 'haiti' ? RATE_AVION_HT : RATE_AVION_RD) : (dest === 'haiti' ? RATE_BATEAU_HT : RATE_BATEAU_RD)}/lb)`, `$${price.toFixed(2)}`],
            ['Assurance (jusqu\'à $100)', 'Gratuit'],
            ['Manutention', 'Inclus'],
          ].map(([k, v]) => (
            <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
              <Text style={{ fontSize: 12, color: '#9CA3AF', flex: 1 }}>{k}</Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: v === 'Gratuit' || v === 'Inclus' ? '#22C55E' : '#FFFFFF' }}>{v}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity onPress={() => router.push('/shopper')} activeOpacity={0.9}
          style={{ marginTop: 22, height: 54, backgroundColor: '#F97316', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#0D0D0D', fontWeight: '700', fontSize: 16 }}>Commander maintenant</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
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
