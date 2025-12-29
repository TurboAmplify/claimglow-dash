import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeVariant = 'cyan-glass' | 'neon-hex' | 'amber-glow';

interface ThemeContextType {
  theme: ThemeVariant;
  setTheme: (theme: ThemeVariant) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'dealmetrics-theme';

const validThemes: ThemeVariant[] = ['cyan-glass', 'neon-hex', 'amber-glow'];

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeVariant>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored && validThemes.includes(stored as ThemeVariant)) {
        return stored as ThemeVariant;
      }
    }
    return 'cyan-glass';
  });

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    
    // Remove all theme classes and add the current one
    document.documentElement.classList.remove('theme-cyan-glass', 'theme-neon-hex', 'theme-amber-glow');
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
