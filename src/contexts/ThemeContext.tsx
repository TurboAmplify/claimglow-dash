import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeVariant = 'cyan-glass' | 'neon-hex' | 'amber-glow' | 'liquid-chrome' | 'violet-dew' | 'ocean-depth';
export type DensityVariant = 'comfortable' | 'compact';

interface ThemeContextType {
  theme: ThemeVariant;
  setTheme: (theme: ThemeVariant) => void;
  density: DensityVariant;
  setDensity: (density: DensityVariant) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'dealmetrics-theme';
const DENSITY_STORAGE_KEY = 'dealmetrics-density';

const validThemes: ThemeVariant[] = ['cyan-glass', 'neon-hex', 'amber-glow', 'liquid-chrome', 'violet-dew', 'ocean-depth'];
const validDensities: DensityVariant[] = ['comfortable', 'compact'];

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

  const [density, setDensityState] = useState<DensityVariant>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(DENSITY_STORAGE_KEY);
      if (stored && validDensities.includes(stored as DensityVariant)) {
        return stored as DensityVariant;
      }
    }
    return 'comfortable';
  });

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    
    // Remove all theme classes and add the current one
    document.documentElement.classList.remove('theme-cyan-glass', 'theme-neon-hex', 'theme-amber-glow', 'theme-liquid-chrome', 'theme-violet-dew', 'theme-ocean-depth');
    document.documentElement.classList.add(`theme-${theme}`);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(DENSITY_STORAGE_KEY, density);
    
    // Remove all density classes and add the current one
    document.documentElement.classList.remove('density-comfortable', 'density-compact');
    document.documentElement.classList.add(`density-${density}`);
  }, [density]);

  const setTheme = (newTheme: ThemeVariant) => {
    setThemeState(newTheme);
  };

  const setDensity = (newDensity: DensityVariant) => {
    setDensityState(newDensity);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, density, setDensity }}>
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
