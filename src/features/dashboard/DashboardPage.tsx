import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2, Circle, Plus, Timer, Target,
  ChevronRight, Flame, Calendar as CalendarIcon, Clock, CheckSquare, Sparkles
} from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import type { Task, Habit, Goal, FocusSession, TimeBlock, UserProfile } from '../../types';
import { STORAGE_KEYS } from '../../types';
import { getGreeting, todayStr, formatTime, format } from '../../lib/date-utils';
import { useNavigate } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { HabitIcon } from '../../lib/icons';

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
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const today = todayStr();

  // ─── Computed Values ───────────────────────────────────────────
  const todayTasks = useMemo(() => tasks.filter(t => t.status === 'today' || t.status === 'in-progress' || (t.dueDate === today && t.status !== 'done')), [tasks, today]);
  const completedToday = useMemo(() => tasks.filter(t => t.completedAt && t.completedAt.startsWith(today)), [tasks, today]);
  const todayBlocks = useMemo(() => timeBlocks.filter(b => b.date === today).sort((a, b) => a.startTime.localeCompare(b.startTime)), [timeBlocks, today]);
  const todaySessions = useMemo(() => sessions.filter(s => s.completedAt && s.completedAt.startsWith(today)), [sessions, today]);
  const focusMinutesToday = useMemo(() => todaySessions.reduce((sum, s) => sum + Math.round(s.elapsed / 60), 0), [todaySessions]);

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
  const activeGoals = useMemo(() => goals.filter(g => g.status === 'active').slice(0, 4), [goals]);

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

  const totalTasksCount = todayTasks.length + completedToday.length;
  const taskCompletionPct = totalTasksCount > 0 ? Math.round((completedToday.length / totalTasksCount) * 100) : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-[1440px] mx-auto space-y-8">
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
        
        {/* Top Greeting Header */}
        <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-text tracking-tight flex items-center gap-3">
              {getGreeting()}, <span className="text-glow">{profile?.name || 'Nuno'}</span>
            </h1>
            <p className="text-text-muted text-sm mt-1.5 font-mono tracking-wide">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate('/focus')}
              variant="outline"
              size="md"
              icon={<Timer className="w-4 h-4 text-glow" />}
            >
              Focus Timer
            </Button>
            <Button
              onClick={() => navigate('/tasks')}
              variant="primary"
              size="md"
              icon={<Plus className="w-4 h-4" />}
            >
              New Task
            </Button>
          </div>
        </motion.div>

        {/* Top Summary Bento Cards — Generous Gaps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          
          {/* Focus Today Card — Perfectly Centered */}
          <motion.div variants={item} className="bg-surface/95 border border-border/80 rounded-2xl p-6 sm:p-7 shadow-sm flex flex-col justify-between items-center text-center relative overflow-hidden group hover:border-border transition-all duration-200">
            <div className="w-full flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-text-secondary tracking-wider uppercase select-none">Focus Today</span>
              <div className="w-8 h-8 rounded-xl bg-glow/10 border border-glow/20 flex items-center justify-center text-glow">
                <Timer className="w-4 h-4" />
              </div>
            </div>
            
            <div className="my-auto py-3 flex flex-col items-center justify-center">
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-5xl font-extrabold text-glow tracking-tight">{focusMinutesToday}</span>
                <span className="text-xs text-text-muted font-mono uppercase tracking-widest font-semibold">MIN</span>
              </div>
              <p className="text-xs text-text-muted mt-2">Deep work session output</p>
            </div>

            <Button
              onClick={() => navigate('/focus')}
              variant="secondary"
              size="md"
              className="w-full mt-4"
              icon={<Timer className="w-4 h-4" />}
            >
              Start Session
            </Button>
          </motion.div>

          {/* Today's Task Progress */}
          <motion.div variants={item} className="bg-surface/95 border border-border/80 rounded-2xl p-6 sm:p-7 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-border transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-text-secondary tracking-wider uppercase select-none">Task Progress</span>
              <div className="w-8 h-8 rounded-xl bg-success/10 border border-success/20 flex items-center justify-center text-success">
                <CheckSquare className="w-4 h-4" />
              </div>
            </div>

            <div className="my-auto py-2">
              <div className="flex items-baseline justify-between mb-3">
                <div className="flex items-baseline gap-1">
                  <span className="font-mono text-4xl font-extrabold text-text">{completedToday.length}</span>
                  <span className="text-xl text-text-muted font-mono font-medium">/{totalTasksCount}</span>
                </div>
                <span className="text-sm font-mono font-bold text-success bg-success/10 border border-success/20 px-2.5 py-1 rounded-lg">
                  {taskCompletionPct}%
                </span>
              </div>
              
              <div className="w-full h-2.5 bg-surface-2 rounded-full overflow-hidden mb-3 border border-border/40">
                <motion.div
                  className="h-full bg-success rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${taskCompletionPct}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>
              
              <p className="text-xs text-text-muted font-medium">
                {totalTasksCount === 0 ? 'No tasks scheduled for today' : `${todayTasks.length} tasks remaining to finish today`}
              </p>
            </div>
          </motion.div>

          {/* Top Habit Streaks Card */}
          <motion.div variants={item} className="bg-surface/95 border border-border/80 rounded-2xl p-6 sm:p-7 shadow-sm flex flex-col justify-between group hover:border-border transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-text-secondary tracking-wider uppercase select-none">Top Habits</span>
              <div className="w-8 h-8 rounded-xl bg-ember/10 border border-ember/20 flex items-center justify-center text-ember">
                <Flame className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-3 my-auto py-1">
              {habitStreaks.slice(0, 3).map(h => (
                <div key={h.id} className="flex items-center justify-between p-3 px-3.5 bg-surface-2/60 border border-border/50 rounded-xl hover:border-border transition-colors">
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
                      style={{
                        backgroundColor: `${h.color || '#00E5FF'}18`,
                        border: `1px solid ${h.color || '#00E5FF'}35`,
                        color: h.color || '#00E5FF',
                      }}
                    >
                      <HabitIcon icon={h.icon} className="w-4 h-4" />
                    </div>
                    <span className="text-sm text-text font-medium truncate">{h.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-ember bg-ember/10 border border-ember/20 px-2.5 py-1 rounded-lg flex-shrink-0">
                    <Flame className="w-3.5 h-3.5 fill-current" />
                    <span>{h.streak}d</span>
                  </div>
                </div>
              ))}
              {habitStreaks.length === 0 && (
                <div className="py-6 text-center text-xs text-text-muted border border-dashed border-border/60 rounded-xl">
                  No habits configured yet
                </div>
              )}
            </div>

            <Button
              onClick={() => navigate('/habits')}
              variant="ghost"
              size="sm"
              className="w-full mt-4"
              icon={<ChevronRight className="w-4 h-4" />}
              iconPosition="right"
            >
              View all habits
            </Button>
          </motion.div>

        </div>

        {/* Main Dashboard Grid — Generous 8 Gap */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          
          {/* Today's Tasks Column (2 cols) */}
          <motion.div variants={item} className="lg:col-span-2 bg-surface/95 border border-border/80 rounded-2xl p-6 sm:p-7 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-border/60">
                <div>
                  <h2 className="font-display text-lg font-semibold text-text tracking-tight">Today's Tasks</h2>
                  <p className="text-xs text-text-muted mt-0.5">{todayTasks.length} pending · {completedToday.length} completed</p>
                </div>
                <Button
                  onClick={() => navigate('/tasks')}
                  variant="ghost"
                  size="sm"
                  icon={<ChevronRight className="w-4 h-4" />}
                  iconPosition="right"
                >
                  View all tasks
                </Button>
              </div>

              {/* Quick Add Task Field */}
              <div className="flex gap-3 mb-6">
                <Input
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addQuickTask()}
                  placeholder="What's your next priority task today?"
                  containerClassName="flex-1"
                />
                <Button
                  onClick={addQuickTask}
                  disabled={!newTaskTitle.trim()}
                  variant="secondary"
                  size="icon"
                  className="mt-auto h-11 w-11 flex-shrink-0"
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </div>

              {/* Task Items List */}
              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                {[...todayTasks, ...completedToday].map(task => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3.5 p-3.5 px-4 bg-surface-2/60 border border-border/60 rounded-xl hover:border-border transition-all duration-150 group"
                  >
                    <button onClick={() => toggleTask(task.id)} className="flex-shrink-0 transition-transform active:scale-90 p-0.5">
                      {task.status === 'done' ? (
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      ) : (
                        <Circle className="w-5 h-5 text-text-muted group-hover:text-glow transition-colors" />
                      )}
                    </button>
                    <span className={`text-sm flex-1 truncate ${task.status === 'done' ? 'text-text-muted line-through' : 'text-text font-medium'}`}>
                      {task.title}
                    </span>
                    {task.dueTime && task.status !== 'done' && (
                      <span className="text-xs font-mono text-text-muted flex items-center gap-1.5 bg-surface-3/80 px-2.5 py-1 rounded-lg border border-border/40">
                        <Clock className="w-3.5 h-3.5" /> {formatTime(task.dueTime)}
                      </span>
                    )}
                    {task.priority === 'urgent' && task.status !== 'done' && (
                      <span className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase bg-danger-muted text-danger border border-danger/30 rounded-lg">
                        urgent
                      </span>
                    )}
                  </div>
                ))}

                {todayTasks.length === 0 && completedToday.length === 0 && (
                  <div className="py-14 text-center text-sm text-text-muted border border-dashed border-border/70 rounded-2xl flex flex-col items-center justify-center space-y-2">
                    <Sparkles className="w-6 h-6 text-text-muted/60 mb-1" />
                    <p className="font-medium text-text-secondary">No tasks scheduled for today</p>
                    <p className="text-xs text-text-muted">Type a task title above to quickly add one to your day</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Schedule Column (1 col) */}
          <motion.div variants={item} className="bg-surface/95 border border-border/80 rounded-2xl p-6 sm:p-7 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-border/60">
                <div>
                  <h2 className="font-display text-lg font-semibold text-text tracking-tight">Schedule</h2>
                  <p className="text-xs text-text-muted mt-0.5">Time blocks for today</p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-surface-2 flex items-center justify-center text-text-muted">
                  <CalendarIcon className="w-4 h-4" />
                </div>
              </div>

              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                {todayBlocks.map(block => (
                  <div key={block.id} className="flex items-start gap-3.5 p-3.5 px-4 bg-surface-2/60 border border-border/60 rounded-xl">
                    <div className={`w-1.5 h-10 rounded-full flex-shrink-0 mt-0.5 ${
                      block.category === 'deep-work' ? 'bg-glow' :
                      block.category === 'meeting' ? 'bg-pulse' :
                      block.category === 'exercise' ? 'bg-success' :
                      block.category === 'break' ? 'bg-drift' : 'bg-ember'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-text truncate">{block.title}</div>
                      <div className="text-xs font-mono text-text-muted mt-1">
                        {formatTime(block.startTime)} – {formatTime(block.endTime)}
                      </div>
                    </div>
                  </div>
                ))}
                {todayBlocks.length === 0 && (
                  <div className="py-14 text-center text-sm text-text-muted border border-dashed border-border/70 rounded-2xl flex flex-col items-center justify-center space-y-2">
                    <CalendarIcon className="w-6 h-6 text-text-muted/60 mb-1" />
                    <p className="font-medium text-text-secondary">No blocks scheduled</p>
                    <p className="text-xs text-text-muted">Add time blocks in Planner</p>
                  </div>
                )}
              </div>
            </div>

            <Button
              onClick={() => navigate('/planner')}
              variant="outline"
              size="md"
              className="w-full mt-6"
              icon={<ChevronRight className="w-4 h-4" />}
              iconPosition="right"
            >
              Open Planner
            </Button>
          </motion.div>

          {/* Active Goals Section (3 cols) */}
          <motion.div variants={item} className="lg:col-span-3 bg-surface/95 border border-border/80 rounded-2xl p-6 sm:p-7 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-border/60">
              <div>
                <h2 className="font-display text-lg font-semibold text-text tracking-tight">Active Goals</h2>
                <p className="text-xs text-text-muted mt-0.5">Key targets & milestone progress</p>
              </div>
              <Button
                onClick={() => navigate('/goals')}
                variant="ghost"
                size="sm"
                icon={<ChevronRight className="w-4 h-4" />}
                iconPosition="right"
              >
                View all goals
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {activeGoals.map(g => {
                const completed = g.milestones.filter(m => m.completed).length;
                const total = g.milestones.length;
                const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                return (
                  <div key={g.id} className="p-5 bg-surface-2/60 border border-border/60 rounded-xl hover:border-border transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-text truncate pr-2">{g.title}</span>
                      <span className="text-xs font-mono font-extrabold text-glow bg-glow/10 border border-glow/20 px-2.5 py-0.5 rounded-lg">
                        {pct}%
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-surface-3 rounded-full overflow-hidden mb-3 border border-border/40">
                      <motion.div
                        className="h-full bg-glow rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-text-muted font-mono">
                      <span>{completed}/{total} milestones</span>
                      <span className="uppercase tracking-wider font-semibold text-[10px] bg-surface-3 px-2 py-0.5 rounded-md">{g.category}</span>
                    </div>
                  </div>
                );
              })}
              {activeGoals.length === 0 && (
                <div className="col-span-2 py-12 text-center text-sm text-text-muted border border-dashed border-border/70 rounded-2xl flex flex-col items-center justify-center space-y-2">
                  <Target className="w-6 h-6 text-text-muted/60 mb-1" />
                  <p className="font-medium text-text-secondary">No active goals set</p>
                  <p className="text-xs text-text-muted">Start tracking a new target in Goals page</p>
                </div>
              )}
            </div>
          </motion.div>

        </div>
      </motion.div>
    </div>
  );
}
