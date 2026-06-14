import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { BackButton } from './BackButton';

interface Props {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  showBack?: boolean;
}

export function Header({ title, subtitle, right, showBack = true }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.row}>
        {showBack ? <BackButton /> : <View style={{ width: 40 }} />}
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        <View style={{ width: 40 }}>{right}</View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: '#0D0D0D' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14 },
  title: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  subtitle: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
});
