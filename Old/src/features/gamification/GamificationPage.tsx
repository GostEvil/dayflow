import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Zap, Star } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import type { GamificationState } from '../../types';
import { STORAGE_KEYS } from '../../types';
import { getXpProgress, BADGE_DEFINITIONS } from '../../lib/xp';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export function GamificationPage() {
  const [gamification] = useLocalStorage<GamificationState>(STORAGE_KEYS.GAMIFICATION, { xp: 0, level: 1, totalTasksCompleted: 0, totalFocusMinutes: 0, totalJournalEntries: 0, longestHabitStreak: 0, loginStreak: 0, lastLoginDate: null, unlockedBadges: [], quests: [] });
  const xpProgress = useMemo(() => getXpProgress(gamification.xp), [gamification.xp]);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[900px] mx-auto">
      <motion.div variants={container} initial="hidden" animate="show">
        <motion.div variants={item} className="mb-8">
          <h1 className="font-display text-2xl font-bold text-text">Profile</h1>
          <p className="text-sm text-text-muted mt-1">Your progress & achievements</p>
        </motion.div>

        {/* Level Card */}
        <motion.div variants={item} className="bg-surface border border-border rounded-2xl p-6 mb-6 spotlight-card">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-pulse/10 border border-pulse/30 flex items-center justify-center flex-shrink-0">
              <span className="font-mono text-3xl font-bold text-pulse">{xpProgress.level}</span>
            </div>
            <div className="flex-1">
              <div className="text-xs font-mono uppercase text-text-muted mb-1">Level {xpProgress.level}</div>
              <div className="w-full h-3 bg-surface-2 rounded-full overflow-hidden mb-2">
                <motion.div className="h-full bg-pulse rounded-full" initial={{ width: 0 }}
                  animate={{ width: `${xpProgress.progress * 100}%` }} transition={{ duration: 1, ease: 'easeOut' }} />
              </div>
              <div className="flex justify-between text-xs font-mono text-text-muted">
                <span>{gamification.xp} XP</span>
                <span>{xpProgress.nextLevelXp} XP to next</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Tasks Done', value: gamification.totalTasksCompleted, color: 'text-glow' },
            { label: 'Focus Min', value: gamification.totalFocusMinutes, color: 'text-pulse' },
            { label: 'Journal Entries', value: gamification.totalJournalEntries, color: 'text-ember' },
            { label: 'Best Streak', value: gamification.longestHabitStreak, color: 'text-success' },
          ].map((stat, i) => (
            <div key={i} className="bg-surface border border-border rounded-xl p-4 text-center">
              <div className={`font-mono text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-[10px] font-mono uppercase text-text-muted mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Quests */}
        <motion.div variants={item} className="bg-surface border border-border rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-glow" />
            <div className="text-xs font-mono uppercase text-text-muted tracking-wider">Active Quests</div>
          </div>
          <div className="space-y-3">
            {gamification.quests.filter(q => !q.completed).map(quest => (
              <div key={quest.id} className="flex items-center gap-4 p-3 bg-surface-2 rounded-xl">
                <div className="flex-1">
                  <div className="text-sm text-text font-medium">{quest.title}</div>
                  <div className="text-xs text-text-muted">{quest.description}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm font-bold text-glow">{quest.current}/{quest.target}</div>
                  <div className="text-[10px] font-mono text-text-muted">+{quest.xpReward} XP</div>
                </div>
              </div>
            ))}
            {gamification.quests.filter(q => !q.completed).length === 0 && (
              <div className="text-sm text-text-muted text-center py-3">No active quests</div>
            )}
          </div>
        </motion.div>

        {/* Badges */}
        <motion.div variants={item} className="bg-surface border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-4 h-4 text-ember" />
            <div className="text-xs font-mono uppercase text-text-muted tracking-wider">Badges</div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {BADGE_DEFINITIONS.map(badge => {
              const unlocked = gamification.unlockedBadges.includes(badge.id);
              return (
                <div key={badge.id}
                  className={`p-4 rounded-xl text-center transition-all ${
                    unlocked ? 'bg-surface-2 border border-border' : 'bg-surface-2/50 opacity-40'
                  }`}>
                  <div className="text-2xl mb-2">{badge.icon}</div>
                  <div className={`text-xs font-medium ${unlocked ? 'text-text' : 'text-text-muted'}`}>{badge.name}</div>
                  <div className="text-[10px] text-text-muted mt-0.5">{badge.description}</div>
                  {unlocked && <Star className="w-3 h-3 text-ember mx-auto mt-1" />}
                </div>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
