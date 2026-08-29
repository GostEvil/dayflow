import React from 'react';
import {
  Activity,
  Award,
  BookOpen,
  Brain,
  Calendar,
  CalendarDays,
  CheckCircle2,
  Code,
  Coffee,
  Crown,
  Droplets,
  Dumbbell,
  FileText,
  Flame,
  Footprints,
  Heart,
  Moon,
  Mountain,
  Music,
  Smile,
  Sparkles,
  Star,
  Sun,
  Sunrise,
  Sunset,
  Target,
  Timer,
  Utensils,
  Waves,
  Zap,
  type LucideIcon,
} from 'lucide-react';

/**
 * Habit icon definitions with Lucide icons
 */
export interface HabitIconDefinition {
  id: string;
  label: string;
  icon: LucideIcon;
}

export const HABIT_ICON_DEFINITIONS: HabitIconDefinition[] = [
  { id: 'meditate', label: 'Meditate', icon: Sparkles },
  { id: 'fitness', label: 'Fitness', icon: Dumbbell },
  { id: 'book', label: 'Reading', icon: BookOpen },
  { id: 'water', label: 'Hydration', icon: Droplets },
  { id: 'write', label: 'Journaling', icon: FileText },
  { id: 'walk', label: 'Walking', icon: Footprints },
  { id: 'activity', label: 'Stretching', icon: Activity },
  { id: 'code', label: 'Coding', icon: Code },
  { id: 'cooking', label: 'Cooking', icon: Utensils },
  { id: 'sleep', label: 'Sleep', icon: Moon },
  { id: 'music', label: 'Music', icon: Music },
  { id: 'running', label: 'Running', icon: Activity },
  { id: 'target', label: 'Goal', icon: Target },
  { id: 'brain', label: 'Mind', icon: Brain },
  { id: 'heart', label: 'Health', icon: Heart },
  { id: 'energy', label: 'Energy', icon: Zap },
  { id: 'coffee', label: 'Coffee', icon: Coffee },
  { id: 'sun', label: 'Morning', icon: Sun },
];

// Mapping for legacy emojis and habit icon ids
const EMOJI_AND_ID_TO_LUCIDE: Record<string, LucideIcon> = {
  // Legacy Emojis -> Lucide
  '🧘': Sparkles,
  '💪': Dumbbell,
  '📚': BookOpen,
  '💧': Droplets,
  '✍️': FileText,
  '✍': FileText,
  '🚶': Footprints,
  '🤸': Activity,
  '💻': Code,
  '🍳': Utensils,
  '😴': Moon,
  '🎵': Music,
  '🏃': Activity,
  '🎯': Target,
  '🧠': Brain,
  '❤️': Heart,
  '❤': Heart,
  '⚡': Zap,
  '💎': Award,
  '🔥': Flame,
  '🌊': Waves,
  '🏔️': Mountain,
  '🏔': Mountain,
  '📅': Calendar,
  '🗓️': CalendarDays,
  '🗓': CalendarDays,
  '👑': Crown,
  '📝': FileText,
  '📖': BookOpen,
  '⭐': Star,
  '🌟': Award,
  '✨': Sparkles,
  '🌅': Sunrise,
  '☀️': Sun,
  '🌆': Sunset,
  '🌙': Moon,
  '🚀': Sparkles,
  '🏆': Crown,

  // Icon IDs -> Lucide
  meditate: Sparkles,
  fitness: Dumbbell,
  book: BookOpen,
  water: Droplets,
  write: FileText,
  walk: Footprints,
  activity: Activity,
  code: Code,
  cooking: Utensils,
  sleep: Moon,
  music: Music,
  running: Activity,
  target: Target,
  brain: Brain,
  heart: Heart,
  energy: Zap,
  coffee: Coffee,
  sun: Sun,
  zap: Zap,
  diamond: Award,
  flame: Flame,
  waves: Waves,
  mountain: Mountain,
  calendar: Calendar,
  'calendar-days': CalendarDays,
  crown: Crown,
  'file-text': FileText,
  'book-open': BookOpen,
  star: Star,
  award: Award,
  sparkles: Sparkles,
  sunrise: Sunrise,
  sunset: Sunset,
};

export function getIconComponent(iconKeyOrEmoji: string): LucideIcon {
  return EMOJI_AND_ID_TO_LUCIDE[iconKeyOrEmoji] || Sparkles;
}

export function HabitIcon({
  icon,
  className = 'w-5 h-5',
}: {
  icon: string;
  className?: string;
}) {
  const IconComp = getIconComponent(icon);
  return <IconComp className={className} />;
}

export function BadgeIcon({
  icon,
  className = 'w-6 h-6',
}: {
  icon: string;
  className?: string;
}) {
  const IconComp = getIconComponent(icon);
  return <IconComp className={className} />;
}
