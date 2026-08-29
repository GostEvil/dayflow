import { useEffect, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { ThemeMode } from '../types';

export function useTheme() {
  const [theme, setTheme] = useLocalStorage<ThemeMode>('dayflow_theme', 'dark');

  const applyTheme = useCallback((mode: ThemeMode) => {
    const root = document.documentElement;
    const isDark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  }, []);

  useEffect(() => {
    applyTheme(theme);

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme('system');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [theme, applyTheme]);

  return { theme, setTheme };
}
