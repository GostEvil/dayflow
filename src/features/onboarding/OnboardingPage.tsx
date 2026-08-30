import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Zap, SkipForward, Sunrise, Sun, Sunset, Moon, Sparkles, Check } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import type { UserProfile, EnergyPattern } from '../../types';
import { STORAGE_KEYS } from '../../types';
import { loadSeedData } from '../../lib/seed-data';
import { HabitIcon } from '../../lib/icons';

const STEPS = ['welcome', 'name', 'goal', 'schedule', 'energy', 'habits', 'complete'] as const;
type Step = (typeof STEPS)[number];

const ENERGY_OPTIONS: { value: EnergyPattern; label: string; desc: string; icon: any }[] = [
  { value: 'morning', label: 'Early Bird', desc: 'Most productive before noon', icon: Sunrise },
  { value: 'afternoon', label: 'Afternoon Peak', desc: 'Hit your stride after lunch', icon: Sun },
  { value: 'evening', label: 'Evening Flow', desc: 'Best work happens after 5pm', icon: Sunset },
  { value: 'night', label: 'Night Owl', desc: 'Thrive in the late night hours', icon: Moon },
];

const HABIT_SUGGESTIONS = [
  { name: 'Meditate', icon: 'meditate' },
  { name: 'Exercise', icon: 'fitness' },
  { name: 'Read', icon: 'book' },
  { name: 'Journal', icon: 'write' },
  { name: 'Drink Water', icon: 'water' },
  { name: 'Walk', icon: 'walk' },
  { name: 'Stretch', icon: 'activity' },
  { name: 'Code', icon: 'code' },
  { name: 'Cook', icon: 'cooking' },
  { name: 'Sleep 8h', icon: 'sleep' },
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
    setTimeout(() => window.location.reload(), 100);
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
          icon: found?.icon || 'meditate',
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
    setTimeout(() => window.location.reload(), 100);
  };

  const toggleHabit = (h: string) => {
    setSelectedHabits(prev => (prev.includes(h) ? prev.filter(x => x !== h) : [...prev, h]));
  };

  const slideVariants = {
    enter: { opacity: 0, x: 30 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
  };

  return (
    <div className="min-h-screen bg-void flex items-center justify-center p-5 sm:p-8">
      <div className="w-full max-w-lg">
        {/* Progress Bar */}
        <div className="flex gap-4 mb-10">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                i <= stepIndex ? 'bg-glow shadow-sm shadow-glow/30' : 'bg-surface-2'
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
            className="bg-surface border border-border/80 rounded-2xl p-7 sm:p-8 shadow-2xl backdrop-blur-md"
          >
            {/* Welcome Step */}
            {step === 'welcome' && (
              <div className="text-center py-4">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: 'spring' }}
                  className="w-20 h-20 rounded-2xl bg-glow/15 border border-glow/30 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-glow/10 text-glow"
                >
                  <Zap className="w-10 h-10" />
                </motion.div>
                <h1 className="font-display text-3xl font-bold text-text mb-3 tracking-tight">
                  Welcome to DayFlow
                </h1>
                <p className="text-text-secondary text-base mb-8 max-w-sm mx-auto leading-relaxed">
                  Your minimalist, deep-work productivity operating system. Let's configure your workspace for peak focus.
                </p>
                <div className="flex flex-col gap-4">
                  <button
                    onClick={next}
                    className="px-6 py-3.5 bg-glow text-void font-semibold rounded-2xl hover:bg-glow/90 transition-all flex items-center justify-center gap-4 shadow-lg shadow-glow/20 cursor-pointer"
                  >
                    Get Started <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={skip}
                    className="px-6 py-2.5 text-text-muted text-sm hover:text-text transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <SkipForward className="w-3.5 h-3.5" /> Skip setup with defaults
                  </button>
                </div>
              </div>
            )}

            {/* Name Step */}
            {step === 'name' && (
              <div className="py-2">
                <h2 className="font-display text-2xl font-bold text-text mb-2">What should we call you?</h2>
                <p className="text-text-secondary text-sm mb-6">This personalizes your dashboard and greetings.</p>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Nuno"
                  autoFocus
                  className="w-full bg-surface-2 border border-border/80 rounded-2xl px-5 py-4 text-text text-lg outline-none placeholder:text-text-muted focus:border-glow/60 focus:ring-1 focus:ring-glow/30 transition-all"
                  onKeyDown={e => e.key === 'Enter' && next()}
                />
              </div>
            )}

            {/* Goal Step */}
            {step === 'goal' && (
              <div className="py-2">
                <h2 className="font-display text-2xl font-bold text-text mb-2">What's your primary goal right now?</h2>
                <p className="text-text-secondary text-sm mb-6">A single focus point to keep you aligned.</p>
                <textarea
                  value={goal}
                  onChange={e => setGoal(e.target.value)}
                  placeholder="e.g. Launch my SaaS platform, achieve daily consistency, master system architecture"
                  autoFocus
                  rows={3}
                  className="w-full bg-surface-2 border border-border/80 rounded-2xl px-5 py-4 text-text outline-none placeholder:text-text-muted focus:border-glow/60 focus:ring-1 focus:ring-glow/30 transition-all resize-none text-base"
                />
              </div>
            )}

            {/* Schedule Step */}
            {step === 'schedule' && (
              <div className="py-2">
                <h2 className="font-display text-2xl font-bold text-text mb-2">Your working hours</h2>
                <p className="text-text-secondary text-sm mb-6">We'll use this to optimize your planner and focus blocks.</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-mono uppercase tracking-wider text-text-muted mb-2 block font-semibold">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={workStart}
                      onChange={e => setWorkStart(e.target.value)}
                      className="w-full bg-surface-2 border border-border/80 rounded-2xl px-4 py-3.5 text-text font-mono outline-none focus:border-glow/60 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-mono uppercase tracking-wider text-text-muted mb-2 block font-semibold">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={workEnd}
                      onChange={e => setWorkEnd(e.target.value)}
                      className="w-full bg-surface-2 border border-border/80 rounded-2xl px-4 py-3.5 text-text font-mono outline-none focus:border-glow/60 transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Energy Pattern Step */}
            {step === 'energy' && (
              <div className="py-2">
                <h2 className="font-display text-2xl font-bold text-text mb-2">When is your peak energy?</h2>
                <p className="text-text-secondary text-sm mb-6">We'll recommend deep work sessions during your highest output hours.</p>
                <div className="space-y-4">
                  {ENERGY_OPTIONS.map(opt => {
                    const IconComponent = opt.icon;
                    const isSelected = energy === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setEnergy(opt.value)}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left cursor-pointer ${
                          isSelected
                            ? 'border-glow bg-surface-2 shadow-sm'
                            : 'border-border/60 bg-surface-2 hover:border-border hover:bg-surface-2'
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            isSelected
                              ? 'bg-glow/20 text-glow border border-glow/30'
                              : 'bg-surface-3 text-text-muted border border-border/50'
                          }`}
                        >
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div>
                          <div className={`font-semibold text-sm ${isSelected ? 'text-glow' : 'text-text'}`}>
                            {opt.label}
                          </div>
                          <div className="text-xs text-text-muted mt-0.5">{opt.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Habits Step */}
            {step === 'habits' && (
              <div className="py-2">
                <h2 className="font-display text-2xl font-bold text-text mb-2">Pick initial habits to track</h2>
                <p className="text-text-secondary text-sm mb-6">Select a few daily rituals to build momentum.</p>
                <div className="grid grid-cols-2 gap-4 max-h-64 overflow-y-auto pr-1">
                  {HABIT_SUGGESTIONS.map(h => {
                    const isSelected = selectedHabits.includes(h.name);
                    return (
                      <button
                        key={h.name}
                        type="button"
                        onClick={() => toggleHabit(h.name)}
                        className={`flex items-center gap-4 p-4.5 rounded-2xl border transition-all text-left cursor-pointer ${
                          isSelected
                            ? 'border-glow bg-surface-2 shadow-sm'
                            : 'border-border/60 bg-surface-2 hover:border-border hover:bg-surface-2'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isSelected
                              ? 'bg-glow/20 text-glow'
                              : 'bg-surface-3 text-text-muted'
                          }`}
                        >
                          <HabitIcon icon={h.icon} className="w-4 h-4" />
                        </div>
                        <span className={`text-sm font-semibold truncate ${isSelected ? 'text-glow' : 'text-text'}`}>
                          {h.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Complete Step */}
            {step === 'complete' && (
              <div className="text-center py-4">
                <motion.div
                  initial={{ scale: 0.8, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-20 h-20 rounded-2xl bg-glow/15 border border-glow/30 flex items-center justify-center mx-auto mb-6 text-glow shadow-xl shadow-glow/10"
                >
                  <Sparkles className="w-10 h-10" />
                </motion.div>
                <h2 className="font-display text-3xl font-bold text-text mb-3 tracking-tight">You're All Set!</h2>
                <p className="text-text-secondary text-sm mb-8 max-w-xs mx-auto leading-relaxed">
                  {name ? `Welcome, ${name}!` : 'Welcome!'} Your personalized DayFlow workspace is ready.
                </p>
                <button
                  onClick={complete}
                  className="w-full py-4 bg-glow text-void font-semibold text-base rounded-2xl hover:bg-glow/90 transition-all shadow-xl shadow-glow/20 cursor-pointer"
                >
                  Launch DayFlow
                </button>
              </div>
            )}

            {/* Navigation Footer */}
            {step !== 'welcome' && step !== 'complete' && (
              <div className="flex items-center justify-between mt-8 pt-4 border-t border-border/50">
                <button
                  onClick={prev}
                  className="flex items-center gap-4 text-sm font-medium text-text-muted hover:text-text transition-colors cursor-pointer px-3 py-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={next}
                  className="flex items-center gap-4 px-6 py-2.5 bg-glow/15 text-glow text-sm font-semibold rounded-xl hover:bg-glow/25 transition-all border border-glow/25 cursor-pointer shadow-sm"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
