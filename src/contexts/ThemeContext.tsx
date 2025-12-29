import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeVariant = 'cyan-glass' | 'neon-hex';

interface ThemeContextType {
  theme: ThemeVariant;
  setTheme: (theme: ThemeVariant) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'dealmetrics-theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeVariant>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'cyan-glass' || stored === 'neon-hex') {
        return stored;
      }
    }
    return 'cyan-glass';
  });

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    
    // Remove all theme classes and add the current one
    document.documentElement.classList.remove('theme-cyan-glass', 'theme-neon-hex');
    document.documentElement.classList.add(`theme-${theme}`);
  }, [theme]);

  const setTheme = (newTheme: ThemeVariant) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
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
