'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Theme, ThemeId, themes, defaultTheme } from '@/lib/themes/theme-config';

interface ThemeContextType {
  theme: Theme;
  themeId: ThemeId;
  setTheme: (themeId: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>(defaultTheme);
  const [mounted, setMounted] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') as ThemeId;
    if (savedTheme && themes[savedTheme]) {
      setThemeId(savedTheme);
    }
    setMounted(true);
  }, []);

  // Apply theme CSS variables
  useEffect(() => {
    if (!mounted) return;

    const theme = themes[themeId];
    const root = document.documentElement;

    // Helper function to convert hex to RGB
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
        : '0, 0, 0';
    };

    // Apply CSS variables
    root.style.setProperty('--color-primary', theme.colors.primary);
    root.style.setProperty('--color-primary-from', theme.colors.primaryFrom);
    root.style.setProperty('--color-primary-to', theme.colors.primaryTo);
    root.style.setProperty('--color-accent', theme.colors.accent);
    root.style.setProperty('--color-accent-light', theme.colors.accentLight);
    root.style.setProperty('--color-bg-primary', theme.colors.bgPrimary);
    root.style.setProperty('--color-bg-secondary', theme.colors.bgSecondary);
    root.style.setProperty('--color-bg-tertiary', theme.colors.bgTertiary);
    root.style.setProperty('--color-text-primary', theme.colors.textPrimary);
    root.style.setProperty('--color-text-secondary', theme.colors.textSecondary);
    root.style.setProperty('--color-border', theme.colors.border);
    root.style.setProperty('--color-border-light', theme.colors.borderLight);
    root.style.setProperty('--color-shadow', theme.colors.shadow);

    // Set RGB versions for opacity support
    root.style.setProperty('--color-bg-primary-rgb', hexToRgb(theme.colors.bgPrimary));
    root.style.setProperty('--color-bg-secondary-rgb', hexToRgb(theme.colors.bgSecondary));
    root.style.setProperty('--color-bg-tertiary-rgb', hexToRgb(theme.colors.bgTertiary));

    // Save to localStorage
    localStorage.setItem('app-theme', themeId);
  }, [themeId, mounted]);

  const handleSetTheme = (newThemeId: ThemeId) => {
    setThemeId(newThemeId);
  };

  const value: ThemeContextType = {
    theme: themes[themeId],
    themeId,
    setTheme: handleSetTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
