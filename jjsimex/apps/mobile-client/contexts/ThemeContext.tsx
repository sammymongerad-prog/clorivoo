import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ThemeColors {
  bg: string;
  card: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  inputBg: string;
}

const DARK: ThemeColors = {
  bg: '#0D0D0D',
  card: '#1A1A1A',
  border: '#2A2A2A',
  text: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  accent: '#F97316',
  inputBg: '#0D0D0D',
};

const LIGHT: ThemeColors = {
  bg: '#F5F5F5',
  card: '#FFFFFF',
  border: '#E5E7EB',
  text: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  accent: '#F97316',
  inputBg: '#FFFFFF',
};

type ThemeMode = 'dark' | 'light';

interface ThemeContextType {
  mode: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'dark',
  colors: DARK,
  toggleTheme: () => {},
  isDark: true,
});

const STORAGE_KEY = '@jjsimex_theme';

export function ThemeProvider({ children }: { children: any }) {
  const [mode, setMode] = useState<ThemeMode>('dark');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(v => {
      if (v === 'light' || v === 'dark') setMode(v);
    }).catch(() => {});
  }, []);

  function toggleTheme() {
    const next = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }

  const colors = mode === 'dark' ? DARK : LIGHT;

  return (
    <ThemeContext.Provider value={{ mode, colors, toggleTheme, isDark: mode === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
