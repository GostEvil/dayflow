import { useEffect, useCallback } from 'react';

type KeyCombo = string; // e.g. 'ctrl+k', 'ctrl+shift+n'

export function useKeyboardShortcut(combo: KeyCombo, callback: () => void, enabled = true) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;

    const parts = combo.toLowerCase().split('+');
    const key = parts[parts.length - 1];
    const needCtrl = parts.includes('ctrl') || parts.includes('cmd');
    const needShift = parts.includes('shift');
    const needAlt = parts.includes('alt');

    const ctrlMatch = needCtrl ? (e.ctrlKey || e.metaKey) : !(e.ctrlKey || e.metaKey);
    const shiftMatch = needShift ? e.shiftKey : !e.shiftKey;
    const altMatch = needAlt ? e.altKey : !e.altKey;
    const keyMatch = e.key.toLowerCase() === key || e.code.toLowerCase() === `key${key}`;

    if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
      e.preventDefault();
      callback();
    }
  }, [combo, callback, enabled]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
