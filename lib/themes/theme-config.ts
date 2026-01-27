export type ThemeId = 'glamour' | 'ocean' | 'pink-boxer';

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
      primaryFrom: '#22d3ee', // cyan-400
      primaryTo: '#06b6d4',   // cyan-500

      accent: '#0ea5e9',      // sky-500
      accentLight: '#7dd3fc', // sky-300

      bgPrimary: '#ecfeff',   // cyan-50
      bgSecondary: '#cffafe', // cyan-100
      bgTertiary: '#a5f3fc',  // cyan-200

      textPrimary: '#164e63', // cyan-900
      textSecondary: '#0e7490', // cyan-800

      border: 'rgba(6, 182, 212, 0.3)', // cyan-500 with opacity
      borderLight: 'rgba(34, 211, 238, 0.2)', // cyan-400 with opacity

      shadow: 'rgba(6, 182, 212, 0.4)',
    },
  },
  'pink-boxer': {
    id: 'pink-boxer',
    name: 'Pink Boxer',
    description: 'Full Pink theme',
    colors: {
      primary: '#ec4899',
      primaryFrom: '#f9a8d4', // pink-300
      primaryTo: '#ec4899',   // pink-500

      accent: '#f472b6',      // pink-400
      accentLight: '#fbcfe8', // pink-200

      bgPrimary: '#fdf2f8',   // pink-50
      bgSecondary: '#fce7f3', // pink-100
      bgTertiary: '#fbcfe8',  // pink-200

      textPrimary: '#831843', // pink-900
      textSecondary: '#9f1239', // rose-800

      border: 'rgba(236, 72, 153, 0.3)', // pink-500 with opacity
      borderLight: 'rgba(249, 168, 212, 0.2)', // pink-300 with opacity

      shadow: 'rgba(236, 72, 153, 0.4)',
    },
  },
};

export const defaultTheme: ThemeId = 'glamour';
