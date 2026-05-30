import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SHADOW } from '../../lib/tokens';
import Icon from '../../components/Icon';

function SettingRow({ icon, label, detail, toggle, value, onToggle, onPress, danger, last }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={toggle ? 1 : 0.7}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: last ? 0 : 1, borderBottomColor: COLORS.hairline }}>
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: danger ? '#FFF0F0' : COLORS.paper, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={17} color={danger ? COLORS.danger : COLORS.mute} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, color: danger ? COLORS.danger : COLORS.ink }}>{label}</Text>
        {detail ? <Text style={{ fontSize: 12, color: COLORS.mute, marginTop: 1 }}>{detail}</Text> : null}
      </View>
      {toggle ? <Switch value={value} onValueChange={onToggle} trackColor={{ true: COLORS.primary }} thumbColor="#fff" /> : !danger ? <Icon name="chevronRight" size={16} color={COLORS.mute} /> : null}
    </TouchableOpacity>
  );
}

function Section({ title, children }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.mute, letterSpacing: 0.5, textTransform: 'uppercase', marginLeft: 16, marginBottom: 8 }}>{title}</Text>
      <View style={{ backgroundColor: COLORS.white, borderRadius: 16, overflow: 'hidden', ...SHADOW.sm, marginHorizontal: 16 }}>
        {children}
      </View>
    </View>
  );
}

export default function SettingsScreen({ navigation }) {
  const [notifPush,     setNotifPush]     = useState(true);
  const [notifEmail,    setNotifEmail]    = useState(false);
  const [notifOrders,   setNotifOrders]   = useState(true);
  const [notifPromos,   setNotifPromos]   = useState(true);
  const [notifMessages, setNotifMessages] = useState(true);
  const [biometric,     setBiometric]     = useState(false);
  const [darkMode,      setDarkMode]      = useState(false);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.paper }} edges={['top']}>
      <View style={{ backgroundColor: COLORS.white, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.hairline }}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Icon name="arrowLeft" size={22} color={COLORS.ink} /></TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.ink }}>Paramètres</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 16, paddingBottom: 40 }}>
        <Section title="Notifications">
          <SettingRow icon="bell"         label="Notifications push"    toggle value={notifPush}     onToggle={setNotifPush} />
          <SettingRow icon="mail"         label="Notifications e-mail"  toggle value={notifEmail}    onToggle={setNotifEmail} />
          <SettingRow icon="package"      label="Suivi de commandes"    toggle value={notifOrders}   onToggle={setNotifOrders} />
          <SettingRow icon="tag"          label="Offres & promotions"   toggle value={notifPromos}   onToggle={setNotifPromos} />
          <SettingRow icon="messageSquare" label="Nouveaux messages"    toggle value={notifMessages} onToggle={setNotifMessages} last />
        </Section>

        <Section title="Sécurité">
          <SettingRow icon="lock"        label="Authentification biométrique" detail="Face ID / Touch ID" toggle value={biometric} onToggle={setBiometric} />
          <SettingRow icon="creditCard"  label="Méthodes de paiement"        detail="Visa, PayPal" onPress={() => {}} />
          <SettingRow icon="eye"         label="Confidentialité"             onPress={() => {}} last />
        </Section>

        <Section title="Apparence">
          <SettingRow icon="settings" label="Mode sombre" detail="Bientôt disponible" toggle value={darkMode} onToggle={setDarkMode} last />
        </Section>

        <Section title="Langue & Région">
          <SettingRow icon="mapPin" label="Langue"   detail="Français" onPress={() => {}} />
          <SettingRow icon="mapPin" label="Devise"   detail="USD ($)"  onPress={() => {}} />
          <SettingRow icon="truck"  label="Région"   detail="France"   onPress={() => {}} last />
        </Section>

        <Section title="À propos">
          <SettingRow icon="help"       label="Aide & Support"     onPress={() => navigation.navigate('Help')} />
          <SettingRow icon="checkCircle" label="Conditions d'utilisation" onPress={() => {}} />
          <SettingRow icon="lock"        label="Politique de confidentialité" onPress={() => {}} last />
        </Section>

        <View style={{ alignItems: 'center', paddingVertical: 16 }}>
          <Text style={{ fontFamily: 'monospace', fontSize: 11, color: COLORS.hairline }}>clorivo v1.0.0 · {Platform.OS}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
