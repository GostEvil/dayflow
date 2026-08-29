import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Flame, Check, TrendingUp, Sparkles, Trash2 } from 'lucide-react';
import { v4 as uuid } from 'uuid';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import type { Habit, HabitFrequency, GamificationState } from '../../types';
import { STORAGE_KEYS } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { todayStr, format, subDays, getLast7Days } from '../../lib/date-utils';
import { XP_VALUES, getLevel, checkBadges } from '../../lib/xp';
import { HABIT_ICON_DEFINITIONS, HabitIcon } from '../../lib/icons';

export function HabitsPage() {
  const [habits, setHabits] = useLocalStorage<Habit[]>(STORAGE_KEYS.HABITS, []);
  const [, setGamification] = useLocalStorage<GamificationState>(STORAGE_KEYS.GAMIFICATION, {
    xp: 0,
    level: 1,
    totalTasksCompleted: 0,
    totalFocusMinutes: 0,
    totalJournalEntries: 0,
    longestHabitStreak: 0,
    loginStreak: 0,
    lastLoginDate: null,
    unlockedBadges: [],
    quests: [],
  });
  const [showNew, setShowNew] = useState(false);
  const [detailHabit, setDetailHabit] = useState<Habit | null>(null);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('meditate');
  const [newColor, setNewColor] = useState('#00E5FF');
  const [newFreq, setNewFreq] = useState<HabitFrequency>('daily');

  const today = todayStr();
  const last7 = getLast7Days();

  const toggleCompletion = (habitId: string) => {
    setHabits(prev =>
      prev.map(h => {
        if (h.id !== habitId) return h;
        const completions = { ...h.completions };
        if (completions[today]) {
          delete completions[today];
        } else {
          completions[today] = true;
          // Award XP
          setGamification(g => {
            const updated = {
              ...g,
              xp: g.xp + XP_VALUES.HABIT,
              level: getLevel(g.xp + XP_VALUES.HABIT),
            };
            const newBadges = checkBadges(updated);
            return { ...updated, unlockedBadges: [...g.unlockedBadges, ...newBadges] };
          });
        }
        return { ...h, completions };
      })
    );
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
    let best = 0;
    let current = 0;
    for (let i = 365; i >= 0; i--) {
      const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
      if (habit.completions[d]) {
        current++;
        best = Math.max(best, current);
      } else {
        current = 0;
      }
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
    const targetDays =
      newFreq === 'daily'
        ? [0, 1, 2, 3, 4, 5, 6]
        : newFreq === 'weekdays'
        ? [1, 2, 3, 4, 5]
        : newFreq === 'weekends'
        ? [0, 6]
        : [0, 1, 2, 3, 4, 5, 6];
    const habit: Habit = {
      id: uuid(),
      name: newName.trim(),
      icon: newIcon,
      color: newColor,
      frequency: newFreq,
      targetDays,
      createdAt: new Date().toISOString(),
      completions: {},
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
    <div className="p-4 sm:p-6 lg:p-10 max-w-[1400px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-text tracking-tight">Habits</h1>
          <p className="text-sm text-text-muted mt-1 font-mono">
            {habits.filter(h => h.completions[today]).length} of {habits.length} completed today
          </p>
        </div>
        <Button
          onClick={() => setShowNew(true)}
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
        >
          New Habit
        </Button>
      </div>

      {/* Habits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        {habits.map(habit => {
          const streak = getStreak(habit);
          const isComplete = habit.completions[today];
          return (
            <motion.div
              key={habit.id}
              layout
              className="bg-surface/95 border border-border/80 rounded-2xl p-6 sm:p-7 shadow-sm cursor-pointer hover:border-border transition-all duration-200 flex flex-col justify-between group"
              onClick={() => setDetailHabit(habit)}
            >
              <div>
                {/* Habit Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4 min-w-0 pr-2">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-105"
                      style={{
                        backgroundColor: `${habit.color}18`,
                        border: `1px solid ${habit.color}35`,
                        color: habit.color,
                      }}
                    >
                      <HabitIcon icon={habit.icon} className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-text font-semibold text-base leading-snug tracking-tight truncate">
                        {habit.name}
                      </h3>
                      <span className="text-xs text-text-muted uppercase tracking-wider font-mono font-medium mt-0.5 block">
                        {habit.frequency}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={e => {
                      e.stopPropagation();
                      toggleCompletion(habit.id);
                    }}
                    className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 active:scale-90 flex-shrink-0 ${
                      isComplete
                        ? 'bg-success/20 text-success border border-success/40 shadow-sm shadow-success/10'
                        : 'bg-surface-2 text-text-muted hover:text-glow hover:bg-glow/10 border border-border/60 hover:border-glow/30'
                    }`}
                  >
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  </button>
                </div>

                {/* 7-Day Consistency Strip */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2 px-1">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-text-muted font-medium">
                      Recent Activity
                    </span>
                    <span className="text-[11px] font-mono text-text-muted">Last 7 Days</span>
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {last7.map(day => {
                      const key = format(day, 'yyyy-MM-dd');
                      const done = habit.completions[key];
                      const isCurrentDay = key === today;
                      return (
                        <div key={key} className="flex flex-col items-center gap-1.5">
                          <span
                            className={`text-[11px] font-mono font-semibold uppercase ${
                              isCurrentDay ? 'text-glow' : 'text-text-muted'
                            }`}
                          >
                            {format(day, 'EEE').slice(0, 3)}
                          </span>
                          <div
                            className={`w-full h-8 rounded-xl transition-all flex items-center justify-center border ${
                              done
                                ? 'shadow-sm'
                                : 'bg-surface-2/60 border-border/50 hover:border-border'
                            }`}
                            style={
                              done
                                ? {
                                    backgroundColor: `${habit.color}25`,
                                    borderColor: `${habit.color}50`,
                                    color: habit.color,
                                  }
                                : undefined
                            }
                          >
                            {done && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Stats Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-border/50 font-mono text-xs">
                <div className="flex items-center gap-1.5 bg-ember/10 border border-ember/25 px-3 py-1 rounded-xl text-ember font-bold">
                  <Flame className="w-4 h-4 fill-current" />
                  <span>{streak}d streak</span>
                </div>
                <div className="flex items-center gap-1.5 text-text-muted bg-surface-2/80 px-3 py-1 rounded-xl border border-border/40">
                  <TrendingUp className="w-4 h-4 text-glow" />
                  <span>{getCompletionPct(habit)}% completion</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {habits.length === 0 && (
        <div className="bg-surface/95 border border-dashed border-border/80 rounded-3xl p-16 text-center flex flex-col items-center justify-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-glow/10 border border-glow/20 flex items-center justify-center text-glow">
            <Sparkles className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-text mb-1">
              No habits configured yet
            </h3>
            <p className="text-sm text-text-muted max-w-sm">
              Start building daily consistency and track your streaks over time.
            </p>
          </div>
          <Button
            onClick={() => setShowNew(true)}
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
          >
            Create Your First Habit
          </Button>
        </div>
      )}

      {/* New Habit Modal */}
      <Modal
        isOpen={showNew}
        onClose={() => setShowNew(false)}
        title="New Habit"
        subtitle="Build consistency by tracking your daily rituals"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowNew(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={addHabit} disabled={!newName.trim()}>
              Create Habit
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <Input
            label="Habit Name"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="e.g. Morning Meditation, Reading, Deep Work"
            autoFocus
          />

          <div>
            <label className="text-xs font-medium text-text-secondary tracking-wide mb-2.5 block select-none">
              Choose Icon
            </label>
            <div className="grid grid-cols-6 gap-2.5 max-h-48 overflow-y-auto p-1 bg-surface-2/40 rounded-2xl border border-border/60">
              {HABIT_ICON_DEFINITIONS.map(def => {
                const IconComponent = def.icon;
                const isSelected = newIcon === def.id;
                return (
                  <button
                    key={def.id}
                    type="button"
                    title={def.label}
                    onClick={() => setNewIcon(def.id)}
                    className={`h-11 rounded-xl flex items-center justify-center transition-all duration-150 ${
                      isSelected
                        ? 'bg-glow/20 text-glow ring-2 ring-glow shadow-sm'
                        : 'bg-surface-2 text-text-muted hover:text-text hover:bg-surface-3'
                    }`}
                  >
                    <IconComponent className="w-5 h-5" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Frequency"
              value={newFreq}
              onChange={e => setNewFreq(e.target.value as HabitFrequency)}
            >
              <option value="daily">Daily</option>
              <option value="weekdays">Weekdays</option>
              <option value="weekends">Weekends</option>
            </Select>

            <div>
              <label className="text-xs font-medium text-text-secondary tracking-wide mb-2 block select-none">
                Color Accent
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={newColor}
                  onChange={e => setNewColor(e.target.value)}
                  className="w-11 h-11 rounded-xl border border-border cursor-pointer bg-surface-2"
                />
                <span className="text-xs font-mono text-text-muted">{newColor.toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Habit Detail Side Panel */}
      <AnimatePresence>
        {detailHabit && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
              onClick={() => setDetailHabit(null)}
            />
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.2 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md z-50"
            >
              <div className="h-full bg-surface/98 border-l border-border/80 p-6 sm:p-8 overflow-y-auto flex flex-col justify-between shadow-2xl">
                <div>
                  <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/60">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm"
                        style={{
                          backgroundColor: `${detailHabit.color}20`,
                          border: `1px solid ${detailHabit.color}40`,
                          color: detailHabit.color,
                        }}
                      >
                        <HabitIcon icon={detailHabit.icon} className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="font-display text-xl font-bold text-text">
                          {detailHabit.name}
                        </h2>
                        <p className="text-xs font-mono uppercase text-text-muted mt-0.5">
                          {detailHabit.frequency}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setDetailHabit(null)}
                      className="p-2 hover:bg-surface-2 rounded-xl text-text-muted hover:text-text transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Summary Metric Bento */}
                  <div className="grid grid-cols-3 gap-3.5 mb-8">
                    <div className="bg-surface-2/70 border border-border/60 rounded-2xl p-4 text-center">
                      <div className="font-mono text-2xl font-extrabold text-ember">
                        {getStreak(detailHabit)}d
                      </div>
                      <div className="text-[10px] text-text-muted font-mono uppercase tracking-wider font-semibold mt-1">
                        Current
                      </div>
                    </div>
                    <div className="bg-surface-2/70 border border-border/60 rounded-2xl p-4 text-center">
                      <div className="font-mono text-2xl font-extrabold text-glow">
                        {getBestStreak(detailHabit)}d
                      </div>
                      <div className="text-[10px] text-text-muted font-mono uppercase tracking-wider font-semibold mt-1">
                        Best
                      </div>
                    </div>
                    <div className="bg-surface-2/70 border border-border/60 rounded-2xl p-4 text-center">
                      <div className="font-mono text-2xl font-extrabold text-pulse">
                        {getCompletionPct(detailHabit)}%
                      </div>
                      <div className="text-[10px] text-text-muted font-mono uppercase tracking-wider font-semibold mt-1">
                        Rate
                      </div>
                    </div>
                  </div>

                  {/* 30-Day Grid */}
                  <div className="mb-8">
                    <div className="text-xs font-mono uppercase tracking-wider text-text-muted font-semibold mb-3">
                      Last 30 Days Activity
                    </div>
                    <div className="grid grid-cols-7 gap-2 p-4 bg-surface-2/40 border border-border/60 rounded-2xl">
                      {Array.from({ length: 30 }, (_, i) => {
                        const d = format(subDays(new Date(), 29 - i), 'yyyy-MM-dd');
                        const isDone = detailHabit.completions[d];
                        return (
                          <div
                            key={d}
                            className={`w-full aspect-square rounded-lg transition-all flex items-center justify-center border ${
                              isDone ? 'border-transparent' : 'bg-surface-2/80 border-border/40'
                            }`}
                            style={
                              isDone
                                ? {
                                    backgroundColor: detailHabit.color,
                                    boxShadow: `0 0 10px ${detailHabit.color}40`,
                                  }
                                : undefined
                            }
                            title={d}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => deleteHabit(detailHabit.id)}
                  variant="danger"
                  className="w-full"
                  icon={<Trash2 className="w-4 h-4" />}
                >
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
