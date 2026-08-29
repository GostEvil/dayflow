import { STORAGE_KEYS, type BackupSnapshot } from '../types';

// ─── localStorage wrapper ────────────────────────────────────────────
export function getStorageItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function setStorageItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    scheduleBackup();
  } catch (e) {
    console.warn('localStorage write failed:', e);
  }
}

export function removeStorageItem(key: string): void {
  localStorage.removeItem(key);
}

// ─── Export / Import ─────────────────────────────────────────────────
export function exportAllData(): string {
  const data: Record<string, unknown> = {};
  for (const key of Object.values(STORAGE_KEYS)) {
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      try {
        data[key] = JSON.parse(raw);
      } catch {
        data[key] = raw;
      }
    }
  }
  return JSON.stringify(data, null, 2);
}

export function importAllData(jsonStr: string): { success: boolean; error?: string } {
  try {
    const data = JSON.parse(jsonStr);
    if (typeof data !== 'object' || data === null) {
      return { success: false, error: 'Invalid JSON structure' };
    }
    for (const [key, value] of Object.entries(data)) {
      localStorage.setItem(key, JSON.stringify(value));
    }
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to parse JSON' };
  }
}

export function clearAllData(): void {
  for (const key of Object.values(STORAGE_KEYS)) {
    localStorage.removeItem(key);
  }
}

// ─── Backup System ───────────────────────────────────────────────────
const MAX_BACKUPS = 5;
let backupTimeout: ReturnType<typeof setTimeout> | null = null;

function scheduleBackup() {
  if (backupTimeout) clearTimeout(backupTimeout);
  backupTimeout = setTimeout(() => {
    createBackup();
  }, 30000); // 30s debounce
}

export function createBackup(): void {
  try {
    const data: Record<string, unknown> = {};
    for (const key of Object.values(STORAGE_KEYS)) {
      if (key === STORAGE_KEYS.BACKUPS) continue;
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        try { data[key] = JSON.parse(raw); } catch { data[key] = raw; }
      }
    }

    const snapshot: BackupSnapshot = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      size: JSON.stringify(data).length,
      data,
    };

    const backups = getStorageItem<BackupSnapshot[]>(STORAGE_KEYS.BACKUPS, []);
    backups.unshift(snapshot);
    while (backups.length > MAX_BACKUPS) backups.pop();

    // Write directly to avoid triggering another backup
    localStorage.setItem(STORAGE_KEYS.BACKUPS, JSON.stringify(backups));
  } catch (e) {
    console.warn('Backup creation failed:', e);
  }
}

export function getBackups(): BackupSnapshot[] {
  return getStorageItem<BackupSnapshot[]>(STORAGE_KEYS.BACKUPS, []);
}

export function restoreBackup(backupId: string): boolean {
  const backups = getBackups();
  const backup = backups.find(b => b.id === backupId);
  if (!backup) return false;

  for (const [key, value] of Object.entries(backup.data)) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  return true;
}
