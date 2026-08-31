import { Routes, Route, Navigate } from 'react-router-dom';
import { useTheme } from './hooks/useTheme';
import { useLocalStorage } from './hooks/useLocalStorage';
import { AppShell } from './components/AppShell';
import { CommandPalette } from './components/CommandPalette';
import { QuickCapture } from './components/QuickCapture';
import { useKeyboardShortcut } from './hooks/useKeyboardShortcut';
import { useState } from 'react';

// Feature pages
import { DashboardPage } from './features/dashboard/DashboardPage';
import { TasksPage } from './features/tasks/TasksPage';
import { HabitsPage } from './features/habits/HabitsPage';
import { GoalsPage } from './features/goals/GoalsPage';
import { PlannerPage } from './features/planner/PlannerPage';
import { FocusPage } from './features/focus/FocusPage';
import { JournalPage } from './features/journal/JournalPage';
import { AnalyticsPage } from './features/analytics/AnalyticsPage';
import { InsightsPage } from './features/insights/InsightsPage';
import { WellbeingPage } from './features/wellbeing/WellbeingPage';
import { GamificationPage } from './features/gamification/GamificationPage';
import { ReviewPage } from './features/review/ReviewPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { OnboardingPage } from './features/onboarding/OnboardingPage';
import { GarminPage } from './features/garmin/GarminPage';
import { GarminSubPage } from './features/garmin/GarminSubPage';
import { useAutoSync } from './hooks/useAutoSync';
import type { UserProfile } from './types';
import { STORAGE_KEYS } from './types';

export default function App() {
  useTheme();
  useAutoSync();
  const [profile] = useLocalStorage<UserProfile | null>(STORAGE_KEYS.PROFILE, null);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);

  useKeyboardShortcut('ctrl+k', () => setCmdOpen(true));
  useKeyboardShortcut('ctrl+shift+n', () => setQuickCaptureOpen(true));

  // Show onboarding if no profile
  if (!profile || !profile.onboardingCompleted) {
    return <OnboardingPage />;
  }

  return (
    <>
      <AppShell>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/habits" element={<HabitsPage />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/planner" element={<PlannerPage />} />
          <Route path="/focus" element={<FocusPage />} />
          <Route path="/journal" element={<JournalPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/insights" element={<InsightsPage />} />
          <Route path="/wellbeing" element={<WellbeingPage />} />
          <Route path="/gamification" element={<GamificationPage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/garmin" element={<GarminPage />} />
          <Route path="/garmin/:type" element={<GarminSubPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>

      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
      <QuickCapture open={quickCaptureOpen} onClose={() => setQuickCaptureOpen(false)} />
    </>
  );
}
