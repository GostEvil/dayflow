import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue(prev => {
      const newValue = value instanceof Function ? value(prev) : value;
      try {
        localStorage.setItem(key, JSON.stringify(newValue));
        window.dispatchEvent(new CustomEvent('local-storage-update', { detail: { key, newValue } }));
      } catch (e) {
        console.warn('Failed to save to localStorage:', e);
      }
      return newValue;
    });
  }, [key]);

  // Sync across tabs and same-tab components
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue) as T);
        } catch { /* ignore */ }
      }
    };

    const handleCustomEvent = (e: Event) => {
      const detail = (e as CustomEvent<{ key: string; newValue: T }>).detail;
      if (detail && detail.key === key) {
        setStoredValue(detail.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('local-storage-update', handleCustomEvent);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage-update', handleCustomEvent);
    };
  }, [key]);

  return [storedValue, setValue];
}
