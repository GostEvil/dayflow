import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, AlertTriangle, TrendingUp, Moon, Brain, Flame, Clock, Sparkles } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import type { Task, Habit, FocusSession, JournalEntry, WellbeingLog } from '../../types';
import { STORAGE_KEYS } from '../../types';
import { format, subDays, todayStr } from '../../lib/date-utils';

interface Insight {
  id: string;
  type: 'suggestion' | 'warning' | 'trend' | 'correlation';
  icon: any;
  title: string;
  description: string;
  color: string;
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export function InsightsPage() {
  const [tasks] = useLocalStorage<Task[]>(STORAGE_KEYS.TASKS, []);
  const [habits] = useLocalStorage<Habit[]>(STORAGE_KEYS.HABITS, []);
  const [sessions] = useLocalStorage<FocusSession[]>(STORAGE_KEYS.FOCUS_SESSIONS, []);
  const [journal] = useLocalStorage<JournalEntry[]>(STORAGE_KEYS.JOURNAL, []);
  const [wellbeing] = useLocalStorage<WellbeingLog[]>(STORAGE_KEYS.WELLBEING, []);

  const insights = useMemo(() => {
    const results: Insight[] = [];
    const today = todayStr();
    const last7 = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), i), 'yyyy-MM-dd'));

    // Most productive day of week
    const dayCompletions: Record<string, number> = {};
    tasks.filter(t => t.completedAt).forEach(t => {
      const day = format(new Date(t.completedAt!), 'EEEE');
      dayCompletions[day] = (dayCompletions[day] || 0) + 1;
    });
    const bestDay = Object.entries(dayCompletions).sort(([, a], [, b]) => b - a)[0];
    if (bestDay) {
      results.push({
        id: 'best-day',
        type: 'trend',
        icon: TrendingUp,
        title: `${bestDay[0]}s are your most productive day`,
        description: `You've completed ${bestDay[1]} tasks on ${bestDay[0]}s — outperforming other weekdays. Consider scheduling deep analytical or complex work then.`,
        color: 'text-glow',
      });
    }

    // Focus time analysis
    const morningFocus = sessions
      .filter(s => {
        const h = new Date(s.completedAt).getHours();
        return h >= 6 && h < 12;
      })
      .reduce((s, ses) => s + ses.elapsed, 0);
    const afternoonFocus = sessions
      .filter(s => {
        const h = new Date(s.completedAt).getHours();
        return h >= 12 && h < 18;
      })
      .reduce((s, ses) => s + ses.elapsed, 0);
    const eveningFocus = sessions
      .filter(s => {
        const h = new Date(s.completedAt).getHours();
        return h >= 18;
      })
      .reduce((s, ses) => s + ses.elapsed, 0);

    if (morningFocus > afternoonFocus && morningFocus > eveningFocus) {
      results.push({
        id: 'focus-morning',
        type: 'suggestion',
        icon: Brain,
        title: 'Morning focus sessions show peak effectiveness',
        description: `You've logged ${Math.round(morningFocus / 60)} minutes of morning focus vs ${Math.round(afternoonFocus / 60)} in the afternoon. Schedule high-cognitive tasks before noon.`,
        color: 'text-pulse',
      });
    }

    // Sleep-productivity correlation
    const recentWellbeing = wellbeing.filter(w => last7.includes(w.date));
    const goodSleepDays = recentWellbeing.filter(w => w.sleepHours >= 7);
    const badSleepDays = recentWellbeing.filter(w => w.sleepHours < 7);
    if (goodSleepDays.length > 0 && badSleepDays.length > 0) {
      const goodSleepTaskAvg =
        goodSleepDays.reduce((sum, w) => {
          return sum + tasks.filter(t => t.completedAt?.startsWith(w.date)).length;
        }, 0) / goodSleepDays.length;
      const badSleepTaskAvg =
        badSleepDays.reduce((sum, w) => {
          return sum + tasks.filter(t => t.completedAt?.startsWith(w.date)).length;
        }, 0) / badSleepDays.length;
      if (goodSleepTaskAvg > badSleepTaskAvg * 1.3) {
        results.push({
          id: 'sleep-prod',
          type: 'correlation',
          icon: Moon,
          title: 'Quality sleep directly boosts task output',
          description: `On days with 7+ hours of sleep, you complete ${goodSleepTaskAvg.toFixed(1)} tasks on average vs ${badSleepTaskAvg.toFixed(1)} on shorter nights. Prioritize consistent rest.`,
          color: 'text-glow',
        });
      }
    }

    // Streak warnings
    habits.forEach(h => {
      let streak = 0;
      for (let i = 0; i < 365; i++) {
        const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
        if (h.completions[d]) streak++;
        else if (i > 0) break;
      }
      if (streak >= 5 && !h.completions[today]) {
        results.push({
          id: `streak-${h.id}`,
          type: 'warning',
          icon: Flame,
          title: `Protect your ${streak}-day "${h.name}" streak`,
          description: `You've maintained consistency for ${streak} days in a row. Complete "${h.name}" today to sustain this momentum.`,
          color: 'text-ember',
        });
      }
    });

    // Mood-productivity correlation
    const recentJournal = journal.filter(j => last7.includes(j.date));
    const happyDays = recentJournal.filter(j => j.mood >= 4);
    const lowDays = recentJournal.filter(j => j.mood <= 2);
    if (happyDays.length > 0 && lowDays.length > 0) {
      const happyTaskAvg =
        happyDays.reduce((sum, j) => sum + tasks.filter(t => t.completedAt?.startsWith(j.date)).length, 0) /
        happyDays.length;
      const lowTaskAvg =
        lowDays.reduce((sum, j) => sum + tasks.filter(t => t.completedAt?.startsWith(j.date)).length, 0) /
        lowDays.length;
      if (happyTaskAvg > lowTaskAvg) {
        results.push({
          id: 'mood-prod',
          type: 'correlation',
          icon: TrendingUp,
          title: 'Mindset directly correlates with daily completion',
          description: `High-mood days average ${happyTaskAvg.toFixed(1)} completed tasks vs ${lowTaskAvg.toFixed(1)} on low-energy days. Taking breaks and reflecting pays off.`,
          color: 'text-success',
        });
      }
    }

    // Weekly completion rate
    const last7Tasks = tasks.filter(t => t.completedAt && last7.some(d => t.completedAt!.startsWith(d)));
    if (last7Tasks.length > 0) {
      results.push({
        id: 'weekly-rate',
        type: 'trend',
        icon: Clock,
        title: `${last7Tasks.length} tasks completed over the last 7 days`,
        description: `Average of ${(last7Tasks.length / 7).toFixed(1)} tasks per day. ${
          last7Tasks.length > 20
            ? 'Outstanding productivity pace!'
            : last7Tasks.length > 10
            ? 'Solid consistency throughout the week.'
            : 'Keep building daily rhythm.'
        }`,
        color: 'text-glow',
      });
    }

    // Low energy warning
    if (recentWellbeing.length > 3) {
      const avgEnergy = recentWellbeing.reduce((s, w) => s + w.energyLevel, 0) / recentWellbeing.length;
      if (avgEnergy < 3) {
        results.push({
          id: 'low-energy',
          type: 'warning',
          icon: AlertTriangle,
          title: 'Energy levels have dipped recently',
          description: `Average energy this week is ${avgEnergy.toFixed(1)}/5. Consider scheduling more rest blocks or lightening cognitive load.`,
          color: 'text-danger',
        });
      }
    }

    return results;
  }, [tasks, habits, sessions, journal, wellbeing]);

  return (
    <div className="p-5 sm:p-8 lg:p-10 max-w-[1200px] mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-text tracking-tight">AI Insights & Patterns</h1>
        <p className="text-sm text-text-muted mt-1 font-mono">
          Algorithmic correlations from your habits, focus sessions, journal, and wellbeing logs
        </p>
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
        {insights.map(insight => {
          const Icon = insight.icon;
          return (
            <motion.div
              key={insight.id}
              variants={item}
              className="bg-surface border border-border/80 rounded-2xl p-7 sm:p-8 shadow-sm hover:border-border transition-all duration-200"
            >
              <div className="flex items-start gap-5">
                <div
                  className={`w-12 h-12 rounded-2xl bg-surface-2 border border-border/60 flex items-center justify-center flex-shrink-0 ${insight.color} shadow-sm`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-4 mb-2">
                    <span
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-semibold uppercase tracking-wider ${
                        insight.type === 'warning'
                          ? 'bg-ember/15 text-ember border border-ember/30'
                          : insight.type === 'suggestion'
                          ? 'bg-glow/15 text-glow border border-glow/30'
                          : insight.type === 'correlation'
                          ? 'bg-pulse/15 text-pulse border border-pulse/30'
                          : 'bg-success/15 text-success border border-success/30'
                      }`}
                    >
                      {insight.type}
                    </span>
                  </div>
                  <h3 className="text-text font-semibold text-base mb-1.5 leading-snug">
                    {insight.title}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {insight.description}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}

        {insights.length === 0 && (
          <div className="bg-surface border border-dashed border-border/80 rounded-2xl p-16 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-glow/20 flex items-center justify-center text-glow">
              <Lightbulb className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-text mb-1">No patterns detected yet</h3>
              <p className="text-sm text-text-muted max-w-sm">
                As you continue logging tasks, focus sessions, and habits, DayFlow will automatically uncover behavioral insights.
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
