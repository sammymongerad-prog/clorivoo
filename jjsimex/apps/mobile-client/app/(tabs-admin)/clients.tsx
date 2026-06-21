import React from 'react';
import { View, Text, StyleSheet, Platform, StatusBar } from 'react-native';
import { Users } from 'lucide-react-native';

const statusBarH = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 44;

export default function AdminClients() {
  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Gestion des clients</Text>
      </View>
      <View style={s.center}>
        <Users size={48} color="#F97316" strokeWidth={1.5} />
        <Text style={s.title}>Clients</Text>
        <Text style={s.sub}>La liste des clients arrive bientôt.</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  header: {
    paddingHorizontal: 18, paddingTop: statusBarH + 10, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#1A1A1A', alignItems: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingBottom: 100 },
  title: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  sub: { fontSize: 13, color: '#9CA3AF' },
});
