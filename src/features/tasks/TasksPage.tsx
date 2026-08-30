import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  LayoutGrid,
  List,
  X,
  CheckCircle2,
  Circle,
  Clock,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { v4 as uuid } from 'uuid';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import type { Task, TaskStatus, Priority, TaskCategory, GamificationState } from '../../types';
import { STORAGE_KEYS } from '../../types';
import { formatDate, todayStr } from '../../lib/date-utils';
import { XP_VALUES, getLevel, checkBadges } from '../../lib/xp';
import { deleteNotionTask, syncNotionTask } from '../../lib/sync-api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Modal } from '../../components/ui/Modal';

const STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  today: 'Today',
  'in-progress': 'In Progress',
  done: 'Completed',
};

const STATUS_COLORS: Record<TaskStatus, string> = {
  backlog: 'text-text-muted',
  today: 'text-glow',
  'in-progress': 'text-pulse',
  done: 'text-success',
};

const PRIORITY_COLORS: Record<Priority, string> = {
  low: 'bg-drift/15 text-drift border border-drift/25',
  medium: 'bg-glow/15 text-glow border border-glow/25',
  high: 'bg-ember/15 text-ember border border-ember/25',
  urgent: 'bg-danger/15 text-danger border border-danger/30',
};

const CATEGORY_OPTIONS: TaskCategory[] = [
  'work',
  'personal',
  'health',
  'learning',
  'finance',
  'creative',
  'other',
];

export function TasksPage() {
  const [tasks, setTasks] = useLocalStorage<Task[]>(STORAGE_KEYS.TASKS, []);
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
    const groups: Record<TaskStatus, Task[]> = {
      backlog: [],
      today: [],
      'in-progress': [],
      done: [],
    };
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
    void syncNotionTask(task)
      .then(result => {
        setTasks(prev =>
          prev.map(item =>
            item.id === task.id ? { ...item, notionPageId: result.notionPageId } : item
          )
        );
      })
      .catch(() => undefined);
    resetForm();
    setShowNewTask(false);
  };

  const resetForm = () => {
    setNewTitle('');
    setNewDesc('');
    setNewPriority('medium');
    setNewCategory('work');
    setNewDueDate('');
    setNewDueTime('');
    setNewStatus('today');
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev => {
      const updated = prev.map(t => (t.id === id ? { ...t, ...updates } : t));
      const task = updated.find(t => t.id === id);
      if (task) {
        void syncNotionTask(task)
          .then(result =>
            setTasks(current =>
              current.map(item =>
                item.id === id ? { ...item, notionPageId: result.notionPageId } : item
              )
            )
          )
          .catch(() => undefined);
      }
      return updated;
    });
  };

  const toggleComplete = (task: Task) => {
    if (task.status === 'done') {
      updateTask(task.id, { status: 'today', completedAt: null });
    } else {
      updateTask(task.id, { status: 'done', completedAt: new Date().toISOString() });
      // Award XP
      const xpMap: Record<Priority, number> = {
        low: XP_VALUES.TASK_LOW,
        medium: XP_VALUES.TASK_MEDIUM,
        high: XP_VALUES.TASK_HIGH,
        urgent: XP_VALUES.TASK_URGENT,
      };
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

  const saveEdit = () => {
    if (!editingTask) return;
    setTasks(prev => prev.map(t => (t.id === editingTask.id ? editingTask : t)));
    setEditingTask(null);
  };

  return (
    <div className="p-5 sm:p-8 lg:p-10 max-w-[1440px] mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-text tracking-tight">Tasks</h1>
          <p className="text-sm text-text-muted mt-1 font-mono">
            {tasks.filter(t => t.status !== 'done').length} open ·{' '}
            {tasks.filter(t => t.completedAt && t.completedAt.startsWith(todayStr())).length} completed today
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            onClick={() => setShowNewTask(true)}
            variant="primary"
            icon={<Plus className="w-4.5 h-4.5" />}
          >
            New Task
          </Button>
          <div className="flex bg-surface-2/80 border border-border/80 rounded-2xl p-1 shadow-sm">
            <button
              onClick={() => setView('board')}
              className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150 flex items-center justify-center cursor-pointer ${
                view === 'board'
                  ? 'bg-surface text-glow shadow-sm border border-border/60'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150 flex items-center justify-center cursor-pointer ${
                view === 'list'
                  ? 'bg-surface text-glow shadow-sm border border-border/60'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          icon={<Search className="w-4 h-4" />}
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search tasks by title..."
          containerClassName="flex-1"
        />
        <Button
          onClick={() => setShowFilters(!showFilters)}
          variant={showFilters || filterPriority !== 'all' || filterCategory !== 'all' ? 'secondary' : 'outline'}
          icon={<Filter className="w-4 h-4" />}
          className="h-11"
        >
          Filters
        </Button>
      </div>

      {showFilters && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="flex flex-wrap items-center gap-4 p-5 bg-surface-2/40 border border-border/60 rounded-2xl"
        >
          <Select
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value as Priority | 'all')}
            containerClassName="w-48"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
            <option value="urgent">Urgent Priority</option>
          </Select>
          <Select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value as TaskCategory | 'all')}
            containerClassName="w-48"
          >
            <option value="all">All Categories</option>
            {CATEGORY_OPTIONS.map(c => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </Select>
          {(filterPriority !== 'all' || filterCategory !== 'all') && (
            <Button
              onClick={() => {
                setFilterPriority('all');
                setFilterCategory('all');
              }}
              variant="ghost"
              size="sm"
              className="text-glow ml-auto"
            >
              Clear filters
            </Button>
          )}
        </motion.div>
      )}

      {/* Board View */}
      {view === 'board' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {(['backlog', 'today', 'in-progress', 'done'] as TaskStatus[]).map(status => (
            <div
              key={status}
              className="bg-surface/95 border border-border/80 rounded-3xl p-6 sm:p-7 shadow-sm flex flex-col justify-between min-h-[420px]"
            >
              <div>
                {/* Column Header */}
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-border/60">
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        status === 'done'
                          ? 'bg-success'
                          : status === 'in-progress'
                          ? 'bg-pulse'
                          : status === 'today'
                          ? 'bg-glow'
                          : 'bg-drift'
                      }`}
                    />
                    <span className={`text-sm font-semibold tracking-wide ${STATUS_COLORS[status]}`}>
                      {STATUS_LABELS[status]}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-text-muted bg-surface-2 border border-border/50 px-3 py-1.5 rounded-lg">
                    {grouped[status].length}
                  </span>
                </div>

                {/* Column Task Cards */}
                <div className="space-y-4">
                  {grouped[status].map(task => (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-surface-2/70 border border-border/60 rounded-2xl p-4 sm:p-5 cursor-pointer hover:border-border hover:bg-surface-2 transition-all duration-200 shadow-xs group"
                      onClick={() => setEditingTask(task)}
                    >
                      <div className="flex items-start gap-4.5">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            toggleComplete(task);
                          }}
                          className="mt-0.5 flex-shrink-0 cursor-pointer active:scale-90 transition-transform"
                        >
                          {task.status === 'done' ? (
                            <CheckCircle2 className="w-5 h-5 text-success" />
                          ) : (
                            <Circle className="w-5 h-5 text-text-muted group-hover:text-glow transition-colors" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div
                            className={`text-sm font-medium leading-snug ${
                              task.status === 'done' ? 'text-text-muted line-through' : 'text-text'
                            }`}
                          >
                            {task.title}
                          </div>
                          {task.dueDate && (
                            <div className="text-xs font-mono text-text-muted mt-2.5 flex items-center gap-1.5 bg-surface-3/70 px-3 py-1.5 rounded-lg w-max border border-border/40">
                              <Clock className="w-3.5 h-3.5 text-text-muted" /> {formatDate(task.dueDate)}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Tags & Metadata */}
                      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border/40 flex-wrap">
                        <span
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase ${PRIORITY_COLORS[task.priority]}`}
                        >
                          {task.priority}
                        </span>
                        <span className="px-3 py-1.5 rounded-lg text-[10px] font-mono bg-surface-3 text-text-muted uppercase border border-border/40 font-medium">
                          {task.category}
                        </span>
                        {task.isInbox && (
                          <span className="px-3 py-1.5 rounded-lg text-[10px] font-mono bg-pulse/15 text-pulse border border-pulse/25 uppercase font-medium">
                            inbox
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}

                  {grouped[status].length === 0 && (
                    <div className="py-14 text-center text-xs text-text-muted border border-dashed border-border/60 rounded-2xl flex flex-col items-center justify-center space-y-1">
                      <span>No tasks in {STATUS_LABELS[status].toLowerCase()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="bg-surface/95 border border-border/80 rounded-3xl overflow-hidden shadow-sm">
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-5 px-7 py-4 border-b border-border/60 text-xs font-mono uppercase tracking-wider text-text-muted bg-surface-2/40">
            <div className="w-5" />
            <div>Task Title</div>
            <div className="hidden sm:block">Status</div>
            <div className="hidden sm:block">Priority</div>
            <div className="hidden md:block">Category</div>
            <div className="w-8" />
          </div>
          <div className="divide-y divide-border/40">
            {filtered.map(task => (
              <div
                key={task.id}
                className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-5 px-7 py-4 items-center hover:bg-surface-2/60 transition-colors cursor-pointer"
                onClick={() => setEditingTask(task)}
              >
                <button
                  onClick={e => {
                    e.stopPropagation();
                    toggleComplete(task);
                  }}
                  className="cursor-pointer active:scale-90 transition-transform"
                >
                  {task.status === 'done' ? (
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  ) : (
                    <Circle className="w-5 h-5 text-text-muted hover:text-glow" />
                  )}
                </button>
                <div
                  className={`text-sm font-medium truncate ${
                    task.status === 'done' ? 'text-text-muted line-through' : 'text-text'
                  }`}
                >
                  {task.title}
                </div>
                <span className={`hidden sm:block text-xs font-medium ${STATUS_COLORS[task.status]}`}>
                  {STATUS_LABELS[task.status]}
                </span>
                <span
                  className={`hidden sm:block px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase ${PRIORITY_COLORS[task.priority]}`}
                >
                  {task.priority}
                </span>
                <span className="hidden md:block text-xs text-text-muted uppercase font-mono">
                  {task.category}
                </span>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    deleteTask(task.id);
                  }}
                  className="p-1.5 hover:text-danger hover:bg-danger/10 rounded-lg text-text-muted transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="py-16 text-center text-sm text-text-muted font-mono">
                No tasks match your selected search or filters.
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Task Modal */}
      <Modal
        isOpen={showNewTask}
        onClose={() => setShowNewTask(false)}
        title="New Task"
        subtitle="Capture a new action item in your workspace"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowNewTask(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={addTask} disabled={!newTitle.trim()}>
              Create Task
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Task Title"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="What needs to be done?"
            autoFocus
          />
          <Textarea
            label="Description (optional)"
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            placeholder="Add relevant notes, checklist links, or context..."
            rows={3}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Status"
              value={newStatus}
              onChange={e => setNewStatus(e.target.value as TaskStatus)}
            >
              <option value="backlog">Backlog</option>
              <option value="today">Today</option>
              <option value="in-progress">In Progress</option>
            </Select>
            <Select
              label="Priority"
              value={newPriority}
              onChange={e => setNewPriority(e.target.value as Priority)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              value={newCategory}
              onChange={e => setNewCategory(e.target.value as TaskCategory)}
            >
              {CATEGORY_OPTIONS.map(c => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </Select>
            <Input
              label="Due Date"
              type="date"
              value={newDueDate}
              onChange={e => setNewDueDate(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      {/* Edit Task Modal */}
      {editingTask && (
        <Modal
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
          title="Edit Task"
          footer={
            <>
              <Button variant="danger" onClick={() => deleteTask(editingTask.id)}>
                Delete
              </Button>
              <Button variant="primary" onClick={saveEdit}>
                Save Changes
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Input
              label="Task Title"
              value={editingTask.title}
              onChange={e => setEditingTask({ ...editingTask, title: e.target.value })}
            />
            <Textarea
              label="Description"
              value={editingTask.description}
              onChange={e => setEditingTask({ ...editingTask, description: e.target.value })}
              rows={4}
            />
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Status"
                value={editingTask.status}
                onChange={e => setEditingTask({ ...editingTask, status: e.target.value as TaskStatus })}
              >
                <option value="backlog">Backlog</option>
                <option value="today">Today</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Completed</option>
              </Select>
              <Select
                label="Priority"
                value={editingTask.priority}
                onChange={e => setEditingTask({ ...editingTask, priority: e.target.value as Priority })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Category"
                value={editingTask.category}
                onChange={e => setEditingTask({ ...editingTask, category: e.target.value as TaskCategory })}
              >
                {CATEGORY_OPTIONS.map(c => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </Select>
              <Input
                label="Due Date"
                type="date"
                value={editingTask.dueDate || ''}
                onChange={e => setEditingTask({ ...editingTask, dueDate: e.target.value || null })}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
