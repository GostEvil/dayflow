import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
 CheckCircle2,
 Circle,
 Plus,
 Timer,
 Target,
 ChevronRight,
 Flame,
 Calendar as CalendarIcon,
 Clock,
 CheckSquare,
 Sparkles,
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
 show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
 hidden: { opacity: 0, y: 12 },
 show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
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
 const todayTasks = useMemo(
 () =>
 tasks.filter(
 t =>
 t.status === 'today' ||
 t.status === 'in-progress' ||
 (t.dueDate === today && t.status !== 'done')
 ),
 [tasks, today]
 );
 const completedToday = useMemo(
 () => tasks.filter(t => t.completedAt && t.completedAt.startsWith(today)),
 [tasks, today]
 );
 const todayBlocks = useMemo(
 () =>
 timeBlocks
 .filter(b => b.date === today)
 .sort((a, b) => a.startTime.localeCompare(b.startTime)),
 [timeBlocks, today]
 );
 const todaySessions = useMemo(
 () => sessions.filter(s => s.completedAt && s.completedAt.startsWith(today)),
 [sessions, today]
 );
 const focusMinutesToday = useMemo(
 () => todaySessions.reduce((sum, s) => sum + Math.round(s.elapsed / 60), 0),
 [todaySessions]
 );

 // Habit streaks
 const habitStreaks = useMemo(() => {
 return habits
 .map(h => {
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
 })
 .sort((a, b) => b.streak - a.streak);
 }, [habits]);

 // Active goals
 const activeGoals = useMemo(
 () => goals.filter(g => g.status === 'active').slice(0, 4),
 [goals]
 );

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
 setTasks(prev =>
 prev.map(t => {
 if (t.id !== taskId) return t;
 if (t.status === 'done') {
 return { ...t, status: 'today' as const, completedAt: null };
 }
 return { ...t, status: 'done' as const, completedAt: new Date().toISOString() };
 })
 );
 };

 const totalTasksCount = todayTasks.length + completedToday.length;
 const taskCompletionPct =
 totalTasksCount > 0 ? Math.round((completedToday.length / totalTasksCount) * 100) : 0;

 return (
 <div className="min-h-full text-text transition-colors duration-200">
 <div className="max-w-[1440px] mx-auto px-6 sm:px-12 lg:px-16 py-12 sm:py-16 space-y-16">
 <motion.div variants={container} initial="hidden" animate="show" className="space-y-16">
 {/* Header */}
 <motion.div variants={item} className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-2">
 <div>
 <p className="text-pulse text-sm font-semibold tracking-wider uppercase mb-1.5 font-mono">
 {format(new Date(), 'EEEE, MMMM d')}
 </p>
 <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-text">
 {getGreeting()}, <span className="text-white/90">{profile?.name || 'User'}</span>
 </h1>
 </div>
 <div className="flex items-center gap-4">
 <Button
 onClick={() => navigate('/focus')}
 variant="outline"
 size="md"
 className="bg-surface border-border hover:bg-surface-2"
 icon={<Timer className="w-4 h-4 text-glow" />}
 >
 Focus Timer
 </Button>
 <Button
 onClick={() => navigate('/tasks')}
 variant="primary"
 size="md"
 className="shadow-pulse/20"
 icon={<Plus className="w-4 h-4" />}
 >
 New Task
 </Button>
 </div>
 </motion.div>

 {/* Top Metrics Row - Glassmorphism */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
 {/* Focus Metric */}
 <motion.div variants={item} className="relative overflow-hidden bg-surface border border-border rounded-2xl p-6 group transition-all hover:bg-surface hover:border-border">
 <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
 <Timer className="w-16 h-16 text-glow" />
 </div>
 <div className="flex items-center gap-4 mb-6">
 <div className="w-10 h-10 rounded-xl bg-surface-2 bg-surface-2 flex items-center justify-center text-glow">
 <Timer className="w-5 h-5" />
 </div>
 <div>
 <h3 className="font-bold text-text">Deep Work</h3>
 <p className="text-xs text-text-muted">Focus sessions today</p>
 </div>
 </div>
 <div className="flex items-baseline gap-4">
 <span className="font-display text-5xl font-bold text-white">{focusMinutesToday}</span>
 <span className="text-sm font-medium text-text-muted uppercase tracking-widest font-mono">min</span>
 </div>
 </motion.div>

 {/* Task Metric */}
 <motion.div variants={item} className="relative overflow-hidden bg-surface border border-border rounded-2xl p-6 group transition-all hover:bg-surface hover:border-border">
 <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
 <CheckSquare className="w-16 h-16 text-success" />
 </div>
 <div className="flex items-center gap-4 mb-6">
 <div className="w-10 h-10 rounded-xl bg-surface-2 bg-surface-2 flex items-center justify-center text-success">
 <CheckSquare className="w-5 h-5" />
 </div>
 <div>
 <h3 className="font-bold text-text">Task Progress</h3>
 <p className="text-xs text-text-muted">{totalTasksCount === 0 ? 'No tasks today' : `${todayTasks.length} tasks remaining`}</p>
 </div>
 </div>
 <div className="flex items-baseline justify-between mb-3">
 <div className="flex items-baseline gap-1">
 <span className="font-display text-4xl font-bold text-white">{completedToday.length}</span>
 <span className="text-xl font-medium text-text-muted">/{totalTasksCount}</span>
 </div>
 <span className="text-xs font-mono font-bold text-success bg-surface-2 px-3 py-1.5 rounded-xl">{taskCompletionPct}%</span>
 </div>
 <div className="w-full h-1.5 bg-black/20 rounded-full overflow-hidden">
 <motion.div className="h-full bg-success" initial={{ width: 0 }} animate={{ width: `${taskCompletionPct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} />
 </div>
 </motion.div>

 {/* Habits Metric */}
 <motion.div variants={item} className="relative overflow-hidden bg-surface border border-border rounded-2xl p-6 group transition-all hover:bg-surface hover:border-border">
 <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
 <Flame className="w-16 h-16 text-ember" />
 </div>
 <div className="flex items-center gap-4 mb-6">
 <div className="w-10 h-10 rounded-xl bg-surface-2 bg-surface-2 flex items-center justify-center text-ember">
 <Flame className="w-5 h-5" />
 </div>
 <div>
 <h3 className="font-bold text-text">Habit Streaks</h3>
 <p className="text-xs text-text-muted">Active daily habits</p>
 </div>
 </div>
 <div className="flex items-baseline gap-4">
 <span className="font-display text-5xl font-bold text-white">{habitStreaks.filter(h => h.streak > 0).length}</span>
 <span className="text-sm font-medium text-text-muted uppercase tracking-widest font-mono">active</span>
 </div>
 </motion.div>
 </div>

 {/* Main Layout */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
 {/* Left Column (2 span) - Agenda */}
 <div className="lg:col-span-2 space-y-12">
 
 {/* Today's Tasks */}
 <motion.div variants={item}>
 <div className="flex items-center justify-between mb-6">
 <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-4">
 <CheckSquare className="w-5 h-5 text-pulse" />
 Today's Tasks
 </h2>
 <button onClick={() => navigate('/tasks')} className="text-sm font-medium text-text-muted hover:text-white transition-colors flex items-center gap-1 cursor-pointer">
 View all <ChevronRight className="w-4 h-4" />
 </button>
 </div>
 
 {/* Quick Add */}
 <div className="relative mb-6">
 <Plus className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
 <input 
 type="text" 
 value={newTaskTitle}
 onChange={e => setNewTaskTitle(e.target.value)}
 onKeyDown={e => e.key === 'Enter' && addQuickTask()}
 placeholder="What's your next priority task?"
 className="w-full h-14 pl-12 pr-14 rounded-2xl bg-surface border border-border text-white placeholder:text-text-muted/60 focus:outline-none focus:border-pulse focus:ring-1 focus:ring-pulse/30 transition-all shadow-sm"
 />
 <button 
 onClick={addQuickTask}
 disabled={!newTaskTitle.trim()}
 className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-pulse text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
 >
 <Plus className="w-5 h-5" />
 </button>
 </div>

 <div className="space-y-4">
 {[...todayTasks, ...completedToday].map(task => (
 <div
 key={task.id}
 className="group flex items-center gap-4 p-4 rounded-2xl bg-surface border border-transparent hover:border-border hover:bg-surface transition-all"
 >
 <button
 onClick={() => toggleTask(task.id)}
 className="flex-shrink-0 transition-transform active:scale-90 cursor-pointer"
 >
 {task.status === 'done' ? (
 <CheckCircle2 className="w-6 h-6 text-success" />
 ) : (
 <Circle className="w-6 h-6 text-text-muted group-hover:text-pulse transition-colors" />
 )}
 </button>
 <div className="flex-1 min-w-0">
 <span className={`block text-base truncate ${task.status === 'done' ? 'text-text-muted line-through' : 'text-white font-medium'}`}>
 {task.title}
 </span>
 </div>
 <div className="flex items-center gap-4">
 {task.priority === 'urgent' && task.status !== 'done' && (
 <span className="w-2 h-2 rounded-full bg-danger shadow-[0_0_8px_rgba(239,68,68,0.6)]" title="Urgent" />
 )}
 {task.dueTime && task.status !== 'done' && (
 <span className="text-xs font-mono font-medium text-text-muted flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-xl border border-border">
 <Clock className="w-3.5 h-3.5" /> {formatTime(task.dueTime)}
 </span>
 )}
 </div>
 </div>
 ))}
 {todayTasks.length === 0 && completedToday.length === 0 && (
 <div className="py-12 text-center flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface">
 <Sparkles className="w-8 h-8 text-text-muted/40 mb-3" />
 <p className="text-white font-medium">No tasks scheduled</p>
 <p className="text-sm text-text-muted mt-1">Add a task above to start your day</p>
 </div>
 )}
 </div>
 </motion.div>

 {/* Today's Schedule */}
 <motion.div variants={item} className="pt-4">
 <div className="flex items-center justify-between mb-6">
 <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-4">
 <CalendarIcon className="w-5 h-5 text-glow" />
 Today's Schedule
 </h2>
 <button onClick={() => navigate('/planner')} className="text-sm font-medium text-text-muted hover:text-white transition-colors flex items-center gap-1 cursor-pointer">
 Open Planner <ChevronRight className="w-4 h-4" />
 </button>
 </div>

 <div className="relative pl-6 space-y-6 before:absolute before:inset-y-2 before:left-[11px] before:w-[2px] before:bg-white/5">
 {todayBlocks.map(block => (
 <div key={block.id} className="relative flex items-start gap-8">
 <div className={`absolute -left-6 top-1.5 w-6 h-6 rounded-full border-4 border-void flex items-center justify-center
 ${block.category === 'deep-work' ? 'bg-glow shadow-[0_0_10px_rgba(0,229,255,0.4)]' 
 : block.category === 'meeting' ? 'bg-pulse shadow-[0_0_10px_rgba(189,0,255,0.4)]'
 : block.category === 'exercise' ? 'bg-success'
 : block.category === 'break' ? 'bg-drift' : 'bg-ember'}
 `} />
 <div className="flex-1 bg-surface border border-border rounded-2xl p-5 hover:bg-surface transition-all">
 <div className="flex items-start justify-between gap-4">
 <div>
 <h4 className="font-bold text-white">{block.title}</h4>
 <div className="text-xs font-mono font-medium text-text-muted mt-1.5 flex items-center gap-1.5">
 <Clock className="w-3.5 h-3.5" />
 {formatTime(block.startTime)} – {formatTime(block.endTime)}
 </div>
 </div>
 <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted bg-black/30 px-3 py-1.5 rounded-lg">
 {block.category.replace('-', ' ')}
 </span>
 </div>
 </div>
 </div>
 ))}
 {todayBlocks.length === 0 && (
 <div className="py-8 ml-4 text-sm text-text-muted italic">No time blocks scheduled for today.</div>
 )}
 </div>
 </motion.div>

 </div>

 {/* Right Column (1 span) - Goals & Habits */}
 <div className="space-y-12">
 
 {/* Active Goals */}
 <motion.div variants={item}>
 <div className="flex items-center justify-between mb-6">
 <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-4">
 <Target className="w-5 h-5 text-ember" />
 Active Goals
 </h2>
 <button onClick={() => navigate('/goals')} className="text-text-muted hover:text-white transition-colors p-1 cursor-pointer">
 <ChevronRight className="w-5 h-5" />
 </button>
 </div>
 
 <div className="space-y-4">
 {activeGoals.map(g => {
 const completed = g.milestones.filter(m => m.completed).length;
 const total = g.milestones.length;
 const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
 return (
 <div key={g.id} className="p-5 rounded-2xl bg-surface border border-border hover:border-border transition-all">
 <div className="flex items-center justify-between mb-4">
 <h4 className="font-bold text-white truncate pr-4">{g.title}</h4>
 <span className="text-xs font-mono font-bold text-white bg-black/40 px-3 py-1.5 rounded-xl">{pct}%</span>
 </div>
 <div className="w-full h-1.5 bg-black/30 rounded-full overflow-hidden mb-3">
 <motion.div 
 className="h-full bg-gradient-to-r from-ember to-pulse" 
 initial={{ width: 0 }} 
 animate={{ width: `${pct}%` }} 
 transition={{ duration: 0.8, ease: 'easeOut' }} 
 />
 </div>
 <p className="text-[11px] font-mono font-medium text-text-muted tracking-wide">
 {completed} of {total} milestones
 </p>
 </div>
 );
 })}
 {activeGoals.length === 0 && (
 <div className="p-6 rounded-2xl border border-dashed border-border bg-surface text-center">
 <p className="text-sm text-text-muted">No active goals</p>
 </div>
 )}
 </div>
 </motion.div>

 {/* Top Habits */}
 <motion.div variants={item}>
 <div className="flex items-center justify-between mb-6">
 <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-4">
 <Flame className="w-5 h-5 text-ember" />
 Top Habits
 </h2>
 <button onClick={() => navigate('/habits')} className="text-text-muted hover:text-white transition-colors p-1 cursor-pointer">
 <ChevronRight className="w-5 h-5" />
 </button>
 </div>

 <div className="bg-surface border border-border rounded-2xl p-4">
 {habitStreaks.slice(0, 4).map(h => (
 <div key={h.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-colors group">
 <div className="flex items-center gap-4">
 <div 
 className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
 style={{ backgroundColor: `${h.color || '#00E5FF'}15`, color: h.color || '#00E5FF' }}
 >
 <HabitIcon icon={h.icon} className="w-5 h-5" />
 </div>
 <span className="text-sm font-medium text-white group-hover:text-glow transition-colors">{h.name}</span>
 </div>
 <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-ember bg-surface-2 border border-ember/20 px-3 py-1.5 rounded-xl">
 <Flame className="w-3.5 h-3.5 fill-current" />
 {h.streak}d
 </div>
 </div>
 ))}
 {habitStreaks.length === 0 && (
 <div className="p-6 text-center text-sm text-text-muted">No habits tracked</div>
 )}
 </div>
 </motion.div>

 </div>
 </div>
 </motion.div>
 </div>
 </div>
 );
}
