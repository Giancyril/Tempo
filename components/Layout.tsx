'use client';

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Monitor, LogOut, Cpu,
  ChevronLeft, ChevronRight, Menu, X, User,
  Search, Bell, Download, Sparkles, CheckSquare, Calendar as CalendarIcon, Settings,
  SlidersHorizontal, AlertTriangle, Shield, BarChart3
} from 'lucide-react';
import { CustomSelectDropdown } from './CustomSelectDropdown';
import { CustomDatePicker, DateRange } from './CustomDatePicker';
import { GlobalSearchModal } from './GlobalSearchModal';
import { useSession, signOut } from 'next-auth/react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout?: () => void;
  selectedLabId?: string;
  setSelectedLabId?: (labId: string) => void;
  labs?: Array<{ id: string; name: string }>;
  showLabSelector?: boolean;
  onExport?: () => void;
  pcs?: any[];
  selectedPc?: string | null;
  onSelectPc?: (pcName: string | null) => void;
  lastFetchedAt?: Date | null;
  openAlertCount?: number;
}

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  overview: {
    title: 'Dashboard Overview',
    subtitle: 'System-wide summary of pending tasks, work hours, and scheduled focus blocks.',
  },
  tasks: {
    title: 'Task Backlog',
    subtitle: 'Browse, create, and inspect task priorities and constraints.',
  },
  calendar: {
    title: 'Weekly AI Planner',
    subtitle: 'Conflict-free weekly schedule generator synced with Google Calendar.',
  },
  preferences: {
    title: 'Scheduling Preferences',
    subtitle: 'Configure daily work hours, focus block limits, buffer times, and days off.',
  },
};

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'calendar', label: 'Weekly Planner', icon: Sparkles },
  { id: 'preferences', label: 'Preferences', icon: Settings },
];

export const Layout: React.FC<LayoutProps> = ({
  children,
  activeTab,
  setActiveTab,
  onLogout,
  selectedLabId = 'all',
  setSelectedLabId = () => { },
  labs = [{ id: 'work', name: 'Work' }, { id: 'personal', name: 'Personal' }],
  showLabSelector = true,
  onExport,
  pcs = [],
  selectedPc = null,
  onSelectPc,
  lastFetchedAt = null,
  openAlertCount = 0,
}) => {
  const { data: session } = useSession();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null });
  const [relativeTime, setRelativeTime] = useState('just now');

  // Always dark mode
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Keyboard listener for global search shortcut (Ctrl+Q / Cmd+Q)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'q') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Live status relative time ticker
  useEffect(() => {
    if (!lastFetchedAt) {
      setRelativeTime('just now');
      return;
    }
    const update = () => {
      const diffMs = Date.now() - lastFetchedAt.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      if (diffSec < 5) {
        setRelativeTime('just now');
      } else if (diffSec < 60) {
        setRelativeTime(`${diffSec}s ago`);
      } else {
        const diffMin = Math.floor(diffSec / 60);
        setRelativeTime(`${diffMin}m ago`);
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [lastFetchedAt]);

  const meta = pageMeta[activeTab] ?? { title: activeTab, subtitle: '' };

  const handleTabChange = (id: string) => {
    setActiveTab(id);
    setSidebarOpen(false);
  };

  const handleSignOut = () => {
    if (onLogout) onLogout();
    else signOut();
  };

  return (
    <div className="min-h-screen bg-slate-950 lg:flex overflow-hidden text-slate-100">

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Icon-rail Sidebar ──────────────────────────────────── */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50 flex flex-col
          bg-slate-900/95 backdrop-blur-xl border-r border-slate-800/80
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          ${sidebarCollapsed ? 'lg:w-16' : 'lg:w-[220px]'}
          w-[220px]
          overflow-hidden
        `}
      >
        {/* Logo row */}
        <div
          className={`h-14 border-b border-slate-800/80 flex items-center shrink-0 ${sidebarCollapsed ? 'justify-center px-0' : 'justify-between px-4'
            }`}
        >
          <div className="flex items-center gap-2.5">
            {!sidebarCollapsed && (
              <div className="leading-none">
                <p className="text-white text-sm font-bold tracking-widest">CHRONOS</p>
                <p className="text-indigo-400 text-[9px] uppercase font-semibold tracking-wider">AI Planner</p>
              </div>
            )}
          </div>
          {/* Mobile close */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-3 flex flex-col gap-0.5 px-2 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const active = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                title={sidebarCollapsed ? item.label : undefined}
                className={`
                  sidebar-nav-btn
                  relative flex items-center gap-3 rounded-xl px-2.5 py-2.5
                  text-sm font-medium transition-colors duration-150 group
                  focus:outline-none select-none
                  ${active
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-glow-indigo'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60 active:bg-slate-800/60'}
                  ${sidebarCollapsed ? 'justify-center' : ''}
                `}
              >
                {/* Active left-bar */}
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-indigo-400 rounded-full" />
                )}
                <Icon
                  className={`w-[18px] h-[18px] shrink-0 transition-colors ${active ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                />
                {!sidebarCollapsed && <span>{item.label}</span>}

                {/* Hover tooltip (collapsed only) */}
                {sidebarCollapsed && (
                  <span className="pointer-events-none absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 border border-slate-800 text-white text-xs rounded-xl hidden group-hover:block transition-all whitespace-nowrap z-50 shadow-xl">
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom: collapse toggle + logout */}
        <div className="p-2 border-t border-slate-800/80 shrink-0 flex flex-col gap-0.5 overflow-x-hidden">
          {/* Desktop collapse toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex items-center justify-center w-full py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={handleSignOut}
            title="Log Out"
            className={`
              relative flex items-center gap-3 rounded-xl px-2.5 py-2.5
              text-slate-400 hover:text-red-400 hover:bg-red-500/10
              transition-all duration-150 group
              ${sidebarCollapsed ? 'justify-center' : ''}
            `}
          >
            <LogOut className="w-4 h-4 shrink-0 group-hover:text-red-400 transition-colors" />
            {!sidebarCollapsed && <span className="text-sm font-medium">Log Out</span>}
            {sidebarCollapsed && (
              <span className="pointer-events-none absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 border border-slate-800 text-white text-xs rounded-xl hidden group-hover:block transition-all whitespace-nowrap z-50 shadow-xl">
                Log Out
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* ── Main column ────────────────────────────────────────── */}
      <div
        className={`
          w-full flex flex-col min-h-screen overflow-hidden transition-all duration-300
          ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-[220px]'}
        `}
      >

        {/* ── Top Bar ─────────────────────────────────────────── */}
        <header className="h-14 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/80 flex items-center px-4 sm:px-5 gap-3 shrink-0 sticky top-0 z-30">

          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Global Searchbar Trigger */}
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 w-64 bg-slate-950 hover:bg-slate-900 border border-slate-800/80 rounded-xl text-left text-slate-400 hover:text-slate-300 transition-all select-none group"
          >
            <Search className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-400" />
            <span className="text-xs font-semibold flex-1 truncate whitespace-nowrap">Search tasks & AI plan...</span>
            <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-[9px] font-mono font-bold text-slate-500">
              Ctrl+Q
            </div>
          </button>

          {/* Center spacer */}
          <div className="flex-1" />

          {/* ── Right: controls cluster ── */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-emerald-400 rounded-full ring-1 ring-slate-950" />
            </button>

            <div className="w-px h-4 bg-slate-800 mx-0.5" />

            {/* Avatar + user info */}
            <div className="flex items-center gap-2 pl-1">
              <div className="relative">
                <div className="w-7 h-7 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center border border-slate-700 shadow-sm">
                  <User className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 border border-slate-900 rounded-full" />
              </div>
              <div className="hidden md:flex flex-col leading-none">
                <span className="text-white text-[11px] font-semibold">
                  {session?.user?.name || session?.user?.email || 'Demo User'}
                </span>
                <span className="text-slate-400 text-[9px] uppercase tracking-wider">AI Planner User</span>
              </div>
            </div>
          </div>
        </header>

        {/* ── Page subheader (only show if not inspecting a specific item) ── */}
        {!selectedPc && (
          <div className="bg-slate-950 border-b border-slate-800/80 px-5 sm:px-6 py-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-tight">
                  {meta.title}
                </h1>
                <p className="text-slate-400 text-xs mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span>{meta.subtitle}</span>
                  <span className="hidden sm:inline w-1 h-1 rounded-full bg-slate-700" />
                  <span className="text-indigo-400 font-medium">
                    AI Sync status: {relativeTime}
                  </span>
                </p>
              </div>

              {/* Action controls */}
              <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                {showLabSelector && (
                  <CustomSelectDropdown
                    value={selectedLabId}
                    onChange={setSelectedLabId}
                    options={labs}
                    allLabel="All Categories"
                    allValue="all"
                  />
                )}
                <CustomDatePicker
                  value={dateRange}
                  onChange={setDateRange}
                />
                <button
                  className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-colors"
                  title="Filters"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </button>
                {onExport && (
                  <button
                    onClick={onExport}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl shadow-glow-indigo transition-all active:translate-y-px"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export Plan
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Page content ────────────────────────────────────── */}
        <main className="flex-1 p-5 sm:p-7 bg-slate-950 overflow-auto">
          {children}
        </main>
      </div>

      <GlobalSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        pcs={pcs}
        onSelectPc={onSelectPc || (() => { })}
        setActiveTab={setActiveTab}
      />
    </div>
  );
};
