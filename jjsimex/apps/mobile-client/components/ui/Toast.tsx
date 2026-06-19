import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { Check, X, Info } from 'lucide-react-native';

interface Props {
  message: string;
  type?: 'success' | 'error' | 'info';
  visible: boolean;
  onHide: () => void;
}

export function Toast({ message, type = 'success', visible, onHide }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      const t = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(onHide);
      }, 2800);
      return () => clearTimeout(t);
    }
  }, [visible]);

  if (!visible) return null;

  const colors = {
    success: { bg: '#14532D', border: '#22C55E', Icon: Check },
    error:   { bg: '#450A0A', border: '#EF4444', Icon: X },
    info:    { bg: '#1e3a5f', border: '#3B82F6', Icon: Info },
  };
  const c = colors[type];
  const Icon = c.Icon;

  return (
    <Animated.View style={[styles.container, { opacity, backgroundColor: c.bg, borderColor: c.border }]}>
      <Icon size={16} color={c.border} strokeWidth={2} />
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
}

export function useToast() {
  const [state, setState] = React.useState<{ message: string; type: 'success' | 'error' | 'info'; visible: boolean }>({ message: '', type: 'success', visible: false });
  const show = (message: string, type: 'success' | 'error' | 'info' = 'success') => setState({ message, type, visible: true });
  const hide = () => setState(s => ({ ...s, visible: false }));
  const ToastEl = <Toast message={state.message} type={state.type} visible={state.visible} onHide={hide} />;
  return { show, ToastEl };
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute', bottom: 90, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 999, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8,
    zIndex: 9999,
  },
  message: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
});
