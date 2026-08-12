import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { v4 as uuid } from 'uuid';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import type { TimeBlock, TimeBlockCategory } from '../../types';
import { STORAGE_KEYS } from '../../types';
import { getWeekDates, format, addDays, formatTime, dateStr } from '../../lib/date-utils';

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

export function PlannerPage() {
  const [timeBlocks, setTimeBlocks] = useLocalStorage<TimeBlock[]>(STORAGE_KEYS.TIME_BLOCKS, []);
  const [weekOffset, setWeekOffset] = useState(0);
  const [showNew, setShowNew] = useState(false);
  const [editBlock, setEditBlock] = useState<TimeBlock | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<TimeBlockCategory>('deep-work');
  const [newDate, setNewDate] = useState('');
  const [newStart, setNewStart] = useState('09:00');
  const [newEnd, setNewEnd] = useState('10:00');

  const baseDate = useMemo(() => addDays(new Date(), weekOffset * 7), [weekOffset]);
  const weekDates = useMemo(() => getWeekDates(baseDate), [baseDate]);

  const getBlocksForDate = (date: string) => timeBlocks.filter(b => b.date === date).sort((a, b) => a.startTime.localeCompare(b.startTime));

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
    setShowNew(false);
    setNewTitle('');
  };

  const saveEdit = () => {
    if (!editBlock) return;
    setTimeBlocks(prev => prev.map(b => b.id === editBlock.id ? editBlock : b));
    setEditBlock(null);
  };

  const deleteBlock = (id: string) => {
    setTimeBlocks(prev => prev.filter(b => b.id !== id));
    if (editBlock?.id === id) setEditBlock(null);
  };

  const getBlockPosition = (block: TimeBlock) => {
    const [sh, sm] = block.startTime.split(':').map(Number);
    const [eh, em] = block.endTime.split(':').map(Number);
    const startMinutes = (sh - 6) * 60 + sm;
    const endMinutes = (eh - 6) * 60 + em;
    return { top: startMinutes, height: Math.max(endMinutes - startMinutes, 15) };
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-text">Planner</h1>
          <p className="text-sm text-text-muted mt-1">
            {format(weekDates[0], 'MMM d')} – {format(weekDates[6], 'MMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekOffset(0)} className="px-3 py-2 text-xs font-mono bg-surface border border-border rounded-lg hover:bg-surface-2 text-text-muted transition-colors">Today</button>
          <button onClick={() => setWeekOffset(w => w - 1)} className="p-2 hover:bg-surface-2 rounded-lg text-text-muted"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={() => setWeekOffset(w => w + 1)} className="p-2 hover:bg-surface-2 rounded-lg text-text-muted"><ChevronRight className="w-4 h-4" /></button>
          <button onClick={() => { setNewDate(dateStr(weekDates[0])); setShowNew(true); }}
            className="px-4 py-2 bg-glow/10 text-glow text-sm font-medium rounded-xl hover:bg-glow/20 transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Block
          </button>
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
            const isToday = ds === dateStr(new Date());
            return (
              <div key={ds} className={`relative border-l border-border ${isToday ? 'bg-glow/[0.02]' : ''}`}>
                {/* Hour lines */}
                {HOURS.map(h => (
                  <div key={h} className="absolute left-0 right-0 border-t border-border/30" style={{ top: (h - 6) * 60 }} />
                ))}

                {/* Blocks */}
                {blocks.map(block => {
                  const pos = getBlockPosition(block);
                  return (
                    <div
                      key={block.id}
                      className={`absolute left-1 right-1 rounded-lg border px-2 py-1 cursor-pointer transition-opacity hover:opacity-90 overflow-hidden ${CATEGORY_COLORS[block.category]}`}
                      style={{ top: pos.top, height: pos.height }}
                      onClick={() => setEditBlock(block)}
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
