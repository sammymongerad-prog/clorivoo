import React from 'react';
import { TouchableOpacity, View } from 'react-native';

interface Props { value: boolean; onToggle: () => void; }

export function Toggle({ value, onToggle }: Props) {
  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.8}
      style={{ width: 44, height: 26, borderRadius: 99, backgroundColor: value ? '#F97316' : '#2A2A2A', justifyContent: 'center', padding: 3 }}
    >
      <View style={{ width: 20, height: 20, borderRadius: 99, backgroundColor: '#FFFFFF', marginLeft: value ? 18 : 0 }} />
    </TouchableOpacity>
  );
}
