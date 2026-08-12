import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, X, BookOpen, Smile, Frown, Meh, SmilePlus, Heart } from 'lucide-react';
import { v4 as uuid } from 'uuid';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import type { JournalEntry, GamificationState } from '../../types';
import { STORAGE_KEYS } from '../../types';
import { todayStr, formatDate, format, subDays } from '../../lib/date-utils';
import { XP_VALUES, getLevel, checkBadges } from '../../lib/xp';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

const PROMPTS = [
  'What went well today?', 'What drained your energy?', 'What are you grateful for?',
  'What would you do differently?', "What's one thing you learned today?",
  'What made you smile today?', 'What challenged you today?',
  'What are you looking forward to?', 'How did you take care of yourself today?',
];

const MOOD_ICONS = [Frown, Meh, Meh, Smile, SmilePlus];
const MOOD_COLORS = ['text-danger', 'text-ember', 'text-warning', 'text-success', 'text-glow'];

export function JournalPage() {
  const [entries, setEntries] = useLocalStorage<JournalEntry[]>(STORAGE_KEYS.JOURNAL, []);
  const [gamification, setGamification] = useLocalStorage<GamificationState>(STORAGE_KEYS.GAMIFICATION, { xp: 0, level: 1, totalTasksCompleted: 0, totalFocusMinutes: 0, totalJournalEntries: 0, longestHabitStreak: 0, loginStreak: 0, lastLoginDate: null, unlockedBadges: [], quests: [] });
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  const [content, setContent] = useState('');
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [tags, setTags] = useState('');
  const today = todayStr();
  const prompt = useMemo(() => PROMPTS[new Date().getDate() % PROMPTS.length], []);
  const hasToday = entries.some(e => e.date === today);

  const filtered = useMemo(() => {
    if (!search) return entries;
    const q = search.toLowerCase();
    return entries.filter(e => e.content.toLowerCase().includes(q) || e.tags.some(t => t.toLowerCase().includes(q)));
  }, [entries, search]);

  const trendData = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const d = format(subDays(new Date(), 13 - i), 'yyyy-MM-dd');
      const entry = entries.find(e => e.date === d);
      return { date: format(subDays(new Date(), 13 - i), 'MMM d'), mood: entry?.mood || null, energy: entry?.energy || null };
    });
  }, [entries]);

  const saveEntry = () => {
    if (!content.trim()) return;
    const entry: JournalEntry = {
      id: uuid(), date: today, content: content.trim(),
      mood, energy, tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      prompt, createdAt: new Date().toISOString(),
    };
    setEntries(prev => [entry, ...prev.filter(e => e.date !== today)]);
    setGamification(prev => {
      const updated = { ...prev, xp: prev.xp + XP_VALUES.JOURNAL, totalJournalEntries: prev.totalJournalEntries + 1, level: getLevel(prev.xp + XP_VALUES.JOURNAL) };
      const newBadges = checkBadges(updated);
      return { ...updated, unlockedBadges: [...prev.unlockedBadges, ...newBadges] };
    });
    setShowNew(false);
    setContent(''); setTags(''); setMood(3); setEnergy(3);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-text">Journal</h1>
          <p className="text-sm text-text-muted mt-1">{entries.length} entries</p>
        </div>
        <button onClick={() => setShowNew(true)} disabled={hasToday && !showNew}
          className="px-4 py-2 bg-glow/10 text-glow text-sm font-medium rounded-xl hover:bg-glow/20 disabled:opacity-40 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" /> {hasToday ? 'Already wrote today' : 'Write Today'}
        </button>
      </div>

      {/* Mood/Energy Trend */}
      <div className="bg-surface border border-border rounded-2xl p-5 mb-6">
        <div className="text-xs font-mono uppercase text-text-muted mb-3 tracking-wider">Mood & Energy Trend</div>
        <div className="h-[150px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[1, 5]} tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} width={20} />
              <Tooltip contentStyle={{ background: '#0F0F18', border: '1px solid #1E1E3A', borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="mood" stroke="#00E5FF" strokeWidth={2} dot={false} connectNulls />
              <Line type="monotone" dataKey="energy" stroke="#A855F7" strokeWidth={2} dot={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-4 mt-2">
          <div className="flex items-center gap-1.5 text-xs text-text-muted"><div className="w-3 h-0.5 bg-glow rounded" /> Mood</div>
          <div className="flex items-center gap-1.5 text-xs text-text-muted"><div className="w-3 h-0.5 bg-pulse rounded" /> Energy</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search entries..."
          className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text outline-none placeholder:text-text-muted focus:border-glow/30" />
      </div>

      {/* Entries */}
      <div className="space-y-3">
        {filtered.map(entry => {
          const MoodIcon = MOOD_ICONS[entry.mood - 1] || Meh;
          return (
            <motion.div key={entry.id} layout
              className="bg-surface border border-border rounded-2xl p-5 cursor-pointer hover:border-border-2 transition-colors spotlight-card"
              onClick={() => setSelectedEntry(entry)}>
              <div className="flex items-start justify-between mb-2">
                <div className="text-xs font-mono text-text-muted">{formatDate(entry.date)}</div>
                <div className="flex items-center gap-2">
                  <MoodIcon className={`w-4 h-4 ${MOOD_COLORS[entry.mood - 1]}`} />
                  <span className="text-xs font-mono text-text-muted">Energy: {entry.energy}/5</span>
                </div>
              </div>
              <p className="text-sm text-text line-clamp-3 mb-3">{entry.content}</p>
              {entry.tags.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                  {entry.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-surface-2 text-text-muted text-[10px] rounded-md font-mono">#{tag}</span>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {entries.length === 0 && (
        <div className="bg-surface border border-border rounded-2xl p-12 text-center">
          <BookOpen className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <h3 className="font-display text-lg text-text mb-2">Start your journal</h3>
          <p className="text-sm text-text-muted">Daily reflection helps you grow. Write your first entry today.</p>
        </div>
      )}

      {/* New Entry Modal */}
      <AnimatePresence>
        {showNew && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setShowNew(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-[10%] left-1/2 -translate-x-1/2 w-full max-w-lg z-50">
              <div className="bg-surface border border-border rounded-2xl p-6 m-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-lg font-bold text-text">Today's Journal</h2>
                  <button onClick={() => setShowNew(false)} className="p-1 hover:bg-surface-2 rounded-lg text-text-muted"><X className="w-4 h-4" /></button>
                </div>
                <div className="bg-surface-2 border border-border rounded-xl p-3 mb-4">
                  <div className="text-[10px] font-mono uppercase text-text-muted mb-1">Prompt</div>
                  <div className="text-sm text-text-secondary italic">{prompt}</div>
                </div>
                <div className="space-y-4">
                  <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Write your thoughts..." rows={6} autoFocus
                    className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm text-text outline-none placeholder:text-text-muted focus:border-glow/30 resize-none" />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-mono uppercase text-text-muted mb-2 block">Mood</label>
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map(v => {
                          const Icon = MOOD_ICONS[v-1];
                          return (
                            <button key={v} onClick={() => setMood(v)}
                              className={`p-2 rounded-lg transition-colors ${mood === v ? `bg-glow/10 ${MOOD_COLORS[v-1]}` : 'text-text-muted hover:text-text'}`}>
                              <Icon className="w-5 h-5" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-mono uppercase text-text-muted mb-2 block">Energy</label>
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map(v => (
                          <button key={v} onClick={() => setEnergy(v)}
                            className={`w-9 h-9 rounded-lg text-sm font-mono font-bold transition-colors ${energy === v ? 'bg-pulse/10 text-pulse' : 'bg-surface-2 text-text-muted hover:text-text'}`}>
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="Tags (comma-separated)"
                    className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-sm text-text outline-none placeholder:text-text-muted focus:border-glow/30" />
                  <button onClick={saveEntry} disabled={!content.trim()}
                    className="w-full py-2.5 bg-glow text-void font-semibold rounded-xl hover:bg-glow/90 disabled:opacity-40 transition-colors">
                    Save Entry
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Entry Detail */}
      <AnimatePresence>
        {selectedEntry && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setSelectedEntry(null)} />
            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }} className="fixed top-0 right-0 bottom-0 w-full max-w-md z-50">
              <div className="h-full bg-surface border-l border-border p-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="text-xs font-mono text-text-muted">{formatDate(selectedEntry.date)}</div>
                  <button onClick={() => setSelectedEntry(null)} className="p-1 hover:bg-surface-2 rounded-lg text-text-muted"><X className="w-4 h-4" /></button>
                </div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-surface-2 rounded-xl p-3 text-center flex-1">
                    <div className="text-xs text-text-muted mb-1">Mood</div>
                    <div className={`text-2xl ${MOOD_COLORS[selectedEntry.mood - 1]}`}>{selectedEntry.mood}/5</div>
                  </div>
                  <div className="bg-surface-2 rounded-xl p-3 text-center flex-1">
                    <div className="text-xs text-text-muted mb-1">Energy</div>
                    <div className="text-2xl text-pulse">{selectedEntry.energy}/5</div>
                  </div>
                </div>
                <div className="bg-surface-2 border border-border rounded-xl p-3 mb-4">
                  <div className="text-[10px] font-mono uppercase text-text-muted mb-1">Prompt</div>
                  <div className="text-sm text-text-secondary italic">{selectedEntry.prompt}</div>
                </div>
                <p className="text-sm text-text leading-relaxed whitespace-pre-wrap">{selectedEntry.content}</p>
                {selectedEntry.tags.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap mt-4">
                    {selectedEntry.tags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 bg-surface-2 text-text-muted text-[10px] rounded-md font-mono">#{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
