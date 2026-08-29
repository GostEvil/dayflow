import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Zap, SkipForward } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import type { UserProfile, EnergyPattern } from '../../types';
import { STORAGE_KEYS } from '../../types';
import { loadSeedData } from '../../lib/seed-data';

const STEPS = ['welcome', 'name', 'goal', 'schedule', 'energy', 'habits', 'complete'] as const;
type Step = typeof STEPS[number];

const ENERGY_OPTIONS: { value: EnergyPattern; label: string; desc: string; icon: string }[] = [
  { value: 'morning', label: 'Early Bird', desc: 'Most productive before noon', icon: '🌅' },
  { value: 'afternoon', label: 'Afternoon Peak', desc: 'Hit your stride after lunch', icon: '☀️' },
  { value: 'evening', label: 'Evening Flow', desc: 'Best work happens after 5pm', icon: '🌆' },
  { value: 'night', label: 'Night Owl', desc: 'Thrive in the late hours', icon: '🌙' },
];

const HABIT_SUGGESTIONS = [
  { name: 'Meditate', icon: '🧘' },
  { name: 'Exercise', icon: '💪' },
  { name: 'Read', icon: '📚' },
  { name: 'Journal', icon: '✍️' },
  { name: 'Drink Water', icon: '💧' },
  { name: 'Walk', icon: '🚶' },
  { name: 'Stretch', icon: '🤸' },
  { name: 'Code', icon: '💻' },
  { name: 'Cook', icon: '🍳' },
  { name: 'Sleep 8h', icon: '😴' },
];

export function OnboardingPage() {
  const [, setProfile] = useLocalStorage<UserProfile | null>(STORAGE_KEYS.PROFILE, null);
  const [step, setStep] = useState<Step>('welcome');
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [workStart, setWorkStart] = useState('09:00');
  const [workEnd, setWorkEnd] = useState('17:00');
  const [energy, setEnergy] = useState<EnergyPattern>('morning');
  const [selectedHabits, setSelectedHabits] = useState<string[]>([]);

  const stepIndex = STEPS.indexOf(step);

  const next = () => {
    const nextIdx = Math.min(stepIndex + 1, STEPS.length - 1);
    setStep(STEPS[nextIdx]);
  };

  const prev = () => {
    const prevIdx = Math.max(stepIndex - 1, 0);
    setStep(STEPS[prevIdx]);
  };

  const skip = () => {
    loadSeedData();
    const profile = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILE) || '{}');
    setProfile({ ...profile, onboardingCompleted: true });
  };

  const complete = () => {
    loadSeedData();
    if (selectedHabits.length > 0) {
      const existingHabits = JSON.parse(localStorage.getItem(STORAGE_KEYS.HABITS) || '[]');
      const newHabits = selectedHabits.map(h => {
        const found = HABIT_SUGGESTIONS.find(s => s.name === h);
        return {
          id: crypto.randomUUID(),
          name: h,
          icon: found?.icon || '⭐',
          color: '#00E5FF',
          frequency: 'daily' as const,
          targetDays: [0, 1, 2, 3, 4, 5, 6],
          createdAt: new Date().toISOString(),
          completions: {},
        };
      });
      localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify([...existingHabits, ...newHabits]));
    }
    setProfile({
      name: name || 'User',
      primaryGoal: goal || '',
      workingHoursStart: workStart,
      workingHoursEnd: workEnd,
      energyPattern: energy,
      initialHabits: selectedHabits,
      onboardingCompleted: true,
      theme: 'dark',
      createdAt: new Date().toISOString(),
    });
  };

  const toggleHabit = (h: string) => {
    setSelectedHabits(prev => prev.includes(h) ? prev.filter(x => x !== h) : [...prev, h]);
  };

  const slideVariants = {
    enter: { opacity: 0, x: 40 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  };

  return (
    <div className="min-h-screen bg-void flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress bar */}
        <div className="flex gap-1.5 mb-8">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                i <= stepIndex ? 'bg-glow' : 'bg-border'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25 }}
          >
            {/* Welcome */}
            {step === 'welcome' && (
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: 'spring' }}
                  className="w-20 h-20 rounded-2xl bg-glow/10 border border-glow/30 flex items-center justify-center mx-auto mb-6"
                >
                  <Zap className="w-10 h-10 text-glow" />
                </motion.div>
                <h1 className="font-display text-3xl font-bold text-text mb-3">Welcome to DayFlow</h1>
                <p className="text-text-secondary text-base mb-8 max-w-sm mx-auto">
                  Your personal productivity operating system. Let's set things up so everything feels right.
                </p>
                <div className="flex flex-col gap-3">
                  <button onClick={next} className="px-6 py-3 bg-glow text-void font-semibold rounded-xl hover:bg-glow/90 transition-colors flex items-center justify-center gap-2">
                    Get Started <ArrowRight className="w-4 h-4" />
                  </button>
                  <button onClick={skip} className="px-6 py-2.5 text-text-muted text-sm hover:text-text transition-colors flex items-center justify-center gap-1">
                    <SkipForward className="w-3.5 h-3.5" /> Skip setup
                  </button>
                </div>
              </div>
            )}

            {/* Name */}
            {step === 'name' && (
              <div>
                <h2 className="font-display text-2xl font-bold text-text mb-2">What should we call you?</h2>
                <p className="text-text-secondary text-sm mb-6">This personalizes your dashboard greeting.</p>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  autoFocus
                  className="w-full bg-surface border border-border rounded-xl px-4 py-3.5 text-text text-lg outline-none placeholder:text-text-muted focus:border-glow/50 transition-colors"
                  onKeyDown={e => e.key === 'Enter' && next()}
                />
              </div>
            )}

            {/* Goal */}
            {step === 'goal' && (
              <div>
                <h2 className="font-display text-2xl font-bold text-text mb-2">What's your main focus right now?</h2>
                <p className="text-text-secondary text-sm mb-6">One sentence about what you want to achieve.</p>
                <textarea
                  value={goal}
                  onChange={e => setGoal(e.target.value)}
                  placeholder="e.g. Ship my side project, get in shape, learn a new language"
                  autoFocus
                  rows={3}
                  className="w-full bg-surface border border-border rounded-xl px-4 py-3.5 text-text outline-none placeholder:text-text-muted focus:border-glow/50 transition-colors resize-none"
                />
              </div>
            )}

            {/* Schedule */}
            {step === 'schedule' && (
              <div>
                <h2 className="font-display text-2xl font-bold text-text mb-2">Your working hours</h2>
                <p className="text-text-secondary text-sm mb-6">We'll use this to plan your day optimally.</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-mono uppercase tracking-wider text-text-muted mb-2 block">Start</label>
                    <input
                      type="time"
                      value={workStart}
                      onChange={e => setWorkStart(e.target.value)}
                      className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text font-mono outline-none focus:border-glow/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-mono uppercase tracking-wider text-text-muted mb-2 block">End</label>
                    <input
                      type="time"
                      value={workEnd}
                      onChange={e => setWorkEnd(e.target.value)}
                      className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text font-mono outline-none focus:border-glow/50 transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Energy */}
            {step === 'energy' && (
              <div>
                <h2 className="font-display text-2xl font-bold text-text mb-2">When's your peak energy?</h2>
                <p className="text-text-secondary text-sm mb-6">We'll suggest scheduling deep work during your peak.</p>
                <div className="space-y-2">
                  {ENERGY_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setEnergy(opt.value)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
                        energy === opt.value
                          ? 'border-glow/50 bg-glow/5'
                          : 'border-border bg-surface hover:border-border-2'
                      }`}
                    >
                      <span className="text-2xl">{opt.icon}</span>
                      <div className="text-left">
                        <div className={`font-medium ${energy === opt.value ? 'text-glow' : 'text-text'}`}>{opt.label}</div>
                        <div className="text-xs text-text-muted">{opt.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Habits */}
            {step === 'habits' && (
              <div>
                <h2 className="font-display text-2xl font-bold text-text mb-2">Pick habits to track</h2>
                <p className="text-text-secondary text-sm mb-6">You can always add more later.</p>
                <div className="grid grid-cols-2 gap-2">
                  {HABIT_SUGGESTIONS.map(h => (
                    <button
                      key={h.name}
                      onClick={() => toggleHabit(h.name)}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${
                        selectedHabits.includes(h.name)
                          ? 'border-glow/50 bg-glow/5'
                          : 'border-border bg-surface hover:border-border-2'
                      }`}
                    >
                      <span className="text-lg">{h.icon}</span>
                      <span className={`text-sm font-medium ${selectedHabits.includes(h.name) ? 'text-glow' : 'text-text'}`}>
                        {h.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Complete */}
            {step === 'complete' && (
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-20 h-20 rounded-2xl bg-glow/10 border border-glow/30 flex items-center justify-center mx-auto mb-6"
                >
                  <span className="text-4xl">🚀</span>
                </motion.div>
                <h2 className="font-display text-2xl font-bold text-text mb-3">You're all set!</h2>
                <p className="text-text-secondary text-sm mb-8">
                  {name ? `Welcome, ${name}!` : 'Welcome!'} Your DayFlow workspace is ready.
                </p>
                <button
                  onClick={complete}
                  className="px-8 py-3 bg-glow text-void font-semibold rounded-xl hover:bg-glow/90 transition-colors"
                >
                  Launch DayFlow
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        {step !== 'welcome' && step !== 'complete' && (
          <div className="flex items-center justify-between mt-8">
            <button onClick={prev} className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={next} className="flex items-center gap-1.5 px-5 py-2.5 bg-glow/10 text-glow text-sm font-medium rounded-xl hover:bg-glow/20 transition-colors">
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
