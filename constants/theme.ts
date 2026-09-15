import { Platform } from 'react-native';

export const colors = {
  primary: {
    50: '#eef4ff',
    100: '#d9e6ff',
    200: '#bcd3ff',
    300: '#8eb6ff',
    400: '#598fff',
    500: '#2e6bff',
    600: '#1a52f5',
    700: '#163fe0',
    800: '#1834b5',
    900: '#1a338f',
  },
  secondary: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },
  accent: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  success: {
    50: '#ecfdf5',
    100: '#d1fae5',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
  },
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
  },
  neutral: {
    0: '#ffffff',
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },
};

export const stateColors = {
  verde: colors.success[600],
  amber: colors.warning[500],
  rojo: colors.error[500],
  azul: colors.primary[600],
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 9999,
};

export const fontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  xxl: 30,
  xxxl: 38,
  display: 46,
};

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const shadows = Platform.select({
  ios: {
    card: { shadowColor: colors.neutral[900], shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
    floating: { shadowColor: colors.neutral[900], shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24 },
    header: { shadowColor: colors.neutral[900], shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  },
  default: {
    card: { elevation: 3 },
    floating: { elevation: 8 },
    header: { elevation: 2 },
  },
});
