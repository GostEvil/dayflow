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
import { Select } from '../../components/ui/Select';

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
    <div className={`min-h-full flex flex-col items-center justify-center p-5 sm:p-8 lg:p-8 ${isFullscreen ? 'fixed inset-0 z-50 bg-void p-8' : ''}`}>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full"
      >
        {!isFullscreen && (
          <div className="text-center mb-8">
            <h1 className="font-display text-2xl font-bold text-text tracking-tight">Focus Mode</h1>
            <p className="text-xs text-text-muted mt-1 font-mono">Deep work timer & ambient focus sounds</p>
          </div>
        )}

        {/* Timer Card Container */}
        <div className="bg-surface border border-border/80 rounded-2xl p-7 sm:p-8 shadow-sm text-center">
          {/* Timer Circle */}
          <div className="relative w-64 h-64 mx-auto mb-8">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 256 256">
              <circle cx="128" cy="128" r="120" fill="none" stroke="currentColor" strokeWidth="5" className="text-surface-2" />
              <circle
                cx="128" cy="128" r="120" fill="none"
                stroke={completed ? '#10B981' : '#00E5FF'}
                strokeWidth="5" strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="font-mono text-6xl font-extrabold text-text tracking-tight tabular-nums">
                {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
              </div>
              <div className="text-xs font-mono font-semibold text-text-muted mt-2 uppercase tracking-widest bg-surface-2 border border-border/50 px-3 py-1 rounded-lg">
                {completed ? 'Session Complete!' : running ? 'Focusing...' : elapsed > 0 ? 'Paused' : 'Ready'}
              </div>
            </div>
          </div>

          {/* Presets */}
          {!running && !completed && elapsed === 0 && (
            <div className="flex gap-4 justify-center mb-8">
              {PRESETS.map(p => (
                <button
                  key={p.minutes}
                  type="button"
                  onClick={() => setDuration(p.minutes)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-mono font-semibold transition-all duration-150 ${
                    duration === p.minutes
                      ? 'bg-glow/15 text-glow border border-glow/40 shadow-sm'
                      : 'bg-surface-2 border border-border/60 text-text-muted hover:text-text hover:bg-surface-2'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 mb-6">
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
                <Button onClick={reset} variant="outline" size="icon" className="h-11 w-11">
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

          {/* Task & Goal Linking */}
          <div className="space-y-4 pt-4 border-t border-border/60 text-left">
            {!running && elapsed === 0 && (
              <>
                <Select
                  label="Link to Task"
                  value={linkedTaskId || ''}
                  onChange={e => setLinkedTaskId(e.target.value || null)}
                >
                  <option value="">No task linked (optional)</option>
                  {activeTasks.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </Select>
                <Select
                  label="Link to Goal"
                  value={linkedGoalId || ''}
                  onChange={e => setLinkedGoalId(e.target.value || null)}
                >
                  <option value="">No goal linked (optional)</option>
                  {activeGoals.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
                </Select>
              </>
            )}

            {/* Sound Controls */}
            <div className="flex items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-4 flex-1">
                <Button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  variant={soundEnabled ? 'secondary' : 'outline'}
                  size="icon"
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4 text-glow" /> : <VolumeX className="w-4 h-4" />}
                </Button>
                {soundEnabled && (
                  <Select
                    value={soundType}
                    onChange={e => setSoundType(e.target.value as SoundType)}
                    containerClassName="flex-1"
                  >
                    {SOUND_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                )}
              </div>
              <Button
                onClick={() => setIsFullscreen(!isFullscreen)}
                variant="outline"
                size="icon"
              >
                <Square className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Recent Sessions */}
        {!isFullscreen && (
          <div className="mt-8 bg-surface border border-border/80 rounded-2xl p-7 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-4">Recent Focus Sessions</div>
            <div className="space-y-4.5">
              {sessions.slice(0, 5).map(s => (
                <div key={s.id} className="flex items-center justify-between p-4 bg-surface-2 border border-border/60 rounded-xl text-xs">
                  <span className="font-mono text-text font-semibold">{Math.round(s.elapsed / 60)} min session</span>
                  <span className="font-mono text-text-muted">{new Date(s.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              ))}
              {sessions.length === 0 && (
                <div className="py-6 text-center text-xs text-text-muted font-mono">No sessions recorded yet</div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
