import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Zap, Star, Award, CheckSquare, Timer, BookOpen, Flame, Target } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import type { GamificationState } from '../../types';
import { STORAGE_KEYS } from '../../types';
import { getXpProgress, BADGE_DEFINITIONS } from '../../lib/xp';
import { BadgeIcon } from '../../lib/icons';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export function GamificationPage() {
  const [gamification] = useLocalStorage<GamificationState>(STORAGE_KEYS.GAMIFICATION, {
    xp: 0,
    level: 1,
    totalTasksCompleted: 0,
    totalFocusMinutes: 0,
    totalJournalEntries: 0,
    longestHabitStreak: 0,
    loginStreak: 0,
    lastLoginDate: null,
    unlockedBadges: [],
    quests: [],
  });
  const xpProgress = useMemo(() => getXpProgress(gamification.xp), [gamification.xp]);

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-[1200px] mx-auto space-y-8">
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
        
        {/* Header */}
        <motion.div variants={item}>
          <h1 className="font-display text-3xl font-bold text-text tracking-tight">Profile & Progress</h1>
          <p className="text-sm text-text-muted mt-1 font-mono">
            Track your milestones, level progression, and earned achievement badges
          </p>
        </motion.div>

        {/* Level Progression Card */}
        <motion.div
          variants={item}
          className="bg-surface/95 border border-border/80 rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden group hover:border-border transition-all duration-200"
        >
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
            <div className="w-24 h-24 rounded-2xl bg-pulse/15 border border-pulse/30 flex flex-col items-center justify-center flex-shrink-0 shadow-lg shadow-pulse/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-pulse font-bold">LEVEL</span>
              <span className="font-mono text-4xl font-extrabold text-pulse mt-0.5">{xpProgress.level}</span>
            </div>

            <div className="flex-1 w-full text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-3 gap-1">
                <div>
                  <h3 className="font-display text-xl font-bold text-text">Experience Level {xpProgress.level}</h3>
                  <p className="text-xs text-text-muted font-mono mt-0.5">
                    {Math.round(xpProgress.progress * 100)}% progress towards Level {xpProgress.level + 1}
                  </p>
                </div>
                <div className="font-mono text-sm font-bold text-pulse">
                  {gamification.xp} <span className="text-xs text-text-muted font-normal">/ {xpProgress.nextLevelXp} XP</span>
                </div>
              </div>

              <div className="w-full h-3 bg-surface-2 rounded-full overflow-hidden border border-border/40 mb-2">
                <motion.div
                  className="h-full bg-pulse rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${xpProgress.progress * 100}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>

              <div className="flex justify-between text-xs font-mono text-text-muted">
                <span>{xpProgress.currentLevelXp} XP</span>
                <span>{xpProgress.nextLevelXp - gamification.xp} XP remaining</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Lifetime Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[
            { label: 'Tasks Completed', value: gamification.totalTasksCompleted, icon: CheckSquare, color: 'text-glow', bg: 'bg-glow/10', border: 'border-glow/20' },
            { label: 'Focus Minutes', value: gamification.totalFocusMinutes, icon: Timer, color: 'text-pulse', bg: 'bg-pulse/10', border: 'border-pulse/20' },
            { label: 'Journal Entries', value: gamification.totalJournalEntries, icon: BookOpen, color: 'text-ember', bg: 'bg-ember/10', border: 'border-ember/20' },
            { label: 'Longest Streak', value: `${gamification.longestHabitStreak}d`, icon: Flame, color: 'text-success', bg: 'bg-success/10', border: 'border-success/20' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              variants={item}
              className="bg-surface/95 border border-border/80 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between hover:border-border transition-all"
            >
              <div className="flex items-center justify-between mb-3">
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

        {/* Quests Section */}
        <motion.div variants={item} className="bg-surface/95 border border-border/80 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/60">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-glow/10 border border-glow/20 flex items-center justify-center text-glow">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-text">Active Quests</h3>
                <p className="text-xs text-text-muted">Complete challenges to earn bonus experience points</p>
              </div>
            </div>
            <span className="text-xs font-mono text-text-muted bg-surface-2 px-3 py-1 rounded-lg border border-border/40">
              {gamification.quests.filter(q => !q.completed).length} available
            </span>
          </div>

          <div className="space-y-3">
            {gamification.quests.filter(q => !q.completed).map(quest => (
              <div
                key={quest.id}
                className="flex items-center justify-between p-4 bg-surface-2/60 border border-border/60 rounded-xl hover:border-border transition-all"
              >
                <div className="flex-1 pr-4">
                  <div className="text-sm text-text font-semibold">{quest.title}</div>
                  <div className="text-xs text-text-muted mt-0.5">{quest.description}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-mono text-sm font-bold text-glow">
                    {quest.current} / {quest.target}
                  </div>
                  <div className="text-xs font-mono font-bold text-pulse bg-pulse/10 border border-pulse/20 px-2 py-0.5 rounded-md mt-1">
                    +{quest.xpReward} XP
                  </div>
                </div>
              </div>
            ))}
            {gamification.quests.filter(q => !q.completed).length === 0 && (
              <div className="text-xs text-text-muted text-center py-8 font-mono border border-dashed border-border/60 rounded-xl">
                No active quests right now. Keep finishing daily tasks and habits!
              </div>
            )}
          </div>
        </motion.div>

        {/* Achievement Badges Section */}
        <motion.div variants={item} className="bg-surface/95 border border-border/80 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/60">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-ember/10 border border-ember/20 flex items-center justify-center text-ember">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-text">Achievement Badges</h3>
                <p className="text-xs text-text-muted">
                  {gamification.unlockedBadges.length} of {BADGE_DEFINITIONS.length} unlocked
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {BADGE_DEFINITIONS.map(badge => {
              const unlocked = gamification.unlockedBadges.includes(badge.id);
              return (
                <div
                  key={badge.id}
                  className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between text-center relative overflow-hidden group ${
                    unlocked
                      ? 'bg-surface-2/80 border-border hover:border-glow/40 shadow-sm'
                      : 'bg-surface-2/30 border-border/40 opacity-45'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3.5 transition-transform duration-200 group-hover:scale-110 ${
                        unlocked
                          ? 'bg-glow/15 border border-glow/30 text-glow shadow-sm shadow-glow/10'
                          : 'bg-surface-3 border border-border/50 text-text-muted'
                      }`}
                    >
                      <BadgeIcon icon={badge.icon} className="w-6 h-6" />
                    </div>
                    <div className={`text-sm font-semibold tracking-tight ${unlocked ? 'text-text' : 'text-text-muted'}`}>
                      {badge.name}
                    </div>
                    <p className="text-xs text-text-muted mt-1 leading-relaxed">
                      {badge.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-center">
                    {unlocked ? (
                      <span className="text-[11px] font-mono text-emerald-400 font-semibold flex items-center gap-1.5 bg-emerald-400/10 px-2.5 py-0.5 rounded-md border border-emerald-400/20">
                        <Star className="w-3 h-3 fill-current" /> Unlocked
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono text-text-muted">Locked</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}
