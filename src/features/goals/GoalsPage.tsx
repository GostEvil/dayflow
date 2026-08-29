import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Target, CheckCircle2, Circle, ChevronRight, Calendar } from 'lucide-react';
import { v4 as uuid } from 'uuid';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import type { Goal, GoalStatus, GoalCategory, Milestone } from '../../types';
import { STORAGE_KEYS } from '../../types';
import { Button } from '../../components/ui/Button';
import { formatDate } from '../../lib/date-utils';

const CATEGORY_COLORS: Record<GoalCategory, string> = {
  career: 'bg-glow-muted text-glow',
  health: 'bg-success-muted text-success',
  learning: 'bg-pulse-muted text-pulse',
  financial: 'bg-ember-muted text-ember',
  personal: 'bg-surface-2 text-text-secondary',
  creative: 'bg-danger-muted text-danger',
};

export function GoalsPage() {
  const [goals, setGoals] = useLocalStorage<Goal[]>(STORAGE_KEYS.GOALS, []);
  const [tab, setTab] = useState<GoalStatus>('active');
  const [showNew, setShowNew] = useState(false);
  const [detailGoal, setDetailGoal] = useState<Goal | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<GoalCategory>('career');
  const [newTargetDate, setNewTargetDate] = useState('');
  const [newMilestones, setNewMilestones] = useState<string[]>(['']);

  const filtered = useMemo(() => goals.filter(g => g.status === tab), [goals, tab]);

  const addGoal = () => {
    if (!newTitle.trim()) return;
    const milestones: Milestone[] = newMilestones.filter(m => m.trim()).map(m => ({
      id: uuid(), title: m.trim(), completed: false, completedAt: null,
    }));
    const goal: Goal = {
      id: uuid(), title: newTitle.trim(), description: newDesc, category: newCategory,
      status: 'active', targetDate: newTargetDate || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
      milestones, createdAt: new Date().toISOString(), completedAt: null,
    };
    setGoals(prev => [goal, ...prev]);
    setShowNew(false);
    setNewTitle(''); setNewDesc(''); setNewMilestones(['']);
  };

  const toggleMilestone = (goalId: string, milestoneId: string) => {
    setGoals(prev => prev.map(g => {
      if (g.id !== goalId) return g;
      const milestones = g.milestones.map(m => {
        if (m.id !== milestoneId) return m;
        return { ...m, completed: !m.completed, completedAt: !m.completed ? new Date().toISOString() : null };
      });
      // Auto-complete goal if all milestones done
      const allDone = milestones.length > 0 && milestones.every(m => m.completed);
      return { ...g, milestones, status: allDone ? 'completed' : g.status, completedAt: allDone ? new Date().toISOString() : g.completedAt };
    }));
    if (detailGoal?.id === goalId) {
      setDetailGoal(prev => {
        if (!prev) return prev;
        const milestones = prev.milestones.map(m => m.id === milestoneId ? { ...m, completed: !m.completed, completedAt: !m.completed ? new Date().toISOString() : null } : m);
        return { ...prev, milestones };
      });
    }
  };

  const updateGoalStatus = (id: string, status: GoalStatus) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, status, completedAt: status === 'completed' ? new Date().toISOString() : null } : g));
    if (detailGoal?.id === id) setDetailGoal(prev => prev ? { ...prev, status } : prev);
  };

  const deleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
    if (detailGoal?.id === id) setDetailGoal(null);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-text">Goals</h1>
          <p className="text-sm text-text-muted mt-1">{goals.filter(g => g.status === 'active').length} active goals</p>
        </div>
        <Button onClick={() => setShowNew(true)} variant="secondary" icon={<Plus className="w-4 h-4" />}>
          New Goal
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 bg-surface border border-border rounded-2xl p-1.5 mb-6 w-fit shadow-sm">
        {(['active', 'completed', 'paused'] as GoalStatus[]).map(s => (
          <button key={s} onClick={() => setTab(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${tab === s ? 'bg-glow/15 text-glow shadow-sm border border-glow/30' : 'text-text-muted hover:text-text'}`}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Goals list */}
      <div className="space-y-4">
        {filtered.map(goal => {
          const completed = goal.milestones.filter(m => m.completed).length;
          const total = goal.milestones.length;
          const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
          return (
            <motion.div
              key={goal.id} layout
              className="bg-surface border border-border rounded-2xl p-5 spotlight-card cursor-pointer hover:border-border-2 transition-colors"
              onClick={() => setDetailGoal(goal)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono ${CATEGORY_COLORS[goal.category]}`}>
                      {goal.category}
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-semibold text-text">{goal.title}</h3>
                  {goal.description && <p className="text-sm text-text-muted mt-1 line-clamp-2">{goal.description}</p>}
                </div>
                <div className="text-right ml-4 flex-shrink-0">
                  <div className="font-mono text-2xl font-bold text-glow">{pct}%</div>
                  <div className="text-[10px] font-mono text-text-muted">{completed}/{total} milestones</div>
                </div>
              </div>
              <div className="w-full h-1.5 bg-surface-2 rounded-full overflow-hidden mb-3">
                <motion.div className="h-full bg-glow rounded-full" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }} />
              </div>
              <div className="flex items-center gap-3 text-xs text-text-muted">
                <Calendar className="w-3 h-3" />
                <span>Target: {formatDate(goal.targetDate)}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="bg-surface border border-border rounded-2xl p-12 text-center">
          <Target className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <h3 className="font-display text-lg text-text mb-2">No {tab} goals</h3>
          <p className="text-sm text-text-muted">
            {tab === 'active' ? 'Create a goal to start tracking your progress.' : `You have no ${tab} goals yet.`}
          </p>
        </div>
      )}

      {/* New Goal Modal */}
      <AnimatePresence>
        {showNew && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setShowNew(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-[10%] left-1/2 -translate-x-1/2 w-full max-w-md z-50">
              <div className="bg-surface border border-border rounded-2xl p-6 m-4 max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-lg font-bold text-text">New Goal</h2>
                  <button onClick={() => setShowNew(false)} className="p-1 hover:bg-surface-2 rounded-lg text-text-muted"><X className="w-4 h-4" /></button>
                </div>
                <div className="space-y-3">
                  <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Goal title" autoFocus
                    className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-sm text-text outline-none placeholder:text-text-muted focus:border-glow/30" />
                  <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Description" rows={2}
                    className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-sm text-text outline-none placeholder:text-text-muted focus:border-glow/30 resize-none" />
                  <div className="grid grid-cols-2 gap-3">
                    <select value={newCategory} onChange={e => setNewCategory(e.target.value as GoalCategory)}
                      className="bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm text-text outline-none">
                      <option value="career">Career</option><option value="health">Health</option>
                      <option value="learning">Learning</option><option value="financial">Financial</option>
                      <option value="personal">Personal</option><option value="creative">Creative</option>
                    </select>
                    <input type="date" value={newTargetDate} onChange={e => setNewTargetDate(e.target.value)}
                      className="bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm text-text outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-mono uppercase text-text-muted mb-2 block">Milestones</label>
                    {newMilestones.map((m, i) => (
                      <div key={i} className="flex gap-2 mb-2">
                        <input type="text" value={m} onChange={e => { const arr = [...newMilestones]; arr[i] = e.target.value; setNewMilestones(arr); }}
                          placeholder={`Milestone ${i + 1}`}
                          className="flex-1 bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-text outline-none placeholder:text-text-muted" />
                        {newMilestones.length > 1 && (
                          <button onClick={() => setNewMilestones(prev => prev.filter((_, j) => j !== i))} className="p-2 text-text-muted hover:text-danger">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    <Button onClick={() => setNewMilestones(prev => [...prev, ''])} variant="ghost" size="sm" className="mt-1 text-glow">
                      + Add milestone
                    </Button>
                  </div>
                  <Button onClick={addGoal} disabled={!newTitle.trim()} variant="primary" size="lg" className="w-full">
                    Create Goal
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Goal Detail */}
      <AnimatePresence>
        {detailGoal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setDetailGoal(null)} />
            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }} className="fixed top-0 right-0 bottom-0 w-full max-w-lg z-50">
              <div className="h-full bg-surface border-l border-border p-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-mono ${CATEGORY_COLORS[detailGoal.category]}`}>{detailGoal.category}</span>
                  <button onClick={() => setDetailGoal(null)} className="p-2 hover:bg-surface-2 rounded-xl text-text-muted transition-colors"><X className="w-4 h-4" /></button>
                </div>
                <h2 className="font-display text-2xl font-bold text-text mb-2">{detailGoal.title}</h2>
                {detailGoal.description && <p className="text-sm text-text-secondary mb-6">{detailGoal.description}</p>}

                {/* Progress */}
                <div className="bg-surface-2 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono uppercase text-text-muted">Progress</span>
                    <span className="font-mono text-lg font-bold text-glow">
                      {detailGoal.milestones.length > 0 ? Math.round((detailGoal.milestones.filter(m => m.completed).length / detailGoal.milestones.length) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-surface-3 rounded-full overflow-hidden">
                    <div className="h-full bg-glow rounded-full transition-all" style={{ width: `${detailGoal.milestones.length > 0 ? (detailGoal.milestones.filter(m => m.completed).length / detailGoal.milestones.length) * 100 : 0}%` }} />
                  </div>
                </div>

                {/* Milestones */}
                <div className="mb-6">
                  <div className="text-xs font-mono uppercase text-text-muted mb-3">Milestones</div>
                  <div className="space-y-2">
                    {detailGoal.milestones.map(m => (
                      <div key={m.id} className="flex items-center gap-3 p-3.5 bg-surface-2 rounded-xl cursor-pointer hover:bg-surface-3 transition-colors"
                        onClick={() => toggleMilestone(detailGoal.id, m.id)}>
                        {m.completed ? <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" /> : <Circle className="w-5 h-5 text-text-muted flex-shrink-0" />}
                        <span className={`text-sm ${m.completed ? 'text-text-muted line-through' : 'text-text'}`}>{m.title}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2.5">
                  {detailGoal.status === 'active' && (
                    <Button onClick={() => updateGoalStatus(detailGoal.id, 'paused')} variant="outline" className="w-full">
                      Pause Goal
                    </Button>
                  )}
                  {detailGoal.status === 'paused' && (
                    <Button onClick={() => updateGoalStatus(detailGoal.id, 'active')} variant="secondary" className="w-full">
                      Resume Goal
                    </Button>
                  )}
                  <Button onClick={() => deleteGoal(detailGoal.id)} variant="danger" className="w-full">
                    Delete Goal
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
