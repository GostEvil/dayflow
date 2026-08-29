import { v4 as uuid } from 'uuid';
import { format, subDays } from 'date-fns';
import type { Task, Habit, Goal, JournalEntry, FocusSession, WellbeingLog, TimeBlock, UserProfile, GamificationState } from '../types';
import { STORAGE_KEYS } from '../types';
import { getStorageItem } from './storage';

const today = new Date();
const d = (daysAgo: number) => format(subDays(today, daysAgo), 'yyyy-MM-dd');
const ts = (daysAgo: number) => subDays(today, daysAgo).toISOString();

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Seed Tasks ──────────────────────────────────────────────────────
function seedTasks(): Task[] {
  return [
    { id: uuid(), title: 'Review quarterly OKRs', description: 'Go through team OKRs and update progress metrics', status: 'done', priority: 'high', category: 'work', dueDate: d(2), dueTime: '09:00', createdAt: ts(5), completedAt: ts(2), isInbox: false },
    { id: uuid(), title: 'Design system audit', description: 'Check component consistency across the app', status: 'done', priority: 'medium', category: 'work', dueDate: d(1), dueTime: '14:00', createdAt: ts(4), completedAt: ts(1), isInbox: false },
    { id: uuid(), title: 'Morning run - 5K', description: '', status: 'done', priority: 'medium', category: 'health', dueDate: d(0), dueTime: '07:00', createdAt: ts(1), completedAt: ts(0), isInbox: false },
    { id: uuid(), title: 'Write API documentation', description: 'Document the new REST endpoints for the v2 API', status: 'in-progress', priority: 'high', category: 'work', dueDate: d(0), dueTime: '11:00', createdAt: ts(3), completedAt: null, isInbox: false },
    { id: uuid(), title: 'Read "Atomic Habits" Ch.5', description: 'Continue reading and take notes', status: 'today', priority: 'low', category: 'learning', dueDate: d(0), dueTime: '20:00', createdAt: ts(2), completedAt: null, isInbox: false },
    { id: uuid(), title: 'Grocery shopping', description: 'Weekly groceries - check the list on the fridge', status: 'today', priority: 'medium', category: 'personal', dueDate: d(0), dueTime: '18:00', createdAt: ts(1), completedAt: null, isInbox: false },
    { id: uuid(), title: 'Prepare presentation slides', description: 'Q3 results presentation for stakeholder meeting', status: 'today', priority: 'urgent', category: 'work', dueDate: d(0), dueTime: '15:00', createdAt: ts(2), completedAt: null, isInbox: false },
    { id: uuid(), title: 'Fix login page bug', description: 'Users report intermittent 401 errors on login', status: 'in-progress', priority: 'urgent', category: 'work', dueDate: d(0), dueTime: null, createdAt: ts(1), completedAt: null, isInbox: false },
    { id: uuid(), title: 'Plan weekend trip', description: 'Research destinations and book accommodation', status: 'backlog', priority: 'low', category: 'personal', dueDate: null, dueTime: null, createdAt: ts(3), completedAt: null, isInbox: false },
    { id: uuid(), title: 'Update resume', description: '', status: 'backlog', priority: 'medium', category: 'personal', dueDate: null, dueTime: null, createdAt: ts(7), completedAt: null, isInbox: false },
    { id: uuid(), title: 'Learn Rust basics', description: 'Complete first 3 chapters of The Rust Book', status: 'backlog', priority: 'low', category: 'learning', dueDate: null, dueTime: null, createdAt: ts(10), completedAt: null, isInbox: false },
    { id: uuid(), title: 'Call dentist for appointment', description: '', status: 'backlog', priority: 'medium', category: 'health', dueDate: null, dueTime: null, createdAt: ts(5), completedAt: null, isInbox: true },
  ];
}

// ─── Seed Habits ─────────────────────────────────────────────────────
function seedHabits(): Habit[] {
  const completions = (days: number[], total: number) => {
    const c: Record<string, boolean> = {};
    for (let i = 0; i < total; i++) {
      if (days.includes(i % 7) || Math.random() > 0.2) {
        c[d(i)] = true;
      }
    }
    return c;
  };

  return [
    { id: uuid(), name: 'Meditate', icon: '🧘', color: '#00E5FF', frequency: 'daily', targetDays: [0,1,2,3,4,5,6], createdAt: ts(30), completions: completions([0,1,2,3,4,5,6], 28) },
    { id: uuid(), name: 'Exercise', icon: '💪', color: '#A855F7', frequency: 'weekdays', targetDays: [1,2,3,4,5], createdAt: ts(30), completions: completions([1,2,3,4,5], 25) },
    { id: uuid(), name: 'Read 30 min', icon: '📚', color: '#F97316', frequency: 'daily', targetDays: [0,1,2,3,4,5,6], createdAt: ts(30), completions: completions([0,1,2,3,4,5,6], 20) },
    { id: uuid(), name: 'Drink 8 glasses water', icon: '💧', color: '#06B6D4', frequency: 'daily', targetDays: [0,1,2,3,4,5,6], createdAt: ts(30), completions: completions([0,1,2,3,4,5,6], 22) },
    { id: uuid(), name: 'Journal', icon: '✍️', color: '#EC4899', frequency: 'daily', targetDays: [0,1,2,3,4,5,6], createdAt: ts(30), completions: completions([0,1,2,3,4,5,6], 18) },
  ];
}

// ─── Seed Goals ──────────────────────────────────────────────────────
function seedGoals(): Goal[] {
  return [
    {
      id: uuid(), title: 'Launch Side Project', description: 'Build and launch a SaaS product by end of year',
      category: 'career', status: 'active', targetDate: format(new Date(today.getFullYear(), 11, 31), 'yyyy-MM-dd'),
      milestones: [
        { id: uuid(), title: 'Define MVP scope', completed: true, completedAt: ts(20) },
        { id: uuid(), title: 'Build prototype', completed: true, completedAt: ts(10) },
        { id: uuid(), title: 'Beta testing', completed: false, completedAt: null },
        { id: uuid(), title: 'Launch to Product Hunt', completed: false, completedAt: null },
      ],
      createdAt: ts(60), completedAt: null,
    },
    {
      id: uuid(), title: 'Run a Half Marathon', description: 'Train and complete a 21K race',
      category: 'health', status: 'active', targetDate: format(new Date(today.getFullYear(), 9, 15), 'yyyy-MM-dd'),
      milestones: [
        { id: uuid(), title: 'Run 5K without stopping', completed: true, completedAt: ts(25) },
        { id: uuid(), title: 'Run 10K under 55 min', completed: true, completedAt: ts(12) },
        { id: uuid(), title: 'Run 15K', completed: false, completedAt: null },
        { id: uuid(), title: 'Complete half marathon', completed: false, completedAt: null },
      ],
      createdAt: ts(45), completedAt: null,
    },
    {
      id: uuid(), title: 'Learn TypeScript Advanced Patterns', description: 'Master generics, conditional types, and mapped types',
      category: 'learning', status: 'active', targetDate: format(new Date(today.getFullYear(), 8, 30), 'yyyy-MM-dd'),
      milestones: [
        { id: uuid(), title: 'Complete generics deep-dive', completed: true, completedAt: ts(15) },
        { id: uuid(), title: 'Master conditional types', completed: true, completedAt: ts(8) },
        { id: uuid(), title: 'Build a type-safe ORM', completed: false, completedAt: null },
      ],
      createdAt: ts(40), completedAt: null,
    },
  ];
}

// ─── Seed Journal ────────────────────────────────────────────────────
const PROMPTS = [
  'What went well today?',
  'What drained your energy?',
  'What are you grateful for?',
  'What would you do differently?',
  'What\'s one thing you learned today?',
  'What made you smile today?',
  'What challenged you today?',
];

function seedJournal(): JournalEntry[] {
  const entries: JournalEntry[] = [];
  const contents = [
    'Had a productive morning working on the API. The new architecture is coming together nicely. Need to spend more time on testing tomorrow.',
    'Felt scattered today. Too many meetings broke up my deep work time. Need to block out larger chunks tomorrow.',
    'Great workout this morning — finally hit my 5K goal time. The consistency is paying off. Energy was high all day.',
    'Spent the afternoon learning about type-safe patterns. The mental model for conditional types finally clicked.',
    'Quiet day. Read a lot, journaled, cooked a good meal. Sometimes slow days are the most restorative.',
    'Big presentation went well. Got positive feedback on the Q3 analysis. Feeling confident about the direction.',
    'Struggled with focus today. Might be the poor sleep last night. Going to bed early tonight.',
  ];

  for (let i = 0; i < 14; i++) {
    entries.push({
      id: uuid(),
      date: d(i),
      content: contents[i % contents.length],
      mood: Math.min(5, Math.max(1, 3 + Math.floor(Math.random() * 3) - 1)),
      energy: Math.min(5, Math.max(1, 3 + Math.floor(Math.random() * 3) - 1)),
      tags: [randomFrom(['work', 'health', 'learning', 'personal']), randomFrom(['productive', 'reflective', 'energetic', 'calm'])],
      prompt: PROMPTS[i % PROMPTS.length],
      createdAt: ts(i),
    });
  }
  return entries;
}

// ─── Seed Focus Sessions ─────────────────────────────────────────────
function seedFocusSessions(): FocusSession[] {
  const sessions: FocusSession[] = [];
  for (let i = 0; i < 20; i++) {
    const duration = randomFrom([25, 25, 25, 45, 45, 60]);
    sessions.push({
      id: uuid(),
      duration,
      elapsed: duration * 60 - Math.floor(Math.random() * 120),
      linkedTaskId: null,
      linkedGoalId: null,
      completedAt: ts(Math.floor(i / 2)),
      type: 'pomodoro',
    });
  }
  return sessions;
}

// ─── Seed Wellbeing ──────────────────────────────────────────────────
function seedWellbeing(): WellbeingLog[] {
  const logs: WellbeingLog[] = [];
  for (let i = 0; i < 14; i++) {
    logs.push({
      id: uuid(),
      date: d(i),
      sleepHours: 6 + Math.round(Math.random() * 3 * 10) / 10,
      sleepQuality: Math.min(5, Math.max(1, 3 + Math.floor(Math.random() * 3) - 1)),
      energyLevel: Math.min(5, Math.max(1, 3 + Math.floor(Math.random() * 3) - 1)),
      waterIntake: 4 + Math.floor(Math.random() * 6),
      createdAt: ts(i),
    });
  }
  return logs;
}

// ─── Seed Time Blocks ────────────────────────────────────────────────
function seedTimeBlocks(): TimeBlock[] {
  const blocks: TimeBlock[] = [];
  const categories: Array<TimeBlock['category']> = ['deep-work', 'meeting', 'exercise', 'personal', 'study'];

  for (let dayOffset = -2; dayOffset <= 4; dayOffset++) {
    const date = format(subDays(today, -dayOffset), 'yyyy-MM-dd');
    blocks.push(
      { id: uuid(), title: 'Deep Work: API Development', category: 'deep-work', date, startTime: '09:00', endTime: '11:30', isGoogleEvent: false, googleEventId: null, createdAt: ts(7) },
      { id: uuid(), title: 'Team Standup', category: 'meeting', date, startTime: '11:30', endTime: '12:00', isGoogleEvent: false, googleEventId: null, createdAt: ts(7) },
      { id: uuid(), title: 'Lunch Break', category: 'break', date, startTime: '12:00', endTime: '13:00', isGoogleEvent: false, googleEventId: null, createdAt: ts(7) },
    );

    if (dayOffset % 2 === 0) {
      blocks.push(
        { id: uuid(), title: 'Gym Session', category: 'exercise', date, startTime: '17:00', endTime: '18:00', isGoogleEvent: false, googleEventId: null, createdAt: ts(7) },
      );
    }
    if (dayOffset % 3 === 0) {
      blocks.push(
        { id: uuid(), title: 'Study: Advanced TypeScript', category: 'study', date, startTime: '20:00', endTime: '21:00', isGoogleEvent: false, googleEventId: null, createdAt: ts(7) },
      );
    }
  }
  return blocks;
}

// ─── Seed Gamification ───────────────────────────────────────────────
function seedGamification(): GamificationState {
  return {
    xp: 1250,
    level: 5,
    totalTasksCompleted: 47,
    totalFocusMinutes: 680,
    totalJournalEntries: 14,
    longestHabitStreak: 12,
    loginStreak: 5,
    lastLoginDate: d(0),
    unlockedBadges: ['task_10', 'focus_60', 'focus_300', 'streak_7', 'journal_7', 'level_5'],
    quests: [
      { id: uuid(), title: 'Complete 3 habits today', description: 'Build consistency', type: 'daily', target: 3, current: 1, xpReward: 50, completed: false, expiresAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59).toISOString() },
      { id: uuid(), title: 'Focus for 90 minutes', description: 'Deep work session', type: 'daily', target: 90, current: 25, xpReward: 50, completed: false, expiresAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59).toISOString() },
      { id: uuid(), title: 'Complete 15 tasks this week', description: 'Productivity sprint', type: 'weekly', target: 15, current: 8, xpReward: 150, completed: false, expiresAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7).toISOString() },
    ],
  };
}

// ─── Seed Profile ────────────────────────────────────────────────────
function seedProfile(): UserProfile {
  return {
    name: 'Alex',
    primaryGoal: 'Ship my side project and run a half marathon',
    workingHoursStart: '09:00',
    workingHoursEnd: '17:00',
    energyPattern: 'morning',
    initialHabits: ['Meditate', 'Exercise', 'Read'],
    onboardingCompleted: true,
    theme: 'dark',
    createdAt: ts(30),
  };
}

// ─── Load Seed Data ──────────────────────────────────────────────────
export function loadSeedData(): void {
  const alreadyLoaded = getStorageItem<boolean>(STORAGE_KEYS.SEED_LOADED, false);
  if (alreadyLoaded) return;

  localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(seedProfile()));
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(seedTasks()));
  localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(seedHabits()));
  localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(seedGoals()));
  localStorage.setItem(STORAGE_KEYS.JOURNAL, JSON.stringify(seedJournal()));
  localStorage.setItem(STORAGE_KEYS.FOCUS_SESSIONS, JSON.stringify(seedFocusSessions()));
  localStorage.setItem(STORAGE_KEYS.WELLBEING, JSON.stringify(seedWellbeing()));
  localStorage.setItem(STORAGE_KEYS.TIME_BLOCKS, JSON.stringify(seedTimeBlocks()));
  localStorage.setItem(STORAGE_KEYS.GAMIFICATION, JSON.stringify(seedGamification()));
  localStorage.setItem(STORAGE_KEYS.SEED_LOADED, JSON.stringify(true));
}

export function resetToSeedData(): void {
  localStorage.removeItem(STORAGE_KEYS.SEED_LOADED);
  loadSeedData();
}
