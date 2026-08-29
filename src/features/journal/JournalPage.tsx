import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, X, BookOpen, Smile, Frown, Meh, SmilePlus, Sparkles, Calendar } from 'lucide-react';
import { v4 as uuid } from 'uuid';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import type { JournalEntry, GamificationState } from '../../types';
import { STORAGE_KEYS } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Modal } from '../../components/ui/Modal';
import { todayStr, formatDate, format, subDays } from '../../lib/date-utils';
import { XP_VALUES, getLevel, checkBadges } from '../../lib/xp';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

const PROMPTS = [
  'What went well today and gave you momentum?',
  'What drained your energy or felt like friction?',
  'What are you genuinely grateful for right now?',
  'What would you do differently if you replayed today?',
  "What is one key insight or lesson you learned today?",
  'What made you smile or feel proud today?',
  'What was your biggest challenge today and how did you approach it?',
  'What high-priority outcome are you looking forward to tomorrow?',
  'How did you practice self-care and mental recovery today?',
];

const MOOD_ICONS = [Frown, Meh, Meh, Smile, SmilePlus];
const MOOD_COLORS = ['text-danger', 'text-ember', 'text-warning', 'text-success', 'text-glow'];

export function JournalPage() {
  const [entries, setEntries] = useLocalStorage<JournalEntry[]>(STORAGE_KEYS.JOURNAL, []);
  const [, setGamification] = useLocalStorage<GamificationState>(STORAGE_KEYS.GAMIFICATION, {
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
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  const [content, setContent] = useState('');
  const [mood, setMood] = useState(4);
  const [energy, setEnergy] = useState(4);
  const [tags, setTags] = useState('');
  const today = todayStr();
  const prompt = useMemo(() => PROMPTS[new Date().getDate() % PROMPTS.length], []);
  const hasToday = entries.some(e => e.date === today);

  const filtered = useMemo(() => {
    if (!search) return entries;
    const q = search.toLowerCase();
    return entries.filter(
      e => e.content.toLowerCase().includes(q) || e.tags.some(t => t.toLowerCase().includes(q))
    );
  }, [entries, search]);

  const trendData = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const d = format(subDays(new Date(), 13 - i), 'yyyy-MM-dd');
      const entry = entries.find(e => e.date === d);
      return {
        date: format(subDays(new Date(), 13 - i), 'MMM d'),
        mood: entry?.mood || null,
        energy: entry?.energy || null,
      };
    });
  }, [entries]);

  const saveEntry = () => {
    if (!content.trim()) return;
    const entry: JournalEntry = {
      id: uuid(),
      date: today,
      content: content.trim(),
      mood,
      energy,
      tags: tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean),
      prompt,
      createdAt: new Date().toISOString(),
    };
    setEntries(prev => [entry, ...prev.filter(e => e.date !== today)]);
    setGamification(prev => {
      const updated = {
        ...prev,
        xp: prev.xp + XP_VALUES.JOURNAL,
        totalJournalEntries: prev.totalJournalEntries + 1,
        level: getLevel(prev.xp + XP_VALUES.JOURNAL),
      };
      const newBadges = checkBadges(updated);
      return { ...updated, unlockedBadges: [...prev.unlockedBadges, ...newBadges] };
    });
    setShowNew(false);
    setContent('');
    setTags('');
    setMood(4);
    setEnergy(4);
  };

  return (
    <div className="p-5 sm:p-8 lg:p-10 max-w-[1400px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-text tracking-tight">Journal</h1>
          <p className="text-sm text-text-muted mt-1 font-mono">
            {entries.length} reflections logged · Daily mindset & energy tracking
          </p>
        </div>
        <Button
          onClick={() => setShowNew(true)}
          disabled={hasToday && !showNew}
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
        >
          {hasToday ? 'Already Logged Today' : 'Write Today'}
        </Button>
      </div>

      {/* Mood & Energy Trend Chart Card */}
      <div className="bg-surface/95 border border-border/80 rounded-3xl p-7 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-border/60">
          <div>
            <h3 className="font-display text-lg font-semibold text-text">Mood & Energy Trend</h3>
            <p className="text-xs text-text-muted">14-day continuous trajectory</p>
          </div>
          <div className="flex items-center gap-5 text-xs font-mono text-text-muted">
            <div className="flex items-center gap-2">
              <div className="w-3 h-1 bg-glow rounded-full" /> <span>Mood</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-1 bg-pulse rounded-full" /> <span>Energy</span>
            </div>
          </div>
        </div>

        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[1, 5]} tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} width={25} />
              <Tooltip contentStyle={{ background: '#0F0F18', border: '1px solid #1E1E3A', borderRadius: 12, fontSize: 12 }} />
              <Line type="monotone" dataKey="mood" stroke="#00E5FF" strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
              <Line type="monotone" dataKey="energy" stroke="#A855F7" strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Search Bar */}
      <div>
        <Input
          icon={<Search className="w-4 h-4" />}
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search journal entries by keywords or #tags..."
        />
      </div>

      {/* Entries List */}
      <div className="space-y-4">
        {filtered.map(entry => {
          const MoodIcon = MOOD_ICONS[entry.mood - 1] || Meh;
          return (
            <motion.div
              key={entry.id}
              layout
              className="bg-surface/95 border border-border/80 rounded-2xl p-7 sm:p-8 cursor-pointer hover:border-border transition-all duration-200 shadow-sm group"
              onClick={() => setSelectedEntry(entry)}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-border/50">
                <div className="flex items-center gap-2 text-xs font-mono font-semibold text-text bg-surface-2/80 px-3 py-1.5 rounded-xl border border-border/50 w-fit">
                  <Calendar className="w-3.5 h-3.5 text-text-muted" />
                  {formatDate(entry.date)}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-surface-2/80 border border-border/50">
                    <MoodIcon className={`w-4 h-4 ${MOOD_COLORS[entry.mood - 1]}`} />
                    <span className="text-xs font-mono font-medium text-text-secondary">
                      Mood {entry.mood}/5
                    </span>
                  </div>
                  <span className="text-xs font-mono font-medium text-pulse bg-pulse/10 border border-pulse/20 px-3 py-1 rounded-xl">
                    Energy {entry.energy}/5
                  </span>
                </div>
              </div>

              <p className="text-sm text-text leading-relaxed line-clamp-3 mb-4">{entry.content}</p>

              {entry.tags.length > 0 && (
                <div className="flex gap-2 flex-wrap pt-2">
                  {entry.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-2.5 py-0.5 bg-surface-2 text-text-muted text-xs rounded-lg font-mono border border-border/40"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {entries.length === 0 && (
        <div className="bg-surface/95 border border-dashed border-border/80 rounded-3xl p-16 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-glow/10 border border-glow/20 flex items-center justify-center text-glow">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-text mb-1">Start your reflection journal</h3>
            <p className="text-sm text-text-muted max-w-sm">
              Daily reflection builds clarity, tracks emotional energy, and reinforces intentional habits.
            </p>
          </div>
          <Button
            onClick={() => setShowNew(true)}
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
          >
            Write First Entry
          </Button>
        </div>
      )}

      {/* New Entry Modal */}
      <Modal
        isOpen={showNew}
        onClose={() => setShowNew(false)}
        title="Today's Journal"
        subtitle="Reflect on your progress, challenges, and headspace"
        maxWidth="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowNew(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={saveEntry} disabled={!content.trim()}>
              Save Reflection
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="bg-surface-2/60 border border-border/80 rounded-2xl p-4">
            <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-glow mb-1 select-none flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Reflection Prompt
            </div>
            <div className="text-sm text-text font-medium italic">{prompt}</div>
          </div>

          <Textarea
            label="Your Thoughts"
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Write freely about what happened, wins, blockers, or ideas..."
            rows={5}
            autoFocus
          />

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-medium text-text-secondary tracking-wide mb-2.5 block select-none">
                Mood Rating (1 to 5)
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(v => {
                  const Icon = MOOD_ICONS[v - 1];
                  const isSelected = mood === v;
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setMood(v)}
                      className={`flex-1 p-3 rounded-xl transition-all flex items-center justify-center ${
                        isSelected
                          ? `bg-glow/20 ring-2 ring-glow ${MOOD_COLORS[v - 1]} shadow-sm`
                          : 'text-text-muted hover:text-text hover:bg-surface-2 bg-surface-2/50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-text-secondary tracking-wide mb-2.5 block select-none">
                Energy Rating (1 to 5)
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setEnergy(v)}
                    className={`flex-1 py-3 rounded-xl text-sm font-mono font-bold transition-all ${
                      energy === v
                        ? 'bg-pulse/20 text-pulse ring-2 ring-pulse shadow-sm'
                        : 'bg-surface-2/50 text-text-muted hover:text-text hover:bg-surface-2'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Input
            label="Tags"
            value={tags}
            onChange={e => setTags(e.target.value)}
            placeholder="work, breakthrough, gratitude (comma-separated)"
          />
        </div>
      </Modal>

      {/* Entry Detail Side Modal */}
      <AnimatePresence>
        {selectedEntry && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
              onClick={() => setSelectedEntry(null)}
            />
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.2 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-lg z-50"
            >
              <div className="h-full bg-surface/98 border-l border-border/80 p-6 sm:p-8 overflow-y-auto flex flex-col justify-between shadow-2xl">
                <div>
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/60">
                    <div className="text-xs font-mono font-semibold text-text bg-surface-2 px-3 py-1.5 rounded-xl border border-border/50">
                      {formatDate(selectedEntry.date)}
                    </div>
                    <button
                      onClick={() => setSelectedEntry(null)}
                      className="p-2 hover:bg-surface-2 rounded-xl text-text-muted hover:text-text transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-surface-2/70 border border-border/60 rounded-2xl p-4 text-center">
                      <div className="text-xs text-text-muted font-medium mb-1">Mood Rating</div>
                      <div className={`text-2xl font-mono font-extrabold ${MOOD_COLORS[selectedEntry.mood - 1]}`}>
                        {selectedEntry.mood} / 5
                      </div>
                    </div>
                    <div className="bg-surface-2/70 border border-border/60 rounded-2xl p-4 text-center">
                      <div className="text-xs text-text-muted font-medium mb-1">Energy Level</div>
                      <div className="text-2xl font-mono font-extrabold text-pulse">
                        {selectedEntry.energy} / 5
                      </div>
                    </div>
                  </div>

                  <div className="bg-surface-2/50 border border-border/60 rounded-2xl p-4 mb-6">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-text-muted mb-1 font-semibold">
                      Reflection Prompt
                    </div>
                    <div className="text-sm text-text font-medium italic">{selectedEntry.prompt}</div>
                  </div>

                  <p className="text-sm text-text leading-relaxed whitespace-pre-wrap">
                    {selectedEntry.content}
                  </p>

                  {selectedEntry.tags.length > 0 && (
                    <div className="flex gap-2 flex-wrap mt-6 pt-4 border-t border-border/40">
                      {selectedEntry.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-surface-2 text-text-muted text-xs rounded-xl font-mono border border-border/40"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
