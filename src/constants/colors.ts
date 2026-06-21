export const COLORS = {
  healthcare: {
    blue: '#0066CC',
    blueLight: '#3385D6',
    blueDark: '#004D99',
  },
  emerald: {
    DEFAULT: '#10B981',
    light: '#34D399',
    dark: '#059669',
  },
  indigo: {
    soft: '#818CF8',
    DEFAULT: '#6366F1',
    dark: '#4F46E5',
  },
  status: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
  severity: {
    low: '#10B981',
    medium: '#F59E0B',
    high: '#EF4444',
    critical: '#7C3AED',
  },
} as const;

export type ColorKey = keyof typeof COLORS;
