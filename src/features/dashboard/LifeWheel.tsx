import { useMemo } from 'react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import type { Habit, FocusSession, JournalEntry, WellbeingLog } from '../../types';
import { STORAGE_KEYS } from '../../types';
import { todayStr, format, subDays } from '../../lib/date-utils';

export function LifeWheel() {
  const [habits] = useLocalStorage<Habit[]>(STORAGE_KEYS.HABITS, []);
  const [sessions] = useLocalStorage<FocusSession[]>(STORAGE_KEYS.FOCUS_SESSIONS, []);
  const [journal] = useLocalStorage<JournalEntry[]>(STORAGE_KEYS.JOURNAL, []);
  const [wellbeing] = useLocalStorage<WellbeingLog[]>(STORAGE_KEYS.WELLBEING, []);

  const data = useMemo(() => {
    const last7 = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), i), 'yyyy-MM-dd'));

    // Health: exercise habits + wellbeing scores
    const healthHabits = habits.filter(h => ['Exercise', 'Walk', 'Stretch', 'Gym'].some(n => h.name.includes(n)));
    const healthScore = healthHabits.length > 0
      ? healthHabits.reduce((sum, h) => sum + last7.filter(d => h.completions[d]).length, 0) / (healthHabits.length * 7) * 10
      : wellbeing.filter(w => last7.includes(w.date)).reduce((s, w) => s + w.energyLevel, 0) / Math.max(1, wellbeing.filter(w => last7.includes(w.date)).length) * 2;

    // Work: focus sessions
    const focusMinutes = sessions.filter(s => last7.some(d => s.completedAt.startsWith(d))).reduce((s, ses) => s + Math.round(ses.elapsed / 60), 0);
    const workScore = Math.min(10, focusMinutes / 30);

    // Growth: learning habits + journal entries
    const growthHabits = habits.filter(h => ['Read', 'Study', 'Learn', 'Code'].some(n => h.name.includes(n)));
    const growthScore = growthHabits.length > 0
      ? growthHabits.reduce((sum, h) => sum + last7.filter(d => h.completions[d]).length, 0) / (growthHabits.length * 7) * 10
      : 5;

    // Rest: sleep quality
    const recentWellbeing = wellbeing.filter(w => last7.includes(w.date));
    const restScore = recentWellbeing.length > 0
      ? recentWellbeing.reduce((s, w) => s + w.sleepQuality, 0) / recentWellbeing.length * 2
      : 5;

    // Mindfulness: meditation + journal
    const mindHabits = habits.filter(h => ['Meditate', 'Journal', 'Breathe'].some(n => h.name.includes(n)));
    const journalDays = journal.filter(j => last7.includes(j.date)).length;
    const mindScore = mindHabits.length > 0
      ? (mindHabits.reduce((sum, h) => sum + last7.filter(d => h.completions[d]).length, 0) / (mindHabits.length * 7) * 7 + journalDays / 7 * 3)
      : journalDays / 7 * 10;

    // Mood: from journal
    const recentJournal = journal.filter(j => last7.includes(j.date));
    const moodScore = recentJournal.length > 0
      ? recentJournal.reduce((s, j) => s + j.mood, 0) / recentJournal.length * 2
      : 5;

    return [
      { area: 'Health', score: Math.round(Math.min(10, Math.max(0, healthScore)) * 10) / 10 },
      { area: 'Work', score: Math.round(Math.min(10, Math.max(0, workScore)) * 10) / 10 },
      { area: 'Growth', score: Math.round(Math.min(10, Math.max(0, growthScore)) * 10) / 10 },
      { area: 'Rest', score: Math.round(Math.min(10, Math.max(0, restScore)) * 10) / 10 },
      { area: 'Mind', score: Math.round(Math.min(10, Math.max(0, mindScore)) * 10) / 10 },
      { area: 'Mood', score: Math.round(Math.min(10, Math.max(0, moodScore)) * 10) / 10 },
    ];
  }, [habits, sessions, journal, wellbeing]);

  return (
    <div className="h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid stroke="#1E1E3A" strokeWidth={0.5} />
          <PolarAngleAxis
            dataKey="area"
            tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'Inter' }}
          />
          <Radar
            dataKey="score"
            stroke="#00E5FF"
            fill="#00E5FF"
            fillOpacity={0.15}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
