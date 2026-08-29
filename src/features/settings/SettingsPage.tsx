import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Sun,
  Moon,
  Monitor,
  Download,
  Upload,
  Trash2,
  RotateCcw,
  Database,
  Calendar,
  RefreshCw,
  Sliders,
  User,
  Layout,
} from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useTheme } from '../../hooks/useTheme';
import type { UserProfile, ThemeMode } from '../../types';
import { STORAGE_KEYS, DEFAULT_VISIBLE_TABS } from '../../types';
import { NAV_ITEMS } from '../../components/AppShell';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  exportAllData,
  importAllData,
  clearAllData,
  getBackups,
  restoreBackup,
  createBackup,
} from '../../lib/storage';
import { resetToSeedData } from '../../lib/seed-data';
import { connectGoogle, getSyncStatus, type SyncStatus } from '../../lib/sync-api';
import { syncPullGoogleEvents, syncPullNotionTasks } from '../../lib/sync-manager';

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [profile, setProfile] = useLocalStorage<UserProfile | null>(STORAGE_KEYS.PROFILE, null);
  const [visibleTabs, setVisibleTabs] = useLocalStorage<Record<string, boolean>>(
    STORAGE_KEYS.VISIBLE_TABS,
    DEFAULT_VISIBLE_TABS
  );
  const [name, setName] = useState(profile?.name || '');
  const [workStart, setWorkStart] = useState(profile?.workingHoursStart || '09:00');
  const [workEnd, setWorkEnd] = useState(profile?.workingHoursEnd || '17:00');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backups = getBackups();

  const refreshSyncStatus = () => {
    void getSyncStatus()
      .then(setSyncStatus)
      .catch(() => setSyncStatus(null));
  };

  useEffect(() => {
    refreshSyncStatus();
  }, []);

  const saveProfile = () => {
    if (profile) {
      setProfile({ ...profile, name, workingHoursStart: workStart, workingHoursEnd: workEnd });
      showMsg('success', 'Profile settings saved');
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
    showMsg('success', 'Data exported successfully');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = importAllData(reader.result as string);
      if (result.success) {
        showMsg('success', 'Data imported — refreshing workspace');
        setTimeout(() => window.location.reload(), 1200);
      } else {
        showMsg('error', result.error || 'Import failed');
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (confirm('Clear all data and reset workspace to clean state? This cannot be undone.')) {
      clearAllData();
      resetToSeedData();
      showMsg('success', 'Workspace cleared — refreshing...');
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
    showMsg('success', 'Backup snapshot created');
  };

  const handleImportGoogle = () => {
    void syncPullGoogleEvents()
      .then(res => {
        refreshSyncStatus();
        const parts: string[] = [];
        if (res.importedCount > 0) parts.push(`${res.importedCount} imported`);
        if (res.updatedCount > 0) parts.push(`${res.updatedCount} updated`);
        if (res.deletedCount > 0) parts.push(`${res.deletedCount} deleted`);
        const details = parts.length > 0 ? ` (${parts.join(', ')})` : '';
        showMsg('success', `Google Calendar checked${details}`);
      })
      .catch(error => showMsg('error', error.message));
  };

  const handleImportNotion = () => {
    void syncPullNotionTasks()
      .then(res => {
        refreshSyncStatus();
        const details = res.importedCount > 0 ? ` (${res.importedCount} new)` : '';
        showMsg('success', `Notion tasks checked${details}`);
      })
      .catch(error => showMsg('error', error.message));
  };

  const handleRestore = (backupId: string) => {
    if (confirm('Restore this backup? Current workspace state will be replaced.')) {
      if (restoreBackup(backupId)) {
        showMsg('success', 'Backup restored — refreshing...');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        showMsg('error', 'Backup not found');
      }
    }
  };

  const THEME_OPTIONS: { value: ThemeMode; label: string; icon: any }[] = [
    { value: 'dark', label: 'Dark Mode', icon: Moon },
    { value: 'light', label: 'Light Mode', icon: Sun },
    { value: 'system', label: 'System Sync', icon: Monitor },
  ];

  const formatTs = (value: string | null) => (value ? new Date(value).toLocaleString() : 'Never');

  return (
    <div className="p-5 sm:p-8 lg:p-10 max-w-[960px] mx-auto space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-text tracking-tight">Settings</h1>
        <p className="text-sm text-text-muted mt-1 font-mono">
          Customize themes, navigation modules, sync integrations, and local data
        </p>
      </div>

      {/* Status Messages */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`px-5 py-3.5 rounded-2xl text-sm font-medium border ${
            message.type === 'success'
              ? 'bg-success/15 text-success border-success/30'
              : 'bg-danger/15 text-danger border-danger/30'
          }`}
        >
          {message.text}
        </motion.div>
      )}

      {/* Theme Card */}
      <div className="bg-surface/95 border border-border/80 rounded-3xl p-7 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-5 pb-3 border-b border-border/60">
          <div className="w-8 h-8 rounded-xl bg-glow/10 border border-glow/20 flex items-center justify-center text-glow">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display text-base font-semibold text-text">Appearance Theme</h3>
            <p className="text-xs text-text-muted">Choose your preferred visual mode</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {THEME_OPTIONS.map(opt => {
            const Icon = opt.icon;
            const isSelected = theme === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => {
                  setTheme(opt.value);
                  if (profile) setProfile({ ...profile, theme: opt.value });
                }}
                className={`flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-glow/15 text-glow border border-glow/40 shadow-sm font-semibold'
                    : 'bg-surface-2/70 text-text-muted hover:text-text hover:bg-surface-2 border border-border/60'
                }`}
              >
                <Icon className="w-4 h-4" /> {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation Tabs Customization */}
      <div className="bg-surface/95 border border-border/80 rounded-3xl p-7 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-2 pb-3 border-b border-border/60">
          <div className="w-8 h-8 rounded-xl bg-pulse/10 border border-pulse/20 flex items-center justify-center text-pulse">
            <Layout className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display text-base font-semibold text-text">Navigation Modules</h3>
            <p className="text-xs text-text-muted">Toggle visible features in your sidebar</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isEnabled = visibleTabs[item.key] !== false;
            const isSettings = item.key === 'settings';

            return (
              <label
                key={item.key}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all select-none ${
                  isSettings
                    ? 'opacity-70 cursor-not-allowed border-border/50 bg-surface-2/40'
                    : 'cursor-pointer hover:border-glow/40 bg-surface-2/70'
                } ${isEnabled ? 'border-border text-text' : 'border-border/40 text-text-muted opacity-60'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-surface-3 flex items-center justify-center text-glow">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <input
                  type="checkbox"
                  checked={isEnabled}
                  disabled={isSettings}
                  onChange={e => {
                    if (isSettings) return;
                    setVisibleTabs(prev => ({
                      ...DEFAULT_VISIBLE_TABS,
                      ...prev,
                      [item.key]: e.target.checked,
                    }));
                  }}
                  className="w-4 h-4 rounded border-border text-glow focus:ring-glow focus:ring-offset-0 bg-void accent-glow cursor-pointer disabled:cursor-not-allowed"
                />
              </label>
            );
          })}
        </div>
      </div>

      {/* User Profile Settings */}
      <div className="bg-surface/95 border border-border/80 rounded-3xl p-7 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-5 pb-3 border-b border-border/60">
          <div className="w-8 h-8 rounded-xl bg-ember/10 border border-ember/20 flex items-center justify-center text-ember">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display text-base font-semibold text-text">Profile & Schedule</h3>
            <p className="text-xs text-text-muted">Working window and greeting personalization</p>
          </div>
        </div>

        <div className="space-y-4">
          <Input
            label="Display Name"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Work Start"
              type="time"
              value={workStart}
              onChange={e => setWorkStart(e.target.value)}
            />
            <Input
              label="Work End"
              type="time"
              value={workEnd}
              onChange={e => setWorkEnd(e.target.value)}
            />
          </div>
          <Button onClick={saveProfile} variant="primary" className="mt-2">
            Save Profile
          </Button>
        </div>
      </div>

      {/* Google Calendar Sync */}
      <div className="bg-surface/95 border border-border/80 rounded-3xl p-7 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-3 pb-3 border-b border-border/60">
          <div className="w-8 h-8 rounded-xl bg-glow/10 border border-glow/20 flex items-center justify-center text-glow">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display text-base font-semibold text-text">Google Calendar Sync</h3>
            <p className="text-xs text-text-muted">Two-way synchronization for time blocks</p>
          </div>
        </div>

        <p className="text-sm text-text-secondary mb-4 leading-relaxed">
          Connect your Google account to automatically import calendar events into your weekly Planner.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={connectGoogle}
            disabled={!syncStatus?.google.configured}
            variant="outline"
          >
            {syncStatus?.google.connected ? 'Reconnect Google Calendar' : 'Connect Google Calendar'}
          </Button>
          <Button
            onClick={refreshSyncStatus}
            aria-label="Refresh sync status"
            variant="ghost"
            size="icon"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <span
            className={`text-xs font-mono font-medium px-3 py-1 rounded-xl border ${
              syncStatus?.google.connected
                ? 'text-success bg-success/10 border-success/20'
                : 'text-text-muted bg-surface-2 border-border/50'
            }`}
          >
            {syncStatus?.google.connected
              ? 'Connected'
              : syncStatus?.google.configured
              ? 'Ready to Connect'
              : 'Local server not running'}
          </span>
        </div>

        {syncStatus && (
          <div className="mt-4 pt-3 border-t border-border/40 space-y-1 text-xs text-text-muted font-mono">
            <p>Last sync: {formatTs(syncStatus.sync.google.lastSuccessAt)}</p>
            {syncStatus.sync.google.lastError && (
              <p className="text-danger">Google error: {syncStatus.sync.google.lastError}</p>
            )}
          </div>
        )}
      </div>

      {/* Data Management Card */}
      <div className="bg-surface/95 border border-border/80 rounded-3xl p-7 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-5 pb-3 border-b border-border/60">
          <div className="w-8 h-8 rounded-xl bg-success/10 border border-success/20 flex items-center justify-center text-success">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display text-base font-semibold text-text">Data & Backups</h3>
            <p className="text-xs text-text-muted">Import, export, snapshot, or reset your workspace</p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleExport}
            className="w-full flex items-center justify-between px-5 py-3.5 bg-surface-2/70 border border-border/60 rounded-2xl text-sm text-text hover:bg-surface-2 hover:border-border transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Download className="w-4 h-4 text-glow" />
              <span>Export Full Workspace (JSON)</span>
            </div>
            <span className="text-xs font-mono text-text-muted">Download</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-between px-5 py-3.5 bg-surface-2/70 border border-border/60 rounded-2xl text-sm text-text hover:bg-surface-2 hover:border-border transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Upload className="w-4 h-4 text-pulse" />
              <span>Import Data File</span>
            </div>
            <span className="text-xs font-mono text-text-muted">Upload</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />

          <button
            onClick={handleBackup}
            className="w-full flex items-center justify-between px-5 py-3.5 bg-surface-2/70 border border-border/60 rounded-2xl text-sm text-text hover:bg-surface-2 hover:border-border transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Database className="w-4 h-4 text-ember" />
              <span>Create Snapshot Backup Now</span>
            </div>
            <span className="text-xs font-mono text-text-muted">Save State</span>
          </button>

          <button
            onClick={handleRestartOnboarding}
            className="w-full flex items-center justify-between px-5 py-3.5 bg-surface-2/70 border border-border/60 rounded-2xl text-sm text-text hover:bg-surface-2 hover:border-border transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <RotateCcw className="w-4 h-4 text-text-muted" />
              <span>Restart Initial Onboarding Flow</span>
            </div>
            <span className="text-xs font-mono text-text-muted">Reset Wizard</span>
          </button>

          <button
            onClick={handleReset}
            className="w-full flex items-center justify-between px-5 py-3.5 bg-danger/10 border border-danger/25 rounded-2xl text-sm text-danger hover:bg-danger/15 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Trash2 className="w-4 h-4" />
              <span>Clear All Data & Reset Workspace</span>
            </div>
            <span className="text-xs font-mono font-semibold">Destructive</span>
          </button>
        </div>

        {/* Backups List */}
        {backups.length > 0 && (
          <div className="mt-6 pt-5 border-t border-border/40 space-y-2">
            <div className="text-xs font-mono uppercase tracking-wider text-text-muted font-semibold mb-3">
              Available Backups ({backups.length})
            </div>
            {backups.map(b => (
              <div
                key={b.id}
                className="flex items-center justify-between p-3 px-4 bg-surface-2/50 border border-border/50 rounded-xl"
              >
                <div>
                  <div className="text-xs font-mono text-text font-medium">
                    {new Date(b.timestamp).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-text-muted font-mono">
                    {(b.size / 1024).toFixed(1)} KB
                  </div>
                </div>
                <button
                  onClick={() => handleRestore(b.id)}
                  className="px-3 py-1 bg-glow/15 text-glow text-xs font-mono font-semibold rounded-lg hover:bg-glow/25 transition-colors cursor-pointer"
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
