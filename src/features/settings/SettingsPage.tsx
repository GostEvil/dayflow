import { useState, useRef, useEffect, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
 Search,
 Mail,
 Calendar,
 Database,
 UploadCloud,
 Check,
 Moon,
 Sun,
 Monitor,
 RefreshCw,
 Download,
 Upload,
 Trash2,
 RotateCcw,
 Clock,
 Info,
 CheckCircle2,
 AlertCircle,
 X,
 Compass,
} from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useTheme } from '../../hooks/useTheme';
import type { UserProfile, ThemeMode, UserNotificationSettings } from '../../types';
import { STORAGE_KEYS, DEFAULT_VISIBLE_TABS } from '../../types';
import { NAV_ITEMS } from '../../components/AppShell';
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

// Preset country list with flags
const COUNTRIES = [
 { code: 'AU', name: 'Australia', flag: '🇦🇺' },
 { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
 { code: 'US', name: 'United States', flag: '🇺🇸' },
 { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
 { code: 'ES', name: 'Spain', flag: '🇪🇸' },
 { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
 { code: 'DE', name: 'Germany', flag: '🇩🇪' },
 { code: 'FR', name: 'France', flag: '🇫🇷' },
 { code: 'CA', name: 'Canada', flag: '🇨🇦' },
 { code: 'JP', name: 'Japan', flag: '🇯🇵' },
 { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
 { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
 { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
 { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
 { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
];

// Timezone options
const TIMEZONES = [
 { value: 'UTC-08:00', label: 'Pacific Standard Time (PST) UTC-08:00' },
 { value: 'UTC-05:00', label: 'Eastern Standard Time (EST) UTC-05:00' },
 { value: 'UTC+00:00', label: 'Western European Time (WET / GMT) UTC+00:00' },
 { value: 'UTC+01:00', label: 'Central European Time (CET) UTC+01:00' },
 { value: 'UTC+02:00', label: 'Eastern European Time (EET) UTC+02:00' },
 { value: 'UTC+05:30', label: 'India Standard Time (IST) UTC+05:30' },
 { value: 'UTC+08:00', label: 'Singapore / China Time (CST) UTC+08:00' },
 { value: 'UTC+09:00', label: 'Japan Standard Time (JST) UTC+09:00' },
 { value: 'UTC+10:00', label: 'Australian Eastern Time (AEST) UTC+10:00' },
 { value: 'UTC+12:00', label: 'New Zealand Standard Time (NZST) UTC+12:00' },
];

type SettingsTabKey =
 | 'my-details'
 | 'profile'
 | 'appearance'
 | 'navigation'
 | 'notifications'
 | 'integrations'
 | 'data'
 | 'plan';

interface SettingsTabItem {
 key: SettingsTabKey;
 label: string;
 badge?: number | string;
}

const SETTINGS_TABS: SettingsTabItem[] = [
 { key: 'my-details', label: 'My details' },
 { key: 'profile', label: 'Profile' },
 { key: 'appearance', label: 'Appearance' },
 { key: 'navigation', label: 'Navigation' },
 { key: 'notifications', label: 'Notifications', badge: 2 },
 { key: 'integrations', label: 'Integrations' },
 { key: 'data', label: 'Data & Backups' },
 { key: 'plan', label: 'Plan & Usage' },
];

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop';

export function SettingsPage() {
 const { theme, setTheme } = useTheme();
 const [profile, setProfile] = useLocalStorage<UserProfile | null>(STORAGE_KEYS.PROFILE, null);
 const [visibleTabs, setVisibleTabs] = useLocalStorage<Record<string, boolean>>(
 STORAGE_KEYS.VISIBLE_TABS,
 DEFAULT_VISIBLE_TABS
 );

 const [activeTab, setActiveTab] = useState<SettingsTabKey>('my-details');
 const [searchQuery, setSearchQuery] = useState('');

 // Personal Info Form State
 const initialNames = (profile?.name || 'Olivia Rhye').split(' ');
 const [firstName, setFirstName] = useState(profile?.firstName || initialNames[0] || 'Olivia');
 const [lastName, setLastName] = useState(profile?.lastName || initialNames.slice(1).join(' ') || 'Rhye');
 const [email, setEmail] = useState(profile?.email || 'olivia@untitledui.com');
 const [avatarUrl, setAvatarUrl] = useState<string>(profile?.avatarUrl || DEFAULT_AVATAR);
 const [role, setRole] = useState(profile?.role || 'Product Designer');
 const [country, setCountry] = useState(profile?.country || 'Australia');
 const [timezone, setTimezone] = useState(profile?.timezone || 'UTC-08:00');
 const [bio, setBio] = useState(profile?.bio || 'Product Designer and maker building clean, human-centered digital experiences.');
 const [workStart, setWorkStart] = useState(profile?.workingHoursStart || '09:00');
 const [workEnd, setWorkEnd] = useState(profile?.workingHoursEnd || '17:00');
 const [primaryGoal, setPrimaryGoal] = useState(profile?.primaryGoal || 'Launch v1 Product');
 const [energyPattern, setEnergyPattern] = useState(profile?.energyPattern || 'morning');

 // Notifications State
 const [notifications, setNotifications] = useState<UserNotificationSettings>(
 profile?.notifications || {
 emailDigest: true,
 taskReminders: true,
 habitStreaks: true,
 weeklyReview: true,
 soundEffects: true,
 }
 );

 const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
 const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
 const [isDragging, setIsDragging] = useState(false);
 const avatarInputRef = useRef<HTMLInputElement>(null);
 const fileInputRef = useRef<HTMLInputElement>(null);

 const avatarInputId = useId();
 const importInputId = useId();

 const backups = getBackups();

 const refreshSyncStatus = () => {
 void getSyncStatus()
 .then(setSyncStatus)
 .catch(() => setSyncStatus(null));
 };

 useEffect(() => {
 refreshSyncStatus();
 }, []);

 const showMsg = (type: 'success' | 'error', text: string) => {
 setMessage({ type, text });
 setTimeout(() => setMessage(null), 3500);
 };

 const handleSaveAll = () => {
 const fullName = `${firstName} ${lastName}`.trim() || 'User';
 const updatedProfile: UserProfile = {
 name: fullName,
 firstName,
 lastName,
 email,
 avatarUrl,
 role,
 country,
 timezone,
 bio,
 notifications,
 primaryGoal,
 workingHoursStart: workStart,
 workingHoursEnd: workEnd,
 energyPattern,
 initialHabits: profile?.initialHabits || [],
 onboardingCompleted: profile?.onboardingCompleted ?? true,
 theme: profile?.theme || theme,
 createdAt: profile?.createdAt || new Date().toISOString(),
 };

 setProfile(updatedProfile);
 showMsg('success', 'Changes saved successfully');
 };

 const handleCancel = () => {
 const currentNames = (profile?.name || 'Olivia Rhye').split(' ');
 setFirstName(profile?.firstName || currentNames[0] || 'Olivia');
 setLastName(profile?.lastName || currentNames.slice(1).join(' ') || 'Rhye');
 setEmail(profile?.email || 'olivia@untitledui.com');
 setAvatarUrl(profile?.avatarUrl || DEFAULT_AVATAR);
 setRole(profile?.role || 'Product Designer');
 setCountry(profile?.country || 'Australia');
 setTimezone(profile?.timezone || 'UTC-08:00');
 setBio(profile?.bio || 'Product Designer and maker building clean, human-centered digital experiences.');
 setWorkStart(profile?.workingHoursStart || '09:00');
 setWorkEnd(profile?.workingHoursEnd || '17:00');
 setPrimaryGoal(profile?.primaryGoal || 'Launch v1 Product');
 setEnergyPattern(profile?.energyPattern || 'morning');
 showMsg('success', 'Changes reverted');
 };

 const handleAvatarFile = (file: File) => {
 if (!file.type.startsWith('image/')) {
 showMsg('error', 'Please upload a valid image file (PNG, JPG, SVG, WebP)');
 return;
 }
 if (file.size > 2 * 1024 * 1024) {
 showMsg('error', 'Image size should be less than 2MB');
 return;
 }
 const reader = new FileReader();
 reader.onload = e => {
 if (typeof e.target?.result === 'string') {
 setAvatarUrl(e.target.result);
 showMsg('success', 'Photo updated! Click save to keep changes.');
 }
 };
 reader.readAsDataURL(file);
 };

 const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
 e.preventDefault();
 setIsDragging(false);
 if (e.dataTransfer.files && e.dataTransfer.files[0]) {
 handleAvatarFile(e.dataTransfer.files[0]);
 }
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
 showMsg('success', 'Workspace data exported successfully');
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

 const formatTs = (value: string | null) => (value ? new Date(value).toLocaleString() : 'Never');

 const filteredTabs = SETTINGS_TABS.filter(t =>
 t.label.toLowerCase().includes(searchQuery.toLowerCase())
 );

 return (
 <div className="min-h-full text-text transition-colors duration-200">
 {/* Container matching Untitled UI Layout */}
 <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16">
 
 {/* Top Header: Title and Search Input with ⌘K */}
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-8 mb-2">
 <div>
 <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text font-display">
 Settings
 </h1>
 <p className="text-sm text-text-muted mt-1.5">
 Manage your team preferences, personal details, integrations and workspace data.
 </p>
 </div>

 {/* Search bar */}
 <div className="relative w-full sm:w-80">
 <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
 <input
 type="text"
 placeholder="Search settings..."
 value={searchQuery}
 onChange={e => setSearchQuery(e.target.value)}
 className="w-full h-11 pl-10 pr-12 rounded-xl bg-surface border border-border text-sm text-text placeholder:text-text-muted/70 focus:outline-none focus:border-pulse focus:ring-1 focus:ring-pulse/40 transition-all shadow-xs"
 />
 <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-3 py-1.5 text-[10px] font-mono text-text-muted border border-border bg-surface-2 rounded-md shadow-xs pointer-events-none">
 <span>⌘</span>
 <span>K</span>
 </div>
 </div>
 </div>

 {/* Global Toast Alert */}
 <AnimatePresence>
 {message && (
 <motion.div
 initial={{ opacity: 0, y: -10, scale: 0.98 }}
 animate={{ opacity: 1, y: 0, scale: 1 }}
 exit={{ opacity: 0, y: -10, scale: 0.98 }}
 className={`flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium border shadow-md ${
 message.type === 'success'
 ? 'bg-surface-2 text-success border-success/30'
 : 'bg-danger/10 text-danger border-danger/30'
 }`}
 >
 {message.type === 'success' ? (
 <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
 ) : (
 <AlertCircle className="w-4 h-4 flex-shrink-0" />
 )}
 <span>{message.text}</span>
 </motion.div>
 )}
 </AnimatePresence>

 {/* Horizontal Tab Navigation Bar */}
 <div className="border-b border-border">
 <div className="flex items-center gap-8 sm:gap-8 overflow-x-auto no-scrollbar">
 {(searchQuery ? filteredTabs : SETTINGS_TABS).map(tab => {
 const isActive = activeTab === tab.key;
 return (
 <button
 key={tab.key}
 onClick={() => setActiveTab(tab.key)}
 className={`relative flex items-center gap-4 py-4 text-sm font-medium whitespace-nowrap transition-all duration-200 group cursor-pointer border-b-2 -mb-px ${
 isActive
 ? 'text-text font-semibold border-pulse'
 : 'text-text-muted hover:text-text border-transparent hover:border-border'
 }`}
 >
 <span>{tab.label}</span>
 {tab.badge !== undefined && (
 <span
 className={`inline-flex items-center justify-center px-3 py-1.5 text-[11px] font-semibold rounded-full transition-colors ${
 isActive
 ? 'bg-surface-2 text-pulse'
 : 'bg-surface-3 text-text-muted group-hover:bg-surface-3/80 group-hover:text-text'
 }`}
 >
 {tab.badge}
 </span>
 )}
 </button>
 );
 })}
 </div>
 </div>

 {/* ──────────────────────────────────────────────────────────────────────── */}
 {/* TAB 1: MY DETAILS (Exact Untitled UI Layout from screenshot) */}
 {/* ──────────────────────────────────────────────────────────────────────── */}
 {activeTab === 'my-details' && (
 <div className="space-y-12 sm:space-y-16">
 {/* Subheader with Personal Info Title & Action Buttons */}
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-8 pb-8 border-b border-border">
 <div>
 <h2 className="text-lg font-semibold text-text">Personal info</h2>
 <p className="text-sm text-text-muted mt-0.5">
 Update your photo and personal details here.
 </p>
 </div>

 <div className="flex items-center gap-4 self-end sm:self-auto">
 <button
 type="button"
 onClick={handleCancel}
 className="px-4 py-2 text-sm font-medium text-text bg-surface border border-border rounded-xl hover:bg-surface-2 transition-all shadow-xs cursor-pointer active:scale-97"
 >
 Cancel
 </button>
 <button
 type="button"
 onClick={handleSaveAll}
 className="px-4 py-2 text-sm font-semibold text-white bg-pulse hover:bg-pulse/90 rounded-xl transition-all shadow-sm shadow-pulse/25 cursor-pointer active:scale-97 flex items-center gap-1.5"
 >
 <Check className="w-4 h-4" />
 Save
 </button>
 </div>
 </div>

 {/* Form Fields: Row by Row Form Layout */}
 <div className="divide-y divide-border">
 
 {/* Row 1: Name * (First name & Last name) */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8 py-10 sm:py-16">
 <div>
 <label htmlFor="first-name-input" className="block text-sm font-medium text-text">
 Name <span className="text-pulse">*</span>
 </label>
 </div>
 <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <input
 id="first-name-input"
 type="text"
 value={firstName}
 onChange={e => setFirstName(e.target.value)}
 placeholder="First name"
 className="w-full h-11 px-3.5 rounded-xl bg-surface border border-border text-sm text-text placeholder:text-text-muted/60 focus:outline-none focus:border-pulse focus:ring-1 focus:ring-pulse/30 transition-all shadow-xs"
 />
 </div>
 <div>
 <input
 id="last-name-input"
 aria-label="Last name"
 type="text"
 value={lastName}
 onChange={e => setLastName(e.target.value)}
 placeholder="Last name"
 className="w-full h-11 px-3.5 rounded-xl bg-surface border border-border text-sm text-text placeholder:text-text-muted/60 focus:outline-none focus:border-pulse focus:ring-1 focus:ring-pulse/30 transition-all shadow-xs"
 />
 </div>
 </div>
 </div>

 {/* Row 2: Email address * */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8 py-10 sm:py-16">
 <div>
 <label htmlFor="email-input" className="block text-sm font-medium text-text">
 Email address <span className="text-pulse">*</span>
 </label>
 </div>
 <div className="md:col-span-2">
 <div className="relative w-full max-w-xl">
 <Mail className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
 <input
 id="email-input"
 type="email"
 value={email}
 onChange={e => setEmail(e.target.value)}
 placeholder="you@untitledui.com"
 className="w-full h-11 pl-10 pr-4 rounded-xl bg-surface border border-border text-sm text-text placeholder:text-text-muted/60 focus:outline-none focus:border-pulse focus:ring-1 focus:ring-pulse/30 transition-all shadow-xs"
 />
 </div>
 </div>
 </div>

 {/* Row 3: Your photo * (Avatar + Drag and Drop Dropzone) */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8 py-10 sm:py-16">
 <div>
 <div className="flex items-center gap-1.5">
 <span className="text-sm font-medium text-text">
 Your photo <span className="text-pulse">*</span>
 </span>
 <button
 type="button"
 title="Profile picture used across Dayflow"
 className="text-text-muted hover:text-text cursor-help"
 >
 <Info className="w-3.5 h-3.5" />
 </button>
 </div>
 <p className="text-xs text-text-muted mt-0.5">
 This will be displayed on your profile.
 </p>
 </div>

 <div className="md:col-span-2 flex flex-col sm:flex-row items-start sm:items-center gap-5">
 {/* Circular Avatar Preview */}
 <div className="relative group flex-shrink-0">
 <img
 src={avatarUrl}
 alt={firstName}
 className="w-16 h-16 sm:w-18 sm:h-18 rounded-full object-cover border-2 border-border shadow-xs bg-surface-2"
 onError={() => setAvatarUrl(DEFAULT_AVATAR)}
 />
 <button
 type="button"
 onClick={() => setAvatarUrl(DEFAULT_AVATAR)}
 title="Reset to default photo"
 className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-surface-3 border border-border text-text-muted hover:text-danger flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-xs"
 >
 <X className="w-3 h-3" />
 </button>
 </div>

 {/* Drag and Drop Zone */}
 <div
 onDragOver={e => {
 e.preventDefault();
 setIsDragging(true);
 }}
 onDragLeave={() => setIsDragging(false)}
 onDrop={handleDrop}
 onClick={() => avatarInputRef.current?.click()}
 className={`flex-1 w-full max-w-xl border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
 isDragging
 ? 'border-pulse bg-surface-2 ring-2 ring-pulse/20'
 : 'border-border/80 hover:border-pulse/60 bg-surface hover:bg-surface'
 }`}
 >
 <div className="w-10 h-10 rounded-xl bg-surface-2 border border-border/80 flex items-center justify-center text-text-muted mb-2.5 shadow-xs">
 <UploadCloud className="w-5 h-5 text-pulse" />
 </div>

 <p className="text-xs sm:text-sm text-text-secondary">
 <span className="font-semibold text-pulse hover:underline">
 Click to upload
 </span>{' '}
 or drag and drop
 </p>
 <p className="text-[11px] text-text-muted mt-1">
 SVG, PNG, JPG or GIF (max. 800×400px)
 </p>

 <input
 id={avatarInputId}
 ref={avatarInputRef}
 type="file"
 accept="image/*"
 className="hidden"
 onChange={e => {
 if (e.target.files?.[0]) handleAvatarFile(e.target.files[0]);
 }}
 />
 </div>
 </div>
 </div>

 {/* Row 4: Role */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8 py-10 sm:py-16">
 <div>
 <label htmlFor="role-input" className="block text-sm font-medium text-text">
 Role
 </label>
 </div>
 <div className="md:col-span-2">
 <input
 id="role-input"
 type="text"
 value={role}
 onChange={e => setRole(e.target.value)}
 placeholder="Product Designer / Software Engineer"
 className="w-full max-w-xl h-11 px-3.5 rounded-xl bg-surface border border-border text-sm text-text placeholder:text-text-muted/60 focus:outline-none focus:border-pulse focus:ring-1 focus:ring-pulse/30 transition-all shadow-xs"
 />
 </div>
 </div>

 {/* Row 5: Country */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8 py-10 sm:py-16">
 <div>
 <label htmlFor="country-select" className="block text-sm font-medium text-text">
 Country
 </label>
 </div>
 <div className="md:col-span-2">
 <div className="relative w-full max-w-xl">
 <select
 id="country-select"
 value={country}
 onChange={e => setCountry(e.target.value)}
 className="w-full h-11 px-3.5 pr-10 rounded-xl bg-surface border border-border text-sm text-text focus:outline-none focus:border-pulse focus:ring-1 focus:ring-pulse/30 transition-all shadow-xs cursor-pointer appearance-none"
 >
 {COUNTRIES.map(c => (
 <option key={c.code} value={c.name} className="bg-surface-2 text-text">
 {c.flag} {c.name}
 </option>
 ))}
 </select>
 <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
 ▼
 </div>
 </div>
 </div>
 </div>

 {/* Row 6: Timezone */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8 py-10 sm:py-16">
 <div>
 <div className="flex items-center gap-1.5">
 <label htmlFor="timezone-select" className="text-sm font-medium text-text">
 Timezone
 </label>
 <button
 type="button"
 title="Used to calculate calendar sync and review daily timing"
 className="text-text-muted hover:text-text cursor-help"
 >
 <Info className="w-3.5 h-3.5" />
 </button>
 </div>
 </div>
 <div className="md:col-span-2">
 <div className="relative w-full max-w-xl">
 <Clock className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
 <select
 id="timezone-select"
 value={timezone}
 onChange={e => setTimezone(e.target.value)}
 className="w-full h-11 pl-10 pr-10 rounded-xl bg-surface border border-border text-sm text-text focus:outline-none focus:border-pulse focus:ring-1 focus:ring-pulse/30 transition-all shadow-xs cursor-pointer appearance-none"
 >
 {TIMEZONES.map(tz => (
 <option key={tz.value} value={tz.value} className="bg-surface-2 text-text">
 {tz.label}
 </option>
 ))}
 </select>
 <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
 ▼
 </div>
 </div>
 </div>
 </div>

 {/* Row 7: Working Hours */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8 py-10 sm:py-16">
 <div>
 <label htmlFor="work-start-input" className="block text-sm font-medium text-text">
 Working hours
 </label>
 <p className="text-xs text-text-muted mt-0.5">
 Set your daily focus and availability window.
 </p>
 </div>
 <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
 <div>
 <span className="text-xs text-text-muted block mb-1">Start Time</span>
 <input
 id="work-start-input"
 type="time"
 value={workStart}
 onChange={e => setWorkStart(e.target.value)}
 className="w-full h-11 px-3.5 rounded-xl bg-surface border border-border text-sm text-text focus:outline-none focus:border-pulse focus:ring-1 focus:ring-pulse/30 transition-all shadow-xs"
 />
 </div>
 <div>
 <span className="text-xs text-text-muted block mb-1">End Time</span>
 <input
 id="work-end-input"
 aria-label="End Time"
 type="time"
 value={workEnd}
 onChange={e => setWorkEnd(e.target.value)}
 className="w-full h-11 px-3.5 rounded-xl bg-surface border border-border text-sm text-text focus:outline-none focus:border-pulse focus:ring-1 focus:ring-pulse/30 transition-all shadow-xs"
 />
 </div>
 </div>
 </div>

 {/* Row 8: Bio */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8 py-10 sm:py-16">
 <div>
 <label htmlFor="bio-input" className="block text-sm font-medium text-text">
 Bio
 </label>
 <p className="text-xs text-text-muted mt-0.5">
 Write a short introduction for yourself.
 </p>
 </div>
 <div className="md:col-span-2">
 <textarea
 id="bio-input"
 rows={3}
 value={bio}
 onChange={e => setBio(e.target.value)}
 placeholder="Tell us a little bit about yourself..."
 className="w-full max-w-xl p-4.5 rounded-xl bg-surface border border-border text-sm text-text placeholder:text-text-muted/60 focus:outline-none focus:border-pulse focus:ring-1 focus:ring-pulse/30 transition-all shadow-xs resize-y"
 />
 <p className="text-[11px] text-text-muted mt-1.5">
 {bio.length} characters • Shown on your profile and journal exports.
 </p>
 </div>
 </div>

 </div>

 {/* Bottom Sticky-ready Action Footer */}
 <div className="flex items-center justify-end gap-4 pt-8 mt-2 border-t border-border">
 <button
 type="button"
 onClick={handleCancel}
 className="px-4 py-2 text-sm font-medium text-text bg-surface border border-border rounded-xl hover:bg-surface-2 transition-all shadow-xs cursor-pointer active:scale-97"
 >
 Cancel
 </button>
 <button
 type="button"
 onClick={handleSaveAll}
 className="px-4 py-2 text-sm font-semibold text-white bg-pulse hover:bg-pulse/90 rounded-xl transition-all shadow-sm shadow-pulse/25 cursor-pointer active:scale-97 flex items-center gap-1.5"
 >
 <Check className="w-4 h-4" />
 Save changes
 </button>
 </div>
 </div>
 )}

 {/* ──────────────────────────────────────────────────────────────────────── */}
 {/* TAB 2: PROFILE & PREFERENCES */}
 {/* ──────────────────────────────────────────────────────────────────────── */}
 {activeTab === 'profile' && (
 <div className="space-y-12 sm:space-y-16">
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-8 pb-8 border-b border-border">
 <div>
 <h2 className="text-lg font-semibold text-text">Profile & Goals</h2>
 <p className="text-sm text-text-muted mt-0.5">
 Customize your focus rhythm and personal onboarding configuration.
 </p>
 </div>
 <button
 type="button"
 onClick={handleSaveAll}
 className="px-4 py-2 text-sm font-semibold text-white bg-pulse hover:bg-pulse/90 rounded-xl transition-all shadow-sm shadow-pulse/25 self-end sm:self-auto cursor-pointer"
 >
 Save changes
 </button>
 </div>

 <div className="divide-y divide-border">
 {/* Primary Goal */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8 py-10 sm:py-16">
 <div>
 <label htmlFor="primary-goal-input" className="block text-sm font-medium text-text">
 Primary Goal
 </label>
 <p className="text-xs text-text-muted mt-0.5">
 Your current main quarterly focus.
 </p>
 </div>
 <div className="md:col-span-2">
 <input
 id="primary-goal-input"
 type="text"
 value={primaryGoal}
 onChange={e => setPrimaryGoal(e.target.value)}
 placeholder="e.g. Master React 19 & Ship DayFlow"
 className="w-full max-w-xl h-11 px-3.5 rounded-xl bg-surface border border-border text-sm text-text focus:outline-none focus:border-pulse focus:ring-1 focus:ring-pulse/30 transition-all shadow-xs"
 />
 </div>
 </div>

 {/* Energy Pattern */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8 py-10 sm:py-16">
 <div>
 <span className="block text-sm font-medium text-text">
 Peak Energy Pattern
 </span>
 <p className="text-xs text-text-muted mt-0.5">
 Used by the smart planner to suggest optimal focus blocks.
 </p>
 </div>
 <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
 {[
 { id: 'morning', label: 'Morning Lark 🌅', desc: 'Highest focus 08:00 - 12:00' },
 { id: 'afternoon', label: 'Afternoon Peak ☀️', desc: 'Highest focus 13:00 - 17:00' },
 { id: 'evening', label: 'Evening Surge 🌆', desc: 'Highest focus 17:00 - 21:00' },
 { id: 'night', label: 'Night Owl 🦉', desc: 'Highest focus 21:00 - 01:00' },
 ].map(pattern => (
 <button
 key={pattern.id}
 type="button"
 onClick={() => setEnergyPattern(pattern.id as any)}
 className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
 energyPattern === pattern.id
 ? 'border-pulse bg-surface-2 text-text ring-1 ring-pulse'
 : 'border-border bg-surface hover:bg-surface-2 text-text-muted'
 }`}
 >
 <div className="text-sm font-medium text-text">{pattern.label}</div>
 <div className="text-xs text-text-muted mt-1">{pattern.desc}</div>
 </button>
 ))}
 </div>
 </div>

 {/* Restart Onboarding Wizard */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8 py-10 sm:py-16">
 <div>
 <span className="block text-sm font-medium text-text">
 Onboarding Wizard
 </span>
 <p className="text-xs text-text-muted mt-0.5">
 Revisit the setup tutorial and goal setting steps.
 </p>
 </div>
 <div className="md:col-span-2">
 <button
 type="button"
 onClick={handleRestartOnboarding}
 className="flex items-center gap-4 px-4 py-2.5 bg-surface border border-border hover:bg-surface-2 rounded-xl text-sm font-medium text-text transition-all shadow-xs cursor-pointer"
 >
 <RotateCcw className="w-4 h-4 text-pulse" />
 Restart Initial Onboarding Flow
 </button>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* ──────────────────────────────────────────────────────────────────────── */}
 {/* TAB 3: APPEARANCE (Untitled UI Theme Cards) */}
 {/* ──────────────────────────────────────────────────────────────────────── */}
 {activeTab === 'appearance' && (
 <div className="space-y-12 sm:space-y-16">
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-8 pb-8 border-b border-border">
 <div>
 <h2 className="text-lg font-semibold text-text">Appearance Theme</h2>
 <p className="text-sm text-text-muted mt-0.5">
 Customize how Dayflow looks on your device.
 </p>
 </div>
 </div>

 {/* Theme Selector Cards */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl">
 {[
 {
 id: 'dark',
 label: 'Dark mode',
 desc: 'Midnight Circuit theme with deep contrast',
 icon: Moon,
 previewBg: 'bg-[#0F0F18]',
 previewBorder: 'border-[#1E1E3A]',
 previewPill: 'bg-[#A855F7]',
 },
 {
 id: 'light',
 label: 'Light mode',
 desc: 'Clean, crisp high-legibility interface',
 icon: Sun,
 previewBg: 'bg-[#FFFFFF]',
 previewBorder: 'border-[#E2E8F0]',
 previewPill: 'bg-[#7C3AED]',
 },
 {
 id: 'system',
 label: 'System Sync',
 desc: 'Adapts automatically with OS settings',
 icon: Monitor,
 previewBg: 'bg-gradient-to-r from-[#FFFFFF] to-[#0F0F18]',
 previewBorder: 'border-[#2A2A50]',
 previewPill: 'bg-[#00E5FF]',
 },
 ].map(opt => {
 const Icon = opt.icon;
 const isSelected = theme === opt.id;
 return (
 <div
 key={opt.id}
 onClick={() => {
 setTheme(opt.id as ThemeMode);
 if (profile) setProfile({ ...profile, theme: opt.id as ThemeMode });
 showMsg('success', `Theme switched to ${opt.label}`);
 }}
 className={`rounded-2xl border p-4 cursor-pointer transition-all duration-200 flex flex-col justify-between ${
 isSelected
 ? 'border-pulse bg-pulse/5 ring-2 ring-pulse/40 shadow-sm'
 : 'border-border bg-surface hover:border-border-2 hover:bg-surface-2'
 }`}
 >
 {/* Visual UI Miniature Preview Card */}
 <div
 className={`h-24 rounded-xl border p-3.5 mb-4 flex flex-col justify-between overflow-hidden ${opt.previewBg} ${opt.previewBorder}`}
 >
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-1.5">
 <div className="w-2.5 h-2.5 rounded-full bg-danger/80" />
 <div className="w-2.5 h-2.5 rounded-full bg-warning/80" />
 <div className="w-2.5 h-2.5 rounded-full bg-success/80" />
 </div>
 <div className={`w-8 h-2 rounded-full ${opt.previewPill} opacity-60`} />
 </div>
 <div className="space-y-1.5">
 <div className="w-3/4 h-2 rounded-full bg-text-muted/20" />
 <div className="w-1/2 h-2 rounded-full bg-text-muted/15" />
 </div>
 </div>

 <div className="flex items-center justify-between mt-1">
 <div className="flex items-center gap-4">
 <Icon className={`w-4 h-4 ${isSelected ? 'text-pulse' : 'text-text-muted'}`} />
 <span className="text-sm font-semibold text-text">{opt.label}</span>
 </div>
 <div
 className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
 isSelected
 ? 'border-pulse bg-pulse text-white'
 : 'border-border bg-transparent'
 }`}
 >
 {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
 </div>
 </div>
 <p className="text-xs text-text-muted mt-1">{opt.desc}</p>
 </div>
 );
 })}
 </div>
 </div>
 )}

 {/* ──────────────────────────────────────────────────────────────────────── */}
 {/* TAB 4: NAVIGATION MODULES */}
 {/* ──────────────────────────────────────────────────────────────────────── */}
 {activeTab === 'navigation' && (
 <div className="space-y-12 sm:space-y-16">
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-8 pb-8 border-b border-border">
 <div>
 <h2 className="text-lg font-semibold text-text">Navigation Modules</h2>
 <p className="text-sm text-text-muted mt-0.5">
 Toggle which tabs and tools are displayed in your sidebar navigation.
 </p>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 max-w-4xl">
 {NAV_ITEMS.map(item => {
 const Icon = item.icon;
 const isEnabled = visibleTabs[item.key] !== false;
 const isSettings = item.key === 'settings';

 return (
 <div
 key={item.key}
 className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
 isSettings
 ? 'border-border/60 bg-surface opacity-70'
 : 'border-border bg-surface hover:border-border-2 hover:bg-surface-2'
 }`}
 >
 <div className="flex items-center gap-4.5">
 <div className="w-9 h-9 rounded-xl bg-surface-2 border border-border flex items-center justify-center text-text shadow-xs">
 <Icon className="w-4 h-4 text-pulse" />
 </div>
 <div>
 <div className="text-sm font-medium text-text">{item.label}</div>
 <div className="text-xs text-text-muted font-mono">{item.path}</div>
 </div>
 </div>

 {/* Untitled UI Toggle Switch */}
 <button
 type="button"
 role="switch"
 aria-checked={isEnabled}
 disabled={isSettings}
 onClick={() => {
 if (isSettings) return;
 setVisibleTabs(prev => ({
 ...DEFAULT_VISIBLE_TABS,
 ...prev,
 [item.key]: !isEnabled,
 }));
 }}
 className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:cursor-not-allowed ${
 isEnabled ? 'bg-pulse' : 'bg-surface-3'
 }`}
 >
 <span
 className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
 isEnabled ? 'translate-x-5' : 'translate-x-0'
 }`}
 />
 </button>
 </div>
 );
 })}
 </div>
 </div>
 )}

 {/* ──────────────────────────────────────────────────────────────────────── */}
 {/* TAB 5: NOTIFICATIONS */}
 {/* ──────────────────────────────────────────────────────────────────────── */}
 {activeTab === 'notifications' && (
 <div className="space-y-12 sm:space-y-16">
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-8 pb-8 border-b border-border">
 <div>
 <h2 className="text-lg font-semibold text-text">Notification Preferences</h2>
 <p className="text-sm text-text-muted mt-0.5">
 Choose what alerts, digests and audio cues you want to receive.
 </p>
 </div>
 <button
 type="button"
 onClick={handleSaveAll}
 className="px-4 py-2 text-sm font-semibold text-white bg-pulse hover:bg-pulse/90 rounded-xl transition-all shadow-sm shadow-pulse/25 self-end sm:self-auto cursor-pointer"
 >
 Save preferences
 </button>
 </div>

 <div className="max-w-3xl divide-y divide-border">
 {[
 {
 key: 'taskReminders',
 title: 'Task due date reminders',
 desc: 'Get notified 30 minutes before high priority tasks are due.',
 },
 {
 key: 'habitStreaks',
 title: 'Daily habit streak alerts',
 desc: 'Receive evening prompts if your active daily habits are pending.',
 },
 {
 key: 'weeklyReview',
 title: 'Weekly review & retrospective prompt',
 desc: 'Remind you every Sunday evening to reflect and plan the upcoming week.',
 },
 {
 key: 'emailDigest',
 title: 'Daily productivity recap digest',
 desc: 'Summarize completed focus sessions and momentum orb score.',
 },
 {
 key: 'soundEffects',
 title: 'Audio feedback & completion chime',
 desc: 'Play subtle sound cues when checking off tasks and finishing pomodoro rounds.',
 },
 ].map(item => {
 const isChecked = Boolean(
 notifications[item.key as keyof UserNotificationSettings]
 );
 return (
 <div
 key={item.key}
 className="flex items-center justify-between py-5"
 >
 <div>
 <div className="text-sm font-medium text-text">{item.title}</div>
 <div className="text-xs text-text-muted mt-0.5">{item.desc}</div>
 </div>

 <button
 type="button"
 role="switch"
 aria-checked={isChecked}
 onClick={() => {
 setNotifications(prev => ({
 ...prev,
 [item.key]: !isChecked,
 }));
 }}
 className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
 isChecked ? 'bg-pulse' : 'bg-surface-3'
 }`}
 >
 <span
 className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
 isChecked ? 'translate-x-5' : 'translate-x-0'
 }`}
 />
 </button>
 </div>
 );
 })}
 </div>
 </div>
 )}

 {/* ──────────────────────────────────────────────────────────────────────── */}
 {/* TAB 6: INTEGRATIONS */}
 {/* ──────────────────────────────────────────────────────────────────────── */}
 {activeTab === 'integrations' && (
 <div className="space-y-12 sm:space-y-16">
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-8 pb-8 border-b border-border">
 <div>
 <h2 className="text-lg font-semibold text-text">Integrations & Sync</h2>
 <p className="text-sm text-text-muted mt-0.5">
 Connect external calendars and task backends directly to Dayflow.
 </p>
 </div>
 <button
 type="button"
 onClick={refreshSyncStatus}
 className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-text bg-surface border border-border hover:bg-surface-2 rounded-xl transition-all shadow-xs"
 >
 <RefreshCw className="w-3.5 h-3.5" />
 Refresh Status
 </button>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-8 max-w-4xl">
 {/* Google Calendar Card */}
 <div className="p-6 rounded-2xl border border-border bg-surface flex flex-col justify-between shadow-xs">
 <div>
 <div className="flex items-center justify-between mb-4">
 <div className="w-10 h-10 rounded-xl bg-surface-2 border border-glow/20 flex items-center justify-center text-glow">
 <Calendar className="w-5 h-5" />
 </div>
 <span
 className={`text-xs font-mono font-medium px-3 py-1.5 rounded-full border ${
 syncStatus?.google.connected
 ? 'text-success bg-surface-2 border-success/30'
 : 'text-text-muted bg-surface-2 border-border'
 }`}
 >
 {syncStatus?.google.connected ? 'Connected' : 'Not Connected'}
 </span>
 </div>

 <h3 className="text-base font-semibold text-text">Google Calendar</h3>
 <p className="text-xs text-text-muted mt-1 leading-relaxed">
 Automatically sync scheduled events into your Dayflow planner blocks.
 </p>
 </div>

 <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
 <button
 type="button"
 onClick={connectGoogle}
 className="px-3.5 py-2 text-xs font-semibold text-glow bg-surface-2 hover:bg-glow/20 border border-glow/30 rounded-xl transition-all shadow-xs cursor-pointer"
 >
 {syncStatus?.google.connected ? 'Reconnect' : 'Connect Calendar'}
 </button>
 <button
 type="button"
 onClick={handleImportGoogle}
 className="text-xs font-medium text-text-muted hover:text-text cursor-pointer"
 >
 Pull Events Now
 </button>
 </div>
 </div>

 {/* Notion Tasks Card */}
 <div className="p-6 rounded-2xl border border-border bg-surface flex flex-col justify-between shadow-xs">
 <div>
 <div className="flex items-center justify-between mb-4">
 <div className="w-10 h-10 rounded-xl bg-surface-2 border border-pulse/20 flex items-center justify-center text-pulse">
 <Compass className="w-5 h-5" />
 </div>
 <span
 className={`text-xs font-mono font-medium px-3 py-1.5 rounded-full border ${
 syncStatus?.notion.configured
 ? 'text-success bg-surface-2 border-success/30'
 : 'text-text-muted bg-surface-2 border-border'
 }`}
 >
 {syncStatus?.notion.configured ? 'Connected' : 'Ready to Sync'}
 </span>
 </div>

 <h3 className="text-base font-semibold text-text">Notion Database</h3>
 <p className="text-xs text-text-muted mt-1 leading-relaxed">
 Import and sync your Notion action items into Dayflow tasks.
 </p>
 </div>

 <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
 <button
 type="button"
 onClick={handleImportNotion}
 className="px-3.5 py-2 text-xs font-semibold text-pulse bg-surface-2 hover:bg-pulse/20 border border-pulse/30 rounded-xl transition-all shadow-xs cursor-pointer"
 >
 Pull Notion Tasks
 </button>
 <span className="text-[11px] font-mono text-text-muted">
 Sync: {formatTs(syncStatus?.sync.notion.lastSuccessAt || null)}
 </span>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* ──────────────────────────────────────────────────────────────────────── */}
 {/* TAB 7: DATA & BACKUPS */}
 {/* ──────────────────────────────────────────────────────────────────────── */}
 {activeTab === 'data' && (
 <div className="space-y-12 sm:space-y-16">
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-8 pb-8 border-b border-border">
 <div>
 <h2 className="text-lg font-semibold text-text">Data & Backups</h2>
 <p className="text-sm text-text-muted mt-0.5">
 Export, import, manage snapshot backups, or reset your workspace.
 </p>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-8 max-w-4xl">
 {/* Export Card */}
 <div className="p-6 rounded-2xl border border-border bg-surface flex flex-col justify-between shadow-xs">
 <div>
 <div className="w-10 h-10 rounded-xl bg-surface-2 border border-glow/20 flex items-center justify-center text-glow mb-3">
 <Download className="w-5 h-5" />
 </div>
 <h3 className="text-base font-semibold text-text">Export Workspace</h3>
 <p className="text-xs text-text-muted mt-1">
 Download a full JSON archive containing all tasks, habits, goals, journal entries and focus sessions.
 </p>
 </div>
 <button
 type="button"
 onClick={handleExport}
 className="mt-5 w-full py-2.5 px-4 text-xs font-semibold text-glow bg-surface-2 hover:bg-glow/20 border border-glow/30 rounded-xl transition-all shadow-xs cursor-pointer"
 >
 Download JSON Backup
 </button>
 </div>

 {/* Import Card */}
 <div className="p-6 rounded-2xl border border-border bg-surface flex flex-col justify-between shadow-xs">
 <div>
 <div className="w-10 h-10 rounded-xl bg-surface-2 border border-pulse/20 flex items-center justify-center text-pulse mb-3">
 <Upload className="w-5 h-5" />
 </div>
 <h3 className="text-base font-semibold text-text">Import Workspace</h3>
 <p className="text-xs text-text-muted mt-1">
 Upload a previously exported JSON backup file to restore all settings and workspace state.
 </p>
 </div>
 <button
 type="button"
 onClick={() => fileInputRef.current?.click()}
 className="mt-5 w-full py-2.5 px-4 text-xs font-semibold text-pulse bg-surface-2 hover:bg-pulse/20 border border-pulse/30 rounded-xl transition-all shadow-xs cursor-pointer"
 >
 Select File to Import
 </button>
 <input
 id={importInputId}
 ref={fileInputRef}
 type="file"
 accept=".json"
 className="hidden"
 onChange={handleImport}
 />
 </div>

 {/* Create Snapshot Backup */}
 <div className="p-6 rounded-2xl border border-border bg-surface flex flex-col justify-between shadow-xs">
 <div>
 <div className="w-10 h-10 rounded-xl bg-surface-2 border border-ember/20 flex items-center justify-center text-ember mb-3">
 <Database className="w-5 h-5" />
 </div>
 <h3 className="text-base font-semibold text-text">Create Instant Snapshot</h3>
 <p className="text-xs text-text-muted mt-1">
 Save a point-in-time snapshot to local storage with one click for easy rollback.
 </p>
 </div>
 <button
 type="button"
 onClick={handleBackup}
 className="mt-5 w-full py-2.5 px-4 text-xs font-semibold text-ember bg-surface-2 hover:bg-ember/20 border border-ember/30 rounded-xl transition-all shadow-xs cursor-pointer"
 >
 Save Snapshot Now
 </button>
 </div>

 {/* Danger Zone: Reset Workspace */}
 <div className="p-6 rounded-2xl border border-danger/30 bg-danger/5 flex flex-col justify-between shadow-xs">
 <div>
 <div className="w-10 h-10 rounded-xl bg-surface-2 border border-danger/20 flex items-center justify-center text-danger mb-3">
 <Trash2 className="w-5 h-5" />
 </div>
 <h3 className="text-base font-semibold text-danger">Reset Workspace</h3>
 <p className="text-xs text-text-muted mt-1">
 Permanently delete all workspace data and restore fresh seed templates.
 </p>
 </div>
 <button
 type="button"
 onClick={handleReset}
 className="mt-5 w-full py-2.5 px-4 text-xs font-semibold text-danger bg-danger/10 hover:bg-danger/20 border border-danger/30 rounded-xl transition-all shadow-xs cursor-pointer"
 >
 Clear All Data
 </button>
 </div>
 </div>

 {/* Backups List */}
 {backups.length > 0 && (
 <div className="mt-8 pt-6 border-t border-border max-w-4xl">
 <h3 className="text-sm font-semibold text-text uppercase tracking-wider font-mono mb-4">
 Stored Snapshots ({backups.length})
 </h3>
 <div className="space-y-4">
 {backups.map(b => (
 <div
 key={b.id}
 className="flex items-center justify-between p-4.5 px-4 rounded-xl bg-surface border border-border shadow-xs"
 >
 <div>
 <div className="text-xs font-mono font-medium text-text">
 {new Date(b.timestamp).toLocaleString()}
 </div>
 <div className="text-[11px] font-mono text-text-muted">
 {(b.size / 1024).toFixed(1)} KB • Snapshot #{b.id.slice(0, 8)}
 </div>
 </div>
 <button
 type="button"
 onClick={() => handleRestore(b.id)}
 className="px-3 py-1.5 text-xs font-semibold font-mono text-glow bg-surface-2 hover:bg-glow/20 border border-glow/30 rounded-lg transition-colors cursor-pointer"
 >
 Restore
 </button>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 )}

 {/* ──────────────────────────────────────────────────────────────────────── */}
 {/* TAB 8: PLAN & USAGE (Matches Untitled UI 80% Space Widget in image) */}
 {/* ──────────────────────────────────────────────────────────────────────── */}
 {activeTab === 'plan' && (
 <div className="space-y-12 sm:space-y-16">
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-8 pb-8 border-b border-border">
 <div>
 <h2 className="text-lg font-semibold text-text">Plan & Storage Usage</h2>
 <p className="text-sm text-text-muted mt-0.5">
 Monitor your local storage quota, active modules and account plan.
 </p>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl">
 {/* Untitled UI Circular Gauge Card */}
 <div className="p-6 rounded-2xl border border-border bg-surface shadow-xs flex flex-col items-center text-center justify-between">
 <div className="w-full flex justify-between items-center text-xs text-text-muted font-medium mb-2">
 <span>Storage Allocation</span>
 <span className="text-pulse font-semibold">Pro Plan</span>
 </div>

 {/* Circular Progress Gauge */}
 <div className="relative w-28 h-28 my-4 flex items-center justify-center">
 <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
 <circle
 cx="50"
 cy="50"
 r="40"
 className="stroke-surface-2"
 strokeWidth="10"
 fill="transparent"
 />
 <circle
 cx="50"
 cy="50"
 r="40"
 className="stroke-pulse"
 strokeWidth="10"
 strokeDasharray="251.2"
 strokeDashoffset="50.24" // 80% used
 strokeLinecap="round"
 fill="transparent"
 />
 </svg>
 <div className="absolute inset-0 flex flex-col items-center justify-center">
 <span className="text-2xl font-bold font-display text-text">80%</span>
 <span className="text-[10px] text-text-muted font-mono">Used</span>
 </div>
 </div>

 <div className="space-y-1">
 <h4 className="text-sm font-semibold text-text">Local Storage Space</h4>
 <p className="text-xs text-text-muted">
 Your workspace has used 80% of local browser quota.
 </p>
 </div>
 </div>

 {/* Usage Breakdown */}
 <div className="md:col-span-2 p-6 rounded-2xl border border-border bg-surface shadow-xs space-y-4">
 <h3 className="text-base font-semibold text-text">Workspace Capacity</h3>

 <div className="space-y-4">
 <div>
 <div className="flex justify-between text-xs font-medium mb-1">
 <span className="text-text">Tasks & Goals State</span>
 <span className="text-text-muted font-mono">420 KB</span>
 </div>
 <div className="w-full h-2 rounded-full bg-surface-2 overflow-hidden">
 <div className="h-full bg-glow rounded-full" style={{ width: '35%' }} />
 </div>
 </div>

 <div>
 <div className="flex justify-between text-xs font-medium mb-1">
 <span className="text-text">Journal & Reflection Logs</span>
 <span className="text-text-muted font-mono">280 KB</span>
 </div>
 <div className="w-full h-2 rounded-full bg-surface-2 overflow-hidden">
 <div className="h-full bg-pulse rounded-full" style={{ width: '25%' }} />
 </div>
 </div>

 <div>
 <div className="flex justify-between text-xs font-medium mb-1">
 <span className="text-text">Snapshot Backups</span>
 <span className="text-text-muted font-mono">1.2 MB</span>
 </div>
 <div className="w-full h-2 rounded-full bg-surface-2 overflow-hidden">
 <div className="h-full bg-ember rounded-full" style={{ width: '60%' }} />
 </div>
 </div>
 </div>

 <div className="pt-4 border-t border-border flex items-center justify-between text-xs text-text-muted">
 <span>Version: Dayflow v1.2.0</span>
 <span className="font-mono text-success">Client-side Encrypted</span>
 </div>
 </div>
 </div>
 </div>
 )}

 </div>
 </div>
 );
}
