import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Clipboard, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Home, MapPin, Copy, Check, AlertTriangle } from 'lucide-react-native';

const MIAMI_ROWS = [
  { label: 'Nom complet', value: 'JJ\'s IMEX / Votre Nom' },
  { label: 'Adresse ligne 1', value: '8370 NW 52nd Terrace' },
  { label: 'Adresse ligne 2 (Suite)', value: 'Suite 101 — [Votre ID Client]' },
  { label: 'Ville', value: 'Doral' },
  { label: 'État', value: 'FL' },
  { label: 'Code postal', value: '33166' },
  { label: 'Pays', value: 'United States' },
  { label: 'Téléphone', value: '+1 (305) 600-9364' },
];

const BOSTON_ROWS = [
  { label: 'Adresse ligne 1', value: '1234 Broadway Ave' },
  { label: 'Ville', value: 'Boston' },
  { label: 'État', value: 'MA' },
  { label: 'Code postal', value: '02101' },
];

export default function AdressesUSScreen() {
  const router = useRouter();
  const [copied, setCopied] = useState<Record<string, boolean>>({});
  const [copiedAll, setCopiedAll] = useState(false);

  function copyField(key: string, value: string) {
    Clipboard.setString(value);
    setCopied(p => ({ ...p, [key]: true }));
    setTimeout(() => setCopied(p => ({ ...p, [key]: false })), 2000);
  }

  function copyAllMiami() {
    const full = MIAMI_ROWS.map(r => `${r.label}: ${r.value}`).join('\n');
    Clipboard.setString(full);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  }

  function openWhatsApp() {
    Alert.alert('WhatsApp', 'Ouvrir WhatsApp pour partager votre adresse ?');
  }

  return (
    <SafeAreaView style={S.container} edges={['top']}>
      {/* Header */}
      <View style={S.header}>
        <TouchableOpacity style={S.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <ArrowLeft size={22} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={S.headerTitle}>Mes adresses US</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 22, paddingBottom: 40 }}>
        {/* Bannière */}
        <View style={S.banner}>
          <Text style={S.bannerText}>
            Utilisez ces adresses comme adresse de livraison sur{' '}
            <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Amazon, Shein, Nike</Text>
            {' '}ou tout site américain. Vos colis arrivent chez nous, on s'occupe du reste.
          </Text>
        </View>

        {/* Carte Miami — principale */}
        <View style={S.cardMain}>
          <View style={[S.badgePrincipal, { flexDirection: 'row', alignItems: 'center', gap: 5 }]}>
            <Home size={14} color="#0D0D0D" strokeWidth={2} />
            <Text style={{ color: '#0D0D0D', fontSize: 12, fontWeight: '700' }}>Principal</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 }}>
            <MapPin size={18} color="#F97316" strokeWidth={2} />
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF' }}>Miami, Floride</Text>
          </View>

          <View style={S.fieldsContainer}>
            {MIAMI_ROWS.map((row) => (
              <View key={row.label} style={S.fieldRow}>
                <View style={{ flex: 1 }}>
                  <Text style={S.fieldLabel}>{row.label}</Text>
                  <Text style={S.fieldValue}>{row.value}</Text>
                </View>
                <TouchableOpacity onPress={() => copyField(`miami_${row.label}`, row.value)} activeOpacity={0.7}>
                  {copied[`miami_${row.label}`]
                    ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Check size={14} color="#22C55E" strokeWidth={2} />
                        <Text style={{ color: '#22C55E', fontSize: 12, fontWeight: '600' }}>Copié</Text>
                      </View>
                    : <Copy size={18} color="#9CA3AF" strokeWidth={2} />
                  }
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
            <TouchableOpacity onPress={copyAllMiami} activeOpacity={0.8}
              style={{ flex: 1, height: 46, backgroundColor: '#2A2A2A', borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              {copiedAll ? <Check size={16} color="#22C55E" strokeWidth={2} /> : <Copy size={16} color="#FFFFFF" strokeWidth={2} />}
              <Text style={{ color: copiedAll ? '#22C55E' : '#FFFFFF', fontSize: 13, fontWeight: '600' }}>
                {copiedAll ? 'Copié !' : 'Tout copier'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={openWhatsApp} activeOpacity={0.9}
              style={{ flex: 1, height: 46, backgroundColor: '#F97316', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#0D0D0D', fontSize: 13, fontWeight: '700' }}>💚 WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Carte Boston */}
        <View style={S.cardSecondary}>
          <View style={[S.badgeSecondary, { flexDirection: 'row', alignItems: 'center', gap: 5 }]}>
            <MapPin size={14} color="#C9CDD3" strokeWidth={2} />
            <Text style={{ color: '#C9CDD3', fontSize: 12, fontWeight: '600' }}>Boston, MA</Text>
          </View>
          <View style={S.fieldsContainer}>
            {BOSTON_ROWS.map((row) => (
              <View key={row.label} style={S.fieldRow}>
                <View style={{ flex: 1 }}>
                  <Text style={S.fieldLabel}>{row.label}</Text>
                  <Text style={S.fieldValue}>{row.value}</Text>
                </View>
                <TouchableOpacity onPress={() => copyField(`boston_${row.label}`, row.value)} activeOpacity={0.7}>
                  {copied[`boston_${row.label}`]
                    ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Check size={14} color="#22C55E" strokeWidth={2} />
                        <Text style={{ color: '#22C55E', fontSize: 12, fontWeight: '600' }}>Copié</Text>
                      </View>
                    : <Copy size={18} color="#9CA3AF" strokeWidth={2} />
                  }
                </TouchableOpacity>
              </View>
            ))}
          </View>
          <TouchableOpacity onPress={() => Alert.alert('Boston', 'Définir Boston comme adresse principale ?')} activeOpacity={0.8}
            style={{ marginTop: 14, height: 42, backgroundColor: '#2A2A2A', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>Tout copier</Text>
          </TouchableOpacity>
        </View>

        {/* Info importante */}
        <View style={{ backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 12, padding: 16, marginTop: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <AlertTriangle size={16} color="#F97316" strokeWidth={2} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#F97316' }}>Important</Text>
          </View>
          <Text style={{ fontSize: 13, lineHeight: 20, color: '#9CA3AF' }}>
            Ajoutez <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>votre ID client</Text> dans la ligne 2 pour que vos colis vous soient correctement attribués.
          </Text>
          <View style={{ backgroundColor: '#F9731622', borderRadius: 8, padding: 10, marginTop: 12 }}>
            <Text style={{ fontSize: 12, color: '#F97316', fontWeight: '700', textAlign: 'center' }}>Votre ID : JJI-00247</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  header: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: '#1A1A1A', backgroundColor: '#0D0D0D' },
  backBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2A2A2A', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  banner: { backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#1F1F1F', borderLeftWidth: 4, borderLeftColor: '#F97316', borderRadius: 12, padding: 16, marginBottom: 20 },
  bannerText: { fontSize: 13, lineHeight: 21, color: '#9CA3AF' },
  cardMain: { backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#1F1F1F', borderTopWidth: 3, borderTopColor: '#F97316', borderRadius: 16, padding: 18, marginBottom: 18 },
  badgePrincipal: { backgroundColor: '#F97316', alignSelf: 'flex-start', paddingHorizontal: 11, paddingVertical: 5, borderRadius: 8 },
  cardSecondary: { backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#1F1F1F', borderRadius: 16, padding: 18 },
  badgeSecondary: { backgroundColor: '#2A2A2A', alignSelf: 'flex-start', paddingHorizontal: 11, paddingVertical: 5, borderRadius: 8 },
  fieldsContainer: { backgroundColor: '#141414', borderWidth: 1, borderColor: '#232323', borderRadius: 12, paddingHorizontal: 14, marginTop: 16 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#242424' },
  fieldLabel: { fontSize: 11, color: '#6B7280' },
  fieldValue: { fontSize: 14, fontWeight: '600', color: '#FFFFFF', marginTop: 2 },
});
