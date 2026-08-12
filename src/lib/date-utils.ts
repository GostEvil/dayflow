import { format, subDays, addDays, startOfWeek, isToday, isSameDay, parseISO, differenceInDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM d, yyyy');
};

export const formatDateShort = (date: Date | string): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM d');
};

export const formatTime = (time: string): string => {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
};

export const formatDayOfWeek = (date: Date | string): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'EEE');
};

export const todayStr = (): string => format(new Date(), 'yyyy-MM-dd');
export const dateStr = (date: Date): string => format(date, 'yyyy-MM-dd');

export const getWeekDates = (date: Date = new Date()): Date[] => {
  const start = startOfWeek(date, { weekStartsOn: 1 }); // Monday
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
};

export const getLast7Days = (): Date[] => {
  return Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i));
};

export const getLast30Days = (): Date[] => {
  return Array.from({ length: 30 }, (_, i) => subDays(new Date(), 29 - i));
};

export const isDateToday = (date: string): boolean => isToday(parseISO(date));
export const isSameDateDay = (a: Date, b: Date): boolean => isSameDay(a, b);
export const daysBetween = (a: string, b: string): number => differenceInDays(parseISO(b), parseISO(a));

export const isDateInRange = (date: Date, start: Date, end: Date): boolean =>
  isWithinInterval(date, { start: startOfDay(start), end: endOfDay(end) });

export const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 6) return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
};

export { format, subDays, addDays, startOfWeek, parseISO, differenceInDays };
