import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, LayoutDashboard, CheckSquare, Repeat, Target, Calendar,
  Timer, BookOpen, BarChart3, Lightbulb, Heart, Trophy, ClipboardList,
  Settings, Plus, Zap
} from 'lucide-react';

interface CommandItem {
  id: string;
  label: string;
  icon: any;
  action: () => void;
  category: string;
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const commands: CommandItem[] = useMemo(() => [
    // Navigation
    { id: 'nav-dashboard', label: 'Go to Dashboard', icon: LayoutDashboard, action: () => navigate('/'), category: 'Navigation' },
    { id: 'nav-tasks', label: 'Go to Tasks', icon: CheckSquare, action: () => navigate('/tasks'), category: 'Navigation' },
    { id: 'nav-habits', label: 'Go to Habits', icon: Repeat, action: () => navigate('/habits'), category: 'Navigation' },
    { id: 'nav-goals', label: 'Go to Goals', icon: Target, action: () => navigate('/goals'), category: 'Navigation' },
    { id: 'nav-planner', label: 'Go to Planner', icon: Calendar, action: () => navigate('/planner'), category: 'Navigation' },
    { id: 'nav-focus', label: 'Go to Focus', icon: Timer, action: () => navigate('/focus'), category: 'Navigation' },
    { id: 'nav-journal', label: 'Go to Journal', icon: BookOpen, action: () => navigate('/journal'), category: 'Navigation' },
    { id: 'nav-analytics', label: 'Go to Analytics', icon: BarChart3, action: () => navigate('/analytics'), category: 'Navigation' },
    { id: 'nav-insights', label: 'Go to Insights', icon: Lightbulb, action: () => navigate('/insights'), category: 'Navigation' },
    { id: 'nav-wellbeing', label: 'Go to Wellbeing', icon: Heart, action: () => navigate('/wellbeing'), category: 'Navigation' },
    { id: 'nav-profile', label: 'Go to Profile', icon: Trophy, action: () => navigate('/gamification'), category: 'Navigation' },
    { id: 'nav-review', label: 'Go to Review', icon: ClipboardList, action: () => navigate('/review'), category: 'Navigation' },
    { id: 'nav-settings', label: 'Go to Settings', icon: Settings, action: () => navigate('/settings'), category: 'Navigation' },
    // Actions
    { id: 'new-task', label: 'New Task', icon: Plus, action: () => navigate('/tasks'), category: 'Actions' },
    { id: 'start-focus', label: 'Start Focus Session', icon: Zap, action: () => navigate('/focus'), category: 'Actions' },
    { id: 'new-journal', label: 'New Journal Entry', icon: BookOpen, action: () => navigate('/journal'), category: 'Actions' },
  ], [navigate]);

  const filtered = useMemo(() => {
    if (!query) return commands;
    const q = query.toLowerCase();
    return commands.filter(c => c.label.toLowerCase().includes(q) || c.category.toLowerCase().includes(q));
  }, [query, commands]);

  const grouped = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    for (const item of filtered) {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    }
    return groups;
  }, [filtered]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleSelect = (item: CommandItem) => {
    item.action();
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15 }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg z-[101]"
          >
            <div className="bg-surface border border-border rounded-xl shadow-2xl overflow-hidden">
              {/* Search input */}
              <div className="flex items-center gap-4 px-4 py-3 border-b border-border">
                <Search className="w-4 h-4 text-text-muted flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Escape') onClose();
                    if (e.key === 'Enter' && filtered.length > 0) handleSelect(filtered[0]);
                  }}
                  placeholder="Type a command..."
                  className="flex-1 bg-transparent text-text text-sm outline-none placeholder:text-text-muted"
                />
                <kbd className="px-3 py-1.5 bg-surface-2 border border-border rounded text-text-muted text-[10px] font-mono">ESC</kbd>
              </div>

              {/* Results */}
              <div className="max-h-[300px] overflow-y-auto py-2">
                {Object.entries(grouped).map(([category, items]) => (
                  <div key={category}>
                    <div className="px-4 py-1.5 text-[10px] font-mono uppercase tracking-wider text-text-muted">
                      {category}
                    </div>
                    {items.map(item => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelect(item)}
                          className="w-full flex items-center gap-4 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-2 hover:text-text transition-colors"
                        >
                          <Icon className="w-4 h-4 text-text-muted" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
                {filtered.length === 0 && (
                  <div className="px-4 py-8 text-center text-sm text-text-muted">
                    No results found
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
