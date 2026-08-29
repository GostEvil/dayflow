import type { GamificationState, BadgeCondition } from '../types';

// ─── XP Values ───────────────────────────────────────────────────────
export const XP_VALUES = {
  TASK_LOW: 10,
  TASK_MEDIUM: 15,
  TASK_HIGH: 25,
  TASK_URGENT: 30,
  HABIT: 15,
  FOCUS_PER_MINUTE: 1,
  JOURNAL: 20,
  WELLBEING_LOG: 5,
  QUEST_DAILY: 50,
  QUEST_WEEKLY: 150,
} as const;

// ─── Level Calculation ───────────────────────────────────────────────
export function getLevel(xp: number): number {
  // Exponential curve: each level requires ~40% more XP
  // Level 1 = 0 XP, Level 2 = 100 XP, Level 3 = 240 XP, etc.
  if (xp <= 0) return 1;
  return Math.floor(1 + Math.sqrt(xp / 50)) ;
}

export function getXpForLevel(level: number): number {
  return Math.pow(level - 1, 2) * 50;
}

export function getXpProgress(xp: number): { level: number; currentLevelXp: number; nextLevelXp: number; progress: number } {
  const level = getLevel(xp);
  const currentLevelXp = getXpForLevel(level);
  const nextLevelXp = getXpForLevel(level + 1);
  const progress = (xp - currentLevelXp) / (nextLevelXp - currentLevelXp);
  return { level, currentLevelXp, nextLevelXp, progress: Math.min(1, Math.max(0, progress)) };
}

// ─── Badges ──────────────────────────────────────────────────────────
export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: BadgeCondition;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // Task badges
  { id: 'task_10', name: 'Starter', description: 'Complete 10 tasks', icon: 'zap', condition: { type: 'task_count', threshold: 10 } },
  { id: 'task_50', name: 'Achiever', description: 'Complete 50 tasks', icon: 'target', condition: { type: 'task_count', threshold: 50 } },
  { id: 'task_100', name: 'Centurion', description: 'Complete 100 tasks', icon: 'diamond', condition: { type: 'task_count', threshold: 100 } },
  { id: 'task_500', name: 'Unstoppable', description: 'Complete 500 tasks', icon: 'flame', condition: { type: 'task_count', threshold: 500 } },

  // Focus badges
  { id: 'focus_60', name: 'Deep Diver', description: '60 minutes of focus', icon: 'brain', condition: { type: 'focus_minutes', threshold: 60 } },
  { id: 'focus_300', name: 'Flow State', description: '5 hours of focus', icon: 'waves', condition: { type: 'focus_minutes', threshold: 300 } },
  { id: 'focus_1000', name: 'Marathon Mind', description: '1000 minutes of focus', icon: 'mountain', condition: { type: 'focus_minutes', threshold: 1000 } },

  // Habit badges
  { id: 'streak_7', name: 'Week Warrior', description: '7-day habit streak', icon: 'calendar', condition: { type: 'habit_streak', threshold: 7 } },
  { id: 'streak_30', name: 'Month Master', description: '30-day habit streak', icon: 'calendar-days', condition: { type: 'habit_streak', threshold: 30 } },
  { id: 'streak_100', name: 'Consistency King', description: '100-day habit streak', icon: 'crown', condition: { type: 'habit_streak', threshold: 100 } },

  // Journal badges
  { id: 'journal_7', name: 'Reflector', description: 'Write 7 journal entries', icon: 'file-text', condition: { type: 'journal_count', threshold: 7 } },
  { id: 'journal_30', name: 'Chronicler', description: 'Write 30 journal entries', icon: 'book-open', condition: { type: 'journal_count', threshold: 30 } },

  // Level badges
  { id: 'level_5', name: 'Rising Star', description: 'Reach level 5', icon: 'star', condition: { type: 'level', threshold: 5 } },
  { id: 'level_10', name: 'Veteran', description: 'Reach level 10', icon: 'award', condition: { type: 'level', threshold: 10 } },
  { id: 'level_20', name: 'Legend', description: 'Reach level 20', icon: 'sparkles', condition: { type: 'level', threshold: 20 } },
];

export function checkBadges(state: GamificationState): string[] {
  const newBadges: string[] = [];
  const level = getLevel(state.xp);

  for (const badge of BADGE_DEFINITIONS) {
    if (state.unlockedBadges.includes(badge.id)) continue;

    let value = 0;
    switch (badge.condition.type) {
      case 'task_count': value = state.totalTasksCompleted; break;
      case 'focus_minutes': value = state.totalFocusMinutes; break;
      case 'habit_streak': value = state.longestHabitStreak; break;
      case 'journal_count': value = state.totalJournalEntries; break;
      case 'level': value = level; break;
      case 'login_streak': value = state.loginStreak; break;
    }

    if (value >= badge.condition.threshold) {
      newBadges.push(badge.id);
    }
  }

  return newBadges;
}

export function getDefaultGamificationState(): GamificationState {
  return {
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
  };
}
