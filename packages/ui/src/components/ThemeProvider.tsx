/**
 * Jastip Design System - Theme Configuration
 * 
 * Mengelola dark/light mode dan customisasi warna untuk seluruh aplikasi.
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children, defaultTheme = 'system' }: { children: ReactNode; defaultTheme?: Theme }) {
  const [storedTheme, setStoredTheme] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('jastip-theme') as Theme | null;
      if (saved) setStoredTheme(saved);
      updateResolvedTheme(saved || defaultTheme);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    updateResolvedTheme(storedTheme);
  }, [storedTheme, mounted]);

  const updateResolvedTheme = (theme: Theme) => {
    if (typeof window === 'undefined') return;

    if (theme === 'system') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setResolvedTheme(systemPrefersDark ? 'dark' : 'light');
    } else {
      setResolvedTheme(theme);
    }
    localStorage.setItem('jastip-theme', theme);
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
  };

  const setTheme = (theme: Theme) => {
    setStoredTheme(theme);
    updateResolvedTheme(theme);
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'light' ? 'dark' : 'light');
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme: resolvedTheme, setTheme, isDark: resolvedTheme === 'dark', toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}