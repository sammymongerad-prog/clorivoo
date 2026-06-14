import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface Props { count: number; onPress: () => void; }

export function UrgencyBanner({ count, onPress }: Props) {
  if (count === 0) return null;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', marginBottom: 12 }}>
      <Text style={{ fontSize: 20 }}>🚨</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#EF4444' }}>{count} alerte{count > 1 ? 's' : ''} urgente{count > 1 ? 's' : ''}</Text>
        <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Appuyez pour voir les détails</Text>
      </View>
      <Text style={{ fontSize: 20, color: '#EF4444' }}>›</Text>
    </TouchableOpacity>
  );
}
