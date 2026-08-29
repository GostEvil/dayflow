import { useEffect, useRef } from 'react';
import { getSyncStatus } from '../lib/sync-api';
import { syncPullGoogleEvents, syncPullNotionTasks } from '../lib/sync-manager';

const SYNC_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes

export function useAutoSync() {
  const isSyncingRef = useRef(false);

  useEffect(() => {
    let timerId: ReturnType<typeof setInterval> | null = null;

    const runSync = async () => {
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;
      try {
        const status = await getSyncStatus().catch(() => null);
        if (!status) return;

        if (status.google?.connected) {
          await syncPullGoogleEvents().catch(err => {
            console.warn('[AutoSync] Google Calendar pull failed:', err);
          });
        }

        if (status.notion?.configured) {
          await syncPullNotionTasks().catch(err => {
            console.warn('[AutoSync] Notion tasks pull failed:', err);
          });
        }
      } finally {
        isSyncingRef.current = false;
      }
    };

    // Run initial sync shortly after mount
    const initialTimeout = setTimeout(() => {
      void runSync();
    }, 1000);

    // Set periodic timer
    timerId = setInterval(() => {
      void runSync();
    }, SYNC_INTERVAL_MS);

    // Sync on tab focus / visibility
    const handleFocus = () => {
      void runSync();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      clearTimeout(initialTimeout);
      if (timerId) clearInterval(timerId);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);
}
