import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Moon, Zap, Droplets } from 'lucide-react';
import { v4 as uuid } from 'uuid';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import type { WellbeingLog } from '../../types';
import { STORAGE_KEYS } from '../../types';
import { todayStr, formatDate, format, subDays, getLast7Days } from '../../lib/date-utils';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar } from 'recharts';

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
      id: uuid(), date: today, sleepHours, sleepQuality,
      energyLevel, waterIntake, createdAt: new Date().toISOString(),
    };
    setLogs(prev => [log, ...prev.filter(l => l.date !== today)]);
    setShowNew(false);
  };

  const avgSleep = useMemo(() => {
    const recent = logs.slice(0, 7);
    return recent.length > 0 ? (recent.reduce((s, l) => s + l.sleepHours, 0) / recent.length).toFixed(1) : '—';
  }, [logs]);

  const avgEnergy = useMemo(() => {
    const recent = logs.slice(0, 7);
    return recent.length > 0 ? (recent.reduce((s, l) => s + l.energyLevel, 0) / recent.length).toFixed(1) : '—';
  }, [logs]);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-text">Wellbeing</h1>
          <p className="text-sm text-text-muted mt-1">Track your sleep, energy, and hydration</p>
        </div>
        <button onClick={() => setShowNew(true)} disabled={hasToday}
          className="px-4 py-2 bg-glow/10 text-glow text-sm font-medium rounded-xl hover:bg-glow/20 disabled:opacity-40 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" /> {hasToday ? 'Logged today' : 'Log Today'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-surface border border-border rounded-2xl p-4 spotlight-card">
          <Moon className="w-4 h-4 text-pulse mb-2" />
          <div className="font-mono text-2xl font-bold text-pulse">{avgSleep}h</div>
          <div className="text-[10px] font-mono uppercase text-text-muted">Avg Sleep (7d)</div>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-4 spotlight-card">
          <Zap className="w-4 h-4 text-ember mb-2" />
          <div className="font-mono text-2xl font-bold text-ember">{avgEnergy}</div>
          <div className="text-[10px] font-mono uppercase text-text-muted">Avg Energy (7d)</div>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-4 spotlight-card">
          <Droplets className="w-4 h-4 text-glow mb-2" />
          <div className="font-mono text-2xl font-bold text-glow">
            {logs.length > 0 ? Math.round(logs.slice(0, 7).reduce((s, l) => s + (l.waterIntake || 0), 0) / Math.min(logs.length, 7)) : '—'}
          </div>
          <div className="text-[10px] font-mono uppercase text-text-muted">Avg Water (7d)</div>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-4 spotlight-card">
          <Moon className="w-4 h-4 text-success mb-2" />
          <div className="font-mono text-2xl font-bold text-success">{logs.length}</div>
          <div className="text-[10px] font-mono uppercase text-text-muted">Total Logs</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-surface border border-border rounded-2xl p-5">
          <div className="text-xs font-mono uppercase text-text-muted mb-4">Sleep Hours</div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 12]} tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} width={20} />
                <Tooltip contentStyle={{ background: '#0F0F18', border: '1px solid #1E1E3A', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="sleep" fill="#A855F7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-5">
          <div className="text-xs font-mono uppercase text-text-muted mb-4">Energy & Sleep Quality</div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[1, 5]} tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} width={20} />
                <Tooltip contentStyle={{ background: '#0F0F18', border: '1px solid #1E1E3A', borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="energy" stroke="#F97316" strokeWidth={2} dot={false} connectNulls />
                <Line type="monotone" dataKey="quality" stroke="#00E5FF" strokeWidth={2} dot={false} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1.5 text-xs text-text-muted"><div className="w-3 h-0.5 bg-ember rounded" /> Energy</div>
            <div className="flex items-center gap-1.5 text-xs text-text-muted"><div className="w-3 h-0.5 bg-glow rounded" /> Sleep Quality</div>
          </div>
        </div>
      </div>

      {/* New Log */}
      {showNew && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-surface border border-border rounded-2xl p-6 mb-6">
          <h2 className="font-display text-lg font-bold text-text mb-4">Log Today's Wellbeing</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-mono uppercase text-text-muted mb-2 block">Sleep Hours: {sleepHours}h</label>
              <input type="range" min="0" max="12" step="0.5" value={sleepHours} onChange={e => setSleepHours(parseFloat(e.target.value))}
                className="w-full accent-pulse" />
            </div>
            <div>
              <label className="text-xs font-mono uppercase text-text-muted mb-2 block">Sleep Quality</label>
              <div className="flex gap-2">
                {[1,2,3,4,5].map(v => (
                  <button key={v} onClick={() => setSleepQuality(v)}
                    className={`flex-1 py-2 rounded-lg text-sm font-mono transition-colors ${sleepQuality === v ? 'bg-glow/10 text-glow border border-glow/30' : 'bg-surface-2 text-text-muted'}`}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-mono uppercase text-text-muted mb-2 block">Energy Level</label>
              <div className="flex gap-2">
                {[1,2,3,4,5].map(v => (
                  <button key={v} onClick={() => setEnergyLevel(v)}
                    className={`flex-1 py-2 rounded-lg text-sm font-mono transition-colors ${energyLevel === v ? 'bg-ember/10 text-ember border border-ember/30' : 'bg-surface-2 text-text-muted'}`}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-mono uppercase text-text-muted mb-2 block">Water Intake: {waterIntake} glasses</label>
              <input type="range" min="0" max="15" step="1" value={waterIntake} onChange={e => setWaterIntake(parseInt(e.target.value))}
                className="w-full accent-glow" />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={addLog} className="px-6 py-2.5 bg-glow text-void font-semibold rounded-xl hover:bg-glow/90 transition-colors">Save</button>
            <button onClick={() => setShowNew(false)} className="px-6 py-2.5 bg-surface-2 text-text-muted rounded-xl hover:bg-surface-3 transition-colors">Cancel</button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
