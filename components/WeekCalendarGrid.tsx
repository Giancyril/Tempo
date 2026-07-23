'use client';

import React from 'react';
import { format, addDays, startOfWeek, parseISO, isSameDay, getHours, getMinutes } from 'date-fns';
import { Sparkles, Calendar as CalendarIcon, CheckCircle, Trash2, ExternalLink, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';

export interface CalendarBlock {
  id: string;
  taskId: string;
  title: string;
  category?: string;
  start: string; // ISO
  end: string;   // ISO
  reasoning?: string;
  isSynced?: boolean;
}

export interface ExistingEvent {
  id?: string;
  summary: string;
  start: string;
  end: string;
  source?: string;
}

interface WeekCalendarGridProps {
  weekStart: Date;
  proposedBlocks: CalendarBlock[];
  existingEvents: ExistingEvent[];
  onDeleteBlock?: (id: string) => void;
  onSyncGoogleCalendar?: () => void;
  isSyncing?: boolean;
}

export function WeekCalendarGrid({
  weekStart,
  proposedBlocks,
  existingEvents,
  onDeleteBlock,
  onSyncGoogleCalendar,
  isSyncing,
}: WeekCalendarGridProps) {
  const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: 13 }).map((_, i) => i + 8); // 8:00 AM to 8:00 PM (20:00)

  const getCategoryColor = (category?: string) => {
    switch (category?.toLowerCase()) {
      case 'work':
        return 'bg-indigo-600/30 border-indigo-500/60 text-indigo-200 shadow-glow-indigo';
      case 'study':
        return 'bg-purple-600/30 border-purple-500/60 text-purple-200 shadow-glow-purple';
      case 'health':
        return 'bg-emerald-600/30 border-emerald-500/60 text-emerald-200 shadow-glow-emerald';
      case 'personal':
        return 'bg-amber-600/30 border-amber-500/60 text-amber-200';
      default:
        return 'bg-brand-600/30 border-brand-500/60 text-brand-200';
    }
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 glass-panel p-4 rounded-2xl border border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-brand-400" />
            Week of {format(weekStart, 'MMM d, yyyy')}
          </h3>
          <p className="text-xs text-slate-400">
            {proposedBlocks.length} AI focus block(s) scheduled • {existingEvents.length} calendar event(s) detected
          </p>
        </div>

        {onSyncGoogleCalendar && (
          <button
            onClick={() => {
              triggerConfetti();
              onSyncGoogleCalendar();
            }}
            disabled={isSyncing || proposedBlocks.length === 0}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-semibold shadow-glow-emerald transition-all disabled:opacity-50"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Syncing Calendar...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Sync to Google Calendar</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Main Weekly Calendar Grid */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header Row: Days of Week */}
          <div className="grid grid-cols-8 border-b border-slate-800 bg-slate-900/60 sticky top-0 z-10">
            <div className="p-3 text-center text-xs font-semibold text-slate-500 border-r border-slate-800">
              Time
            </div>
            {days.map((day) => (
              <div
                key={day.toISOString()}
                className={`p-3 text-center border-r border-slate-800 ${
                  isSameDay(day, new Date()) ? 'bg-brand-950/40 text-brand-300' : 'text-slate-300'
                }`}
              >
                <div className="text-xs font-semibold uppercase">{format(day, 'EEE')}</div>
                <div className="text-sm font-bold mt-0.5">{format(day, 'MMM d')}</div>
              </div>
            ))}
          </div>

          {/* Time Rows */}
          <div className="relative">
            {hours.map((hour) => (
              <div key={hour} className="grid grid-cols-8 border-b border-slate-800/40 min-h-[70px]">
                {/* Hour Label */}
                <div className="p-2 text-center text-[11px] font-medium text-slate-500 border-r border-slate-800/60 select-none">
                  {hour < 12 ? `${hour}:00 AM` : hour === 12 ? '12:00 PM' : `${hour - 12}:00 PM`}
                </div>

                {/* Day Columns for this hour slot */}
                {days.map((day) => {
                  // Find proposed AI blocks for this day & hour
                  const dayBlocks = proposedBlocks.filter((b) => {
                    const bStart = parseISO(b.start);
                    return isSameDay(bStart, day) && getHours(bStart) === hour;
                  });

                  // Find existing calendar events for this day & hour
                  const dayEvents = existingEvents.filter((e) => {
                    const eStart = parseISO(e.start);
                    return isSameDay(eStart, day) && getHours(eStart) === hour;
                  });

                  return (
                    <div
                      key={day.toISOString()}
                      className="p-1 border-r border-slate-800/40 relative min-h-[70px] space-y-1 hover:bg-slate-900/30 transition-colors"
                    >
                      {/* Render Existing Events (Gray/Slate) */}
                      {dayEvents.map((evt) => (
                        <div
                          key={evt.id || evt.summary}
                          className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 text-[11px] font-medium shadow-sm"
                          title={`Existing Event: ${evt.summary} (${format(parseISO(evt.start), 'HH:mm')}-${format(parseISO(evt.end), 'HH:mm')})`}
                        >
                          <div className="truncate font-semibold text-slate-200">{evt.summary}</div>
                          <div className="text-[10px] text-slate-400">
                            {format(parseISO(evt.start), 'h:mm a')} - {format(parseISO(evt.end), 'h:mm a')}
                          </div>
                        </div>
                      ))}

                      {/* Render Proposed AI Focus Blocks */}
                      {dayBlocks.map((block) => (
                        <div
                          key={block.id}
                          className={`p-2 rounded-xl border text-xs relative group transition-all duration-200 hover:scale-[1.02] ${getCategoryColor(
                            block.category
                          )}`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className="font-bold text-[11px] leading-snug line-clamp-2">
                              ✨ {block.title}
                            </span>
                            {onDeleteBlock && (
                              <button
                                onClick={() => onDeleteBlock(block.id)}
                                className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-red-300 hover:bg-red-900/50 transition-opacity"
                                title="Remove Block"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <div className="text-[10px] opacity-80 mt-1 flex items-center justify-between">
                            <span>
                              {format(parseISO(block.start), 'h:mm a')} - {format(parseISO(block.end), 'h:mm a')}
                            </span>
                            {block.isSynced && (
                              <span className="text-emerald-400 font-semibold text-[9px] flex items-center gap-0.5">
                                ✓ Synced
                              </span>
                            )}
                          </div>
                          {block.reasoning && (
                            <div className="hidden group-hover:block absolute bottom-full left-0 z-30 mb-2 w-48 p-2 rounded-lg bg-slate-950 border border-slate-700 text-[10px] text-slate-300 shadow-xl">
                              {block.reasoning}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
