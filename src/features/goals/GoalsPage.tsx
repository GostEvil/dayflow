import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Target, CheckCircle2, Circle, Calendar, Sparkles, Trash2, Pause, Play } from 'lucide-react';
import { v4 as uuid } from 'uuid';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import type { Goal, GoalStatus, GoalCategory, Milestone } from '../../types';
import { STORAGE_KEYS } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Modal } from '../../components/ui/Modal';
import { formatDate } from '../../lib/date-utils';

const CATEGORY_COLORS: Record<GoalCategory, string> = {
  career: 'bg-glow/15 text-glow border border-glow/30',
  health: 'bg-success/15 text-success border border-success/30',
  learning: 'bg-pulse/15 text-pulse border border-pulse/30',
  financial: 'bg-ember/15 text-ember border border-ember/30',
  personal: 'bg-surface-2 text-text-secondary border border-border/60',
  creative: 'bg-pink-500/15 text-pink-400 border border-pink-500/30',
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
    const milestones: Milestone[] = newMilestones
      .filter(m => m.trim())
      .map(m => ({
        id: uuid(),
        title: m.trim(),
        completed: false,
        completedAt: null,
      }));
    const goal: Goal = {
      id: uuid(),
      title: newTitle.trim(),
      description: newDesc,
      category: newCategory,
      status: 'active',
      targetDate:
        newTargetDate ||
        new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
      milestones,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
    setGoals(prev => [goal, ...prev]);
    setShowNew(false);
    setNewTitle('');
    setNewDesc('');
    setNewMilestones(['']);
  };

  const toggleMilestone = (goalId: string, milestoneId: string) => {
    setGoals(prev =>
      prev.map(g => {
        if (g.id !== goalId) return g;
        const milestones = g.milestones.map(m => {
          if (m.id !== milestoneId) return m;
          return {
            ...m,
            completed: !m.completed,
            completedAt: !m.completed ? new Date().toISOString() : null,
          };
        });
        const allDone = milestones.length > 0 && milestones.every(m => m.completed);
        return {
          ...g,
          milestones,
          status: allDone ? 'completed' : g.status,
          completedAt: allDone ? new Date().toISOString() : g.completedAt,
        };
      })
    );
    if (detailGoal?.id === goalId) {
      setDetailGoal(prev => {
        if (!prev) return prev;
        const milestones = prev.milestones.map(m =>
          m.id === milestoneId
            ? { ...m, completed: !m.completed, completedAt: !m.completed ? new Date().toISOString() : null }
            : m
        );
        return { ...prev, milestones };
      });
    }
  };

  const updateGoalStatus = (id: string, status: GoalStatus) => {
    setGoals(prev =>
      prev.map(g =>
        g.id === id
          ? {
              ...g,
              status,
              completedAt: status === 'completed' ? new Date().toISOString() : null,
            }
          : g
      )
    );
    if (detailGoal?.id === id) setDetailGoal(prev => (prev ? { ...prev, status } : prev));
  };

  const deleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
    if (detailGoal?.id === id) setDetailGoal(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-[1400px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-text tracking-tight">Goals & Targets</h1>
          <p className="text-sm text-text-muted mt-1 font-mono">
            {goals.filter(g => g.status === 'active').length} active goals · Long-term focus and milestone roadmaps
          </p>
        </div>
        <Button
          onClick={() => setShowNew(true)}
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
        >
          New Goal
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 bg-surface-2/80 border border-border/80 rounded-2xl p-1.5 w-fit shadow-sm">
        {(['active', 'completed', 'paused'] as GoalStatus[]).map(s => (
          <button
            key={s}
            onClick={() => setTab(s)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
              tab === s
                ? 'bg-surface text-glow shadow-sm border border-border/60'
                : 'text-text-muted hover:text-text'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        {filtered.map(goal => {
          const completed = goal.milestones.filter(m => m.completed).length;
          const total = goal.milestones.length;
          const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
          return (
            <motion.div
              key={goal.id}
              layout
              className="bg-surface/95 border border-border/80 rounded-3xl p-6 sm:p-8 shadow-sm cursor-pointer hover:border-border transition-all duration-200 flex flex-col justify-between group"
              onClick={() => setDetailGoal(goal)}
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-mono uppercase font-semibold ${CATEGORY_COLORS[goal.category]}`}
                  >
                    {goal.category}
                  </span>
                  <div className="text-right ml-4 flex-shrink-0">
                    <div className="font-mono text-2xl font-extrabold text-glow">{pct}%</div>
                    <div className="text-xs font-mono text-text-muted mt-0.5">
                      {completed} of {total} milestones
                    </div>
                  </div>
                </div>
                <h3 className="font-display text-xl font-bold text-text tracking-tight mb-2">
                  {goal.title}
                </h3>
                {goal.description && (
                  <p className="text-sm text-text-secondary line-clamp-2 mb-6 leading-relaxed">
                    {goal.description}
                  </p>
                )}
              </div>

              <div>
                <div className="w-full h-2.5 bg-surface-2 rounded-full overflow-hidden mb-4 border border-border/40">
                  <motion.div
                    className="h-full bg-glow rounded-full shadow-sm shadow-glow/30"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-text-muted pt-2 border-t border-border/40">
                  <Calendar className="w-3.5 h-3.5 text-text-muted" />
                  <span>Target Date: {formatDate(goal.targetDate)}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="bg-surface/95 border border-dashed border-border/80 rounded-3xl p-16 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-glow/10 border border-glow/20 flex items-center justify-center text-glow">
            <Target className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-text mb-1">
              No {tab} goals
            </h3>
            <p className="text-sm text-text-muted max-w-sm">
              {tab === 'active'
                ? 'Create a high-level outcome goal to organize and track key milestones.'
                : `You currently have no ${tab} goals.`}
            </p>
          </div>
          {tab === 'active' && (
            <Button
              onClick={() => setShowNew(true)}
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
            >
              Create Goal
            </Button>
          )}
        </div>
      )}

      {/* New Goal Modal */}
      <Modal
        isOpen={showNew}
        onClose={() => setShowNew(false)}
        title="New Goal"
        subtitle="Set a high-level objective and break it down into key milestones"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowNew(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={addGoal} disabled={!newTitle.trim()}>
              Create Goal
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Goal Title"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="e.g. Master TypeScript & Modern Architecture"
            autoFocus
          />
          <Textarea
            label="Description (optional)"
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            placeholder="Why is this goal important? What is the measurable outcome?"
            rows={2}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              value={newCategory}
              onChange={e => setNewCategory(e.target.value as GoalCategory)}
            >
              <option value="career">Career</option>
              <option value="health">Health</option>
              <option value="learning">Learning</option>
              <option value="financial">Financial</option>
              <option value="personal">Personal</option>
              <option value="creative">Creative</option>
            </Select>
            <Input
              label="Target Date"
              type="date"
              value={newTargetDate}
              onChange={e => setNewTargetDate(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary tracking-wide mb-2 block select-none">
              Milestones
            </label>
            <div className="space-y-2.5">
              {newMilestones.map((m, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input
                    value={m}
                    onChange={e => {
                      const arr = [...newMilestones];
                      arr[i] = e.target.value;
                      setNewMilestones(arr);
                    }}
                    placeholder={`Milestone ${i + 1}`}
                  />
                  {newMilestones.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setNewMilestones(prev => prev.filter((_, j) => j !== i))}
                      className="text-text-muted hover:text-danger"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button
              onClick={() => setNewMilestones(prev => [...prev, ''])}
              variant="ghost"
              size="sm"
              className="mt-2 text-glow"
            >
              + Add milestone
            </Button>
          </div>
        </div>
      </Modal>

      {/* Goal Detail Side Modal */}
      <AnimatePresence>
        {detailGoal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
              onClick={() => setDetailGoal(null)}
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
                    <span
                      className={`px-3 py-1 rounded-xl text-xs font-mono uppercase font-semibold ${CATEGORY_COLORS[detailGoal.category]}`}
                    >
                      {detailGoal.category}
                    </span>
                    <button
                      onClick={() => setDetailGoal(null)}
                      className="p-2 hover:bg-surface-2 rounded-xl text-text-muted hover:text-text transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <h2 className="font-display text-2xl font-bold text-text mb-2">
                    {detailGoal.title}
                  </h2>
                  {detailGoal.description && (
                    <p className="text-sm text-text-secondary mb-6 leading-relaxed">
                      {detailGoal.description}
                    </p>
                  )}

                  {/* Progress Bento */}
                  <div className="bg-surface-2/70 border border-border/60 rounded-2xl p-5 mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono uppercase text-text-muted font-semibold">
                        Progress
                      </span>
                      <span className="font-mono text-lg font-bold text-glow">
                        {detailGoal.milestones.length > 0
                          ? Math.round(
                              (detailGoal.milestones.filter(m => m.completed).length /
                                detailGoal.milestones.length) *
                                100
                            )
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-surface-3 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-glow rounded-full transition-all shadow-sm shadow-glow/30"
                        style={{
                          width: `${
                            detailGoal.milestones.length > 0
                              ? (detailGoal.milestones.filter(m => m.completed).length /
                                  detailGoal.milestones.length) *
                                100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Milestones Checklist */}
                  <div className="mb-6">
                    <div className="text-xs font-mono uppercase text-text-muted mb-3 font-semibold tracking-wider">
                      Milestones ({detailGoal.milestones.filter(m => m.completed).length}/
                      {detailGoal.milestones.length})
                    </div>
                    <div className="space-y-2.5">
                      {detailGoal.milestones.map(m => (
                        <div
                          key={m.id}
                          className="flex items-center gap-3.5 p-4 bg-surface-2/60 border border-border/60 rounded-xl cursor-pointer hover:bg-surface-2 transition-all"
                          onClick={() => toggleMilestone(detailGoal.id, m.id)}
                        >
                          {m.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                          ) : (
                            <Circle className="w-5 h-5 text-text-muted flex-shrink-0" />
                          )}
                          <span
                            className={`text-sm font-medium ${
                              m.completed ? 'text-text-muted line-through' : 'text-text'
                            }`}
                          >
                            {m.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3 pt-4 border-t border-border/60">
                  {detailGoal.status === 'active' && (
                    <Button
                      onClick={() => updateGoalStatus(detailGoal.id, 'paused')}
                      variant="outline"
                      className="w-full"
                      icon={<Pause className="w-4 h-4" />}
                    >
                      Pause Goal
                    </Button>
                  )}
                  {detailGoal.status === 'paused' && (
                    <Button
                      onClick={() => updateGoalStatus(detailGoal.id, 'active')}
                      variant="secondary"
                      className="w-full"
                      icon={<Play className="w-4 h-4" />}
                    >
                      Resume Goal
                    </Button>
                  )}
                  <Button
                    onClick={() => deleteGoal(detailGoal.id)}
                    variant="danger"
                    className="w-full"
                    icon={<Trash2 className="w-4 h-4" />}
                  >
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
