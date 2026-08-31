import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, CheckSquare, Repeat, Target, Calendar,
  Timer, BookOpen, BarChart3, Lightbulb, Heart, Trophy,
  ClipboardList, Settings, Menu, X, Zap, Activity
} from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { STORAGE_KEYS, DEFAULT_VISIBLE_TABS } from '../types';

export const NAV_ITEMS = [
  { key: 'dashboard', path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { key: 'tasks', path: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { key: 'habits', path: '/habits', icon: Repeat, label: 'Habits' },
  { key: 'goals', path: '/goals', icon: Target, label: 'Goals' },
  { key: 'planner', path: '/planner', icon: Calendar, label: 'Planner' },
  { key: 'focus', path: '/focus', icon: Timer, label: 'Focus' },
  { key: 'journal', path: '/journal', icon: BookOpen, label: 'Journal' },
  { key: 'analytics', path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { key: 'insights', path: '/insights', icon: Lightbulb, label: 'Insights' },
  { key: 'wellbeing', path: '/wellbeing', icon: Heart, label: 'Wellbeing' },
  { key: 'gamification', path: '/gamification', icon: Trophy, label: 'Profile' },
  { key: 'review', path: '/review', icon: ClipboardList, label: 'Review' },
  { key: 'garmin', path: '/garmin', icon: Activity, label: 'Garmin' },
  { key: 'settings', path: '/settings', icon: Settings, label: 'Settings' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [visibleTabs] = useLocalStorage<Record<string, boolean>>(STORAGE_KEYS.VISIBLE_TABS, DEFAULT_VISIBLE_TABS);
  const location = useLocation();

  const activeNavItems = NAV_ITEMS.filter(item => visibleTabs[item.key] !== false);

  return (
    <div className="flex h-screen overflow-hidden bg-void">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-[240px] bg-void
        flex flex-col transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="h-20 flex items-center px-6 gap-4">
          <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center border border-border">
            <Zap className="w-4 h-4 text-text" />
          </div>
          <span className="font-display font-bold text-lg text-text tracking-tight">
            DayFlow
          </span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden p-1 rounded-md hover:bg-surface text-text-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-4 space-y-1 overflow-y-auto">
          {activeNavItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium
                transition-all duration-200 group
                ${isActive
                  ? 'bg-text text-void shadow-sm font-bold'
                  : 'text-text-muted hover:text-text hover:bg-surface'
                }
              `}
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-void' : 'text-text-muted group-hover:text-text'}`} />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden lg:py-4 lg:pr-4">
        {/* Top bar (mobile) */}
        <header className="h-16 lg:hidden flex items-center px-4 border-b border-border bg-void flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-3 rounded-xl hover:bg-surface text-text-muted"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-4 ml-4">
            <Zap className="w-5 h-5 text-text" />
            <span className="font-display font-bold text-text">DayFlow</span>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 bg-void lg:bg-surface lg:border lg:border-border lg:rounded-[32px] overflow-hidden relative shadow-2xl flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="min-h-full"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
