import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import type { Task, Habit, FocusSession, Goal } from '../../types';
import { STORAGE_KEYS } from '../../types';
import { format, getLast7Days, getLast30Days } from '../../lib/date-utils';
import { TrendingUp, CheckCircle2, Timer, Target, Flame } from 'lucide-react';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export function AnalyticsPage() {
  const [tasks] = useLocalStorage<Task[]>(STORAGE_KEYS.TASKS, []);
  const [habits] = useLocalStorage<Habit[]>(STORAGE_KEYS.HABITS, []);
  const [sessions] = useLocalStorage<FocusSession[]>(STORAGE_KEYS.FOCUS_SESSIONS, []);
  const [goals] = useLocalStorage<Goal[]>(STORAGE_KEYS.GOALS, []);
  const [period, setPeriod] = useLocalStorage<'7' | '30'>('dayflow_analytics_period', '7');

  const days = period === '7' ? getLast7Days() : getLast30Days();

  // Task completion trend
  const taskData = useMemo(
    () =>
      days.map(d => {
        const ds = format(d, 'yyyy-MM-dd');
        const completed = tasks.filter(t => t.completedAt?.startsWith(ds)).length;
        return { date: format(d, period === '7' ? 'EEE' : 'MMM d'), completed };
      }),
    [tasks, days, period]
  );

  // Focus minutes trend
  const focusData = useMemo(
    () =>
      days.map(d => {
        const ds = format(d, 'yyyy-MM-dd');
        const minutes = sessions
          .filter(s => s.completedAt.startsWith(ds))
          .reduce((sum, s) => sum + Math.round(s.elapsed / 60), 0);
        return { date: format(d, period === '7' ? 'EEE' : 'MMM d'), minutes };
      }),
    [sessions, days, period]
  );

  // Habit consistency
  const habitData = useMemo(
    () =>
      days.map(d => {
        const ds = format(d, 'yyyy-MM-dd');
        const total = habits.filter(h => h.targetDays.includes(d.getDay())).length;
        const done = habits.filter(
          h => h.targetDays.includes(d.getDay()) && h.completions[ds]
        ).length;
        return {
          date: format(d, period === '7' ? 'EEE' : 'MMM d'),
          pct: total > 0 ? Math.round((done / total) * 100) : 0,
        };
      }),
    [habits, days, period]
  );

  // Summary stats
  const totalCompleted = useMemo(
    () =>
      tasks.filter(
        t => t.completedAt && days.some(d => t.completedAt!.startsWith(format(d, 'yyyy-MM-dd')))
      ).length,
    [tasks, days]
  );
  const totalFocusMin = useMemo(
    () =>
      sessions
        .filter(s => days.some(d => s.completedAt.startsWith(format(d, 'yyyy-MM-dd'))))
        .reduce((s, ses) => s + Math.round(ses.elapsed / 60), 0),
    [sessions, days]
  );
  const avgHabitPct = useMemo(() => {
    const vals = habitData.map(d => d.pct);
    return vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
  }, [habitData]);
  const goalsProgress = useMemo(() => {
    const active = goals.filter(g => g.status === 'active');
    if (active.length === 0) return 0;
    return Math.round(
      (active.reduce((sum, g) => {
        const done = g.milestones.filter(m => m.completed).length;
        return sum + (g.milestones.length > 0 ? done / g.milestones.length : 0);
      }, 0) /
        active.length) *
        100
    );
  }, [goals]);

  // Most productive day
  const bestDay = useMemo(() => {
    const dayCounts: Record<string, number> = {};
    tasks
      .filter(t => t.completedAt)
      .forEach(t => {
        const day = format(new Date(t.completedAt!), 'EEEE');
        dayCounts[day] = (dayCounts[day] || 0) + 1;
      });
    return Object.entries(dayCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';
  }, [tasks]);

  // Category breakdown
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks
      .filter(t => t.completedAt)
      .forEach(t => {
        counts[t.category] = (counts[t.category] || 0) + 1;
      });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [tasks]);

  const CHART_COLORS = ['#00E5FF', '#A855F7', '#F97316', '#10B981', '#EF4444', '#64748B'];

  return (
    <div className="p-5 sm:p-8 lg:p-10 max-w-[1440px] mx-auto space-y-8">
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
        {/* Top Header */}
        <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-text tracking-tight">Analytics</h1>
            <p className="text-sm text-text-muted mt-1 font-mono">
              Productivity velocity, focus volume, and habit execution metrics
            </p>
          </div>
          <div className="flex gap-1.5 bg-surface-2/80 border border-border/80 rounded-2xl p-1.5 shadow-sm">
            <button
              onClick={() => setPeriod('7')}
              className={`px-4 py-2 text-xs rounded-xl font-medium transition-all duration-150 cursor-pointer ${
                period === '7'
                  ? 'bg-surface text-glow shadow-sm border border-border/60 font-semibold'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setPeriod('30')}
              className={`px-4 py-2 text-xs rounded-xl font-medium transition-all duration-150 cursor-pointer ${
                period === '30'
                  ? 'bg-surface text-glow shadow-sm border border-border/60 font-semibold'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              30 Days
            </button>
          </div>
        </motion.div>

        {/* Summary Bento Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
          {[
            { icon: CheckCircle2, label: 'Tasks Completed', value: totalCompleted, color: 'text-glow', bg: 'bg-glow/10', border: 'border-glow/20' },
            { icon: Timer, label: 'Focus Minutes', value: totalFocusMin, color: 'text-pulse', bg: 'bg-pulse/10', border: 'border-pulse/20' },
            { icon: Flame, label: 'Habit Rate', value: `${avgHabitPct}%`, color: 'text-ember', bg: 'bg-ember/10', border: 'border-ember/20' },
            { icon: Target, label: 'Goal Progress', value: `${goalsProgress}%`, color: 'text-success', bg: 'bg-success/10', border: 'border-success/20' },
            { icon: TrendingUp, label: 'Peak Day', value: bestDay, color: 'text-text', bg: 'bg-surface-2', border: 'border-border/50' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              variants={item}
              className="bg-surface/95 border border-border/80 rounded-2xl p-7 shadow-sm flex flex-col justify-between hover:border-border transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-medium text-text-secondary">{stat.label}</span>
                <div className={`w-8 h-8 rounded-xl ${stat.bg} ${stat.border} border flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-4 h-4" />
                </div>
              </div>
              <div className={`font-mono text-3xl font-extrabold ${stat.color} tracking-tight`}>
                {stat.value}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts 2x2 Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <motion.div
            variants={item}
            className="bg-surface/95 border border-border/80 rounded-3xl p-7 sm:p-8 shadow-sm"
          >
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-border/60">
              <div>
                <h3 className="font-display text-lg font-semibold text-text">Task Velocity</h3>
                <p className="text-xs text-text-muted">Completed items per day</p>
              </div>
              <span className="text-xs font-mono text-glow bg-glow/10 border border-glow/20 px-3 py-1.5 rounded-lg">
                Tasks
              </span>
            </div>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={taskData}>
                  <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} width={25} />
                  <Tooltip contentStyle={{ background: '#0F0F18', border: '1px solid #1E1E3A', borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="completed" fill="#00E5FF" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div
            variants={item}
            className="bg-surface/95 border border-border/80 rounded-3xl p-7 sm:p-8 shadow-sm"
          >
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-border/60">
              <div>
                <h3 className="font-display text-lg font-semibold text-text">Focus Minutes</h3>
                <p className="text-xs text-text-muted">Deep work output volume</p>
              </div>
              <span className="text-xs font-mono text-pulse bg-pulse/10 border border-pulse/20 px-3 py-1.5 rounded-lg">
                Minutes
              </span>
            </div>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={focusData}>
                  <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} width={25} />
                  <Tooltip contentStyle={{ background: '#0F0F18', border: '1px solid #1E1E3A', borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="minutes" fill="#A855F7" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div
            variants={item}
            className="bg-surface/95 border border-border/80 rounded-3xl p-7 sm:p-8 shadow-sm"
          >
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-border/60">
              <div>
                <h3 className="font-display text-lg font-semibold text-text">Habit Consistency</h3>
                <p className="text-xs text-text-muted">Completion rate percentage</p>
              </div>
              <span className="text-xs font-mono text-ember bg-ember/10 border border-ember/20 px-3 py-1.5 rounded-lg">
                % Consistency
              </span>
            </div>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={habitData}>
                  <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip contentStyle={{ background: '#0F0F18', border: '1px solid #1E1E3A', borderRadius: 12, fontSize: 12 }} />
                  <Line type="monotone" dataKey="pct" stroke="#F97316" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div
            variants={item}
            className="bg-surface/95 border border-border/80 rounded-3xl p-7 sm:p-8 shadow-sm"
          >
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-border/60">
              <div>
                <h3 className="font-display text-lg font-semibold text-text">Task Categories</h3>
                <p className="text-xs text-text-muted">Distribution across life areas</p>
              </div>
              <span className="text-xs font-mono text-text-muted bg-surface-2 px-3 py-1.5 rounded-lg border border-border/40">
                Breakdown
              </span>
            </div>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent = 0 }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0F0F18', border: '1px solid #1E1E3A', borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
