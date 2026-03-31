// =============================================================================
// CONTEXT PATTERN — ThemeContext
//
// Provides dark/light mode across the entire tree without prop drilling.
// Pattern: create → provide → consume (useContext)
// =============================================================================

import { createContext, useContext, useState, useCallback, useMemo } from 'react';

const ThemeContext = createContext(null);

const themes = {
  light: {
    name: 'light',
    bg: '#f8f0ff',
    surface: '#ffffff',
    surfaceAlt: '#fdf4ff',
    border: '#e9d5ff',
    text: '#1a1a2e',
    textMuted: '#6b7280',
    primary: '#e91e8c',
    primaryDark: '#c2185b',
    secondary: '#7c3aed',
    accent: '#f59e0b',
    success: '#10b981',
    danger: '#ef4444',
    gradient: 'linear-gradient(135deg, #e91e8c, #7c3aed)',
    cardShadow: '0 8px 32px rgba(233, 30, 140, 0.15)',
  },
  dark: {
    name: 'dark',
    bg: '#0f0a1a',
    surface: '#1a1030',
    surfaceAlt: '#221540',
    border: '#3d2d6b',
    text: '#f1f0ff',
    textMuted: '#9ca3af',
    primary: '#e91e8c',
    primaryDark: '#c2185b',
    secondary: '#a78bfa',
    accent: '#fbbf24',
    success: '#34d399',
    danger: '#f87171',
    gradient: 'linear-gradient(135deg, #e91e8c, #7c3aed)',
    cardShadow: '0 8px 32px rgba(124, 58, 237, 0.3)',
  },
};

// Custom provider component — wraps the app and manages theme state
export function ThemeProvider({ children }) {
  const [themeName, setThemeName] = useState('light');

  // useCallback prevents toggle function from being recreated on every render
  const toggleTheme = useCallback(() => {
    setThemeName(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  // useMemo so the context value object doesn't trigger unnecessary re-renders
  // in consumers — only re-creates when themeName changes
  const value = useMemo(() => ({
    theme: themes[themeName],
    toggleTheme,
    isDark: themeName === 'dark',
  }), [themeName, toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook — encapsulates the useContext call and provides a clear error
// if a component tries to use theme outside of the provider
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
