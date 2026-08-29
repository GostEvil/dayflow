import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { v4 as uuid } from 'uuid';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import type { TimeBlock, TimeBlockCategory } from '../../types';
import { STORAGE_KEYS } from '../../types';
import { getWeekDates, format, addDays, formatTime, dateStr } from '../../lib/date-utils';
import { deleteGoogleEvent, syncGoogleBlock } from '../../lib/sync-api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 6am - 9pm
const CATEGORY_COLORS: Record<TimeBlockCategory, string> = {
  'deep-work': 'bg-glow/15 border-glow/40 text-glow shadow-sm shadow-glow/5',
  meeting: 'bg-pulse/15 border-pulse/40 text-pulse shadow-sm shadow-pulse/5',
  exercise: 'bg-success/15 border-success/40 text-success shadow-sm shadow-success/5',
  personal: 'bg-ember/15 border-ember/40 text-ember shadow-sm shadow-ember/5',
  study: 'bg-[#818CF8]/15 border-[#818CF8]/40 text-[#818CF8] shadow-sm',
  break: 'bg-drift/15 border-drift/40 text-drift shadow-sm',
  other: 'bg-surface-2 border-border text-text-secondary shadow-sm',
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

  const getBlocksForDate = (date: string) =>
    timeBlocks.filter(b => b.date === date).sort((a, b) => a.startTime.localeCompare(b.startTime));

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
      id: uuid(),
      title: newTitle.trim(),
      category: newCategory,
      date: newDate || dateStr(weekDates[0]),
      startTime: newStart,
      endTime: newEnd,
      isGoogleEvent: false,
      googleEventId: null,
      createdAt: new Date().toISOString(),
    };
    setTimeBlocks(prev => [...prev, block]);
    void syncGoogleBlock(block)
      .then(result => {
        setTimeBlocks(prev =>
          prev.map(item =>
            item.id === block.id
              ? {
                  ...item,
                  isGoogleEvent: true,
                  googleEventId: result.googleEventId,
                  googleEtag: result.etag || item.googleEtag || null,
                }
              : item
          )
        );
      })
      .catch(() => showSyncNotice('error', 'Failed to sync new block to Google Calendar.'));
    setShowNew(false);
    setNewTitle('');
  };

  const saveEdit = () => {
    if (!editBlock) return;
    const nextBlock = editBlock;
    const previousBlock = timeBlocks.find(item => item.id === nextBlock.id) || null;
    setTimeBlocks(prev => prev.map(b => (b.id === nextBlock.id ? nextBlock : b)));
    void syncGoogleBlock(nextBlock)
      .then(result => {
        setTimeBlocks(prev =>
          prev.map(item =>
            item.id === nextBlock.id
              ? {
                  ...item,
                  isGoogleEvent: true,
                  googleEventId: result.googleEventId,
                  googleEtag: result.etag || item.googleEtag || null,
                }
              : item
          )
        );
      })
      .catch(error => {
        if (isGoogleConflict(error)) {
          if (previousBlock) {
            setTimeBlocks(prev => prev.map(item => (item.id === nextBlock.id ? previousBlock : item)));
          }
          showSyncNotice(
            'error',
            'Conflict detected: event changed in Google Calendar. Please import/refresh and retry.'
          );
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
    return { top: startMinutes, height: Math.max(endMinutes - startMinutes, 20) };
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
    <div className="p-5 sm:p-8 lg:p-10 max-w-[1440px] mx-auto space-y-8">
      {syncNotice && (
        <div
          className={`px-4 py-3 rounded-2xl text-sm border font-medium ${
            syncNotice.type === 'error'
              ? 'bg-danger/10 text-danger border-danger/30'
              : 'bg-success/10 text-success border-success/30'
          }`}
        >
          {syncNotice.text}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-text tracking-tight">Planner</h1>
          <p className="text-sm text-text-muted mt-1 font-mono">
            {format(weekDates[0], 'MMMM d')} – {format(weekDates[6], 'MMMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-surface-2/80 border border-border/80 rounded-2xl p-1 shadow-sm">
            <button
              onClick={() => setWeekOffset(0)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-mono font-semibold text-text hover:bg-surface-3 transition-colors"
            >
              Today
            </button>
            <div className="w-[1px] h-4 bg-border mx-1" />
            <button
              onClick={() => setWeekOffset(w => w - 1)}
              className="p-1.5 rounded-xl text-text-muted hover:text-text hover:bg-surface-3 transition-colors"
              aria-label="Previous week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setWeekOffset(w => w + 1)}
              className="p-1.5 rounded-xl text-text-muted hover:text-text hover:bg-surface-3 transition-colors"
              aria-label="Next week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <Button
            onClick={() => {
              setNewDate(dateStr(weekDates[0]));
              setShowNew(true);
            }}
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
          >
            Add Block
          </Button>
        </div>
      </div>

      {/* Weekly Grid Board */}
      <div className="bg-surface/95 border border-border/80 rounded-3xl overflow-hidden shadow-sm">
        {/* Day Header Row */}
        <div className="grid grid-cols-[72px_repeat(7,1fr)] border-b border-border/70 bg-surface-2/30">
          <div className="p-3 border-r border-border/50" />
          {weekDates.map(date => {
            const isToday = dateStr(date) === dateStr(new Date());
            return (
              <div
                key={date.toISOString()}
                className={`py-3.5 px-2 text-center border-l border-border/50 first:border-l-0 ${
                  isToday ? 'bg-glow/10' : ''
                }`}
              >
                <div
                  className={`text-[11px] font-mono font-semibold uppercase tracking-wider ${
                    isToday ? 'text-glow font-bold' : 'text-text-muted'
                  }`}
                >
                  {format(date, 'EEE')}
                </div>
                <div
                  className={`text-lg font-mono font-bold mt-0.5 ${
                    isToday ? 'text-glow' : 'text-text'
                  }`}
                >
                  {format(date, 'd')}
                </div>
              </div>
            );
          })}
        </div>

        {/* Time Grid View */}
        <div
          className="grid grid-cols-[72px_repeat(7,1fr)] relative"
          style={{ height: HOURS.length * 60 }}
        >
          {/* Left Hour Gutter */}
          <div className="relative border-r border-border/50 bg-surface-2/15">
            {HOURS.map(h => (
              <div
                key={h}
                className="absolute left-0 right-0 flex items-start justify-end pr-3.5 select-none"
                style={{ top: (h - 6) * 60, height: 60 }}
              >
                <span className="text-xs font-mono text-text-muted -mt-2 font-medium">
                  {h.toString().padStart(2, '0')}:00
                </span>
              </div>
            ))}
          </div>

          {/* Day Columns */}
          {weekDates.map(date => {
            const ds = dateStr(date);
            const blocks = getBlocksForDate(ds);
            const isToday = ds === dateStr(now);
            return (
              <div
                key={ds}
                className={`relative border-l border-border/50 select-none touch-none cursor-crosshair transition-colors ${
                  isToday ? 'bg-glow/[0.03]' : ''
                }`}
                onPointerDown={e => handlePointerDown(ds, e)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerCancel}
              >
                {/* Horizontal Hour Dividing Lines */}
                {HOURS.map(h => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 border-t border-border/35 pointer-events-none"
                    style={{ top: (h - 6) * 60 }}
                  />
                ))}

                {/* Current Time Indicator Line */}
                {isToday && currentMinutesFrom6 >= 0 && currentMinutesFrom6 <= HOURS.length * 60 && (
                  <div
                    className="absolute left-0 right-0 z-30 pointer-events-none"
                    style={{ top: currentMinutesFrom6 }}
                  >
                    <div className="w-full h-[2px] bg-danger shadow-sm shadow-danger/50" />
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-danger ring-2 ring-danger/30" />
                  </div>
                )}

                {/* Live Drag Selection Preview */}
                {dragSelection &&
                  dragSelection.date === ds &&
                  (() => {
                    const minMins = Math.min(dragSelection.startMins, dragSelection.currentMins);
                    const rawDiff = Math.abs(dragSelection.currentMins - dragSelection.startMins);
                    const durationMins = rawDiff < 15 ? 60 : rawDiff;
                    const maxMins = Math.min(HOURS.length * 60, minMins + durationMins);
                    const height = Math.max(durationMins, 20);
                    const startStr = minutesToTimeStr(minMins);
                    const endStr = minutesToTimeStr(maxMins);

                    return (
                      <div
                        className="absolute left-1.5 right-1.5 rounded-xl border-2 border-glow bg-glow/25 text-glow px-3 py-2 z-20 pointer-events-none overflow-hidden shadow-lg shadow-glow/15 backdrop-blur-xs"
                        style={{ top: minMins, height }}
                      >
                        <div className="flex items-center justify-between text-xs font-semibold leading-tight">
                          <span className="truncate">New Block</span>
                          <span className="text-[10px] font-mono font-bold bg-glow/30 text-glow px-2 py-0.5 rounded-md ml-1 shrink-0">
                            {formatDuration(durationMins)}
                          </span>
                        </div>
                        {height >= 36 && (
                          <div className="text-[11px] font-mono font-medium opacity-90 mt-1">
                            {formatTime(startStr)} – {formatTime(endStr)}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                {/* Time Blocks on Calendar */}
                {blocks.map(block => {
                  const pos = getBlockPosition(block);
                  return (
                    <div
                      key={block.id}
                      className={`absolute left-1.5 right-1.5 rounded-xl border px-3 py-2 cursor-pointer transition-all hover:scale-[1.01] hover:z-10 overflow-hidden ${CATEGORY_COLORS[block.category]}`}
                      style={{ top: pos.top, height: pos.height }}
                      onPointerDown={e => e.stopPropagation()}
                      onClick={e => {
                        e.stopPropagation();
                        setEditBlock(block);
                      }}
                    >
                      <div className="text-xs font-semibold truncate leading-tight">{block.title}</div>
                      {pos.height >= 38 && (
                        <div className="text-[10px] opacity-80 font-mono font-medium mt-1">
                          {formatTime(block.startTime)} – {formatTime(block.endTime)}
                        </div>
                      )}
                      {block.isGoogleEvent && pos.height >= 56 && (
                        <div className="flex items-center gap-1 text-[10px] font-mono mt-1 opacity-75">
                          <CalendarIcon className="w-3 h-3 text-glow" />
                          <span>Google</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* New Time Block Modal */}
      <Modal
        isOpen={showNew}
        onClose={() => setShowNew(false)}
        title="New Time Block"
        subtitle="Schedule focus sessions and activities in your calendar"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowNew(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={addBlock} disabled={!newTitle.trim()}>
              Create Block
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Block Title"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="e.g. Deep Work on Core Feature, Workout, Review"
            autoFocus
          />
          <Select
            label="Category"
            value={newCategory}
            onChange={e => setNewCategory(e.target.value as TimeBlockCategory)}
          >
            <option value="deep-work">Deep Work</option>
            <option value="meeting">Meeting</option>
            <option value="exercise">Exercise</option>
            <option value="personal">Personal</option>
            <option value="study">Study</option>
            <option value="break">Break</option>
            <option value="other">Other</option>
          </Select>
          <Input
            label="Date"
            type="date"
            value={newDate}
            onChange={e => setNewDate(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Time"
              type="time"
              value={newStart}
              onChange={e => setNewStart(e.target.value)}
            />
            <Input
              label="End Time"
              type="time"
              value={newEnd}
              onChange={e => setNewEnd(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      {/* Edit Time Block Modal */}
      {editBlock && (
        <Modal
          isOpen={!!editBlock}
          onClose={() => setEditBlock(null)}
          title="Edit Time Block"
          footer={
            <>
              <Button variant="danger" onClick={() => deleteBlock(editBlock.id)}>
                Delete
              </Button>
              <Button variant="primary" onClick={saveEdit}>
                Save Changes
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Input
              label="Block Title"
              value={editBlock.title}
              onChange={e => setEditBlock({ ...editBlock, title: e.target.value })}
            />
            <Select
              label="Category"
              value={editBlock.category}
              onChange={e =>
                setEditBlock({ ...editBlock, category: e.target.value as TimeBlockCategory })
              }
            >
              <option value="deep-work">Deep Work</option>
              <option value="meeting">Meeting</option>
              <option value="exercise">Exercise</option>
              <option value="personal">Personal</option>
              <option value="study">Study</option>
              <option value="break">Break</option>
              <option value="other">Other</option>
            </Select>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Time"
                type="time"
                value={editBlock.startTime}
                onChange={e => setEditBlock({ ...editBlock, startTime: e.target.value })}
              />
              <Input
                label="End Time"
                type="time"
                value={editBlock.endTime}
                onChange={e => setEditBlock({ ...editBlock, endTime: e.target.value })}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
