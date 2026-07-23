'use client';

import React, { useState, useEffect } from 'react';
import { TaskList, TaskItem } from '@/components/TaskList';
import { TaskFormModal } from '@/components/TaskFormModal';
import { ScheduleBanner } from '@/components/ScheduleBanner';
import { WeekCalendarGrid, CalendarBlock, ExistingEvent } from '@/components/WeekCalendarGrid';
import { startOfWeek } from 'date-fns';
import { Plus, CheckSquare, Calendar as CalendarIcon, Sparkles, Clock, Zap } from 'lucide-react';

export default function DashboardPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [existingEvents, setExistingEvents] = useState<ExistingEvent[]>([]);
  const [proposedBlocks, setProposedBlocks] = useState<CalendarBlock[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [summaryNotes, setSummaryNotes] = useState('');
  const [unscheduledTasks, setUnscheduledTasks] = useState<any[]>([]);
  const [currentScheduleId, setCurrentScheduleId] = useState<string | null>(null);

  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

  // Load tasks & calendar events on mount
  useEffect(() => {
    loadTasks();
    loadCalendarEvents();
  }, [weekStart]);

  async function loadTasks() {
    try {
      const res = await fetch('/api/tasks');
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
    }
  }

  async function loadCalendarEvents() {
    try {
      const startISO = weekStart.toISOString();
      const res = await fetch(`/api/calendar/events?start=${startISO}`);
      if (res.ok) {
        const data = await res.json();
        setExistingEvents(data.events || []);
      }
    } catch (err) {
      console.error('Failed to load calendar events:', err);
    }
  }

  async function handleGenerateSchedule() {
    setIsGenerating(true);
    setSummaryNotes('');
    setUnscheduledTasks([]);

    try {
      const res = await fetch('/api/schedule/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekOf: weekStart.toISOString(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate schedule');
      }

      setProposedBlocks(data.blocks || []);
      setSummaryNotes(data.summaryNotes || '');
      setUnscheduledTasks(data.unscheduledTasks || []);
      if (data.scheduleId) setCurrentScheduleId(data.scheduleId);
      loadTasks();
    } catch (err: any) {
      alert(err.message || 'Error generating schedule');
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSyncGoogleCalendar() {
    if (proposedBlocks.length === 0) return;
    setIsSyncing(true);

    try {
      const res = await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduleId: currentScheduleId,
          blocks: proposedBlocks,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to sync calendar');
      }

      setProposedBlocks(data.blocks || proposedBlocks);
      alert(data.message || 'Schedule synced successfully!');
      loadTasks();
    } catch (err: any) {
      alert(err.message || 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  }

  function handleDeleteBlock(id: string) {
    setProposedBlocks((prev) => prev.filter((b) => b.id !== id));
  }

  const pendingTasks = tasks.filter((t) => t.status === 'pending');
  const scheduledTasks = tasks.filter((t) => t.status === 'scheduled');
  const totalTaskTimeMin = pendingTasks.reduce((acc, t) => acc + t.durationMin, 0);

  return (
    <div className="space-y-8">
      {/* AI Schedule Generation Banner */}
      <ScheduleBanner
        onGenerate={handleGenerateSchedule}
        isGenerating={isGenerating}
        summaryNotes={summaryNotes}
        unscheduledTasks={unscheduledTasks}
      />

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{pendingTasks.length}</div>
            <div className="text-xs text-slate-400 font-medium">Pending Tasks</div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{(totalTaskTimeMin / 60).toFixed(1)} hrs</div>
            <div className="text-xs text-slate-400 font-medium">Estimated Work Required</div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{proposedBlocks.length}</div>
            <div className="text-xs text-slate-400 font-medium">Proposed AI Focus Blocks</div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Task Backlog */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-brand-400" />
              Task Backlog
            </h3>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600/30 hover:bg-brand-600/50 border border-brand-500/50 text-brand-200 text-xs font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Task
            </button>
          </div>

          <TaskList
            tasks={tasks}
            onTaskDeleted={loadTasks}
            onTaskUpdated={loadTasks}
          />
        </div>

        {/* Right Column: Weekly Schedule Grid */}
        <div className="lg:col-span-2 space-y-4">
          <WeekCalendarGrid
            weekStart={weekStart}
            proposedBlocks={proposedBlocks}
            existingEvents={existingEvents}
            onDeleteBlock={handleDeleteBlock}
            onSyncGoogleCalendar={handleSyncGoogleCalendar}
            isSyncing={isSyncing}
          />
        </div>
      </div>

      {/* Task Creation Modal */}
      <TaskFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTaskCreated={loadTasks}
      />
    </div>
  );
}
