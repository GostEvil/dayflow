import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2, Circle, Plus, Timer, Target, TrendingUp,
  ChevronRight, Flame, Calendar as CalendarIcon
} from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import type { Task, Habit, Goal, FocusSession, TimeBlock, UserProfile, GamificationState } from '../../types';
import { STORAGE_KEYS } from '../../types';
import { getGreeting, todayStr, formatTime, format } from '../../lib/date-utils';
import { getXpProgress } from '../../lib/xp';
import { MomentumOrb } from './MomentumOrb';
import { LifeWheel } from './LifeWheel';
import { useNavigate } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { Button } from '../../components/ui/Button';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } }
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

export function DashboardPage() {
  const navigate = useNavigate();
  const [profile] = useLocalStorage<UserProfile | null>(STORAGE_KEYS.PROFILE, null);
  const [tasks, setTasks] = useLocalStorage<Task[]>(STORAGE_KEYS.TASKS, []);
  const [habits] = useLocalStorage<Habit[]>(STORAGE_KEYS.HABITS, []);
  const [goals] = useLocalStorage<Goal[]>(STORAGE_KEYS.GOALS, []);
  const [sessions] = useLocalStorage<FocusSession[]>(STORAGE_KEYS.FOCUS_SESSIONS, []);
  const [timeBlocks] = useLocalStorage<TimeBlock[]>(STORAGE_KEYS.TIME_BLOCKS, []);
  const [gamification] = useLocalStorage<GamificationState>(STORAGE_KEYS.GAMIFICATION, { xp: 0, level: 1, totalTasksCompleted: 0, totalFocusMinutes: 0, totalJournalEntries: 0, longestHabitStreak: 0, loginStreak: 0, lastLoginDate: null, unlockedBadges: [], quests: [] });
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const today = todayStr();

  // ─── Computed Values ───────────────────────────────────────────
  const todayTasks = useMemo(() => tasks.filter(t => t.status === 'today' || t.status === 'in-progress' || (t.dueDate === today && t.status !== 'done')), [tasks, today]);
  const completedToday = useMemo(() => tasks.filter(t => t.completedAt && t.completedAt.startsWith(today)), [tasks, today]);
  const todayBlocks = useMemo(() => timeBlocks.filter(b => b.date === today).sort((a, b) => a.startTime.localeCompare(b.startTime)), [timeBlocks, today]);
  const todaySessions = useMemo(() => sessions.filter(s => s.completedAt.startsWith(today)), [sessions, today]);
  const focusMinutesToday = useMemo(() => todaySessions.reduce((sum, s) => sum + Math.round(s.elapsed / 60), 0), [todaySessions]);

  // Today Score
  const todayScore = useMemo(() => {
    let score = 0;
    const taskWeight = 40;
    const habitWeight = 30;
    const focusWeight = 20;
    const scheduleWeight = 10;

    // Tasks: % of today tasks completed
    const totalTodayTasks = todayTasks.length + completedToday.length;
    if (totalTodayTasks > 0) {
      score += (completedToday.length / totalTodayTasks) * taskWeight;
    } else {
      score += taskWeight * 0.5; // neutral
    }

    // Habits: % completed today
    const todayHabits = habits.filter(h => h.targetDays.includes(new Date().getDay()));
    const completedHabits = todayHabits.filter(h => h.completions[today]);
    if (todayHabits.length > 0) {
      score += (completedHabits.length / todayHabits.length) * habitWeight;
    } else {
      score += habitWeight * 0.5;
    }

    // Focus: 60 min = full score
    score += Math.min(1, focusMinutesToday / 60) * focusWeight;

    // Schedule: blocks attended
    score += scheduleWeight * 0.5; // baseline

    return Math.round(Math.min(100, score));
  }, [todayTasks, completedToday, habits, today, focusMinutesToday]);

  // Habit streaks
  const habitStreaks = useMemo(() => {
    return habits.map(h => {
      let streak = 0;
      const now = new Date();
      for (let i = 0; i < 365; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = format(d, 'yyyy-MM-dd');
        if (h.completions[key]) {
          streak++;
        } else if (i > 0) {
          break;
        }
      }
      return { ...h, streak };
    }).sort((a, b) => b.streak - a.streak);
  }, [habits]);

  // Active goals
  const activeGoals = useMemo(() => goals.filter(g => g.status === 'active').slice(0, 3), [goals]);

  // XP progress
  const xpProgress = useMemo(() => getXpProgress(gamification.xp), [gamification.xp]);

  const addQuickTask = () => {
    if (!newTaskTitle.trim()) return;
    const t: Task = {
      id: uuid(),
      title: newTaskTitle.trim(),
      description: '',
      status: 'today',
      priority: 'medium',
      category: 'other',
      dueDate: today,
      dueTime: null,
      createdAt: new Date().toISOString(),
      completedAt: null,
      isInbox: false,
    };
    setTasks(prev => [t, ...prev]);
    setNewTaskTitle('');
  };

  const toggleTask = (taskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      if (t.status === 'done') {
        return { ...t, status: 'today' as const, completedAt: null };
      }
      return { ...t, status: 'done' as const, completedAt: new Date().toISOString() };
    }));
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
      <motion.div variants={container} initial="hidden" animate="show">
        {/* Header */}
        <motion.div variants={item} className="mb-8">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-text">
            {getGreeting()}, <span className="text-glow">{profile?.name || 'User'}</span>
          </h1>
          <p className="text-text-muted text-sm mt-1 font-mono">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Momentum Orb — spans 2 cols */}
          <motion.div variants={item} className="lg:col-span-2 bg-surface border border-border rounded-2xl overflow-hidden spotlight-card">
            <div className="h-[280px]">
              <MomentumOrb score={todayScore} />
            </div>
          </motion.div>

          {/* Level & XP */}
          <motion.div variants={item} className="bg-surface border border-border rounded-2xl p-5 spotlight-card">
            <div className="text-xs font-mono uppercase tracking-wider text-text-muted mb-3">Level Progress</div>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="font-mono text-4xl font-bold text-pulse">{xpProgress.level}</span>
              <span className="text-xs text-text-muted font-mono">LVL</span>
            </div>
            <div className="w-full h-2 bg-surface-2 rounded-full overflow-hidden mb-2">
              <motion.div
                className="h-full bg-pulse rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${xpProgress.progress * 100}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-text-muted">
              <span>{gamification.xp} XP</span>
              <span>{xpProgress.nextLevelXp} XP</span>
            </div>
          </motion.div>

          {/* Quick Focus */}
          <motion.div variants={item} className="bg-surface border border-border rounded-2xl p-5 spotlight-card flex flex-col">
            <div className="text-xs font-mono uppercase tracking-wider text-text-muted mb-3">Focus Today</div>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="font-mono text-4xl font-bold text-glow">{focusMinutesToday}</span>
              <span className="text-xs text-text-muted font-mono">MIN</span>
            </div>
            <div className="mt-auto">
              <Button
                onClick={() => navigate('/focus')}
                variant="secondary"
                size="md"
                className="w-full"
                icon={<Timer className="w-4 h-4" />}
              >
                Start Session
              </Button>
            </div>
          </motion.div>

          {/* Today's Tasks — spans 2 cols */}
          <motion.div variants={item} className="lg:col-span-2 bg-surface border border-border rounded-2xl p-5 spotlight-card">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs font-mono uppercase tracking-wider text-text-muted">Today's Tasks</div>
              <Button
                onClick={() => navigate('/tasks')}
                variant="ghost"
                size="sm"
                icon={<ChevronRight className="w-3.5 h-3.5" />}
                iconPosition="right"
              >
                View all
              </Button>
            </div>

            {/* Quick add */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addQuickTask()}
                placeholder="Add a task..."
                className="flex-1 bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-sm text-text outline-none placeholder:text-text-muted focus:border-glow/30 transition-colors"
              />
              <Button
                onClick={addQuickTask}
                disabled={!newTaskTitle.trim()}
                variant="secondary"
                size="icon"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Task list */}
            <div className="space-y-1 max-h-[200px] overflow-y-auto">
              {[...completedToday.slice(0, 3), ...todayTasks].slice(0, 8).map(task => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-surface-2 transition-colors group"
                >
                  <button onClick={() => toggleTask(task.id)} className="flex-shrink-0">
                    {task.status === 'done' ? (
                      <CheckCircle2 className="w-4.5 h-4.5 text-success" />
                    ) : (
                      <Circle className="w-4.5 h-4.5 text-text-muted group-hover:text-glow transition-colors" />
                    )}
                  </button>
                  <span className={`text-sm flex-1 truncate ${task.status === 'done' ? 'text-text-muted line-through' : 'text-text'}`}>
                    {task.title}
                  </span>
                  {task.dueTime && task.status !== 'done' && (
                    <span className="text-[10px] font-mono text-text-muted">{formatTime(task.dueTime)}</span>
                  )}
                  {task.priority === 'urgent' && task.status !== 'done' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-danger flex-shrink-0" />
                  )}
                </div>
              ))}
              {todayTasks.length === 0 && completedToday.length === 0 && (
                <div className="py-6 text-center text-sm text-text-muted">
                  No tasks for today. Add one above!
                </div>
              )}
            </div>
          </motion.div>

          {/* Schedule Timeline */}
          <motion.div variants={item} className="bg-surface border border-border rounded-2xl p-5 spotlight-card">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs font-mono uppercase tracking-wider text-text-muted">Schedule</div>
              <CalendarIcon className="w-3.5 h-3.5 text-text-muted" />
            </div>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {todayBlocks.slice(0, 5).map(block => (
                <div key={block.id} className="flex items-center gap-3 py-1.5">
                  <div className={`w-1 h-8 rounded-full ${
                    block.category === 'deep-work' ? 'bg-glow' :
                    block.category === 'meeting' ? 'bg-pulse' :
                    block.category === 'exercise' ? 'bg-success' :
                    block.category === 'break' ? 'bg-drift' : 'bg-ember'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-text truncate">{block.title}</div>
                    <div className="text-[10px] font-mono text-text-muted">
                      {formatTime(block.startTime)} – {formatTime(block.endTime)}
                    </div>
                  </div>
                </div>
              ))}
              {todayBlocks.length === 0 && (
                <div className="py-6 text-center text-sm text-text-muted">No blocks scheduled</div>
              )}
            </div>
          </motion.div>

          {/* Habit Streaks */}
          <motion.div variants={item} className="bg-surface border border-border rounded-2xl p-5 spotlight-card">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs font-mono uppercase tracking-wider text-text-muted">Habit Streaks</div>
              <Flame className="w-3.5 h-3.5 text-ember" />
            </div>
            <div className="space-y-3">
              {habitStreaks.slice(0, 5).map(h => (
                <div key={h.id} className="flex items-center gap-3">
                  <span className="text-lg">{h.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-text truncate">{h.name}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Flame className="w-3 h-3 text-ember" />
                    <span className="text-sm font-mono font-bold text-ember">{h.streak}</span>
                  </div>
                </div>
              ))}
              {habitStreaks.length === 0 && (
                <div className="py-6 text-center text-sm text-text-muted">No habits yet</div>
              )}
            </div>
          </motion.div>

          {/* Goals Progress */}
          <motion.div variants={item} className="lg:col-span-2 bg-surface border border-border rounded-2xl p-5 spotlight-card">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs font-mono uppercase tracking-wider text-text-muted">Goal Progress</div>
              <button onClick={() => navigate('/goals')} className="text-xs text-text-muted hover:text-glow transition-colors flex items-center gap-1">
                View all <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-4">
              {activeGoals.map(g => {
                const completed = g.milestones.filter(m => m.completed).length;
                const total = g.milestones.length;
                const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                return (
                  <div key={g.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-text font-medium truncate">{g.title}</span>
                      <span className="text-xs font-mono text-text-muted">{pct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-2 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: g.category === 'health' ? '#10B981' : g.category === 'career' ? '#00E5FF' : '#A855F7' }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                );
              })}
              {activeGoals.length === 0 && (
                <div className="py-4 text-center text-sm text-text-muted">No active goals</div>
              )}
            </div>
          </motion.div>

          {/* Life Wheel */}
          <motion.div variants={item} className="lg:col-span-2 bg-surface border border-border rounded-2xl p-5 spotlight-card">
            <div className="text-xs font-mono uppercase tracking-wider text-text-muted mb-4">Life Balance</div>
            <LifeWheel />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

