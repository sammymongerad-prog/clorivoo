import React from 'react';
import { TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';

interface Props { onPress?: () => void; color?: string; }

export function BackButton({ onPress, color = '#FFFFFF' }: Props) {
  const router = useRouter();
  return (
    <TouchableOpacity onPress={onPress ?? (() => router.back())} activeOpacity={0.7}
      style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2A2A2A', alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M19 12H5" /><Path d="m12 19-7-7 7-7" />
      </Svg>
    </TouchableOpacity>
  );
}
