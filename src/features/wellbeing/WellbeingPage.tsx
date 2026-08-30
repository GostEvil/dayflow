import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Moon, Zap, Droplets, Activity, CheckCircle2 } from 'lucide-react';
import { v4 as uuid } from 'uuid';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import type { WellbeingLog } from '../../types';
import { STORAGE_KEYS } from '../../types';
import { todayStr, format, subDays } from '../../lib/date-utils';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar } from 'recharts';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';

export function WellbeingPage() {
  const [logs, setLogs] = useLocalStorage<WellbeingLog[]>(STORAGE_KEYS.WELLBEING, []);
  const [showNew, setShowNew] = useState(false);
  const [sleepHours, setSleepHours] = useState(7.5);
  const [sleepQuality, setSleepQuality] = useState(3);
  const [energyLevel, setEnergyLevel] = useState(3);
  const [waterIntake, setWaterIntake] = useState(6);

  const today = todayStr();
  const hasToday = logs.some(l => l.date === today);

  const trendData = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const d = format(subDays(new Date(), 13 - i), 'yyyy-MM-dd');
      const log = logs.find(l => l.date === d);
      return {
        date: format(subDays(new Date(), 13 - i), 'MMM d'),
        sleep: log?.sleepHours ?? null,
        quality: log?.sleepQuality ?? null,
        energy: log?.energyLevel ?? null,
        water: log?.waterIntake ?? null,
      };
    });
  }, [logs]);

  const addLog = () => {
    const log: WellbeingLog = {
      id: uuid(),
      date: today,
      sleepHours,
      sleepQuality,
      energyLevel,
      waterIntake,
      createdAt: new Date().toISOString(),
    };
    setLogs(prev => [log, ...prev.filter(l => l.date !== today)]);
    setShowNew(false);
  };

  const avgSleep = useMemo(() => {
    const recent = logs.slice(0, 7);
    return recent.length > 0
      ? (recent.reduce((s, l) => s + l.sleepHours, 0) / recent.length).toFixed(1)
      : '—';
  }, [logs]);

  const avgEnergy = useMemo(() => {
    const recent = logs.slice(0, 7);
    return recent.length > 0
      ? (recent.reduce((s, l) => s + l.energyLevel, 0) / recent.length).toFixed(1)
      : '—';
  }, [logs]);

  const avgWater = useMemo(() => {
    const recent = logs.slice(0, 7);
    return recent.length > 0
      ? Math.round(recent.reduce((s, l) => s + (l.waterIntake || 0), 0) / recent.length)
      : '—';
  }, [logs]);

  return (
    <div className="p-5 sm:p-8 lg:p-10 max-w-[1400px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-text tracking-tight">Wellbeing</h1>
          <p className="text-sm text-text-muted mt-1 font-mono">
            Track your sleep duration, energy recovery, and daily hydration
          </p>
        </div>
        <Button
          onClick={() => setShowNew(true)}
          disabled={hasToday}
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
        >
          {hasToday ? 'Logged Today' : 'Log Today'}
        </Button>
      </div>

      {/* Summary Bento Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface border border-border/80 rounded-2xl p-7 shadow-sm flex flex-col justify-between hover:border-border transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-text-secondary">Avg Sleep</span>
            <div className="w-8 h-8 rounded-xl bg-surface-2 border border-pulse/20 flex items-center justify-center text-pulse">
              <Moon className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="font-mono text-3xl font-extrabold text-pulse tracking-tight">{avgSleep}h</div>
            <div className="text-xs text-text-muted mt-1">7-day rolling average</div>
          </div>
        </div>

        <div className="bg-surface border border-border/80 rounded-2xl p-7 shadow-sm flex flex-col justify-between hover:border-border transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-text-secondary">Avg Energy</span>
            <div className="w-8 h-8 rounded-xl bg-surface-2 border border-ember/20 flex items-center justify-center text-ember">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="font-mono text-3xl font-extrabold text-ember tracking-tight">{avgEnergy} <span className="text-sm text-text-muted font-normal">/ 5</span></div>
            <div className="text-xs text-text-muted mt-1">7-day recovery score</div>
          </div>
        </div>

        <div className="bg-surface border border-border/80 rounded-2xl p-7 shadow-sm flex flex-col justify-between hover:border-border transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-text-secondary">Avg Hydration</span>
            <div className="w-8 h-8 rounded-xl bg-surface-2 border border-glow/20 flex items-center justify-center text-glow">
              <Droplets className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="font-mono text-3xl font-extrabold text-glow tracking-tight">{avgWater} <span className="text-sm text-text-muted font-normal">glasses</span></div>
            <div className="text-xs text-text-muted mt-1">Daily water intake</div>
          </div>
        </div>

        <div className="bg-surface border border-border/80 rounded-2xl p-7 shadow-sm flex flex-col justify-between hover:border-border transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-text-secondary">Total Entries</span>
            <div className="w-8 h-8 rounded-xl bg-surface-2 border border-success/20 flex items-center justify-center text-success">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="font-mono text-3xl font-extrabold text-success tracking-tight">{logs.length}</div>
            <div className="text-xs text-text-muted mt-1">Lifetime wellbeing logs</div>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <div className="bg-surface border border-border/80 rounded-2xl p-7 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-border/60">
            <div>
              <h3 className="font-display text-lg font-semibold text-text">Sleep Duration</h3>
              <p className="text-xs text-text-muted">Recorded sleep hours over the last 14 days</p>
            </div>
            <span className="text-xs font-mono text-pulse bg-surface-2 border border-pulse/20 px-3 py-1.5 rounded-lg">
              Hours / Night
            </span>
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 12]} tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} width={25} />
                <Tooltip contentStyle={{ background: '#0F0F18', border: '1px solid #1E1E3A', borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="sleep" fill="#A855F7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-surface border border-border/80 rounded-2xl p-7 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-border/60">
            <div>
              <h3 className="font-display text-lg font-semibold text-text">Energy & Sleep Quality</h3>
              <p className="text-xs text-text-muted">Correlation between rest quality and daytime alertness</p>
            </div>
            <div className="flex gap-4 text-xs font-mono text-text-muted">
              <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-ember rounded-full" /> Energy</span>
              <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-glow rounded-full" /> Quality</span>
            </div>
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[1, 5]} tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} width={25} />
                <Tooltip contentStyle={{ background: '#0F0F18', border: '1px solid #1E1E3A', borderRadius: 12, fontSize: 12 }} />
                <Line type="monotone" dataKey="energy" stroke="#F97316" strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
                <Line type="monotone" dataKey="quality" stroke="#00E5FF" strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Log Wellbeing Modal */}
      <Modal
        isOpen={showNew}
        onClose={() => setShowNew(false)}
        title="Log Today's Wellbeing"
        subtitle="Track key physiological metrics to uncover productivity insights"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowNew(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={addLog}>
              Save Log
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-mono uppercase tracking-wider text-text-secondary font-semibold">
                Sleep Duration
              </label>
              <span className="text-sm font-mono font-bold text-pulse bg-surface-2 px-3 py-1.5 rounded-lg border border-pulse/20">
                {sleepHours}h
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="12"
              step="0.5"
              value={sleepHours}
              onChange={e => setSleepHours(parseFloat(e.target.value))}
              className="w-full accent-pulse cursor-pointer h-2 bg-surface-2 rounded-lg"
            />
          </div>

          <div>
            <label className="text-xs font-mono uppercase tracking-wider text-text-secondary font-semibold mb-2.5 block">
              Sleep Quality (1 to 5)
            </label>
            <div className="grid grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setSleepQuality(v)}
                  className={`py-2.5 rounded-xl text-sm font-mono font-bold transition-all ${
                    sleepQuality === v
                      ? 'bg-glow/20 text-glow ring-2 ring-glow shadow-sm'
                      : 'bg-surface-2 text-text-muted hover:text-text hover:bg-surface-3'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-mono uppercase tracking-wider text-text-secondary font-semibold mb-2.5 block">
              Energy Level (1 to 5)
            </label>
            <div className="grid grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setEnergyLevel(v)}
                  className={`py-2.5 rounded-xl text-sm font-mono font-bold transition-all ${
                    energyLevel === v
                      ? 'bg-ember/20 text-ember ring-2 ring-ember shadow-sm'
                      : 'bg-surface-2 text-text-muted hover:text-text hover:bg-surface-3'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-mono uppercase tracking-wider text-text-secondary font-semibold">
                Water Intake
              </label>
              <span className="text-sm font-mono font-bold text-glow bg-surface-2 px-3 py-1.5 rounded-lg border border-glow/20">
                {waterIntake} glasses
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="15"
              step="1"
              value={waterIntake}
              onChange={e => setWaterIntake(parseInt(e.target.value))}
              className="w-full accent-glow cursor-pointer h-2 bg-surface-2 rounded-lg"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
