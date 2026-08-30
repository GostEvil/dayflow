import { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { v4 as uuid } from 'uuid';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { Task } from '../types';
import { STORAGE_KEYS } from '../types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Modal } from './ui/Modal';

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
    <Modal
      isOpen={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-4">
          <Plus className="w-4 h-4 text-glow" />
          <span className="font-display font-semibold text-base">Quick Capture</span>
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-text-muted">Added directly to inbox for triage</span>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              disabled={!title.trim()}
            >
              Add Task
            </Button>
          </div>
        </div>
      }
    >
      <Input
        ref={inputRef}
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') handleSubmit();
          if (e.key === 'Escape') onClose();
        }}
        placeholder="What's on your mind? (e.g. Schedule team sync tomorrow)"
        autoFocus
      />
    </Modal>
  );
}
