import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { StatusBadge } from './StatusBadge';

const COLORS = ['#F97316', '#22C55E', '#3B82F6', '#A855F7', '#06B6D4', '#F59E0B', '#EC4899'];

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
  loyalty_level?: string;
}

interface Props { client: Client; onPress: () => void; }

export function ClientCard({ client, onPress }: Props) {
  const initials = `${client.first_name[0] ?? ''}${client.last_name[0] ?? ''}`.toUpperCase();
  const color = COLORS[client.id.charCodeAt(0) % COLORS.length];
  const loyaltyEmoji: Record<string, string> = { bronze: '🥉', silver: '🥈', gold: '🥇', platinum: '💎' };
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={{ backgroundColor: '#1A1A1A', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#242424', marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: color, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>{client.first_name} {client.last_name}</Text>
          <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{client.email}</Text>
        </View>
        <StatusBadge status={client.status} />
      </View>
      {client.loyalty_level && (
        <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 12, color: '#9CA3AF' }}>Fidélité :</Text>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#F97316' }}>{loyaltyEmoji[client.loyalty_level] ?? ''} {client.loyalty_level}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
