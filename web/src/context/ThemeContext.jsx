import React, { createContext, useContext, useState, useEffect } from 'react';

const THEME_KEY = 'tickthetask_theme_mode';
const COLOR_THEME_KEY = 'tickthetask_color_theme';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem(THEME_KEY) || 'system';
  });

  const [colorTheme, setColorThemeState] = useState(() => {
    return localStorage.getItem(COLOR_THEME_KEY) || 'tickthetask-lime';
  });

  const [systemDark, setSystemDark] = useState(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Listen to system OS dark mode changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setSystemDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const isDark = theme === 'dark' || (theme === 'system' && systemDark);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }
  }, [isDark]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-color-theme', colorTheme);
  }, [colorTheme]);

  const setTheme = (mode) => {
    setThemeState(mode);
    localStorage.setItem(THEME_KEY, mode);
  };

  const setColorTheme = (color) => {
    setColorThemeState(color);
    localStorage.setItem(COLOR_THEME_KEY, color);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark, systemDark, colorTheme, setColorTheme }}>
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
