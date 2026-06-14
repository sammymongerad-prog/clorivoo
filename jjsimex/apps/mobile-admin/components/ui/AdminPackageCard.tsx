import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { StatusBadge } from './StatusBadge';

interface Pkg {
  id: string;
  tracking_number: string;
  status: string;
  transport_mode?: string;
  destination_city?: string;
  destination_country?: string;
  weight_billed?: number;
  users?: { first_name?: string; last_name?: string };
}

interface Props {
  pkg: Pkg;
  onView: () => void;
  onChangeStatus: () => void;
}

export function AdminPackageCard({ pkg, onView, onChangeStatus }: Props) {
  const clientName = pkg.users ? `${pkg.users.first_name ?? ''} ${pkg.users.last_name ?? ''}`.trim() : '—';
  return (
    <View style={{ backgroundColor: '#1A1A1A', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#242424', marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: '#F97316' }}>{pkg.tracking_number}</Text>
        <StatusBadge status={pkg.status} />
      </View>
      <View style={{ flexDirection: 'row', gap: 14, marginBottom: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, color: '#9CA3AF' }}>Client</Text>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#FFFFFF', marginTop: 2 }}>{clientName}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, color: '#9CA3AF' }}>Destination</Text>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#FFFFFF', marginTop: 2 }}>{pkg.destination_city ?? '—'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, color: '#9CA3AF' }}>Poids</Text>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#FFFFFF', marginTop: 2 }}>{pkg.weight_billed ? `${pkg.weight_billed} lbs` : '—'}</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TouchableOpacity onPress={onView} style={{ flex: 1, height: 36, backgroundColor: '#2A2A2A', borderRadius: 8, alignItems: 'center', justifyContent: 'center' }} activeOpacity={0.8}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#FFFFFF' }}>Voir détails</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onChangeStatus} style={{ flex: 1, height: 36, backgroundColor: '#F97316', borderRadius: 8, alignItems: 'center', justifyContent: 'center' }} activeOpacity={0.85}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#0D0D0D' }}>Changer statut</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
