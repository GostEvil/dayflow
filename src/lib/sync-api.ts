import type { Task, TimeBlock } from '../types';

const syncBase = import.meta.env.VITE_SYNC_URL || '';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${syncBase}${path}`, { ...options, headers: { 'content-type': 'application/json', ...options?.headers } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `Sync request failed (${response.status})`);
  return body as T;
}

export interface SyncStatus {
  google: { configured: boolean; connected: boolean };
  notion: { configured: boolean };
  sync: { lastSyncAt: string | null; lastError: string | null };
}

export function getSyncStatus() { return request<SyncStatus>('/api/sync/status'); }
export function connectGoogle() { window.location.assign(`${syncBase}/auth/google`); }
export function syncGoogleBlock(block: TimeBlock) { return request<{ googleEventId: string }>('/api/google/events', { method: 'POST', body: JSON.stringify(block) }); }
export function deleteGoogleEvent(eventId: string) { return request<{ ok: true }>(`/api/google/events/${encodeURIComponent(eventId)}`, { method: 'DELETE' }); }
export function syncNotionTask(task: Task) { return request<{ notionPageId: string }>('/api/notion/tasks', { method: 'POST', body: JSON.stringify(task) }); }
export function deleteNotionTask(pageId: string) { return request<{ ok: true }>(`/api/notion/tasks/${encodeURIComponent(pageId)}`, { method: 'DELETE' }); }

export function pullGoogleEvents() {
  return request<{ events: Array<{ id: string; summary?: string; start?: { date?: string; dateTime?: string }; end?: { date?: string; dateTime?: string } }> }>('/api/google/events');
}

export function pullNotionPages() {
  return request<{ pages: Array<{ id: string; properties: Record<string, any> }> }>('/api/notion/tasks');
}