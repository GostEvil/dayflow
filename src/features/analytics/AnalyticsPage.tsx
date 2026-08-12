import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import type { Task, Habit, FocusSession, Goal, JournalEntry } from '../../types';
import { STORAGE_KEYS } from '../../types';
import { format, subDays, getLast7Days, getLast30Days, todayStr } from '../../lib/date-utils';
import { TrendingUp, CheckCircle2, Timer, Target, Flame } from 'lucide-react';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export function AnalyticsPage() {
  const [tasks] = useLocalStorage<Task[]>(STORAGE_KEYS.TASKS, []);
  const [habits] = useLocalStorage<Habit[]>(STORAGE_KEYS.HABITS, []);
  const [sessions] = useLocalStorage<FocusSession[]>(STORAGE_KEYS.FOCUS_SESSIONS, []);
  const [goals] = useLocalStorage<Goal[]>(STORAGE_KEYS.GOALS, []);
  const [period, setPeriod] = useLocalStorage<'7' | '30'>('dayflow_analytics_period', '7');

  const days = period === '7' ? getLast7Days() : getLast30Days();

  // Task completion trend
  const taskData = useMemo(() => days.map(d => {
    const ds = format(d, 'yyyy-MM-dd');
    const completed = tasks.filter(t => t.completedAt?.startsWith(ds)).length;
    return { date: format(d, period === '7' ? 'EEE' : 'MMM d'), completed };
  }), [tasks, days, period]);

  // Focus minutes trend
  const focusData = useMemo(() => days.map(d => {
    const ds = format(d, 'yyyy-MM-dd');
    const minutes = sessions.filter(s => s.completedAt.startsWith(ds)).reduce((sum, s) => sum + Math.round(s.elapsed / 60), 0);
    return { date: format(d, period === '7' ? 'EEE' : 'MMM d'), minutes };
  }), [sessions, days, period]);

  // Habit consistency
  const habitData = useMemo(() => days.map(d => {
    const ds = format(d, 'yyyy-MM-dd');
    const total = habits.filter(h => h.targetDays.includes(d.getDay())).length;
    const done = habits.filter(h => h.targetDays.includes(d.getDay()) && h.completions[ds]).length;
    return { date: format(d, period === '7' ? 'EEE' : 'MMM d'), pct: total > 0 ? Math.round((done / total) * 100) : 0 };
  }), [habits, days, period]);

  // Summary stats
  const totalCompleted = useMemo(() => tasks.filter(t => t.completedAt && days.some(d => t.completedAt!.startsWith(format(d, 'yyyy-MM-dd')))).length, [tasks, days]);
  const totalFocusMin = useMemo(() => sessions.filter(s => days.some(d => s.completedAt.startsWith(format(d, 'yyyy-MM-dd')))).reduce((s, ses) => s + Math.round(ses.elapsed / 60), 0), [sessions, days]);
  const avgHabitPct = useMemo(() => { const vals = habitData.map(d => d.pct); return vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0; }, [habitData]);
  const goalsProgress = useMemo(() => {
    const active = goals.filter(g => g.status === 'active');
    if (active.length === 0) return 0;
    return Math.round(active.reduce((sum, g) => {
      const done = g.milestones.filter(m => m.completed).length;
      return sum + (g.milestones.length > 0 ? done / g.milestones.length : 0);
    }, 0) / active.length * 100);
  }, [goals]);

  // Most productive day
  const bestDay = useMemo(() => {
    const dayCounts: Record<string, number> = {};
    tasks.filter(t => t.completedAt).forEach(t => {
      const day = format(new Date(t.completedAt!), 'EEEE');
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });
    return Object.entries(dayCounts).sort(([,a],[,b]) => b - a)[0]?.[0] || 'N/A';
  }, [tasks]);

  // Category breakdown
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.filter(t => t.completedAt).forEach(t => { counts[t.category] = (counts[t.category] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [tasks]);

  const CHART_COLORS = ['#00E5FF', '#A855F7', '#F97316', '#10B981', '#EF4444', '#64748B'];

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
      <motion.div variants={container} initial="hidden" animate="show">
        <motion.div variants={item} className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-text">Analytics</h1>
            <p className="text-sm text-text-muted mt-1">Your productivity trends</p>
          </div>
          <div className="flex bg-surface border border-border rounded-lg">
            <button onClick={() => setPeriod('7')} className={`px-3 py-1.5 text-sm rounded-l-lg transition-colors ${period === '7' ? 'bg-surface-2 text-glow' : 'text-text-muted'}`}>7 Days</button>
            <button onClick={() => setPeriod('30')} className={`px-3 py-1.5 text-sm rounded-r-lg transition-colors ${period === '30' ? 'bg-surface-2 text-glow' : 'text-text-muted'}`}>30 Days</button>
          </div>
        </motion.div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {[
            { icon: CheckCircle2, label: 'Tasks Done', value: totalCompleted, color: 'text-glow' },
            { icon: Timer, label: 'Focus Min', value: totalFocusMin, color: 'text-pulse' },
            { icon: Flame, label: 'Habit Rate', value: `${avgHabitPct}%`, color: 'text-ember' },
            { icon: Target, label: 'Goal Progress', value: `${goalsProgress}%`, color: 'text-success' },
            { icon: TrendingUp, label: 'Best Day', value: bestDay, color: 'text-text' },
          ].map((stat, i) => (
            <motion.div key={i} variants={item} className="bg-surface border border-border rounded-2xl p-4 spotlight-card">
              <stat.icon className={`w-4 h-4 ${stat.color} mb-2`} />
              <div className={`font-mono text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-[10px] font-mono uppercase text-text-muted mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <motion.div variants={item} className="bg-surface border border-border rounded-2xl p-5">
            <div className="text-xs font-mono uppercase text-text-muted mb-4 tracking-wider">Task Completion</div>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={taskData}>
                  <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} width={20} />
                  <Tooltip contentStyle={{ background: '#0F0F18', border: '1px solid #1E1E3A', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="completed" fill="#00E5FF" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div variants={item} className="bg-surface border border-border rounded-2xl p-5">
            <div className="text-xs font-mono uppercase text-text-muted mb-4 tracking-wider">Focus Minutes</div>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={focusData}>
                  <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} width={20} />
                  <Tooltip contentStyle={{ background: '#0F0F18', border: '1px solid #1E1E3A', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="minutes" fill="#A855F7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div variants={item} className="bg-surface border border-border rounded-2xl p-5">
            <div className="text-xs font-mono uppercase text-text-muted mb-4 tracking-wider">Habit Consistency</div>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={habitData}>
                  <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} width={25} />
                  <Tooltip contentStyle={{ background: '#0F0F18', border: '1px solid #1E1E3A', borderRadius: 8, fontSize: 12 }} />
                  <Line type="monotone" dataKey="pct" stroke="#F97316" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div variants={item} className="bg-surface border border-border rounded-2xl p-5">
            <div className="text-xs font-mono uppercase text-text-muted mb-4 tracking-wider">Task Categories</div>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, percent = 0 }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}>
                    {categoryData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0F0F18', border: '1px solid #1E1E3A', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
