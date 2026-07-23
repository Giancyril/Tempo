'use client';

import React, { useState, useEffect } from 'react';
import { TaskList, TaskItem } from '@/components/TaskList';
import { TaskFormModal } from '@/components/TaskFormModal';
import { ScheduleBanner } from '@/components/ScheduleBanner';
import { WeekCalendarGrid, CalendarBlock, ExistingEvent } from '@/components/WeekCalendarGrid';
import { ConflictAlert, ConflictItem } from '@/components/ConflictAlert';
import { startOfWeek, addWeeks, subWeeks, format } from 'date-fns';
import { Plus, CheckSquare, Sparkles, Clock, Zap, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

export default function DashboardPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [existingEvents, setExistingEvents] = useState<ExistingEvent[]>([]);
  const [proposedBlocks, setProposedBlocks] = useState<CalendarBlock[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [summaryNotes, setSummaryNotes] = useState('');
  const [unscheduledTasks, setUnscheduledTasks] = useState<any[]>([]);
  const [currentScheduleId, setCurrentScheduleId] = useState<string | null>(null);

  // Automatic Conflict Re-planning state
  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);
  const [isReplanning, setIsReplanning] = useState(false);

  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

  // Load tasks & calendar events on mount & when weekStart changes
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      await Promise.all([loadTasks(), loadCalendarEvents()]);
      setIsLoading(false);
    }
    loadData();
  }, [weekStart]);

  // Periodic Conflict Polling (checks every 30 seconds for overlaps with Google Calendar events)
  useEffect(() => {
    if (proposedBlocks.length === 0) {
      setConflicts([]);
      return;
    }

    async function checkForConflicts() {
      try {
        const res = await fetch('/api/schedule/conflict-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            blocks: proposedBlocks,
            weekOf: weekStart.toISOString(),
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setConflicts(data.conflicts || []);
        }
      } catch (err) {
        console.error('Failed to poll conflicts:', err);
      }
    }

    checkForConflicts();
    const interval = setInterval(checkForConflicts, 30000);
    return () => clearInterval(interval);
  }, [proposedBlocks, weekStart]);

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
    setConflicts([]);

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

  async function handleAutomaticReplan() {
    if (conflicts.length === 0 || proposedBlocks.length === 0) return;
    setIsReplanning(true);

    try {
      const conflictingBlockIds = conflicts.map((c) => c.blockId);
      const res = await fetch('/api/schedule/replan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentBlocks: proposedBlocks,
          conflictingBlockIds,
          weekOf: weekStart.toISOString(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to replan schedule');
      }

      setProposedBlocks(data.blocks || proposedBlocks);
      if (data.summaryNotes) setSummaryNotes(data.summaryNotes);
      setConflicts([]); // Clear conflicts once resolved
      await loadCalendarEvents();
    } catch (err: any) {
      alert(err.message || 'Re-plan failed');
    } finally {
      setIsReplanning(false);
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
  const totalTaskTimeMin = pendingTasks.reduce((acc, t) => acc + t.durationMin, 0);

  return (
    <div className="space-y-6 animate-fade-in">

      {/* AI Schedule Generation Banner */}
      <ScheduleBanner
        onGenerate={handleGenerateSchedule}
        isGenerating={isGenerating}
        summaryNotes={summaryNotes}
        unscheduledTasks={unscheduledTasks}
      />

      {/* Automatic Conflict Alert Banner (when overlaps detected) */}
      <ConflictAlert
        conflicts={conflicts}
        onReplan={handleAutomaticReplan}
        isReplanning={isReplanning}
        onDismiss={() => setConflicts([])}
      />

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4.5 flex items-center gap-4 border-l-4 border-l-indigo-500">
          <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 shrink-0">
            <CheckSquare className="w-5.5 h-5.5" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white tracking-tight">{pendingTasks.length}</div>
            <div className="text-xs text-slate-400 font-medium">Pending Tasks</div>
          </div>
        </div>

        <div className="card p-4.5 flex items-center gap-4 border-l-4 border-l-purple-500">
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400 shrink-0">
            <Clock className="w-5.5 h-5.5" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white tracking-tight">{(totalTaskTimeMin / 60).toFixed(1)} hrs</div>
            <div className="text-xs text-slate-400 font-medium">Est. Focus Required</div>
          </div>
        </div>

        <div className="card p-4.5 flex items-center gap-4 border-l-4 border-l-emerald-500">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
            <Sparkles className="w-5.5 h-5.5" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white tracking-tight">{proposedBlocks.length}</div>
            <div className="text-xs text-slate-400 font-medium">AI Focus Blocks</div>
          </div>
        </div>
      </div>

      {/* Week Selector Bar */}
      <div className="card p-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekStart((prev) => subWeeks(prev, 1))}
            className="btn btn-outline p-2 text-slate-400 hover:text-white"
            title="Previous Week"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
            className="btn btn-outline px-3 py-1.5 text-xs text-slate-300 hover:text-white"
          >
            Today
          </button>
          <button
            onClick={() => setWeekStart((prev) => addWeeks(prev, 1))}
            className="btn btn-outline p-2 text-slate-400 hover:text-white"
            title="Next Week"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
          <CalendarIcon className="w-4 h-4 text-indigo-400" />
          <span>Week of {format(weekStart, 'MMMM d, yyyy')}</span>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: Task Backlog */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="section-heading">
              <Zap className="w-4.5 h-4.5 text-indigo-400" />
              <span>Task Backlog</span>
              <span className="badge badge-indigo">{tasks.length}</span>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn btn-primary px-3 py-1.5 text-xs shadow-none"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Task</span>
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="card p-4 space-y-2">
                  <div className="skeleton h-4 w-3/4" />
                  <div className="skeleton h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <TaskList
              tasks={tasks}
              onTaskDeleted={loadTasks}
              onTaskUpdated={loadTasks}
            />
          )}
        </div>

        {/* Right Column: Weekly Schedule Grid */}
        <div className="lg:col-span-2 space-y-4">
          {isLoading ? (
            <div className="card p-8 text-center space-y-3">
              <div className="skeleton h-12 w-full" />
              <div className="skeleton h-64 w-full" />
            </div>
          ) : (
            <WeekCalendarGrid
              weekStart={weekStart}
              proposedBlocks={proposedBlocks}
              existingEvents={existingEvents}
              onDeleteBlock={handleDeleteBlock}
              onSyncGoogleCalendar={handleSyncGoogleCalendar}
              isSyncing={isSyncing}
            />
          )}
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
