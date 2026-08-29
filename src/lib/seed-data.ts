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
  const cleanInitialized = getStorageItem<boolean>(STORAGE_KEYS.CLEAN_INITIALIZED, false);
  if (cleanInitialized) return;

  // Clear demo data
  localStorage.removeItem(STORAGE_KEYS.SEED_LOADED);
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(seedTasks()));
  localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(seedHabits()));
  localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(seedGoals()));
  localStorage.setItem(STORAGE_KEYS.JOURNAL, JSON.stringify(seedJournal()));
  localStorage.setItem(STORAGE_KEYS.FOCUS_SESSIONS, JSON.stringify(seedFocusSessions()));
  localStorage.setItem(STORAGE_KEYS.WELLBEING, JSON.stringify(seedWellbeing()));
  localStorage.setItem(STORAGE_KEYS.TIME_BLOCKS, JSON.stringify(seedTimeBlocks()));
  localStorage.setItem(STORAGE_KEYS.GAMIFICATION, JSON.stringify(seedGamification()));

  const existingProfile = getStorageItem<UserProfile | null>(STORAGE_KEYS.PROFILE, null);
  if (!existingProfile || existingProfile.name === 'Alex') {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(seedProfile()));
  }

  localStorage.setItem(STORAGE_KEYS.CLEAN_INITIALIZED, JSON.stringify(true));
}

export function resetToSeedData(): void {
  localStorage.removeItem(STORAGE_KEYS.CLEAN_INITIALIZED);
  localStorage.removeItem(STORAGE_KEYS.SEED_LOADED);
  loadSeedData();
}
