import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, CheckCircle2, Target, Flame, TrendingUp, Trophy, Sparkles } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import type { Task, Habit, Goal, JournalEntry, FocusSession, WellbeingLog } from '../../types';
import { STORAGE_KEYS } from '../../types';
import { format, subDays } from '../../lib/date-utils';
import { Textarea } from '../../components/ui/Textarea';

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
  const dateRange = useMemo(
    () => Array.from({ length: days }, (_, i) => format(subDays(new Date(), i), 'yyyy-MM-dd')),
    [days]
  );

  const stats = useMemo(() => {
    const completedTasks = tasks.filter(
      t => t.completedAt && dateRange.includes(t.completedAt.split('T')[0])
    );
    const focusMin = sessions
      .filter(s => dateRange.includes(s.completedAt.split('T')[0]))
      .reduce((sum, s) => sum + Math.round(s.elapsed / 60), 0);
    const habitConsistency =
      habits.length > 0
        ? Math.round(
            (habits.reduce(
              (sum, h) => sum + dateRange.filter(d => h.completions[d]).length,
              0
            ) /
              (habits.length * days)) *
              100
          )
        : 0;
    const avgMood = (() => {
      const entries = journal.filter(j => dateRange.includes(j.date));
      return entries.length > 0
        ? (entries.reduce((s, j) => s + j.mood, 0) / entries.length).toFixed(1)
        : '—';
    })();
    const avgSleep = (() => {
      const logs = wellbeing.filter(w => dateRange.includes(w.date));
      return logs.length > 0
        ? (logs.reduce((s, w) => s + w.sleepHours, 0) / logs.length).toFixed(1)
        : '—';
    })();
    const goalsCompleted = goals.filter(
      g => g.completedAt && dateRange.includes(g.completedAt.split('T')[0])
    );
    const milestonesCompleted = goals.reduce(
      (sum, g) =>
        sum +
        g.milestones.filter(m => m.completedAt && dateRange.includes(m.completedAt.split('T')[0]))
          .length,
      0
    );

    // Find wins
    const wins: string[] = [];
    if (completedTasks.length > 0) wins.push(`Completed ${completedTasks.length} tasks`);
    if (focusMin > 60) wins.push(`${focusMin} minutes of deep focus work`);
    if (milestonesCompleted > 0) wins.push(`${milestonesCompleted} milestones achieved`);
    if (habitConsistency > 70) wins.push(`${habitConsistency}% habit consistency maintained`);
    if (goalsCompleted.length > 0) wins.push(`${goalsCompleted.length} goals successfully finished`);

    return {
      completedTasks: completedTasks.length,
      focusMin,
      habitConsistency,
      avgMood,
      avgSleep,
      milestonesCompleted,
      wins,
    };
  }, [tasks, habits, goals, journal, sessions, wellbeing, dateRange, days]);

  return (
    <div className="p-5 sm:p-8 lg:p-10 max-w-[1200px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-text tracking-tight">Periodic Review</h1>
          <p className="text-sm text-text-muted mt-1 font-mono">
            Reflect on your achievements, habits, and set clear upcoming intentions
          </p>
        </div>
        <div className="flex gap-1.5 bg-surface-2 border border-border/80 rounded-2xl p-1.5 shadow-sm">
          <button
            onClick={() => setPeriod('weekly')}
            className={`px-4 py-2 text-xs rounded-xl font-medium transition-all duration-150 ${
              period === 'weekly'
                ? 'bg-surface text-glow shadow-sm border border-border/60 font-semibold'
                : 'text-text-muted hover:text-text'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setPeriod('monthly')}
            className={`px-4 py-2 text-xs rounded-xl font-medium transition-all duration-150 ${
              period === 'monthly'
                ? 'bg-surface text-glow shadow-sm border border-border/60 font-semibold'
                : 'text-text-muted hover:text-text'
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      {/* Summary Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { icon: CheckCircle2, label: 'Tasks Done', value: stats.completedTasks, color: 'text-glow', bg: 'bg-surface-2', border: 'border-glow/20' },
          { icon: Flame, label: 'Focus Minutes', value: stats.focusMin, color: 'text-pulse', bg: 'bg-surface-2', border: 'border-pulse/20' },
          { icon: TrendingUp, label: 'Habit Consistency', value: `${stats.habitConsistency}%`, color: 'text-ember', bg: 'bg-surface-2', border: 'border-ember/20' },
          { icon: Target, label: 'Milestones Done', value: stats.milestonesCompleted, color: 'text-success', bg: 'bg-surface-2', border: 'border-success/20' },
          { icon: Sparkles, label: 'Avg Mood Rating', value: `${stats.avgMood}/5`, color: 'text-glow', bg: 'bg-surface-2', border: 'border-glow/20' },
          { icon: ClipboardList, label: 'Avg Sleep Duration', value: `${stats.avgSleep}h`, color: 'text-pulse', bg: 'bg-surface-2', border: 'border-pulse/20' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="bg-surface border border-border/80 rounded-2xl p-7 shadow-sm flex flex-col justify-between hover:border-border transition-all"
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

      {/* Key Wins Section */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-surface border border-border/80 rounded-2xl p-7 sm:p-8 shadow-sm"
      >
        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-border/60">
          <div className="w-8 h-8 rounded-xl bg-surface-2 border border-ember/20 flex items-center justify-center text-ember">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-text">
              Wins & Highlights this {period === 'weekly' ? 'Week' : 'Month'}
            </h3>
            <p className="text-xs text-text-muted">Celebrated milestones and consistency achievements</p>
          </div>
        </div>

        {stats.wins.length > 0 ? (
          <ul className="space-y-4">
            {stats.wins.map((win, i) => (
              <li
                key={i}
                className="flex items-center gap-4.5 text-sm text-text font-medium bg-surface-2 border border-border/60 rounded-xl p-4 hover:border-border transition-all"
              >
                <div className="w-6 h-6 rounded-lg bg-success/15 border border-success/30 flex items-center justify-center text-success flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span>{win}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-xs text-text-muted font-mono py-8 text-center border border-dashed border-border/60 rounded-xl">
            Keep building momentum — your wins and accomplishments will be highlighted here.
          </div>
        )}
      </motion.div>

      {/* Intentions Section */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-surface border border-border/80 rounded-2xl p-7 sm:p-8 shadow-sm"
      >
        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-border/60">
          <div className="w-8 h-8 rounded-xl bg-surface-2 border border-glow/20 flex items-center justify-center text-glow">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-text">
              Intentions for Next {period === 'weekly' ? 'Week' : 'Month'}
            </h3>
            <p className="text-xs text-text-muted">Define your primary focus areas and key targets</p>
          </div>
        </div>

        <Textarea
          value={intentions}
          onChange={e => setIntentions(e.target.value)}
          placeholder="What do you want to achieve next? What habits or goals will you prioritize?"
          rows={5}
        />
      </motion.div>
    </div>
  );
}
