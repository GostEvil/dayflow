import { format } from 'date-fns';
import type { Task, Habit, Goal, JournalEntry, FocusSession, WellbeingLog, TimeBlock, UserProfile, GamificationState } from '../types';
import { STORAGE_KEYS } from '../types';
import { getStorageItem } from './storage';

function seedTasks(): Task[] {
  return [];
}

function seedHabits(): Habit[] {
  return [];
}

function seedGoals(): Goal[] {
  return [];
}

function seedJournal(): JournalEntry[] {
  return [];
}

function seedFocusSessions(): FocusSession[] {
  return [];
}

function seedWellbeing(): WellbeingLog[] {
  return [];
}

function seedTimeBlocks(): TimeBlock[] {
  return [];
}

function seedGamification(): GamificationState {
  return {
    xp: 0,
    level: 1,
    totalTasksCompleted: 0,
    totalFocusMinutes: 0,
    totalJournalEntries: 0,
    longestHabitStreak: 0,
    loginStreak: 1,
    lastLoginDate: format(new Date(), 'yyyy-MM-dd'),
    unlockedBadges: [],
    quests: [],
  };
}

function seedProfile(): UserProfile {
  return {
    name: 'User',
    primaryGoal: '',
    workingHoursStart: '09:00',
    workingHoursEnd: '17:00',
    energyPattern: 'morning',
    initialHabits: [],
    onboardingCompleted: false,
    theme: 'dark',
    createdAt: new Date().toISOString(),
  };
}

// ─── Load Initial Clean Data ─────────────────────────────────────────
export function loadSeedData(): void {
  const WIPE_KEY = 'dayflow_wipe_v5';
  const alreadyWiped = localStorage.getItem(WIPE_KEY) === 'true';

  if (!alreadyWiped) {
    // Clear entire localStorage to eliminate any lingering demo data
    localStorage.clear();

    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(seedTasks()));
    localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(seedHabits()));
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(seedGoals()));
    localStorage.setItem(STORAGE_KEYS.JOURNAL, JSON.stringify(seedJournal()));
    localStorage.setItem(STORAGE_KEYS.FOCUS_SESSIONS, JSON.stringify(seedFocusSessions()));
    localStorage.setItem(STORAGE_KEYS.WELLBEING, JSON.stringify(seedWellbeing()));
    localStorage.setItem(STORAGE_KEYS.TIME_BLOCKS, JSON.stringify(seedTimeBlocks()));
    localStorage.setItem(STORAGE_KEYS.GAMIFICATION, JSON.stringify(seedGamification()));
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(seedProfile()));
    localStorage.setItem(STORAGE_KEYS.CLEAN_INITIALIZED, JSON.stringify(true));
    localStorage.setItem(WIPE_KEY, 'true');
  }
}

export function resetToSeedData(): void {
  localStorage.clear();
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(seedTasks()));
  localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(seedHabits()));
  localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(seedGoals()));
  localStorage.setItem(STORAGE_KEYS.JOURNAL, JSON.stringify(seedJournal()));
  localStorage.setItem(STORAGE_KEYS.FOCUS_SESSIONS, JSON.stringify(seedFocusSessions()));
  localStorage.setItem(STORAGE_KEYS.WELLBEING, JSON.stringify(seedWellbeing()));
  localStorage.setItem(STORAGE_KEYS.TIME_BLOCKS, JSON.stringify(seedTimeBlocks()));
  localStorage.setItem(STORAGE_KEYS.GAMIFICATION, JSON.stringify(seedGamification()));
  localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(seedProfile()));
  localStorage.setItem(STORAGE_KEYS.CLEAN_INITIALIZED, JSON.stringify(true));
  localStorage.setItem('dayflow_wipe_v5', 'true');
}
