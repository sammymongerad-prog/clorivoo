import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { COLORS, RADIUS, SHADOW } from '../../lib/tokens';

const REFERRAL_CODE = 'CLORIVO-A7K2';

const REWARDS = [
  { id: '1', title: '5€ offerts', desc: 'Pour chaque ami invité qui passe sa 1ère commande', threshold: 1, emoji: '🎁' },
  { id: '2', title: '10€ bonus', desc: 'Quand vous atteignez 5 amis parrainés', threshold: 5, emoji: '🏆' },
  { id: '3', title: '25€ bonus', desc: 'Quand vous atteignez 10 amis parrainés', threshold: 10, emoji: '💎' },
];

const REFERRED = [
  { id: '1', name: 'Alice M.', date: '12 mai 2025', status: 'Confirmé', gain: 5 },
  { id: '2', name: 'Kévin L.', date: '3 juin 2025', status: 'Confirmé', gain: 5 },
  { id: '3', name: 'Samia B.', date: '18 juin 2025', status: 'En attente', gain: 5 },
];

export default function ReferralScreen({ navigation }) {
  const [copied, setCopied] = useState(false);

  function copyCode() {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    Alert.alert('Copié !', `Le code ${REFERRAL_CODE} a été copié.`);
  }

  const shareLink = `https://clorivo.app/invite?ref=${REFERRAL_CODE}`;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.hairline }}>
        <TouchableOpacity onPress={() => navigation.goBack()}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
          <Text style={{ fontSize: 18, color: COLORS.primary }}>←</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '800', color: COLORS.ink, letterSpacing: -0.5 }}>Parrainage</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 16 }}>
        {/* Hero */}
        <View style={{ borderRadius: 20, backgroundColor: COLORS.primary, padding: 22, alignItems: 'center', overflow: 'hidden' }}>
          <View style={{ position: 'absolute', right: -30, top: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.1)' }} />
          <Text style={{ fontSize: 36, marginBottom: 6 }}>🎁</Text>
          <Text style={{ fontSize: 20, fontWeight: '900', color: '#fff', textAlign: 'center', letterSpacing: -0.5 }}>Invitez vos amis</Text>
          <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: 4 }}>Gagnez 5€ pour chaque ami qui passe une commande</Text>
        </View>

        {/* Code parrainage */}
        <View style={{ backgroundColor: COLORS.white, borderRadius: 16, padding: 20, borderWidth: 1.5, borderColor: COLORS.hairline, alignItems: 'center', ...SHADOW.sm }}>
          <Text style={{ fontSize: 13, color: COLORS.mute, marginBottom: 8, fontWeight: '500' }}>Votre code de parrainage</Text>
          <View style={{ backgroundColor: COLORS.primarySoft, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12, marginBottom: 14, borderWidth: 2, borderColor: COLORS.primary, borderStyle: 'dashed' }}>
            <Text style={{ fontSize: 26, fontWeight: '900', color: COLORS.primary, letterSpacing: 2, fontFamily: 'monospace' }}>{REFERRAL_CODE}</Text>
          </View>
          <TouchableOpacity onPress={copyCode}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: copied ? COLORS.success : COLORS.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 }}>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>{copied ? '✓ Copié !' : 'Copier le code'}</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {[
            { label: 'Amis parrainés', value: '3', emoji: '👥' },
            { label: 'Gains totaux', value: '15€', emoji: '💰' },
            { label: 'En attente', value: '5€', emoji: '⏳' },
          ].map((s, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: COLORS.white, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.hairline, ...SHADOW.sm }}>
              <Text style={{ fontSize: 22 }}>{s.emoji}</Text>
              <Text style={{ fontSize: 20, fontWeight: '800', color: COLORS.ink, marginTop: 4 }}>{s.value}</Text>
              <Text style={{ fontSize: 10, color: COLORS.mute, textAlign: 'center', marginTop: 2 }}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Récompenses disponibles */}
        <View>
          <Text style={{ fontSize: 16, fontWeight: '800', color: COLORS.ink, marginBottom: 10, letterSpacing: -0.3 }}>Récompenses disponibles</Text>
          <View style={{ gap: 10 }}>
            {REWARDS.map(r => (
              <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.white, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: COLORS.hairline, ...SHADOW.sm }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 22 }}>{r.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.ink }}>{r.title}</Text>
                  <Text style={{ fontSize: 12, color: COLORS.mute, marginTop: 2 }}>{r.desc}</Text>
                </View>
                <View style={{ backgroundColor: COLORS.primarySoft, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.primary }}>{r.threshold} ami{r.threshold > 1 ? 's' : ''}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Liste parrainés */}
        <View>
          <Text style={{ fontSize: 16, fontWeight: '800', color: COLORS.ink, marginBottom: 10, letterSpacing: -0.3 }}>Amis parrainés</Text>
          <View style={{ gap: 8 }}>
            {REFERRED.map(r => (
              <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: COLORS.hairline }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>{r.name[0]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.ink }}>{r.name}</Text>
                  <Text style={{ fontSize: 11, color: COLORS.mute }}>{r.date}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: r.status === 'Confirmé' ? COLORS.success : COLORS.mute }}>+{r.gain}€</Text>
                  <Text style={{ fontSize: 10, color: r.status === 'Confirmé' ? COLORS.success : COLORS.mute }}>{r.status}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Partager */}
        <View>
          <Text style={{ fontSize: 16, fontWeight: '800', color: COLORS.ink, marginBottom: 10, letterSpacing: -0.3 }}>Partager via</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {[
              { label: 'WhatsApp', emoji: '💬', color: '#25D366' },
              { label: 'SMS', emoji: '📱', color: '#4A6FD4' },
              { label: 'Copier le lien', emoji: '🔗', color: COLORS.ink },
            ].map((btn, i) => (
              <TouchableOpacity key={i} onPress={() => Alert.alert('Partage', `Lien copié : ${shareLink}`)}
                style={{ flex: 1, backgroundColor: btn.color, borderRadius: 12, paddingVertical: 12, alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 20 }}>{btn.emoji}</Text>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>{btn.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
