import React from 'react';
import { View, Text } from 'react-native';
import RNSlider from '@react-native-community/slider';

interface Props {
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  label?: string;
  formatValue?: (v: number) => string;
}

export function Slider({ min, max, value, onChange, step = 1, label, formatValue }: Props) {
  return (
    <View>
      {label && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
          <Text style={{ fontSize: 13, color: '#9CA3AF' }}>{label}</Text>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#F97316' }}>{formatValue ? formatValue(value) : value}</Text>
        </View>
      )}
      <RNSlider
        style={{ width: '100%', height: 40 }}
        minimumValue={min}
        maximumValue={max}
        value={value}
        step={step}
        onValueChange={onChange}
        minimumTrackTintColor="#F97316"
        maximumTrackTintColor="#2A2A2A"
        thumbTintColor="#FFFFFF"
      />
    </View>
  );
}
