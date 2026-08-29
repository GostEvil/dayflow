import type { Task, TimeBlock } from '../types';

const syncBase = import.meta.env.VITE_SYNC_URL || '';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${syncBase}${path}`, { ...options, headers: { 'content-type': 'application/json', ...options?.headers } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.error || `Sync request failed (${response.status})`);
    (error as Error & { code?: string }).code = body.code;
    throw error;
  }
  return body as T;
}

export interface SyncStatus {
  google: { configured: boolean; connected: boolean };
  notion: { configured: boolean };
  sync: {
    lastSyncAt: string | null;
    lastError: string | null;
    lastErrorAt: string | null;
    lastSource: 'google' | 'notion' | null;
    conflicts: {
      google: { count: number; lastAt: string | null; lastMessage: string | null; lastEntityId: string | null };
      notion: { count: number; lastAt: string | null; lastMessage: string | null; lastEntityId: string | null };
    };
    google: { lastAttemptAt: string | null; lastSuccessAt: string | null; lastError: string | null };
    notion: { lastAttemptAt: string | null; lastSuccessAt: string | null; lastError: string | null };
  };
}

export function getSyncStatus() { return request<SyncStatus>('/api/sync/status'); }
export function connectGoogle() { window.location.assign(`${syncBase}/auth/google`); }
export function syncGoogleBlock(block: TimeBlock) {
  return request<{ googleEventId: string; etag?: string }>('/api/google/events', {
    method: 'POST',
    body: JSON.stringify({ ...block, ifMatchEtag: block.googleEtag || null }),
  });
}
export function deleteGoogleEvent(eventId: string) { return request<{ ok: true }>(`/api/google/events/${encodeURIComponent(eventId)}`, { method: 'DELETE' }); }
export function syncNotionTask(task: Task) { return request<{ notionPageId: string }>('/api/notion/tasks', { method: 'POST', body: JSON.stringify(task) }); }
export function deleteNotionTask(pageId: string) { return request<{ ok: true }>(`/api/notion/tasks/${encodeURIComponent(pageId)}`, { method: 'DELETE' }); }

export function pullGoogleEvents() {
  return request<{
    events: Array<{
      id: string;
      status?: string;
      etag?: string;
      summary?: string;
      start?: { date?: string; dateTime?: string };
      end?: { date?: string; dateTime?: string };
    }>;
  }>('/api/google/events');
}

export function pullNotionPages() {
  return request<{ pages: Array<{ id: string; properties: Record<string, any> }> }>('/api/notion/tasks');
}