import React from 'react';
import { View, Text, TouchableOpacity, Modal, Dimensions } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const STATUSES = [
  { key: 'received_usa', label: '🏭 Reçu USA', color: '#3B82F6' },
  { key: 'in_transit',   label: '✈️ En transit', color: '#F97316' },
  { key: 'arrived',      label: '🇭🇹 Arrivé', color: '#A855F7' },
  { key: 'ready_pickup', label: '📦 Prêt retrait', color: '#06B6D4' },
  { key: 'delivered',    label: '✅ Livré', color: '#22C55E' },
];

interface Props {
  visible: boolean;
  currentStatus: string;
  trackingNumber?: string;
  onSelect: (status: string) => void;
  onClose: () => void;
}

export function StatusChanger({ visible, currentStatus, trackingNumber, onSelect, onClose }: Props) {
  return (
    <Modal transparent visible={visible} onRequestClose={onClose} animationType="slide">
      <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' }} activeOpacity={1} onPress={onClose} />
      <View style={{ backgroundColor: '#111111', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
        <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#3A3A3A', alignSelf: 'center', marginBottom: 16 }} />
        {trackingNumber && (
          <Text style={{ fontSize: 14, color: '#9CA3AF', textAlign: 'center', marginBottom: 16 }}>
            Colis <Text style={{ color: '#F97316', fontWeight: '700' }}>{trackingNumber}</Text>
          </Text>
        )}
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginBottom: 16, textAlign: 'center' }}>Changer le statut</Text>
        <View style={{ gap: 10 }}>
          {STATUSES.map(s => (
            <TouchableOpacity
              key={s.key}
              onPress={() => onSelect(s.key)}
              activeOpacity={0.85}
              style={{ height: 52, backgroundColor: currentStatus === s.key ? s.color : '#1A1A1A', borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: currentStatus === s.key ? s.color : '#2A2A2A' }}
            >
              <Text style={{ fontSize: 15, fontWeight: '700', color: currentStatus === s.key ? '#0D0D0D' : '#FFFFFF' }}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );
}
