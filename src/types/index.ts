// ─── Core ────────────────────────────────────────────────────────────
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'backlog' | 'today' | 'in-progress' | 'done';
export type TaskCategory = 'work' | 'personal' | 'health' | 'learning' | 'finance' | 'creative' | 'other';

export interface Task {
  id: string;
  notionPageId?: string | null;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  category: TaskCategory;
  dueDate: string | null;
  dueTime: string | null;
  createdAt: string;
  completedAt: string | null;
  isInbox: boolean;
}

// ─── Habits ──────────────────────────────────────────────────────────
export type HabitFrequency = 'daily' | 'weekdays' | 'weekends' | 'custom';

export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  frequency: HabitFrequency;
  targetDays: number[]; // 0=Sun, 6=Sat
  createdAt: string;
  completions: Record<string, boolean>; // 'YYYY-MM-DD' -> true
}

// ─── Goals ───────────────────────────────────────────────────────────
export type GoalStatus = 'active' | 'completed' | 'paused';
export type GoalCategory = 'career' | 'health' | 'learning' | 'financial' | 'personal' | 'creative';

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  completedAt: string | null;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: GoalCategory;
  status: GoalStatus;
  targetDate: string;
  milestones: Milestone[];
  createdAt: string;
  completedAt: string | null;
}

// ─── Journal ─────────────────────────────────────────────────────────
export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  content: string;
  mood: number; // 1-5
  energy: number; // 1-5
  tags: string[];
  prompt: string;
  createdAt: string;
}

// ─── Focus ───────────────────────────────────────────────────────────
export interface FocusSession {
  id: string;
  duration: number; // minutes
  elapsed: number; // seconds actually focused
  linkedTaskId: string | null;
  linkedGoalId: string | null;
  completedAt: string;
  type: 'pomodoro' | 'custom';
}

// ─── Wellbeing ───────────────────────────────────────────────────────
export interface WellbeingLog {
  id: string;
  date: string; // YYYY-MM-DD
  sleepHours: number;
  sleepQuality: number; // 1-5
  energyLevel: number; // 1-5
  waterIntake: number | null; // glasses
  createdAt: string;
}

// ─── Planner ─────────────────────────────────────────────────────────
export type TimeBlockCategory = 'deep-work' | 'meeting' | 'exercise' | 'personal' | 'study' | 'break' | 'other';

export interface TimeBlock {
  id: string;
  title: string;
  category: TimeBlockCategory;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  isGoogleEvent: boolean;
  googleEventId: string | null;
  createdAt: string;
}

// ─── Gamification ────────────────────────────────────────────────────
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string | null;
  condition: BadgeCondition;
}

export interface BadgeCondition {
  type: 'task_count' | 'habit_streak' | 'focus_minutes' | 'journal_count' | 'level' | 'login_streak';
  threshold: number;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly';
  target: number;
  current: number;
  xpReward: number;
  completed: boolean;
  expiresAt: string;
}

export interface GamificationState {
  xp: number;
  level: number;
  totalTasksCompleted: number;
  totalFocusMinutes: number;
  totalJournalEntries: number;
  longestHabitStreak: number;
  loginStreak: number;
  lastLoginDate: string | null;
  unlockedBadges: string[];
  quests: Quest[];
}

// ─── User Profile ────────────────────────────────────────────────────
export type EnergyPattern = 'morning' | 'afternoon' | 'evening' | 'night';
export type ThemeMode = 'dark' | 'light' | 'system';

export interface UserProfile {
  name: string;
  primaryGoal: string;
  workingHoursStart: string; // HH:mm
  workingHoursEnd: string; // HH:mm
  energyPattern: EnergyPattern;
  initialHabits: string[];
  onboardingCompleted: boolean;
  theme: ThemeMode;
  createdAt: string;
}

// ─── Life Wheel ──────────────────────────────────────────────────────
export interface LifeWheelArea {
  name: string;
  score: number; // 0-10
  icon: string;
}

// ─── Google Calendar ─────────────────────────────────────────────────
export interface GoogleCalendarTokens {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number;
  scope: string;
}

// ─── Backup ──────────────────────────────────────────────────────────
export interface BackupSnapshot {
  id: string;
  timestamp: string;
  size: number;
  data: Record<string, unknown>;
}

// ─── App State Keys ──────────────────────────────────────────────────
export const STORAGE_KEYS = {
  PROFILE: 'dayflow_profile',
  TASKS: 'dayflow_tasks',
  HABITS: 'dayflow_habits',
  GOALS: 'dayflow_goals',
  JOURNAL: 'dayflow_journal',
  FOCUS_SESSIONS: 'dayflow_focus_sessions',
  WELLBEING: 'dayflow_wellbeing',
  TIME_BLOCKS: 'dayflow_time_blocks',
  GAMIFICATION: 'dayflow_gamification',
  GOOGLE_TOKENS: 'dayflow_google_tokens',
  BACKUPS: 'dayflow_backups',
  SEED_LOADED: 'dayflow_seed_loaded',
} as const;
