import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { StatusBadge } from './StatusBadge';

interface Package {
  id: string;
  tracking_number: string;
  status: string;
  transport_mode?: string;
  destination_city?: string;
  destination_country?: string;
  weight_billed?: number;
  estimated_delivery?: string;
}

interface Props {
  pkg: Package;
  onPress?: () => void;
  variant?: 'default' | 'compact';
}

export function PackageCard({ pkg, onPress, variant = 'default' }: Props) {
  if (variant === 'compact') {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1F1F1F' }}
      >
        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(249,115,22,0.12)', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 18 }}>{pkg.transport_mode === 'air' ? '✈️' : '🚢'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#F97316' }}>{pkg.tracking_number}</Text>
          <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{pkg.destination_city ?? '—'}, {pkg.destination_country ?? '—'}</Text>
        </View>
        <StatusBadge status={pkg.status} />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{ backgroundColor: '#1A1A1A', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#2A2A2A' }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <View>
          <Text style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4, letterSpacing: 0.5, textTransform: 'uppercase' }}>Numéro de suivi</Text>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#F97316' }}>{pkg.tracking_number}</Text>
        </View>
        <StatusBadge status={pkg.status} size="md" />
      </View>
      <View style={{ flexDirection: 'row', gap: 16 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, color: '#9CA3AF' }}>Destination</Text>
          <Text style={{ fontSize: 13, color: '#FFFFFF', fontWeight: '600', marginTop: 2 }}>{pkg.destination_city ?? '—'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, color: '#9CA3AF' }}>Mode</Text>
          <Text style={{ fontSize: 13, color: '#FFFFFF', fontWeight: '600', marginTop: 2 }}>{pkg.transport_mode === 'air' ? '✈️ Avion' : '🚢 Bateau'}</Text>
        </View>
        {pkg.weight_billed ? (
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, color: '#9CA3AF' }}>Poids</Text>
            <Text style={{ fontSize: 13, color: '#FFFFFF', fontWeight: '600', marginTop: 2 }}>{pkg.weight_billed} lbs</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}
