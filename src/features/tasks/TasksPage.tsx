import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Filter, LayoutGrid, List, X,
  CheckCircle2, Circle, Clock, AlertTriangle, Trash2, Edit3, ChevronDown
} from 'lucide-react';
import { v4 as uuid } from 'uuid';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import type { Task, TaskStatus, Priority, TaskCategory, GamificationState } from '../../types';
import { STORAGE_KEYS } from '../../types';
import { formatDate, todayStr } from '../../lib/date-utils';
import { XP_VALUES, getLevel, checkBadges } from '../../lib/xp';
import { deleteNotionTask, syncNotionTask } from '../../lib/sync-api';
import { Button } from '../../components/ui/Button';

const STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  today: 'Today',
  'in-progress': 'In Progress',
  done: 'Done',
};

const STATUS_COLORS: Record<TaskStatus, string> = {
  backlog: 'text-text-muted',
  today: 'text-glow',
  'in-progress': 'text-pulse',
  done: 'text-success',
};

const PRIORITY_COLORS: Record<Priority, string> = {
  low: 'bg-drift/20 text-drift',
  medium: 'bg-glow-muted text-glow',
  high: 'bg-ember-muted text-ember',
  urgent: 'bg-danger-muted text-danger',
};

const CATEGORY_OPTIONS: TaskCategory[] = ['work', 'personal', 'health', 'learning', 'finance', 'creative', 'other'];

export function TasksPage() {
  const [tasks, setTasks] = useLocalStorage<Task[]>(STORAGE_KEYS.TASKS, []);
  const [gamification, setGamification] = useLocalStorage<GamificationState>(STORAGE_KEYS.GAMIFICATION, { xp: 0, level: 1, totalTasksCompleted: 0, totalFocusMinutes: 0, totalJournalEntries: 0, longestHabitStreak: 0, loginStreak: 0, lastLoginDate: null, unlockedBadges: [], quests: [] });
  const [view, setView] = useState<'board' | 'list'>('board');
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<TaskCategory | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showNewTask, setShowNewTask] = useState(false);

  // New task form
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('medium');
  const [newCategory, setNewCategory] = useState<TaskCategory>('work');
  const [newDueDate, setNewDueDate] = useState('');
  const [newDueTime, setNewDueTime] = useState('');
  const [newStatus, setNewStatus] = useState<TaskStatus>('today');

  const filtered = useMemo(() => {
    return tasks.filter(t => {
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
      if (filterCategory !== 'all' && t.category !== filterCategory) return false;
      return true;
    });
  }, [tasks, search, filterPriority, filterCategory]);

  const grouped = useMemo(() => {
    const groups: Record<TaskStatus, Task[]> = { backlog: [], today: [], 'in-progress': [], done: [] };
    for (const t of filtered) {
      groups[t.status].push(t);
    }
    return groups;
  }, [filtered]);

  const addTask = () => {
    if (!newTitle.trim()) return;
    const task: Task = {
      id: uuid(),
      title: newTitle.trim(),
      description: newDesc,
      status: newStatus,
      priority: newPriority,
      category: newCategory,
      dueDate: newDueDate || null,
      dueTime: newDueTime || null,
      createdAt: new Date().toISOString(),
      completedAt: null,
      isInbox: false,
    };
    setTasks(prev => [task, ...prev]);
    void syncNotionTask(task).then(result => {
      setTasks(prev => prev.map(item => item.id === task.id ? { ...item, notionPageId: result.notionPageId } : item));
    }).catch(() => undefined);
    resetForm();
    setShowNewTask(false);
  };

  const resetForm = () => {
    setNewTitle(''); setNewDesc(''); setNewPriority('medium');
    setNewCategory('work'); setNewDueDate(''); setNewDueTime('');
    setNewStatus('today');
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, ...updates } : t);
      const task = updated.find(t => t.id === id);
      if (task) void syncNotionTask(task).then(result => setTasks(current => current.map(item => item.id === id ? { ...item, notionPageId: result.notionPageId } : item))).catch(() => undefined);
      return updated;
    });
  };

  const toggleComplete = (task: Task) => {
    if (task.status === 'done') {
      updateTask(task.id, { status: 'today', completedAt: null });
    } else {
      updateTask(task.id, { status: 'done', completedAt: new Date().toISOString() });
      // Award XP
      const xpMap: Record<Priority, number> = { low: XP_VALUES.TASK_LOW, medium: XP_VALUES.TASK_MEDIUM, high: XP_VALUES.TASK_HIGH, urgent: XP_VALUES.TASK_URGENT };
      const xp = xpMap[task.priority];
      setGamification(prev => {
        const updated = {
          ...prev,
          xp: prev.xp + xp,
          totalTasksCompleted: prev.totalTasksCompleted + 1,
          level: getLevel(prev.xp + xp),
        };
        const newBadges = checkBadges(updated);
        return { ...updated, unlockedBadges: [...prev.unlockedBadges, ...newBadges] };
      });
    }
  };

  const deleteTask = (id: string) => {
    const task = tasks.find(item => item.id === id);
    setTasks(prev => prev.filter(t => t.id !== id));
    if (task?.notionPageId) void deleteNotionTask(task.notionPageId).catch(() => undefined);
    if (editingTask?.id === id) setEditingTask(null);
  };

  const moveTask = (taskId: string, newStatus: TaskStatus) => {
    if (newStatus === 'done') {
      const task = tasks.find(t => t.id === taskId);
      if (task && task.status !== 'done') {
        toggleComplete(task);
        return;
      }
    }
    updateTask(taskId, { status: newStatus, completedAt: newStatus === 'done' ? new Date().toISOString() : null });
  };

  const saveEdit = () => {
    if (!editingTask) return;
    setTasks(prev => prev.map(t => t.id === editingTask.id ? editingTask : t));
    setEditingTask(null);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-text">Tasks</h1>
          <p className="text-sm text-text-muted mt-1">
            {tasks.filter(t => t.status !== 'done').length} open · {tasks.filter(t => t.completedAt && t.completedAt.startsWith(todayStr())).length} completed today
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowNewTask(true)}
            variant="secondary"
            icon={<Plus className="w-4.5 h-4.5" />}
          >
            New Task
          </Button>
          <div className="flex bg-surface border border-border rounded-xl p-1 gap-1">
            <button
              onClick={() => setView('board')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center ${
                view === 'board' ? 'bg-surface-2 text-glow shadow-sm' : 'text-text-muted hover:text-text'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center ${
                view === 'list' ? 'bg-surface-2 text-glow shadow-sm' : 'text-text-muted hover:text-text'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text outline-none placeholder:text-text-muted focus:border-glow/30 transition-colors min-h-[42px]"
          />
        </div>
        <Button
          onClick={() => setShowFilters(!showFilters)}
          variant={showFilters || filterPriority !== 'all' || filterCategory !== 'all' ? 'secondary' : 'outline'}
          icon={<Filter className="w-4 h-4" />}
        >
          Filters
        </Button>
      </div>

      {showFilters && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="flex flex-wrap gap-3 mb-6">
          <select
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value as Priority | 'all')}
            className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value as TaskCategory | 'all')}
            className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text outline-none"
          >
            <option value="all">All Categories</option>
            {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
          {(filterPriority !== 'all' || filterCategory !== 'all') && (
            <button onClick={() => { setFilterPriority('all'); setFilterCategory('all'); }} className="text-xs text-glow hover:underline">
              Clear filters
            </button>
          )}
        </motion.div>
      )}

      {/* Board View */}
      {view === 'board' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(['backlog', 'today', 'in-progress', 'done'] as TaskStatus[]).map(status => (
            <div key={status} className="bg-surface/50 border border-border rounded-2xl p-3">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${status === 'done' ? 'bg-success' : status === 'in-progress' ? 'bg-pulse' : status === 'today' ? 'bg-glow' : 'bg-drift'}`} />
                  <span className={`text-sm font-medium ${STATUS_COLORS[status]}`}>{STATUS_LABELS[status]}</span>
                </div>
                <span className="text-xs font-mono text-text-muted">{grouped[status].length}</span>
              </div>
              <div className="space-y-2 min-h-[100px]">
                {grouped[status].map(task => (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-surface border border-border rounded-xl p-3 cursor-pointer hover:border-border-2 transition-colors group spotlight-card"
                    onClick={() => setEditingTask(task)}
                  >
                    <div className="flex items-start gap-2.5">
                      <button
                        onClick={e => { e.stopPropagation(); toggleComplete(task); }}
                        className="mt-0.5 flex-shrink-0"
                      >
                        {task.status === 'done' ? (
                          <CheckCircle2 className="w-4 h-4 text-success" />
                        ) : (
                          <Circle className="w-4 h-4 text-text-muted group-hover:text-glow transition-colors" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium ${task.status === 'done' ? 'text-text-muted line-through' : 'text-text'}`}>
                          {task.title}
                        </div>
                        {task.dueDate && (
                          <div className="text-[10px] font-mono text-text-muted mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {formatDate(task.dueDate)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${PRIORITY_COLORS[task.priority]}`}>
                        {task.priority}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-surface-2 text-text-muted">
                        {task.category}
                      </span>
                      {task.isInbox && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-pulse-muted text-pulse">inbox</span>
                      )}
                    </div>
                  </motion.div>
                ))}
                {grouped[status].length === 0 && (
                  <div className="py-8 text-center text-xs text-text-muted">No tasks</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-4 py-2.5 border-b border-border text-xs font-mono uppercase tracking-wider text-text-muted">
            <div className="w-5" />
            <div>Task</div>
            <div className="hidden sm:block">Status</div>
            <div className="hidden sm:block">Priority</div>
            <div className="hidden md:block">Category</div>
            <div className="w-8" />
          </div>
          {filtered.map(task => (
            <div
              key={task.id}
              className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-4 py-3 border-b border-border/50 items-center hover:bg-surface-2/50 transition-colors cursor-pointer"
              onClick={() => setEditingTask(task)}
            >
              <button onClick={e => { e.stopPropagation(); toggleComplete(task); }}>
                {task.status === 'done' ? <CheckCircle2 className="w-4 h-4 text-success" /> : <Circle className="w-4 h-4 text-text-muted" />}
              </button>
              <div className={`text-sm truncate ${task.status === 'done' ? 'text-text-muted line-through' : 'text-text'}`}>{task.title}</div>
              <span className={`hidden sm:block text-xs ${STATUS_COLORS[task.status]}`}>{STATUS_LABELS[task.status]}</span>
              <span className={`hidden sm:block px-1.5 py-0.5 rounded text-[10px] font-mono ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
              <span className="hidden md:block text-xs text-text-muted">{task.category}</span>
              <button onClick={e => { e.stopPropagation(); deleteTask(task.id); }} className="p-1 hover:text-danger text-text-muted transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-text-muted">No tasks match your filters</div>
          )}
        </div>
      )}

      {/* New Task Modal */}
      <AnimatePresence>
        {showNewTask && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setShowNewTask(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-[10%] left-1/2 -translate-x-1/2 w-full max-w-md z-50"
            >
              <div className="bg-surface border border-border rounded-2xl p-6 m-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-lg font-bold text-text">New Task</h2>
                  <button onClick={() => setShowNewTask(false)} className="p-1 hover:bg-surface-2 rounded-lg text-text-muted"><X className="w-4 h-4" /></button>
                </div>
                <div className="space-y-3">
                  <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Task title" autoFocus
                    className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-sm text-text outline-none placeholder:text-text-muted focus:border-glow/30" />
                  <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Description (optional)" rows={2}
                    className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-sm text-text outline-none placeholder:text-text-muted focus:border-glow/30 resize-none" />
                  <div className="grid grid-cols-2 gap-3">
                    <select value={newStatus} onChange={e => setNewStatus(e.target.value as TaskStatus)}
                      className="bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm text-text outline-none">
                      <option value="backlog">Backlog</option>
                      <option value="today">Today</option>
                      <option value="in-progress">In Progress</option>
                    </select>
                    <select value={newPriority} onChange={e => setNewPriority(e.target.value as Priority)}
                      className="bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm text-text outline-none">
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <select value={newCategory} onChange={e => setNewCategory(e.target.value as TaskCategory)}
                      className="bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm text-text outline-none">
                      {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                    </select>
                    <input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)}
                      className="bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm text-text outline-none" />
                  </div>
                  <Button onClick={addTask} disabled={!newTitle.trim()} variant="primary" size="lg" className="w-full">
                    Create Task
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Edit Task Modal */}
      <AnimatePresence>
        {editingTask && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setEditingTask(null)} />
            <motion.div
              initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md z-50"
            >
              <div className="h-full bg-surface border-l border-border p-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-lg font-bold text-text">Edit Task</h2>
                  <button onClick={() => setEditingTask(null)} className="p-2 hover:bg-surface-2 rounded-xl text-text-muted transition-colors"><X className="w-4 h-4" /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-mono uppercase text-text-muted mb-1.5 block">Title</label>
                    <input type="text" value={editingTask.title} onChange={e => setEditingTask({ ...editingTask, title: e.target.value })}
                      className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-sm text-text outline-none focus:border-glow/30" />
                  </div>
                  <div>
                    <label className="text-xs font-mono uppercase text-text-muted mb-1.5 block">Description</label>
                    <textarea value={editingTask.description} onChange={e => setEditingTask({ ...editingTask, description: e.target.value })} rows={4}
                      className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-sm text-text outline-none focus:border-glow/30 resize-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-mono uppercase text-text-muted mb-1.5 block">Status</label>
                      <select value={editingTask.status} onChange={e => setEditingTask({ ...editingTask, status: e.target.value as TaskStatus })}
                        className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm text-text outline-none">
                        <option value="backlog">Backlog</option>
                        <option value="today">Today</option>
                        <option value="in-progress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-mono uppercase text-text-muted mb-1.5 block">Priority</label>
                      <select value={editingTask.priority} onChange={e => setEditingTask({ ...editingTask, priority: e.target.value as Priority })}
                        className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm text-text outline-none">
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-mono uppercase text-text-muted mb-1.5 block">Category</label>
                      <select value={editingTask.category} onChange={e => setEditingTask({ ...editingTask, category: e.target.value as TaskCategory })}
                        className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm text-text outline-none">
                        {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-mono uppercase text-text-muted mb-1.5 block">Due Date</label>
                      <input type="date" value={editingTask.dueDate || ''} onChange={e => setEditingTask({ ...editingTask, dueDate: e.target.value || null })}
                        className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm text-text outline-none" />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button onClick={saveEdit} variant="primary" size="md" className="flex-1">
                      Save Changes
                    </Button>
                    <Button onClick={() => deleteTask(editingTask.id)} variant="danger" size="icon">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
