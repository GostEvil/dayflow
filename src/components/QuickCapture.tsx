import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { v4 as uuid } from 'uuid';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { Task } from '../types';
import { STORAGE_KEYS } from '../types';
import { Button } from './ui/Button';

export function QuickCapture({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [tasks, setTasks] = useLocalStorage<Task[]>(STORAGE_KEYS.TASKS, []);

  useEffect(() => {
    if (open) {
      setTitle('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleSubmit = () => {
    if (!title.trim()) return;

    const newTask: Task = {
      id: uuid(),
      title: title.trim(),
      description: '',
      status: 'backlog',
      priority: 'medium',
      category: 'other',
      dueDate: null,
      dueTime: null,
      createdAt: new Date().toISOString(),
      completedAt: null,
      isInbox: true,
    };

    setTasks(prev => [newTask, ...prev]);
    setTitle('');
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
            className="fixed top-[25%] left-1/2 -translate-x-1/2 w-full max-w-md z-[101]"
          >
            <div className="bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden p-2">
              <div className="flex items-center gap-3 px-4 py-2 border-b border-border/50">
                <Plus className="w-4 h-4 text-glow" />
                <span className="text-xs font-mono uppercase tracking-wider text-text-muted">Quick Capture</span>
                <button onClick={onClose} className="ml-auto p-1.5 rounded-xl hover:bg-surface-2 text-text-muted transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4">
                <input
                  ref={inputRef}
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSubmit();
                    if (e.key === 'Escape') onClose();
                  }}
                  placeholder="What's on your mind?"
                  className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-text text-sm outline-none placeholder:text-text-muted focus:border-glow/50 transition-colors"
                />
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs text-text-muted">Added to inbox for triage</span>
                  <Button
                    onClick={handleSubmit}
                    disabled={!title.trim()}
                    variant="primary"
                    size="sm"
                  >
                    Add Task
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
