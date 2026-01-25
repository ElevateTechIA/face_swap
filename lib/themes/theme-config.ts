export type ThemeId = 'glamour' | 'ocean';

export interface Theme {
  id: ThemeId;
  name: string;
  description: string;
  colors: {
    // Primary gradient colors
    primary: string;
    primaryFrom: string;
    primaryTo: string;

    // Accent colors
    accent: string;
    accentLight: string;

    // Background colors
    bgPrimary: string;
    bgSecondary: string;
    bgTertiary: string;

    // Text colors
    textPrimary: string;
    textSecondary: string;

    // Border colors
    border: string;
    borderLight: string;

    // Shadow colors
    shadow: string;
  };
}

export const themes: Record<ThemeId, Theme> = {
  glamour: {
    id: 'glamour',
    name: 'Glamour',
    description: 'Pink & Purple vibes',
    colors: {
      primary: '#ec4899',
      primaryFrom: '#ec4899', // pink-500
      primaryTo: '#a855f7',   // purple-600

      accent: '#f97316',
      accentLight: '#fb923c',

      bgPrimary: '#050505',
      bgSecondary: '#1a1a1a',
      bgTertiary: '#2a2a2a',

      textPrimary: '#ffffff',
      textSecondary: '#9ca3af',

      border: 'rgba(255, 255, 255, 0.1)',
      borderLight: 'rgba(255, 255, 255, 0.05)',

      shadow: 'rgba(236, 72, 153, 0.3)',
    },
  },
  ocean: {
    id: 'ocean',
    name: 'Ocean',
    description: 'Blue & Cyan waves',
    colors: {
      primary: '#06b6d4',
      primaryFrom: '#06b6d4', // cyan-500
      primaryTo: '#3b82f6',   // blue-500

      accent: '#0ea5e9',
      accentLight: '#38bdf8',

      bgPrimary: '#020617',
      bgSecondary: '#0f172a',
      bgTertiary: '#1e293b',

      textPrimary: '#f1f5f9',
      textSecondary: '#94a3b8',

      border: 'rgba(148, 163, 184, 0.2)',
      borderLight: 'rgba(148, 163, 184, 0.1)',

      shadow: 'rgba(6, 182, 212, 0.3)',
    },
  },
};

export const defaultTheme: ThemeId = 'glamour';
