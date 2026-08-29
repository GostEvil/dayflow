import { STORAGE_KEYS, type Task, type TimeBlock } from '../types';
import { pullGoogleEvents, pullNotionPages } from './sync-api';

function updateLocalStorage<T>(key: string, newValue: T) {
  localStorage.setItem(key, JSON.stringify(newValue));
  window.dispatchEvent(new CustomEvent('local-storage-update', { detail: { key, newValue } }));
}

export async function syncPullGoogleEvents(): Promise<{ importedCount: number; updatedCount: number; deletedCount: number }> {
  const result = await pullGoogleEvents();
  const rawCurrent = localStorage.getItem(STORAGE_KEYS.TIME_BLOCKS);
  const currentBlocks: TimeBlock[] = rawCurrent ? JSON.parse(rawCurrent) : [];

  const remoteMap = new Map<string, typeof result.events[number]>();
  for (const ev of result.events) {
    if (ev.id) remoteMap.set(ev.id, ev);
  }

  // Window bounds (30 days ago to 90 days ahead)
  const now = new Date();
  const minWindowDate = new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10);
  const maxWindowDate = new Date(now.getTime() + 90 * 86400000).toISOString().slice(0, 10);

  let updatedCount = 0;
  let deletedCount = 0;
  let importedCount = 0;

  const matchedRemoteIds = new Set<string>();
  const nextBlocks: TimeBlock[] = [];

  for (const block of currentBlocks) {
    if (block.isGoogleEvent && block.googleEventId) {
      const remote = remoteMap.get(block.googleEventId);
      if (remote) {
        matchedRemoteIds.add(block.googleEventId);
        if (remote.status === 'cancelled') {
          deletedCount++;
          continue; // Event was cancelled/deleted on Google
        }
        const start = remote.start?.dateTime;
        const end = remote.end?.dateTime;
        const remoteTitle = remote.summary || 'Google event';

        if (start && end) {
          const remoteDate = start.slice(0, 10);
          const remoteStart = start.slice(11, 16);
          const remoteEnd = end.slice(11, 16);
          const remoteEtag = remote.etag || block.googleEtag || null;

          if (
            block.title !== remoteTitle ||
            block.date !== remoteDate ||
            block.startTime !== remoteStart ||
            block.endTime !== remoteEnd ||
            block.googleEtag !== remoteEtag
          ) {
            updatedCount++;
            nextBlocks.push({
              ...block,
              title: remoteTitle,
              date: remoteDate,
              startTime: remoteStart,
              endTime: remoteEnd,
              googleEtag: remoteEtag,
            });
          } else {
            nextBlocks.push(block);
          }
        } else {
          nextBlocks.push(block);
        }
      } else {
        // Not in remote map. If block date falls within query window, it was deleted on Google Calendar.
        if (block.date >= minWindowDate && block.date <= maxWindowDate) {
          deletedCount++;
          // Skip pushing -> removes local block
        } else {
          nextBlocks.push(block);
        }
      }
    } else {
      nextBlocks.push(block);
    }
  }

  // Add new active remote events that aren't in local storage yet
  for (const [eventId, remote] of remoteMap.entries()) {
    if (matchedRemoteIds.has(eventId)) continue;
    if (remote.status === 'cancelled') continue;
    const start = remote.start?.dateTime;
    const end = remote.end?.dateTime;
    if (!start || !end) continue;

    const newBlock: TimeBlock = {
      id: crypto.randomUUID(),
      title: remote.summary || 'Google event',
      category: 'meeting',
      date: start.slice(0, 10),
      startTime: start.slice(11, 16),
      endTime: end.slice(11, 16),
      isGoogleEvent: true,
      googleEventId: remote.id,
      googleEtag: remote.etag || null,
      createdAt: new Date().toISOString(),
    };
    nextBlocks.push(newBlock);
    importedCount++;
  }

  updateLocalStorage(STORAGE_KEYS.TIME_BLOCKS, nextBlocks);

  return { importedCount, updatedCount, deletedCount };
}

export async function syncPullNotionTasks(): Promise<{ checkedCount: number; importedCount: number }> {
  const result = await pullNotionPages();
  const titleProperty = import.meta.env.VITE_NOTION_TITLE_PROPERTY || 'Name';
  const rawCurrent = localStorage.getItem(STORAGE_KEYS.TASKS);
  const currentTasks: Task[] = rawCurrent ? JSON.parse(rawCurrent) : [];
  const existingNotionIds = new Set(currentTasks.map(t => t.notionPageId).filter(Boolean));

  let importedCount = 0;
  const newTasks: Task[] = [];

  for (const page of result.pages) {
    if (existingNotionIds.has(page.id)) continue;
    const title = page.properties[titleProperty]?.title?.[0]?.plain_text || 'Notion task';
    newTasks.push({
      id: crypto.randomUUID(),
      notionPageId: page.id,
      title,
      description: '',
      status: 'today',
      priority: 'medium',
      category: 'other',
      dueDate: null,
      dueTime: null,
      createdAt: new Date().toISOString(),
      completedAt: null,
      isInbox: false,
    });
    importedCount++;
  }

  if (newTasks.length > 0) {
    updateLocalStorage(STORAGE_KEYS.TASKS, [...currentTasks, ...newTasks]);
  }

  return { checkedCount: result.pages.length, importedCount };
}
