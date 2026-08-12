import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, CheckSquare, Repeat, Target, Calendar,
  Timer, BookOpen, BarChart3, Lightbulb, Heart, Trophy,
  ClipboardList, Settings, Menu, X, Zap
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { path: '/habits', icon: Repeat, label: 'Habits' },
  { path: '/goals', icon: Target, label: 'Goals' },
  { path: '/planner', icon: Calendar, label: 'Planner' },
  { path: '/focus', icon: Timer, label: 'Focus' },
  { path: '/journal', icon: BookOpen, label: 'Journal' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/insights', icon: Lightbulb, label: 'Insights' },
  { path: '/wellbeing', icon: Heart, label: 'Wellbeing' },
  { path: '/gamification', icon: Trophy, label: 'Profile' },
  { path: '/review', icon: ClipboardList, label: 'Review' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

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
        w-[220px] bg-void-2 border-r border-border
        flex flex-col transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-border gap-2">
          <div className="w-8 h-8 rounded-lg bg-glow/20 flex items-center justify-center">
            <Zap className="w-4 h-4 text-glow" />
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
        <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-all duration-200 group
                ${isActive
                  ? 'bg-glow/10 text-glow'
                  : 'text-text-muted hover:text-text hover:bg-surface-2'
                }
              `}
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-glow' : 'text-text-muted group-hover:text-text'}`} />
                  <span>{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-glow"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-border">
          <div className="px-3 py-2 text-xs text-text-muted font-mono">
            <kbd className="px-1.5 py-0.5 bg-surface rounded text-text-muted text-[10px]">⌘K</kbd>
            <span className="ml-2">Command palette</span>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="h-14 lg:h-0 flex lg:hidden items-center px-4 border-b border-border bg-void-2 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-surface text-text-muted"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 ml-3">
            <Zap className="w-4 h-4 text-glow" />
            <span className="font-display font-bold text-text">DayFlow</span>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="min-h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
