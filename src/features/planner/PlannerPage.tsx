import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { v4 as uuid } from 'uuid';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import type { TimeBlock, TimeBlockCategory } from '../../types';
import { STORAGE_KEYS } from '../../types';
import { getWeekDates, format, addDays, formatTime, dateStr } from '../../lib/date-utils';
import { deleteGoogleEvent, syncGoogleBlock } from '../../lib/sync-api';
import { Button } from '../../components/ui/Button';

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 6am - 9pm
const CATEGORY_COLORS: Record<TimeBlockCategory, string> = {
  'deep-work': 'bg-glow/20 border-glow/40 text-glow',
  meeting: 'bg-pulse/20 border-pulse/40 text-pulse',
  exercise: 'bg-success/20 border-success/40 text-success',
  personal: 'bg-ember/20 border-ember/40 text-ember',
  study: 'bg-[#818CF8]/20 border-[#818CF8]/40 text-[#818CF8]',
  break: 'bg-drift/20 border-drift/40 text-drift',
  other: 'bg-surface-2 border-border text-text-secondary',
};

const minutesToTimeStr = (minsFrom6AM: number): string => {
  const totalMins = Math.max(0, Math.min(16 * 60, minsFrom6AM)) + 6 * 60;
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

const formatDuration = (mins: number): string => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

export function PlannerPage() {
  const [now, setNow] = useState(() => new Date());
  const [timeBlocks, setTimeBlocks] = useLocalStorage<TimeBlock[]>(STORAGE_KEYS.TIME_BLOCKS, []);
  const [syncNotice, setSyncNotice] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const currentMinutesFrom6 = (now.getHours() - 6) * 60 + now.getMinutes();
  const [showNew, setShowNew] = useState(false);
  const [editBlock, setEditBlock] = useState<TimeBlock | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<TimeBlockCategory>('deep-work');
  const [newDate, setNewDate] = useState('');
  const [newStart, setNewStart] = useState('09:00');
  const [newEnd, setNewEnd] = useState('10:00');

  const [dragSelection, setDragSelection] = useState<{
    date: string;
    startMins: number;
    currentMins: number;
  } | null>(null);

  const baseDate = useMemo(() => addDays(new Date(), weekOffset * 7), [weekOffset]);
  const weekDates = useMemo(() => getWeekDates(baseDate), [baseDate]);

  const getBlocksForDate = (date: string) => timeBlocks.filter(b => b.date === date).sort((a, b) => a.startTime.localeCompare(b.startTime));

  const showSyncNotice = (type: 'error' | 'success', text: string) => {
    setSyncNotice({ type, text });
    setTimeout(() => setSyncNotice(null), 4000);
  };

  const isGoogleConflict = (error: unknown) => {
    if (!(error instanceof Error)) return false;
    const err = error as Error & { code?: string };
    return err.code === 'GOOGLE_ETAG_CONFLICT';
  };

  const addBlock = () => {
    if (!newTitle.trim()) return;
    const block: TimeBlock = {
      id: uuid(), title: newTitle.trim(), category: newCategory,
      date: newDate || dateStr(weekDates[0]),
      startTime: newStart, endTime: newEnd,
      isGoogleEvent: false, googleEventId: null,
      createdAt: new Date().toISOString(),
    };
    setTimeBlocks(prev => [...prev, block]);
    void syncGoogleBlock(block).then(result => {
      setTimeBlocks(prev => prev.map(item => item.id === block.id ? { ...item, isGoogleEvent: true, googleEventId: result.googleEventId, googleEtag: result.etag || item.googleEtag || null } : item));
    }).catch(() => showSyncNotice('error', 'Failed to sync new block to Google Calendar.'));
    setShowNew(false);
    setNewTitle('');
  };

  const saveEdit = () => {
    if (!editBlock) return;
    const nextBlock = editBlock;
    const previousBlock = timeBlocks.find(item => item.id === nextBlock.id) || null;
    setTimeBlocks(prev => prev.map(b => b.id === nextBlock.id ? nextBlock : b));
    void syncGoogleBlock(nextBlock).then(result => {
      setTimeBlocks(prev => prev.map(item => item.id === nextBlock.id ? { ...item, isGoogleEvent: true, googleEventId: result.googleEventId, googleEtag: result.etag || item.googleEtag || null } : item));
    }).catch(error => {
      if (isGoogleConflict(error)) {
        if (previousBlock) {
          setTimeBlocks(prev => prev.map(item => item.id === nextBlock.id ? previousBlock : item));
        }
        showSyncNotice('error', 'Conflict detected: event changed in Google Calendar. Please import/refresh and retry.');
        return;
      }
      showSyncNotice('error', 'Failed to sync changes to Google Calendar.');
    });
    setEditBlock(null);
  };

  const deleteBlock = (id: string) => {
    const block = timeBlocks.find(item => item.id === id);
    setTimeBlocks(prev => prev.filter(b => b.id !== id));
    if (block?.googleEventId) void deleteGoogleEvent(block.googleEventId).catch(() => undefined);
    if (editBlock?.id === id) setEditBlock(null);
  };

  const getBlockPosition = (block: TimeBlock) => {
    const [sh, sm] = block.startTime.split(':').map(Number);
    const [eh, em] = block.endTime.split(':').map(Number);
    const startMinutes = (sh - 6) * 60 + sm;
    const endMinutes = (eh - 6) * 60 + em;
    return { top: startMinutes, height: Math.max(endMinutes - startMinutes, 15) };
  };

  const getMinuteOffsetFromPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const clampedY = Math.max(0, Math.min(rect.height, offsetY));
    const snappedY = Math.round(clampedY / 15) * 15;
    return Math.max(0, Math.min(HOURS.length * 60, snappedY));
  };

  const handlePointerDown = (ds: string, e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const mins = getMinuteOffsetFromPointer(e);
    setDragSelection({
      date: ds,
      startMins: mins,
      currentMins: mins,
    });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragSelection) return;
    const mins = getMinuteOffsetFromPointer(e);
    setDragSelection(prev => (prev ? { ...prev, currentMins: mins } : null));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragSelection) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    const minMins = Math.min(dragSelection.startMins, dragSelection.currentMins);
    let maxMins = Math.max(dragSelection.startMins, dragSelection.currentMins);

    if (maxMins - minMins < 15) {
      maxMins = Math.min(HOURS.length * 60, minMins + 60);
    }

    const startStr = minutesToTimeStr(minMins);
    const endStr = minutesToTimeStr(maxMins);

    setNewDate(dragSelection.date);
    setNewStart(startStr);
    setNewEnd(endStr);
    setNewTitle('');
    setShowNew(true);
    setDragSelection(null);
  };

  const handlePointerCancel = () => {
    setDragSelection(null);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
      {syncNotice && (
        <div className={`mb-4 px-4 py-2.5 rounded-xl text-sm border ${syncNotice.type === 'error' ? 'bg-danger/10 text-danger border-danger/30' : 'bg-success/10 text-success border-success/30'}`}>
          {syncNotice.text}
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-text">Planner</h1>
          <p className="text-sm text-text-muted mt-1">
            {format(weekDates[0], 'MMM d')} – {format(weekDates[6], 'MMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setWeekOffset(0)} variant="outline" size="sm">Today</Button>
          <Button onClick={() => setWeekOffset(w => w - 1)} variant="ghost" size="icon" aria-label="Previous week">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button onClick={() => setWeekOffset(w => w + 1)} variant="ghost" size="icon" aria-label="Next week">
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button onClick={() => { setNewDate(dateStr(weekDates[0])); setShowNew(true); }} variant="secondary" icon={<Plus className="w-4 h-4" />}>
            Add Block
          </Button>
        </div>
      </div>

      {/* Weekly grid */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border">
          <div className="p-2" />
          {weekDates.map(date => {
            const isToday = dateStr(date) === dateStr(new Date());
            return (
              <div key={date.toISOString()} className={`p-3 text-center border-l border-border ${isToday ? 'bg-glow/5' : ''}`}>
                <div className="text-[10px] font-mono uppercase text-text-muted">{format(date, 'EEE')}</div>
                <div className={`text-lg font-mono font-bold ${isToday ? 'text-glow' : 'text-text'}`}>{format(date, 'd')}</div>
              </div>
            );
          })}
        </div>

        {/* Time grid */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] relative" style={{ height: HOURS.length * 60 }}>
          {/* Hour labels */}
          <div className="relative">
            {HOURS.map(h => (
              <div key={h} className="absolute left-0 right-0 flex items-start justify-end pr-2" style={{ top: (h - 6) * 60, height: 60 }}>
                <span className="text-[10px] font-mono text-text-muted -mt-1.5">{h.toString().padStart(2, '0')}:00</span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDates.map(date => {
            const ds = dateStr(date);
            const blocks = getBlocksForDate(ds);
            const isToday = ds === dateStr(now);
            return (
              <div
                key={ds}
                className={`relative border-l border-border select-none touch-none cursor-crosshair ${isToday ? 'bg-glow/[0.02]' : ''}`}
                onPointerDown={e => handlePointerDown(ds, e)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerCancel}
              >
                {/* Hour lines */}
                {HOURS.map(h => (
                  <div key={h} className="absolute left-0 right-0 border-t border-border/30 pointer-events-none" style={{ top: (h - 6) * 60 }} />
                ))}

                {/* Current time indicator line */}
                {isToday && currentMinutesFrom6 >= 0 && currentMinutesFrom6 <= HOURS.length * 60 && (
                  <div
                    className="absolute left-0 right-0 z-30 pointer-events-none"
                    style={{ top: currentMinutesFrom6 }}
                  >
                    <div className="w-full h-[2px] bg-danger" />
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-danger shadow-sm shadow-danger/50" />
                  </div>
                )}

                {/* Live Drag Selection Preview */}
                {dragSelection && dragSelection.date === ds && (() => {
                  const minMins = Math.min(dragSelection.startMins, dragSelection.currentMins);
                  const rawDiff = Math.abs(dragSelection.currentMins - dragSelection.startMins);
                  const durationMins = rawDiff < 15 ? 60 : rawDiff;
                  const maxMins = Math.min(HOURS.length * 60, minMins + durationMins);
                  const height = Math.max(durationMins, 15);
                  const startStr = minutesToTimeStr(minMins);
                  const endStr = minutesToTimeStr(maxMins);

                  return (
                    <div
                      className="absolute left-1 right-1 rounded-lg border-2 border-glow bg-glow/20 text-glow px-2.5 py-1.5 z-20 pointer-events-none overflow-hidden shadow-lg shadow-glow/10"
                      style={{ top: minMins, height }}
                    >
                      <div className="flex items-center justify-between text-[11px] font-semibold">
                        <span className="truncate">New Block</span>
                        <span className="text-[9px] font-mono font-bold bg-glow/30 text-glow px-1.5 py-0.5 rounded ml-1 shrink-0">
                          {formatDuration(durationMins)}
                        </span>
                      </div>
                      {height >= 30 && (
                        <div className="text-[10px] font-mono font-medium opacity-90 mt-0.5">
                          {formatTime(startStr)} – {formatTime(endStr)}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Blocks */}
                {blocks.map(block => {
                  const pos = getBlockPosition(block);
                  return (
                    <div
                      key={block.id}
                      className={`absolute left-1 right-1 rounded-lg border px-2 py-1 cursor-pointer transition-opacity hover:opacity-90 overflow-hidden ${CATEGORY_COLORS[block.category]}`}
                      style={{ top: pos.top, height: pos.height }}
                      onPointerDown={e => e.stopPropagation()}
                      onClick={e => {
                        e.stopPropagation();
                        setEditBlock(block);
                      }}
                    >
                      <div className="text-[11px] font-medium truncate">{block.title}</div>
                      {pos.height >= 30 && (
                        <div className="text-[9px] opacity-70 font-mono">{formatTime(block.startTime)} – {formatTime(block.endTime)}</div>
                      )}
                      {block.isGoogleEvent && (
                        <div className="text-[8px] mt-0.5 opacity-50">📅 Google</div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* New Block Modal */}
      <AnimatePresence>
        {showNew && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setShowNew(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-md z-50">
              <div className="bg-surface border border-border rounded-2xl p-6 m-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-lg font-bold text-text">New Time Block</h2>
                  <button onClick={() => setShowNew(false)} className="p-1 hover:bg-surface-2 rounded-lg text-text-muted"><X className="w-4 h-4" /></button>
                </div>
                <div className="space-y-3">
                  <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Block title" autoFocus
                    className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-sm text-text outline-none placeholder:text-text-muted focus:border-glow/30" />
                  <select value={newCategory} onChange={e => setNewCategory(e.target.value as TimeBlockCategory)}
                    className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm text-text outline-none">
                    <option value="deep-work">Deep Work</option><option value="meeting">Meeting</option>
                    <option value="exercise">Exercise</option><option value="personal">Personal</option>
                    <option value="study">Study</option><option value="break">Break</option><option value="other">Other</option>
                  </select>
                  <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
                    className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm text-text outline-none" />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="time" value={newStart} onChange={e => setNewStart(e.target.value)}
                      className="bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm text-text font-mono outline-none" />
                    <input type="time" value={newEnd} onChange={e => setNewEnd(e.target.value)}
                      className="bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm text-text font-mono outline-none" />
                  </div>
                  <button onClick={addBlock} disabled={!newTitle.trim()}
                    className="w-full py-2.5 bg-glow text-void font-semibold rounded-xl hover:bg-glow/90 disabled:opacity-40 transition-colors">
                    Create Block
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Edit Block Modal */}
      <AnimatePresence>
        {editBlock && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setEditBlock(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-md z-50">
              <div className="bg-surface border border-border rounded-2xl p-6 m-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-lg font-bold text-text">Edit Block</h2>
                  <button onClick={() => setEditBlock(null)} className="p-1 hover:bg-surface-2 rounded-lg text-text-muted"><X className="w-4 h-4" /></button>
                </div>
                <div className="space-y-3">
                  <input type="text" value={editBlock.title} onChange={e => setEditBlock({ ...editBlock, title: e.target.value })}
                    className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-sm text-text outline-none focus:border-glow/30" />
                  <select value={editBlock.category} onChange={e => setEditBlock({ ...editBlock, category: e.target.value as TimeBlockCategory })}
                    className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm text-text outline-none">
                    <option value="deep-work">Deep Work</option><option value="meeting">Meeting</option>
                    <option value="exercise">Exercise</option><option value="personal">Personal</option>
                    <option value="study">Study</option><option value="break">Break</option><option value="other">Other</option>
                  </select>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="time" value={editBlock.startTime} onChange={e => setEditBlock({ ...editBlock, startTime: e.target.value })}
                      className="bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm text-text font-mono outline-none" />
                    <input type="time" value={editBlock.endTime} onChange={e => setEditBlock({ ...editBlock, endTime: e.target.value })}
                      className="bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm text-text font-mono outline-none" />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={saveEdit} className="flex-1 py-2.5 bg-glow text-void font-semibold rounded-xl hover:bg-glow/90 transition-colors">Save</button>
                    <button onClick={() => deleteBlock(editBlock.id)} className="px-4 py-2.5 bg-danger-muted text-danger rounded-xl hover:bg-danger/20 transition-colors">Delete</button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
