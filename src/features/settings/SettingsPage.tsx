import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Monitor, Download, Upload, Trash2, RotateCcw, Database, Calendar } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useTheme } from '../../hooks/useTheme';
import type { UserProfile, ThemeMode } from '../../types';
import { STORAGE_KEYS } from '../../types';
import { exportAllData, importAllData, clearAllData, getBackups, restoreBackup, createBackup } from '../../lib/storage';
import { resetToSeedData } from '../../lib/seed-data';

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [profile, setProfile] = useLocalStorage<UserProfile | null>(STORAGE_KEYS.PROFILE, null);
  const [name, setName] = useState(profile?.name || '');
  const [workStart, setWorkStart] = useState(profile?.workingHoursStart || '09:00');
  const [workEnd, setWorkEnd] = useState(profile?.workingHoursEnd || '17:00');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backups = getBackups();

  const saveProfile = () => {
    if (profile) {
      setProfile({ ...profile, name, workingHoursStart: workStart, workingHoursEnd: workEnd });
      showMsg('success', 'Profile saved');
    }
  };

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleExport = () => {
    const data = exportAllData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dayflow-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showMsg('success', 'Data exported');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = importAllData(reader.result as string);
      if (result.success) {
        showMsg('success', 'Data imported — refresh to see changes');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        showMsg('error', result.error || 'Import failed');
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (confirm('Reset all data to demo defaults? This cannot be undone.')) {
      clearAllData();
      resetToSeedData();
      showMsg('success', 'Data reset — refreshing...');
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  const handleRestartOnboarding = () => {
    if (profile) {
      setProfile({ ...profile, onboardingCompleted: false });
      setTimeout(() => window.location.reload(), 500);
    }
  };

  const handleBackup = () => {
    createBackup();
    showMsg('success', 'Backup created');
  };

  const handleRestore = (backupId: string) => {
    if (confirm('Restore this backup? Current data will be overwritten.')) {
      if (restoreBackup(backupId)) {
        showMsg('success', 'Backup restored — refreshing...');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        showMsg('error', 'Backup not found');
      }
    }
  };

  const THEME_OPTIONS: { value: ThemeMode; label: string; icon: any }[] = [
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[700px] mx-auto">
      <h1 className="font-display text-2xl font-bold text-text mb-8">Settings</h1>

      {/* Messages */}
      {message && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className={`mb-6 px-4 py-3 rounded-xl text-sm ${message.type === 'success' ? 'bg-success/10 text-success border border-success/30' : 'bg-danger/10 text-danger border border-danger/30'}`}>
          {message.text}
        </motion.div>
      )}

      {/* Theme */}
      <div className="bg-surface border border-border rounded-2xl p-5 mb-4">
        <div className="text-xs font-mono uppercase text-text-muted mb-3 tracking-wider">Theme</div>
        <div className="flex gap-2">
          {THEME_OPTIONS.map(opt => {
            const Icon = opt.icon;
            return (
              <button key={opt.value} onClick={() => { setTheme(opt.value); if (profile) setProfile({ ...profile, theme: opt.value }); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors ${
                  theme === opt.value ? 'bg-glow/10 text-glow border border-glow/30' : 'bg-surface-2 text-text-muted hover:text-text border border-transparent'
                }`}>
                <Icon className="w-4 h-4" /> {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Profile */}
      <div className="bg-surface border border-border rounded-2xl p-5 mb-4">
        <div className="text-xs font-mono uppercase text-text-muted mb-3 tracking-wider">Profile</div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-text-muted mb-1 block">Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-sm text-text outline-none focus:border-glow/30" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-muted mb-1 block">Work Start</label>
              <input type="time" value={workStart} onChange={e => setWorkStart(e.target.value)}
                className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm text-text font-mono outline-none" />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Work End</label>
              <input type="time" value={workEnd} onChange={e => setWorkEnd(e.target.value)}
                className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm text-text font-mono outline-none" />
            </div>
          </div>
          <button onClick={saveProfile} className="px-4 py-2 bg-glow/10 text-glow text-sm rounded-xl hover:bg-glow/20 transition-colors">
            Save Profile
          </button>
        </div>
      </div>

      {/* Google Calendar */}
      <div className="bg-surface border border-border rounded-2xl p-5 mb-4">
        <div className="text-xs font-mono uppercase text-text-muted mb-3 tracking-wider flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5" /> Google Calendar
        </div>
        <p className="text-sm text-text-secondary mb-3">
          Connect your Google Calendar to sync events with the Planner.
          Requires setting up <code className="text-glow font-mono text-xs">VITE_GOOGLE_CLIENT_ID</code> env var.
        </p>
        <button className="px-4 py-2 bg-surface-2 text-text-muted text-sm rounded-xl hover:bg-surface-3 transition-colors">
          Connect Google Calendar
        </button>
      </div>

      {/* Data */}
      <div className="bg-surface border border-border rounded-2xl p-5 mb-4">
        <div className="text-xs font-mono uppercase text-text-muted mb-3 tracking-wider">Data Management</div>
        <div className="space-y-2">
          <button onClick={handleExport} className="w-full flex items-center gap-3 px-4 py-3 bg-surface-2 rounded-xl text-sm text-text hover:bg-surface-3 transition-colors">
            <Download className="w-4 h-4 text-text-muted" /> Export All Data (JSON)
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-3 px-4 py-3 bg-surface-2 rounded-xl text-sm text-text hover:bg-surface-3 transition-colors">
            <Upload className="w-4 h-4 text-text-muted" /> Import Data
          </button>
          <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
          <button onClick={handleBackup} className="w-full flex items-center gap-3 px-4 py-3 bg-surface-2 rounded-xl text-sm text-text hover:bg-surface-3 transition-colors">
            <Database className="w-4 h-4 text-text-muted" /> Create Backup Now
          </button>
          <button onClick={handleReset} className="w-full flex items-center gap-3 px-4 py-3 bg-surface-2 rounded-xl text-sm text-danger hover:bg-danger/10 transition-colors">
            <Trash2 className="w-4 h-4" /> Reset to Demo Data
          </button>
          <button onClick={handleRestartOnboarding} className="w-full flex items-center gap-3 px-4 py-3 bg-surface-2 rounded-xl text-sm text-text hover:bg-surface-3 transition-colors">
            <RotateCcw className="w-4 h-4 text-text-muted" /> Restart Onboarding
          </button>
        </div>
      </div>

      {/* Backups */}
      <div className="bg-surface border border-border rounded-2xl p-5">
        <div className="text-xs font-mono uppercase text-text-muted mb-3 tracking-wider">Backups ({backups.length})</div>
        {backups.length > 0 ? (
          <div className="space-y-2">
            {backups.map(b => (
              <div key={b.id} className="flex items-center justify-between py-2 px-3 bg-surface-2 rounded-xl">
                <div>
                  <div className="text-sm text-text">{new Date(b.timestamp).toLocaleString()}</div>
                  <div className="text-[10px] text-text-muted font-mono">{(b.size / 1024).toFixed(1)} KB</div>
                </div>
                <button onClick={() => handleRestore(b.id)} className="px-3 py-1 bg-glow/10 text-glow text-xs rounded-lg hover:bg-glow/20">
                  Restore
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted">No backups yet. Backups are created automatically or manually.</p>
        )}
      </div>
    </div>
  );
}
