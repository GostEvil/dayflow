import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Square, Volume2, VolumeX, Link } from 'lucide-react';
import { v4 as uuid } from 'uuid';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import type { FocusSession, Task, Goal, GamificationState } from '../../types';
import { STORAGE_KEYS } from '../../types';
import { startAmbientSound, stopAmbientSound, isAmbientPlaying, SOUND_OPTIONS, type SoundType } from '../../lib/sounds';
import { XP_VALUES, getLevel, checkBadges } from '../../lib/xp';
import { Button } from '../../components/ui/Button';

const PRESETS = [
  { label: '25 min', minutes: 25 },
  { label: '45 min', minutes: 45 },
  { label: '60 min', minutes: 60 },
];

export function FocusPage() {
  const [sessions, setSessions] = useLocalStorage<FocusSession[]>(STORAGE_KEYS.FOCUS_SESSIONS, []);
  const [tasks] = useLocalStorage<Task[]>(STORAGE_KEYS.TASKS, []);
  const [goals] = useLocalStorage<Goal[]>(STORAGE_KEYS.GOALS, []);
  const [gamification, setGamification] = useLocalStorage<GamificationState>(STORAGE_KEYS.GAMIFICATION, { xp: 0, level: 1, totalTasksCompleted: 0, totalFocusMinutes: 0, totalJournalEntries: 0, longestHabitStreak: 0, loginStreak: 0, lastLoginDate: null, unlockedBadges: [], quests: [] });

  const [duration, setDuration] = useState(25);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [linkedTaskId, setLinkedTaskId] = useState<string | null>(null);
  const [linkedGoalId, setLinkedGoalId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [soundType, setSoundType] = useState<SoundType>('brown-noise');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const totalSeconds = duration * 60;
  const remaining = Math.max(0, totalSeconds - elapsed);
  const progress = totalSeconds > 0 ? elapsed / totalSeconds : 0;
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  const activeTasks = useMemo(() => tasks.filter(t => t.status !== 'done'), [tasks]);
  const activeGoals = useMemo(() => goals.filter(g => g.status === 'active'), [goals]);

  useEffect(() => {
    if (running && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);
      return () => clearInterval(intervalRef.current);
    } else if (remaining <= 0 && running) {
      setRunning(false);
      setCompleted(true);
      completeSession();
    }
  }, [running, remaining]);

  useEffect(() => {
    if (soundEnabled && running) {
      startAmbientSound(soundType);
    } else {
      stopAmbientSound();
    }
    return () => stopAmbientSound();
  }, [soundEnabled, running, soundType]);

  const start = () => { setRunning(true); setCompleted(false); };
  const pause = () => setRunning(false);
  const resume = () => setRunning(true);
  const reset = () => { setRunning(false); setElapsed(0); setCompleted(false); stopAmbientSound(); };

  const completeSession = () => {
    const session: FocusSession = {
      id: uuid(), duration, elapsed, linkedTaskId, linkedGoalId,
      completedAt: new Date().toISOString(), type: 'pomodoro',
    };
    setSessions(prev => [session, ...prev]);

    // Award XP
    const focusMinutes = Math.round(elapsed / 60);
    const xp = focusMinutes * XP_VALUES.FOCUS_PER_MINUTE;
    setGamification(prev => {
      const updated = { ...prev, xp: prev.xp + xp, totalFocusMinutes: prev.totalFocusMinutes + focusMinutes, level: getLevel(prev.xp + xp) };
      const newBadges = checkBadges(updated);
      return { ...updated, unlockedBadges: [...prev.unlockedBadges, ...newBadges] };
    });
  };

  const circumference = 2 * Math.PI * 120;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className={`min-h-full flex flex-col items-center justify-center p-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-void' : ''}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md w-full"
      >
        {!isFullscreen && <h1 className="font-display text-2xl font-bold text-text mb-8">Focus Mode</h1>}

        {/* Timer circle */}
        <div className="relative w-64 h-64 mx-auto mb-8">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 256 256">
            <circle cx="128" cy="128" r="120" fill="none" stroke="currentColor" strokeWidth="4" className="text-border" />
            <circle
              cx="128" cy="128" r="120" fill="none"
              stroke={completed ? '#10B981' : '#00E5FF'}
              strokeWidth="4" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="font-mono text-5xl font-bold text-text tabular-nums">
              {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
            </div>
            <div className="text-xs font-mono text-text-muted mt-2 uppercase tracking-wider">
              {completed ? 'Session Complete!' : running ? 'Focusing...' : elapsed > 0 ? 'Paused' : 'Ready'}
            </div>
          </div>
        </div>

        {/* Presets */}
        {!running && !completed && elapsed === 0 && (
          <div className="flex gap-2.5 justify-center mb-8">
            {PRESETS.map(p => (
              <button key={p.minutes} onClick={() => setDuration(p.minutes)}
                className={`px-5 py-2.5 rounded-2xl text-sm font-mono transition-all duration-200 ${
                  duration === p.minutes ? 'bg-glow/15 text-glow border border-glow/30 shadow-sm font-semibold' : 'bg-surface border border-border text-text-muted hover:text-text hover:bg-surface-2'
                }`}>
                {p.label}
              </button>
            ))}
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {!running && elapsed === 0 && !completed && (
            <Button onClick={start} variant="primary" size="lg" icon={<Play className="w-5 h-5 fill-current" />}>
              Start Session
            </Button>
          )}
          {running && (
            <Button onClick={pause} variant="outline" size="lg" icon={<Pause className="w-5 h-5" />}>
              Pause Session
            </Button>
          )}
          {!running && elapsed > 0 && !completed && (
            <>
              <Button onClick={resume} variant="primary" size="lg" icon={<Play className="w-5 h-5 fill-current" />}>
                Resume
              </Button>
              <Button onClick={reset} variant="outline" size="icon">
                <RotateCcw className="w-5 h-5" />
              </Button>
            </>
          )}
          {completed && (
            <Button onClick={reset} variant="primary" size="lg" icon={<RotateCcw className="w-5 h-5" />}>
              New Session
            </Button>
          )}
        </div>

        {/* Link & Sound */}
        <div className="space-y-4">
          {!running && elapsed === 0 && (
            <>
              <div className="flex items-center gap-2">
                <Link className="w-4 h-4 text-text-muted" />
                <select value={linkedTaskId || ''} onChange={e => setLinkedTaskId(e.target.value || null)}
                  className="flex-1 bg-surface border border-border rounded-xl px-3.5 py-2.5 text-xs text-text outline-none focus:border-glow/30">
                  <option value="">Link to task (optional)</option>
                  {uncompletedTasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Link className="w-4 h-4 text-text-muted" />
                <select value={linkedGoalId || ''} onChange={e => setLinkedGoalId(e.target.value || null)}
                  className="flex-1 bg-surface border border-border rounded-xl px-3.5 py-2.5 text-xs text-text outline-none focus:border-glow/30">
                  <option value="">Link to goal (optional)</option>
                  {activeGoals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
                </select>
              </div>
            </>
          )}

          {/* Sound controls */}
          <div className="flex items-center justify-center gap-3">
            <Button
              onClick={() => setSoundEnabled(!soundEnabled)}
              variant={soundEnabled ? 'secondary' : 'outline'}
              size="icon"
            >
              {soundEnabled ? <Volume2 className="w-4.5 h-4.5" /> : <VolumeX className="w-4.5 h-4.5" />}
            </Button>
            {soundEnabled && (
              <select value={soundType} onChange={e => setSoundType(e.target.value as SoundType)}
                className="bg-surface border border-border rounded-xl px-3.5 py-2.5 text-xs text-text outline-none">
                {SOUND_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            )}
            <Button
              onClick={() => setIsFullscreen(!isFullscreen)}
              variant="outline"
              size="icon"
            >
              <Square className="w-4.5 h-4.5" />
            </Button>
          </div>
        </div>

        {/* Recent Sessions */}
        {!isFullscreen && (
          <div className="mt-12 text-left max-w-md mx-auto">
            <div className="text-xs font-mono uppercase text-text-muted mb-3 tracking-wider">Recent Sessions</div>
            <div className="space-y-2">
              {sessions.slice(0, 5).map(s => (
                <div key={s.id} className="flex items-center justify-between py-2 px-3 bg-surface border border-border rounded-xl">
                  <div className="text-sm text-text">{s.duration} min session</div>
                  <div className="text-xs font-mono text-text-muted">{new Date(s.completedAt).toLocaleDateString()}</div>
                </div>
              ))}
              {sessions.length === 0 && <div className="text-sm text-text-muted text-center py-4">No sessions yet</div>}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
