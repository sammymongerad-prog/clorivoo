import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    '../../packages/ui/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Palette JJ's IMEX
        brand: {
          bg: '#0D0D0D',
          card: '#1A1A1A',
          card2: '#2A2A2A',
          sidebar: '#111111',
          orange: '#F97316',
          'orange-dark': '#C2600A',
          green: '#22C55E',
          red: '#EF4444',
          gray: '#9CA3AF',
          border: '#2A2A2A',
        },
      },
      fontFamily: {
        sora: ['Sora', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
        btn: '12px',
        input: '8px',
      },
    },
  },
  plugins: [],
};

export default config;
