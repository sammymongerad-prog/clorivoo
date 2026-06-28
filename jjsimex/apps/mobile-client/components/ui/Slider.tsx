import React, { useRef, useState } from 'react';
import { View, Text, PanResponder } from 'react-native';

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
  const trackRef = useRef<View>(null);
  const [trackWidth, setTrackWidth] = useState(0);

  const pct = trackWidth > 0 ? ((value - min) / (max - min)) : 0;

  function updateValue(pageX: number) {
    if (!trackRef.current) return;
    trackRef.current.measure((_x, _y, w, _h, px) => {
      const rel = pageX - px;
      const newPct = Math.max(0, Math.min(1, rel / w));
      const raw = min + newPct * (max - min);
      const stepped = Math.round(raw / step) * step;
      onChange(Math.max(min, Math.min(max, stepped)));
    });
  }

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => {
      const pageX = e.nativeEvent.pageX;
      updateValue(pageX);
    },
    onPanResponderMove: (e) => {
      const pageX = e.nativeEvent.pageX;
      updateValue(pageX);
    },
  });

  return (
    <View>
      {label && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
          <Text style={{ fontSize: 13, color: '#9CA3AF' }}>{label}</Text>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#F97316' }}>{formatValue ? formatValue(value) : value}</Text>
        </View>
      )}
      <View
        ref={trackRef}
        onLayout={e => setTrackWidth(e.nativeEvent.layout.width)}
        style={{ height: 30, justifyContent: 'center' }}
        {...panResponder.panHandlers}
      >
        <View style={{ height: 6, backgroundColor: '#2A2A2A', borderRadius: 3, justifyContent: 'center' }}>
          <View style={{ position: 'absolute', left: 0, width: `${pct * 100}%`, height: 6, backgroundColor: '#F97316', borderRadius: 3 }} />
        </View>
        <View style={{
          position: 'absolute', left: `${pct * 100}%`, marginLeft: -14,
          width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFFFFF',
          shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4,
        }} />
      </View>
    </View>
  );
}
