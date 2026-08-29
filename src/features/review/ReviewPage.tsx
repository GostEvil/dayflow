import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, CheckCircle2, Target, Flame, TrendingUp, ChevronDown } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import type { Task, Habit, Goal, JournalEntry, FocusSession, WellbeingLog } from '../../types';
import { STORAGE_KEYS } from '../../types';
import { format, subDays, todayStr } from '../../lib/date-utils';

type ReviewPeriod = 'weekly' | 'monthly';

export function ReviewPage() {
  const [period, setPeriod] = useState<ReviewPeriod>('weekly');
  const [tasks] = useLocalStorage<Task[]>(STORAGE_KEYS.TASKS, []);
  const [habits] = useLocalStorage<Habit[]>(STORAGE_KEYS.HABITS, []);
  const [goals] = useLocalStorage<Goal[]>(STORAGE_KEYS.GOALS, []);
  const [journal] = useLocalStorage<JournalEntry[]>(STORAGE_KEYS.JOURNAL, []);
  const [sessions] = useLocalStorage<FocusSession[]>(STORAGE_KEYS.FOCUS_SESSIONS, []);
  const [wellbeing] = useLocalStorage<WellbeingLog[]>(STORAGE_KEYS.WELLBEING, []);
  const [intentions, setIntentions] = useState('');

  const days = period === 'weekly' ? 7 : 30;
  const dateRange = useMemo(() => Array.from({ length: days }, (_, i) => format(subDays(new Date(), i), 'yyyy-MM-dd')), [days]);

  const stats = useMemo(() => {
    const completedTasks = tasks.filter(t => t.completedAt && dateRange.includes(t.completedAt.split('T')[0]));
    const focusMin = sessions.filter(s => dateRange.includes(s.completedAt.split('T')[0])).reduce((sum, s) => sum + Math.round(s.elapsed / 60), 0);
    const habitConsistency = habits.length > 0
      ? Math.round(habits.reduce((sum, h) => sum + dateRange.filter(d => h.completions[d]).length, 0) / (habits.length * days) * 100)
      : 0;
    const avgMood = (() => {
      const entries = journal.filter(j => dateRange.includes(j.date));
      return entries.length > 0 ? (entries.reduce((s, j) => s + j.mood, 0) / entries.length).toFixed(1) : '—';
    })();
    const avgSleep = (() => {
      const logs = wellbeing.filter(w => dateRange.includes(w.date));
      return logs.length > 0 ? (logs.reduce((s, w) => s + w.sleepHours, 0) / logs.length).toFixed(1) : '—';
    })();
    const goalsCompleted = goals.filter(g => g.completedAt && dateRange.includes(g.completedAt.split('T')[0])).length;
    const milestonesCompleted = goals.reduce((sum, g) => sum + g.milestones.filter(m => m.completedAt && dateRange.includes(m.completedAt.split('T')[0])).length, 0);

    // Find wins
    const wins: string[] = [];
    if (completedTasks.length > 0) wins.push(`Completed ${completedTasks.length} tasks`);
    if (focusMin > 60) wins.push(`${focusMin} minutes of focused work`);
    if (milestonesCompleted > 0) wins.push(`${milestonesCompleted} milestones achieved`);
    if (habitConsistency > 70) wins.push(`${habitConsistency}% habit consistency`);

    return { completedTasks: completedTasks.length, focusMin, habitConsistency, avgMood, avgSleep, goalsCompleted, milestonesCompleted, wins };
  }, [tasks, habits, goals, journal, sessions, wellbeing, dateRange, days]);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[900px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-text">Review</h1>
          <p className="text-sm text-text-muted mt-1">Reflect on your progress</p>
        </div>
        <div className="flex gap-1.5 bg-surface border border-border rounded-2xl p-1.5 shadow-sm">
          <button onClick={() => setPeriod('weekly')} className={`px-4 py-2 text-sm rounded-xl font-medium transition-all duration-200 ${period === 'weekly' ? 'bg-glow/15 text-glow shadow-sm border border-glow/30' : 'text-text-muted hover:text-text'}`}>Weekly</button>
          <button onClick={() => setPeriod('monthly')} className={`px-4 py-2 text-sm rounded-xl font-medium transition-all duration-200 ${period === 'monthly' ? 'bg-glow/15 text-glow shadow-sm border border-glow/30' : 'text-text-muted hover:text-text'}`}>Monthly</button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {[
          { icon: CheckCircle2, label: 'Tasks Done', value: stats.completedTasks, color: 'text-glow' },
          { icon: Flame, label: 'Focus Minutes', value: stats.focusMin, color: 'text-pulse' },
          { icon: TrendingUp, label: 'Habit Rate', value: `${stats.habitConsistency}%`, color: 'text-ember' },
          { icon: Target, label: 'Milestones', value: stats.milestonesCompleted, color: 'text-success' },
          { icon: ClipboardList, label: 'Avg Mood', value: stats.avgMood, color: 'text-glow' },
          { icon: ClipboardList, label: 'Avg Sleep', value: `${stats.avgSleep}h`, color: 'text-pulse' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-surface border border-border rounded-2xl p-4 spotlight-card">
            <stat.icon className={`w-4 h-4 ${stat.color} mb-2`} />
            <div className={`font-mono text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-[10px] font-mono uppercase text-text-muted mt-1">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Wins */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-surface border border-border rounded-2xl p-5 mb-6">
        <div className="text-xs font-mono uppercase text-text-muted mb-3 tracking-wider">🏆 Wins this {period === 'weekly' ? 'week' : 'month'}</div>
        {stats.wins.length > 0 ? (
          <ul className="space-y-2">
            {stats.wins.map((win, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-text">
                <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                {win}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-text-muted">Keep going — your wins will show up here.</p>
        )}
      </motion.div>

      {/* Intentions */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="bg-surface border border-border rounded-2xl p-5">
        <div className="text-xs font-mono uppercase text-text-muted mb-3 tracking-wider">
          🎯 Intentions for next {period === 'weekly' ? 'week' : 'month'}
        </div>
        <textarea
          value={intentions}
          onChange={e => setIntentions(e.target.value)}
          placeholder="What do you want to focus on? What habits to maintain? What goals to push forward?"
          rows={4}
          className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm text-text outline-none placeholder:text-text-muted focus:border-glow/30 resize-none"
        />
      </motion.div>
    </div>
  );
}
