'use client';

import React, { useState, useEffect } from 'react';
import { WeekCalendarGrid, CalendarBlock, ExistingEvent } from '@/components/WeekCalendarGrid';
import { ScheduleBanner } from '@/components/ScheduleBanner';
import { startOfWeek, addWeeks, subWeeks, format } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

export default function CalendarPage() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [proposedBlocks, setProposedBlocks] = useState<CalendarBlock[]>([]);
  const [existingEvents, setExistingEvents] = useState<ExistingEvent[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [summaryNotes, setSummaryNotes] = useState('');
  const [unscheduledTasks, setUnscheduledTasks] = useState<any[]>([]);
  const [currentScheduleId, setCurrentScheduleId] = useState<string | null>(null);

  useEffect(() => {
    loadCalendarEvents();
  }, [weekStart]);

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
    } catch (err: any) {
      alert(err.message || 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  }

  function handleDeleteBlock(id: string) {
    setProposedBlocks((prev) => prev.filter((b) => b.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-brand-400" />
            Interactive Weekly Planner
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review proposed AI schedule blocks side-by-side with your existing Google Calendar events.
          </p>
        </div>

        {/* Week Switcher */}
        <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setWeekStart((prev) => subWeeks(prev, 1))}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Previous Week"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-semibold text-slate-200 px-2">
            {format(weekStart, 'MMM d')} - {format(addWeeks(weekStart, 1), 'MMM d, yyyy')}
          </span>
          <button
            onClick={() => setWeekStart((prev) => addWeeks(prev, 1))}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Next Week"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <ScheduleBanner
        onGenerate={handleGenerateSchedule}
        isGenerating={isGenerating}
        summaryNotes={summaryNotes}
        unscheduledTasks={unscheduledTasks}
      />

      <WeekCalendarGrid
        weekStart={weekStart}
        proposedBlocks={proposedBlocks}
        existingEvents={existingEvents}
        onDeleteBlock={handleDeleteBlock}
        onSyncGoogleCalendar={handleSyncGoogleCalendar}
        isSyncing={isSyncing}
      />
    </div>
  );
}
