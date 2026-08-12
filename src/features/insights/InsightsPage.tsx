import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, AlertTriangle, TrendingUp, Moon, Brain, Flame, Clock } from 'lucide-react';
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
    const last30 = Array.from({ length: 30 }, (_, i) => format(subDays(new Date(), i), 'yyyy-MM-dd'));

    // Most productive day of week
    const dayCompletions: Record<string, number> = {};
    tasks.filter(t => t.completedAt).forEach(t => {
      const day = format(new Date(t.completedAt!), 'EEEE');
      dayCompletions[day] = (dayCompletions[day] || 0) + 1;
    });
    const bestDay = Object.entries(dayCompletions).sort(([, a], [, b]) => b - a)[0];
    if (bestDay) {
      results.push({
        id: 'best-day', type: 'trend', icon: TrendingUp,
        title: `${bestDay[0]}s are your most productive day`,
        description: `You've completed ${bestDay[1]} tasks on ${bestDay[0]}s — more than any other day. Consider scheduling your most important work then.`,
        color: 'text-glow',
      });
    }

    // Focus time analysis
    const morningFocus = sessions.filter(s => {
      const h = new Date(s.completedAt).getHours();
      return h >= 6 && h < 12;
    }).reduce((s, ses) => s + ses.elapsed, 0);
    const afternoonFocus = sessions.filter(s => {
      const h = new Date(s.completedAt).getHours();
      return h >= 12 && h < 18;
    }).reduce((s, ses) => s + ses.elapsed, 0);
    const eveningFocus = sessions.filter(s => {
      const h = new Date(s.completedAt).getHours();
      return h >= 18;
    }).reduce((s, ses) => s + ses.elapsed, 0);

    if (morningFocus > afternoonFocus && morningFocus > eveningFocus) {
      results.push({
        id: 'focus-morning', type: 'suggestion', icon: Brain,
        title: 'Your focus sessions are most effective in the morning',
        description: `You've logged ${Math.round(morningFocus / 60)} minutes of morning focus vs ${Math.round(afternoonFocus / 60)} in the afternoon. Schedule deep work before noon.`,
        color: 'text-pulse',
      });
    }

    // Sleep-productivity correlation
    const recentWellbeing = wellbeing.filter(w => last7.includes(w.date));
    const goodSleepDays = recentWellbeing.filter(w => w.sleepHours >= 7);
    const badSleepDays = recentWellbeing.filter(w => w.sleepHours < 7);
    if (goodSleepDays.length > 0 && badSleepDays.length > 0) {
      const goodSleepTaskAvg = goodSleepDays.reduce((sum, w) => {
        return sum + tasks.filter(t => t.completedAt?.startsWith(w.date)).length;
      }, 0) / goodSleepDays.length;
      const badSleepTaskAvg = badSleepDays.reduce((sum, w) => {
        return sum + tasks.filter(t => t.completedAt?.startsWith(w.date)).length;
      }, 0) / badSleepDays.length;
      if (goodSleepTaskAvg > badSleepTaskAvg * 1.3) {
        results.push({
          id: 'sleep-prod', type: 'correlation', icon: Moon,
          title: 'Better sleep = more productive days',
          description: `On days with 7+ hours of sleep, you complete ${goodSleepTaskAvg.toFixed(1)} tasks on average vs ${badSleepTaskAvg.toFixed(1)} on shorter nights. Prioritize rest.`,
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
          id: `streak-${h.id}`, type: 'warning', icon: Flame,
          title: `Don't break your ${streak}-day ${h.name} streak!`,
          description: `You've been consistent for ${streak} days. Complete "${h.name}" today to keep it going.`,
          color: 'text-ember',
        });
      }
    });

    // Mood-productivity correlation
    const recentJournal = journal.filter(j => last7.includes(j.date));
    const happyDays = recentJournal.filter(j => j.mood >= 4);
    const lowDays = recentJournal.filter(j => j.mood <= 2);
    if (happyDays.length > 0 && lowDays.length > 0) {
      const happyTaskAvg = happyDays.reduce((sum, j) => sum + tasks.filter(t => t.completedAt?.startsWith(j.date)).length, 0) / happyDays.length;
      const lowTaskAvg = lowDays.reduce((sum, j) => sum + tasks.filter(t => t.completedAt?.startsWith(j.date)).length, 0) / lowDays.length;
      if (happyTaskAvg > lowTaskAvg) {
        results.push({
          id: 'mood-prod', type: 'correlation', icon: TrendingUp,
          title: 'Your mood directly impacts productivity',
          description: `High-mood days: ${happyTaskAvg.toFixed(1)} tasks completed. Low-mood days: ${lowTaskAvg.toFixed(1)}. Investing in mood-boosting activities pays off.`,
          color: 'text-success',
        });
      }
    }

    // Weekly completion rate
    const last7Tasks = tasks.filter(t => t.completedAt && last7.some(d => t.completedAt!.startsWith(d)));
    if (last7Tasks.length > 0) {
      results.push({
        id: 'weekly-rate', type: 'trend', icon: Clock,
        title: `${last7Tasks.length} tasks completed this week`,
        description: `That's ${(last7Tasks.length / 7).toFixed(1)} tasks per day. ${last7Tasks.length > 20 ? 'Exceptional pace!' : last7Tasks.length > 10 ? 'Solid consistency.' : 'Room to push a bit more.'}`,
        color: 'text-glow',
      });
    }

    // Low energy warning
    if (recentWellbeing.length > 3) {
      const avgEnergy = recentWellbeing.reduce((s, w) => s + w.energyLevel, 0) / recentWellbeing.length;
      if (avgEnergy < 3) {
        results.push({
          id: 'low-energy', type: 'warning', icon: AlertTriangle,
          title: 'Your energy levels have been low recently',
          description: `Average energy this week: ${avgEnergy.toFixed(1)}/5. Consider adjusting your sleep, exercise, or workload.`,
          color: 'text-danger',
        });
      }
    }

    return results;
  }, [tasks, habits, sessions, journal, wellbeing]);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[900px] mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-text">Insights</h1>
        <p className="text-sm text-text-muted mt-1">Patterns and suggestions from your data</p>
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
        {insights.map(insight => {
          const Icon = insight.icon;
          return (
            <motion.div key={insight.id} variants={item}
              className="bg-surface border border-border rounded-2xl p-5 spotlight-card hover:border-border-2 transition-colors">
              <div className="flex items-start gap-4">
                <div className={`p-2.5 rounded-xl bg-surface-2 ${insight.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono uppercase ${
                      insight.type === 'warning' ? 'bg-ember-muted text-ember' :
                      insight.type === 'suggestion' ? 'bg-glow-muted text-glow' :
                      insight.type === 'correlation' ? 'bg-pulse-muted text-pulse' :
                      'bg-success-muted text-success'
                    }`}>
                      {insight.type}
                  </span>
                </div>
                <h3 className="text-text font-medium mb-1">{insight.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{insight.description}</p>
              </div>
            </div>
          </motion.div>
          );
        })}

        {insights.length === 0 && (
          <div className="bg-surface border border-border rounded-2xl p-12 text-center">
            <Lightbulb className="w-10 h-10 text-text-muted mx-auto mb-3" />
            <h3 className="font-display text-lg text-text mb-2">No insights yet</h3>
            <p className="text-sm text-text-muted">Keep logging data — insights will appear as patterns emerge.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
