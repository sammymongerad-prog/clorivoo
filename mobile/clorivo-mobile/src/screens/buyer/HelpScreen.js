import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SHADOW } from '../../lib/tokens';
import Icon from '../../components/Icon';

const FAQ = [
  { q: 'Comment suivre ma commande ?',       a: 'Allez dans Profil → Mes commandes → sélectionnez la commande pour voir le suivi en temps réel.' },
  { q: 'Comment retourner un produit ?',      a: 'Vous avez 30 jours pour retourner un produit. Allez dans Mes commandes → Demander un retour.' },
  { q: 'Quels moyens de paiement acceptés ?', a: 'Nous acceptons Visa, Mastercard, PayPal et Apple Pay. Toutes les transactions sont sécurisées.' },
  { q: 'Comment devenir vendeur ?',           a: 'Allez dans Profil → Devenir vendeur et suivez les étapes. La validation prend 24-48h.' },
  { q: 'Mon paiement a échoué, que faire ?',  a: 'Vérifiez vos informations bancaires et réessayez. Si le problème persiste, contactez votre banque.' },
  { q: 'Comment modifier mon adresse ?',      a: 'Allez dans Profil → Adresses pour ajouter ou modifier vos adresses de livraison.' },
];

export default function HelpScreen({ navigation }) {
  const [openIdx, setOpenIdx]   = useState(null);
  const [message, setMessage]   = useState('');
  const [sent,    setSent]       = useState(false);

  function sendMessage() {
    if (!message.trim()) return;
    setSent(true);
    setMessage('');
    setTimeout(() => setSent(false), 3000);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.paper }} edges={['top']}>
      <View style={{ backgroundColor: COLORS.white, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.hairline }}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Icon name="arrowLeft" size={22} color={COLORS.ink} /></TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.ink }}>Aide & Support</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Hero */}
        <View style={{ backgroundColor: COLORS.primary, borderRadius: 16, padding: 20, marginBottom: 20, alignItems: 'center' }}>
          <Text style={{ fontSize: 32, marginBottom: 8 }}>💬</Text>
          <Text style={{ fontSize: 17, fontWeight: '800', color: '#fff', textAlign: 'center' }}>Comment pouvons-nous vous aider ?</Text>
          <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4, textAlign: 'center' }}>Notre équipe répond en moins de 2h</Text>
        </View>

        {/* Quick contact */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
          {[
            { icon: 'messageSquare', label: 'Chat live',  color: COLORS.primary },
            { icon: 'mail',          label: 'E-mail',     color: '#059669' },
          ].map((c, i) => (
            <TouchableOpacity key={i} style={{ flex: 1, backgroundColor: COLORS.white, borderRadius: 12, padding: 14, alignItems: 'center', gap: 6, ...SHADOW.sm }}>
              <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: c.color + '20', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={c.icon} size={20} color={c.color} />
              </View>
              <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.ink }}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* FAQ */}
        <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.ink, marginBottom: 12 }}>Questions fréquentes</Text>
        <View style={{ backgroundColor: COLORS.white, borderRadius: 16, overflow: 'hidden', ...SHADOW.sm, marginBottom: 20 }}>
          {FAQ.map((item, i) => (
            <View key={i} style={{ borderTopWidth: i > 0 ? 1 : 0, borderTopColor: COLORS.hairline }}>
              <TouchableOpacity onPress={() => setOpenIdx(openIdx === i ? null : i)}
                style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 }}>
                <Text style={{ flex: 1, fontSize: 14, fontWeight: '500', color: COLORS.ink }}>{item.q}</Text>
                <Icon name={openIdx === i ? 'chevronDown' : 'chevronRight'} size={16} color={COLORS.mute} />
              </TouchableOpacity>
              {openIdx === i && (
                <View style={{ paddingHorizontal: 16, paddingBottom: 14, backgroundColor: COLORS.paper }}>
                  <Text style={{ fontSize: 13, color: COLORS.mute, lineHeight: 20 }}>{item.a}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Message form */}
        <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.ink, marginBottom: 12 }}>Envoyer un message</Text>
        {sent ? (
          <View style={{ backgroundColor: '#D1FAE5', borderRadius: 12, padding: 16, alignItems: 'center' }}>
            <Text style={{ fontSize: 24, marginBottom: 6 }}>✅</Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#065F46' }}>Message envoyé ! Réponse sous 2h.</Text>
          </View>
        ) : (
          <View style={{ backgroundColor: COLORS.white, borderRadius: 16, padding: 16, ...SHADOW.sm }}>
            <TextInput
              value={message} onChangeText={setMessage}
              placeholder="Décrivez votre problème…"
              placeholderTextColor={COLORS.mute}
              multiline numberOfLines={4}
              style={{ borderWidth: 1.5, borderColor: COLORS.hairline, borderRadius: 10, padding: 12, fontSize: 14, color: COLORS.ink, minHeight: 100, textAlignVertical: 'top', marginBottom: 12, backgroundColor: COLORS.paper }}
            />
            <TouchableOpacity onPress={sendMessage}
              style={{ backgroundColor: COLORS.primary, borderRadius: 12, height: 48, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Envoyer</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
