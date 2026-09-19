import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export const baseLightColors = {
  background: '#ffffff',
  card: '#ffffff',
  cardBorder: '#e5e5e5',
  text: '#000000',
  textSecondary: '#525252',
  textMuted: '#a3a3a3',
  inputBg: '#f5f5f5',
  inputBorder: '#e5e5e5',
  inputText: '#000000',
  headerBg: '#ffffff',
  headerText: '#000000',
  tabBg: '#ffffff',
  tabBorder: '#e5e5e5',
  tabInactive: '#a3a3a3',
  divider: '#e5e5e5',
  dangerBg: '#fff1f2',
  dangerBorder: '#fecdd3',
  dangerText: '#e11d48',
  successBg: '#ecfdf5',
  successBorder: '#a7f3d0',
  successText: '#059669',
  warningBg: '#fffbeb',
  warningBorder: '#fde68a',
  warningText: '#d97706',
  completedCard: '#fafafa',
  completedCardBorder: '#e5e5e5',
  pillBg: '#f5f5f5',
  pillText: '#525252',
  cardShadow: '#000000',
  statusBar: 'dark',
};

export const baseDarkColors = {
  background: '#000000',
  card: '#0a0a0a',
  cardBorder: '#262626',
  text: '#ffffff',
  textSecondary: '#a3a3a3',
  textMuted: '#737373',
  inputBg: '#0a0a0a',
  inputBorder: '#262626',
  inputText: '#ffffff',
  headerBg: '#000000',
  headerText: '#ffffff',
  tabBg: '#000000',
  tabBorder: '#262626',
  tabInactive: '#737373',
  divider: '#262626',
  dangerBg: '#3f121d',
  dangerBorder: '#881337',
  dangerText: '#fda4af',
  successBg: '#063826',
  successBorder: '#065f46',
  successText: '#6ee7b7',
  warningBg: '#3a2507',
  warningBorder: '#78350f',
  warningText: '#fde68a',
  completedCard: '#0a0a0a',
  completedCardBorder: '#171717',
  pillBg: '#262626',
  pillText: '#d4d4d4',
  cardShadow: '#000000',
  statusBar: 'light',
};

const themePalettes = {
  'tickthetask-lime': {
    light: { primary: '#65a30d', primaryLight: '#f7fee7', primaryBorder: '#d9f99d', primaryText: '#65a30d', tabActive: '#65a30d' },
    dark: { primary: '#84cc16', primaryLight: '#1a2e05', primaryBorder: '#4d7c0f', primaryText: '#bef264', tabActive: '#84cc16' }
  },
  'ocean-blue': {
    light: { primary: '#4f46e5', primaryLight: '#eef2ff', primaryBorder: '#c7d2fe', primaryText: '#4f46e5', tabActive: '#4f46e5' },
    dark: { primary: '#6366f1', primaryLight: '#1e1b4b', primaryBorder: '#4338ca', primaryText: '#a5b4fc', tabActive: '#818cf8' }
  },
  'emerald-green': {
    light: { primary: '#059669', primaryLight: '#ecfdf5', primaryBorder: '#a7f3d0', primaryText: '#059669', tabActive: '#059669' },
    dark: { primary: '#10b981', primaryLight: '#022c22', primaryBorder: '#047857', primaryText: '#6ee7b7', tabActive: '#34d399' }
  },
  'sunset-orange': {
    light: { primary: '#ea580c', primaryLight: '#fff7ed', primaryBorder: '#fed7aa', primaryText: '#ea580c', tabActive: '#ea580c' },
    dark: { primary: '#f97316', primaryLight: '#431407', primaryBorder: '#c2410c', primaryText: '#fdba74', tabActive: '#fb923c' }
  },
  'royal-purple': {
    light: { primary: '#9333ea', primaryLight: '#faf5ff', primaryBorder: '#e9d5ff', primaryText: '#9333ea', tabActive: '#9333ea' },
    dark: { primary: '#a855f7', primaryLight: '#3b0764', primaryBorder: '#7e22ce', primaryText: '#d8b4fe', tabActive: '#c084fc' }
  }
};

const THEME_STORAGE_KEY = 'tickthetask_theme_mode';
const COLOR_THEME_STORAGE_KEY = 'tickthetask_color_theme';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState('system');
  const [colorTheme, setColorThemeState] = useState('tickthetask-lime');

  useEffect(() => {
    async function loadStoredTheme() {
      try {
        const savedMode = await SecureStore.getItemAsync(THEME_STORAGE_KEY);
        if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
          setThemeModeState(savedMode);
        }
        const savedColor = await SecureStore.getItemAsync(COLOR_THEME_STORAGE_KEY);
        if (savedColor && themePalettes[savedColor]) {
          setColorThemeState(savedColor);
        }
      } catch (e) {
        // Fallback gracefully without throwing
      }
    }
    loadStoredTheme();
  }, []);

  const setThemeMode = async (mode) => {
    try {
      setThemeModeState(mode);
      await SecureStore.setItemAsync(THEME_STORAGE_KEY, mode);
    } catch (e) {}
  };

  const setColorTheme = async (color) => {
    try {
      setColorThemeState(color);
      await SecureStore.setItemAsync(COLOR_THEME_STORAGE_KEY, color);
    } catch (e) {}
  };

  const isDark = themeMode === 'dark' || (themeMode === 'system' && systemColorScheme === 'dark');
  const currentPalette = themePalettes[colorTheme] || themePalettes['ocean-blue'];
  
  const colors = isDark 
    ? { ...baseDarkColors, ...currentPalette.dark }
    : { ...baseLightColors, ...currentPalette.light };

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        setThemeMode,
        isDark,
        colors,
        systemColorScheme,
        colorTheme,
        setColorTheme
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
