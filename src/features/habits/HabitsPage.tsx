import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Flame, Check, TrendingUp } from 'lucide-react';
import { v4 as uuid } from 'uuid';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import type { Habit, HabitFrequency, GamificationState } from '../../types';
import { STORAGE_KEYS } from '../../types';
import { Button } from '../../components/ui/Button';
import { todayStr, format, subDays, getLast7Days } from '../../lib/date-utils';
import { XP_VALUES, getLevel, checkBadges } from '../../lib/xp';

const ICONS = ['🧘', '💪', '📚', '💧', '✍️', '🚶', '🤸', '💻', '🍳', '😴', '🎵', '🏃', '🎯', '🧠', '❤️'];

export function HabitsPage() {
  const [habits, setHabits] = useLocalStorage<Habit[]>(STORAGE_KEYS.HABITS, []);
  const [gamification, setGamification] = useLocalStorage<GamificationState>(STORAGE_KEYS.GAMIFICATION, { xp: 0, level: 1, totalTasksCompleted: 0, totalFocusMinutes: 0, totalJournalEntries: 0, longestHabitStreak: 0, loginStreak: 0, lastLoginDate: null, unlockedBadges: [], quests: [] });
  const [showNew, setShowNew] = useState(false);
  const [detailHabit, setDetailHabit] = useState<Habit | null>(null);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('🧘');
  const [newColor, setNewColor] = useState('#00E5FF');
  const [newFreq, setNewFreq] = useState<HabitFrequency>('daily');

  const today = todayStr();
  const last7 = getLast7Days();

  const toggleCompletion = (habitId: string) => {
    setHabits(prev => prev.map(h => {
      if (h.id !== habitId) return h;
      const completions = { ...h.completions };
      if (completions[today]) {
        delete completions[today];
      } else {
        completions[today] = true;
        // Award XP
        setGamification(g => {
          const updated = { ...g, xp: g.xp + XP_VALUES.HABIT, level: getLevel(g.xp + XP_VALUES.HABIT) };
          const newBadges = checkBadges(updated);
          return { ...updated, unlockedBadges: [...g.unlockedBadges, ...newBadges] };
        });
      }
      return { ...h, completions };
    }));
  };

  const getStreak = (habit: Habit): number => {
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
      if (habit.completions[d]) streak++;
      else if (i > 0) break;
    }
    return streak;
  };

  const getBestStreak = (habit: Habit): number => {
    let best = 0, current = 0;
    for (let i = 365; i >= 0; i--) {
      const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
      if (habit.completions[d]) { current++; best = Math.max(best, current); }
      else current = 0;
    }
    return best;
  };

  const getCompletionPct = (habit: Habit): number => {
    const total = Object.keys(habit.completions).length;
    const days = Math.max(1, Math.floor((Date.now() - new Date(habit.createdAt).getTime()) / 86400000));
    return Math.round((total / days) * 100);
  };

  const addHabit = () => {
    if (!newName.trim()) return;
    const targetDays = newFreq === 'daily' ? [0,1,2,3,4,5,6] : newFreq === 'weekdays' ? [1,2,3,4,5] : newFreq === 'weekends' ? [0,6] : [0,1,2,3,4,5,6];
    const habit: Habit = {
      id: uuid(), name: newName.trim(), icon: newIcon, color: newColor,
      frequency: newFreq, targetDays, createdAt: new Date().toISOString(), completions: {},
    };
    setHabits(prev => [habit, ...prev]);
    setShowNew(false);
    setNewName('');
  };

  const deleteHabit = (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
    if (detailHabit?.id === id) setDetailHabit(null);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-text">Habits</h1>
          <p className="text-sm text-text-muted mt-1">{habits.filter(h => h.completions[today]).length}/{habits.length} completed today</p>
        </div>
        <Button onClick={() => setShowNew(true)} variant="secondary" icon={<Plus className="w-4 h-4" />}>
          New Habit
        </Button>
      </div>

      {/* Habit Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {habits.map(habit => {
          const streak = getStreak(habit);
          const isComplete = habit.completions[today];
          return (
            <motion.div
              key={habit.id}
              layout
              className="bg-surface border border-border rounded-2xl p-5 spotlight-card cursor-pointer hover:border-border-2 transition-colors"
              onClick={() => setDetailHabit(habit)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{habit.icon}</div>
                  <div>
                    <div className="text-text font-medium">{habit.name}</div>
                    <div className="text-xs text-text-muted capitalize">{habit.frequency}</div>
                  </div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); toggleCompletion(habit.id); }}
                  className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 active:scale-95 ${
                    isComplete ? 'bg-success/20 text-success border border-success/30' : 'bg-surface-2 text-text-muted hover:text-glow hover:bg-glow/10 border border-transparent'
                  }`}
                >
                  <Check className="w-5 h-5" />
                </button>
              </div>

              {/* Weekly grid */}
              <div className="flex gap-1.5 mb-3">
                {last7.map(day => {
                  const key = format(day, 'yyyy-MM-dd');
                  const done = habit.completions[key];
                  return (
                    <div key={key} className="flex-1 flex flex-col items-center gap-1">
                      <div className="text-[9px] font-mono text-text-muted">{format(day, 'EEE').charAt(0)}</div>
                      <div className={`w-full h-6 rounded-md transition-colors ${
                        done ? 'bg-success/30' : 'bg-surface-2'
                      }`} style={done ? { backgroundColor: `${habit.color}30` } : undefined} />
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-4 text-xs text-text-muted">
                <div className="flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-ember" />
                  <span className="font-mono font-bold text-ember">{streak}</span> streak
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span className="font-mono">{getCompletionPct(habit)}%</span> rate
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {habits.length === 0 && (
        <div className="bg-surface border border-border rounded-2xl p-12 text-center">
          <div className="text-4xl mb-3">🧘</div>
          <h3 className="font-display text-lg text-text mb-2">No habits yet</h3>
          <p className="text-sm text-text-muted mb-4">Start building consistency by adding your first habit.</p>
          <Button onClick={() => setShowNew(true)} variant="secondary" icon={<Plus className="w-4 h-4" />}>
            Add Habit
          </Button>
        </div>
      )}

      {/* New Habit Modal */}
      <AnimatePresence>
        {showNew && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setShowNew(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-md z-50">
              <div className="bg-surface border border-border rounded-2xl p-6 m-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-lg font-bold text-text">New Habit</h2>
                  <button onClick={() => setShowNew(false)} className="p-2 hover:bg-surface-2 rounded-xl text-text-muted transition-colors"><X className="w-4 h-4" /></button>
                </div>
                <div className="space-y-4">
                  <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Habit name" autoFocus
                    className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-sm text-text outline-none placeholder:text-text-muted focus:border-glow/30" />
                  <div>
                    <label className="text-xs font-mono uppercase text-text-muted mb-2 block">Icon</label>
                    <div className="flex flex-wrap gap-2">
                      {ICONS.map(icon => (
                        <button key={icon} onClick={() => setNewIcon(icon)}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${newIcon === icon ? 'bg-glow/15 ring-2 ring-glow scale-105' : 'bg-surface-2 hover:bg-surface-3'}`}>
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                  <select value={newFreq} onChange={e => setNewFreq(e.target.value as HabitFrequency)}
                    className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm text-text outline-none">
                    <option value="daily">Daily</option>
                    <option value="weekdays">Weekdays</option>
                    <option value="weekends">Weekends</option>
                  </select>
                  <div>
                    <label className="text-xs font-mono uppercase text-text-muted mb-2 block">Color</label>
                    <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} className="w-12 h-12 rounded-xl border border-border cursor-pointer" />
                  </div>
                  <Button onClick={addHabit} disabled={!newName.trim()} variant="primary" size="lg" className="w-full">
                    Create Habit
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Detail Panel */}
      <AnimatePresence>
        {detailHabit && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setDetailHabit(null)} />
            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }} className="fixed top-0 right-0 bottom-0 w-full max-w-md z-50">
              <div className="h-full bg-surface border-l border-border p-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{detailHabit.icon}</span>
                    <h2 className="font-display text-xl font-bold text-text">{detailHabit.name}</h2>
                  </div>
                  <button onClick={() => setDetailHabit(null)} className="p-1 hover:bg-surface-2 rounded-lg text-text-muted"><X className="w-4 h-4" /></button>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="bg-surface-2 rounded-xl p-3 text-center">
                    <div className="font-mono text-2xl font-bold text-ember">{getStreak(detailHabit)}</div>
                    <div className="text-[10px] text-text-muted font-mono uppercase">Current</div>
                  </div>
                  <div className="bg-surface-2 rounded-xl p-3 text-center">
                    <div className="font-mono text-2xl font-bold text-glow">{getBestStreak(detailHabit)}</div>
                    <div className="text-[10px] text-text-muted font-mono uppercase">Best</div>
                  </div>
                  <div className="bg-surface-2 rounded-xl p-3 text-center">
                    <div className="font-mono text-2xl font-bold text-pulse">{getCompletionPct(detailHabit)}%</div>
                    <div className="text-[10px] text-text-muted font-mono uppercase">Rate</div>
                  </div>
                </div>
                {/* 30-day grid */}
                <div className="mb-6">
                  <div className="text-xs font-mono uppercase text-text-muted mb-3">Last 30 Days</div>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: 30 }, (_, i) => {
                      const d = format(subDays(new Date(), 29 - i), 'yyyy-MM-dd');
                      return (
                        <div key={d} className={`w-full aspect-square rounded-md transition-colors ${
                          detailHabit.completions[d] ? 'opacity-100' : 'opacity-100 bg-surface-3'
                        }`} style={detailHabit.completions[d] ? { backgroundColor: `${detailHabit.color}40` } : undefined}
                          title={d} />
                      );
                    })}
                  </div>
                </div>
                <Button onClick={() => deleteHabit(detailHabit.id)} variant="danger" className="w-full mt-2">
                  Delete Habit
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
