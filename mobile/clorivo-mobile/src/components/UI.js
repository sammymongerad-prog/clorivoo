import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, TextInput } from 'react-native';
import { COLORS, RADIUS, SHADOW } from '../lib/tokens';

// ─── Button ───────────────────────────────────────────────────────
export function Btn({ children, variant = 'primary', onPress, disabled, style, size = 'md' }) {
  const bg = variant === 'primary' ? COLORS.primary
    : variant === 'secondary' ? COLORS.white
    : variant === 'ghost' ? 'transparent'
    : COLORS.primarySoft;
  const color = variant === 'primary' ? '#fff'
    : variant === 'ghost' ? COLORS.ink
    : variant === 'secondary' ? COLORS.primary
    : COLORS.primaryDeep;
  const border = variant === 'secondary' ? `1px solid ${COLORS.primary}` : undefined;
  const h = size === 'lg' ? 52 : size === 'sm' ? 36 : 44;
  const px = size === 'sm' ? 14 : 20;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.75}
      style={[{
        backgroundColor: disabled ? COLORS.hairline : bg,
        borderRadius: RADIUS.full,
        height: h,
        paddingHorizontal: px,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 6,
        borderWidth: variant === 'secondary' ? 1.5 : 0,
        borderColor: variant === 'secondary' ? COLORS.primary : 'transparent',
      }, style]}
    >
      {typeof children === 'string'
        ? <Text style={{ color: disabled ? COLORS.mute : color, fontWeight: '700', fontSize: size === 'sm' ? 13 : 15 }}>{children}</Text>
        : children}
    </TouchableOpacity>
  );
}

// ─── Input ────────────────────────────────────────────────────────
export function Input({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType, style, error, iconLeft }) {
  const [focused, setFocused] = React.useState(false);
  return (
    <View style={[{ marginBottom: 14 }, style]}>
      {label && <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.ink, marginBottom: 6 }}>{label}</Text>}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1.5,
        borderColor: error ? COLORS.danger : focused ? COLORS.primary : COLORS.hairline,
        borderRadius: RADIUS.md,
        backgroundColor: COLORS.paper,
        paddingHorizontal: 14,
        height: 48,
      }}>
        {iconLeft && <View style={{ marginRight: 8 }}>{iconLeft}</View>}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.mute}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ flex: 1, fontSize: 15, color: COLORS.ink }}
          autoCapitalize="none"
        />
      </View>
      {error && <Text style={{ fontSize: 12, color: COLORS.danger, marginTop: 4 }}>{error}</Text>}
    </View>
  );
}

// ─── Card ─────────────────────────────────────────────────────────
export function Card({ children, style, onPress }) {
  const inner = (
    <View style={[{ backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: 14, ...SHADOW.sm }, style]}>
      {children}
    </View>
  );
  if (onPress) return <TouchableOpacity onPress={onPress} activeOpacity={0.85}>{inner}</TouchableOpacity>;
  return inner;
}

// ─── Badge ────────────────────────────────────────────────────────
export function Badge({ count }) {
  if (!count) return null;
  return (
    <View style={{ position: 'absolute', top: -2, right: -2, backgroundColor: COLORS.danger, borderRadius: RADIUS.full, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3, borderWidth: 1.5, borderColor: COLORS.white }}>
      <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────
export function Avatar({ size = 40, initials = '?', bg, uri }) {
  const { Image } = require('react-native');
  if (uri) return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg ?? COLORS.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size * 0.38, fontWeight: '800', color: bg ? '#fff' : COLORS.primary }}>{initials}</Text>
    </View>
  );
}

// ─── Divider ──────────────────────────────────────────────────────
export function Divider({ style }) {
  return <View style={[{ height: 1, backgroundColor: COLORS.hairline }, style]} />;
}

// ─── LoadingSpinner ───────────────────────────────────────────────
export function Spinner({ color = COLORS.primary }) {
  return <ActivityIndicator color={color} />;
}

// ─── SectionHeader ────────────────────────────────────────────────
export function SectionHeader({ title, onSeeAll }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <Text style={{ fontSize: 17, fontWeight: '700', color: COLORS.ink, letterSpacing: -0.3 }}>{title}</Text>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.primary }}>Voir tout</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── ProductCard ─────────────────────────────────────────────────
export function ProductCard({ product, onPress }) {
  const { Image } = require('react-native');
  const img = product.images?.[0];
  const discount = product.compare_price && product.price < product.compare_price
    ? Math.round((1 - product.price / product.compare_price) * 100) : null;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.88}
      style={{ backgroundColor: COLORS.white, borderRadius: RADIUS.md, overflow: 'hidden', ...SHADOW.sm }}>
      <View style={{ height: 150, backgroundColor: COLORS.primarySoft }}>
        {img
          ? <Image source={{ uri: img }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 32 }}>🛍️</Text>
            </View>
        }
        {discount && (
          <View style={{ position: 'absolute', top: 8, left: 8, backgroundColor: COLORS.primarySoft, borderRadius: RADIUS.full, paddingHorizontal: 7, paddingVertical: 2 }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: COLORS.primaryDeep }}>-{discount}%</Text>
          </View>
        )}
      </View>
      <View style={{ padding: 10 }}>
        <Text style={{ fontSize: 12, color: COLORS.mute, marginBottom: 2 }} numberOfLines={1}>{product.shops?.name ?? ''}</Text>
        <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.ink, marginBottom: 6 }} numberOfLines={2}>{product.title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.primary }}>${Number(product.price).toFixed(2)}</Text>
          {product.compare_price && (
            <Text style={{ fontSize: 12, color: COLORS.mute, textDecorationLine: 'line-through' }}>${Number(product.compare_price).toFixed(2)}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────
export function EmptyState({ icon = '📭', title, subtitle }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 60, gap: 12 }}>
      <Text style={{ fontSize: 48 }}>{icon}</Text>
      <Text style={{ fontSize: 17, fontWeight: '700', color: COLORS.ink }}>{title}</Text>
      {subtitle && <Text style={{ fontSize: 14, color: COLORS.mute, textAlign: 'center', paddingHorizontal: 32 }}>{subtitle}</Text>}
    </View>
  );
}
