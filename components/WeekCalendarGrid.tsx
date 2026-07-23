'use client';

import React, { useEffect, useState } from 'react';
import { format, addDays, startOfWeek, parseISO, isSameDay, getHours, getMinutes, differenceInMinutes } from 'date-fns';
import { Sparkles, Calendar as CalendarIcon, CheckCircle, Trash2, RefreshCw, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { BlockDetailModal, DetailItem } from './BlockDetailModal';

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

  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [selectedDetailItem, setSelectedDetailItem] = useState<DetailItem | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const getCategoryCardStyle = (category?: string) => {
    switch (category?.toLowerCase()) {
      case 'work':
        return 'bg-indigo-950/50 border-indigo-500/40 text-indigo-100 cat-border-work hover:border-indigo-400/80';
      case 'study':
        return 'bg-purple-950/50 border-purple-500/40 text-purple-100 cat-border-study hover:border-purple-400/80';
      case 'health':
        return 'bg-emerald-950/50 border-emerald-500/40 text-emerald-100 cat-border-health hover:border-emerald-400/80';
      case 'personal':
        return 'bg-amber-950/50 border-amber-500/40 text-amber-100 cat-border-personal hover:border-amber-400/80';
      default:
        return 'bg-brand-950/50 border-brand-500/40 text-brand-100 cat-border-default hover:border-brand-400/80';
    }
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.6 },
    });
  };

  const isCurrentTimeSlot = (day: Date, hour: number) => {
    if (!currentTime) return false;
    return isSameDay(day, currentTime) && getHours(currentTime) === hour;
  };

  const getCurrentTimeOffsetPercent = () => {
    if (!currentTime) return 0;
    const mins = getMinutes(currentTime);
    return (mins / 60) * 100;
  };

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Week of {format(weekStart, 'MMM d, yyyy')}</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              <span className="font-semibold text-indigo-300">{proposedBlocks.length} AI focus block(s)</span>
              {' • '}
              <span className="text-slate-400">{existingEvents.length} calendar event(s)</span>
            </p>
          </div>
        </div>

        {onSyncGoogleCalendar && (
          <button
            onClick={() => {
              triggerConfetti();
              onSyncGoogleCalendar();
            }}
            disabled={isSyncing || proposedBlocks.length === 0}
            className="btn btn-success px-5 py-2.5 text-xs font-bold shadow-glow-emerald shrink-0"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Syncing Calendar...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-200" />
                <span>Sync to Google Calendar</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Main Weekly Calendar Grid Container */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[840px]">

            {/* Header Row: Days of Week */}
            <div className="grid grid-cols-8 border-b border-slate-800 bg-slate-900/80 sticky top-0 z-20 backdrop-blur-md">
              <div className="p-3 text-center text-[11px] font-bold text-slate-500 border-r border-slate-800 uppercase tracking-wider flex items-center justify-center">
                Time
              </div>

              {days.map((day) => {
                const isToday = isSameDay(day, new Date());
                return (
                  <div
                    key={day.toISOString()}
                    className={`p-3 text-center border-r border-slate-800/80 transition-colors ${
                      isToday ? 'bg-indigo-500/10' : ''
                    }`}
                  >
                    <div className={`text-[10px] font-bold uppercase tracking-wider ${isToday ? 'text-indigo-400' : 'text-slate-400'}`}>
                      {format(day, 'EEE')}
                    </div>
                    <div className="mt-1 flex items-center justify-center">
                      <span className={`
                        inline-flex items-center justify-center text-xs font-extrabold w-7 h-7 rounded-lg
                        ${isToday
                          ? 'bg-indigo-600 text-white shadow-glow-indigo'
                          : 'text-slate-200'}
                      `}>
                        {format(day, 'd')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Empty State Banner if no proposed blocks exist */}
            {proposedBlocks.length === 0 && (
              <div className="p-4 bg-indigo-950/20 border-b border-slate-800 flex items-center justify-between text-xs text-indigo-300">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>No AI focus blocks generated for this week yet. Click <strong>"Generate AI Schedule"</strong> above to plan your backlog.</span>
                </div>
              </div>
            )}

            {/* Time Rows Grid */}
            <div className="relative divide-y divide-slate-800/50">
              {hours.map((hour) => (
                <div key={hour} className="grid grid-cols-8 min-h-[76px]">
                  {/* Hour Label */}
                  <div className="p-2 text-center text-[11px] font-semibold text-slate-400 border-r border-slate-800/80 select-none bg-slate-950/40 flex flex-col justify-start pt-2">
                    {hour < 12 ? `${hour}:00 AM` : hour === 12 ? '12:00 PM' : `${hour - 12}:00 PM`}
                  </div>

                  {/* Day Columns for this hour slot */}
                  {days.map((day) => {
                    // Find proposed AI blocks starting in this hour slot
                    const dayBlocks = proposedBlocks.filter((b) => {
                      const bStart = parseISO(b.start);
                      return isSameDay(bStart, day) && getHours(bStart) === hour;
                    });

                    // Find existing calendar events starting in this hour slot
                    const dayEvents = existingEvents.filter((e) => {
                      const eStart = parseISO(e.start);
                      return isSameDay(eStart, day) && getHours(eStart) === hour;
                    });

                    const hasCurrentTime = isCurrentTimeSlot(day, hour);
                    const currentTimePercent = getCurrentTimeOffsetPercent();

                    return (
                      <div
                        key={day.toISOString()}
                        className="p-1 border-r border-slate-800/50 relative space-y-1 hover:bg-slate-900/40 transition-colors group/cell"
                      >
                        {/* Half-hour subtle divider line */}
                        <div className="absolute top-1/2 left-0 right-0 border-b border-dashed border-slate-800/30 pointer-events-none" />

                        {/* Red Current-Time Line Indicator */}
                        {hasCurrentTime && (
                          <div
                            className="absolute left-0 right-0 z-30 flex items-center pointer-events-none"
                            style={{ top: `${currentTimePercent}%` }}
                          >
                            <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 shadow-glow-emerald" />
                            <div className="w-full h-[2px] bg-red-500/80" />
                          </div>
                        )}

                        {/* Render Existing Events (Muted Slate) */}
                        {dayEvents.map((evt) => (
                          <div
                            key={evt.id || evt.summary}
                            onClick={() => setSelectedDetailItem({
                              type: 'existing-event',
                              id: evt.id,
                              title: evt.summary,
                              start: evt.start,
                              end: evt.end,
                              source: evt.source,
                            })}
                            className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700/80 text-slate-300 text-[11px] font-medium shadow-sm border-l-2 border-l-slate-400 cursor-pointer hover:bg-slate-700/90 hover:border-slate-500 transition-all select-none"
                            title="Click to view details"
                          >
                            <div className="truncate font-bold text-slate-200">{evt.summary}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {format(parseISO(evt.start), 'h:mm a')} – {format(parseISO(evt.end), 'h:mm a')}
                            </div>
                          </div>
                        ))}

                        {/* Render Proposed AI Focus Blocks */}
                        {dayBlocks.map((block) => {
                          return (
                            <div
                              key={block.id}
                              onClick={() => setSelectedDetailItem({
                                type: 'ai-block',
                                id: block.id,
                                title: block.title,
                                category: block.category,
                                start: block.start,
                                end: block.end,
                                reasoning: block.reasoning,
                                isSynced: block.isSynced,
                              })}
                              className={`
                                p-2 rounded-xl border text-xs relative group/block transition-all duration-200 hover:scale-[1.02] shadow-sm cursor-pointer select-none
                                ${getCategoryCardStyle(block.category)}
                              `}
                            >
                              <div className="flex items-start justify-between gap-1">
                                <span className="font-extrabold text-[11px] leading-snug line-clamp-2">
                                  ✨ {block.title}
                                </span>
                                {onDeleteBlock && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteBlock(block.id);
                                    }}
                                    className="opacity-0 group-hover/block:opacity-100 p-0.5 rounded text-red-300 hover:bg-red-900/60 transition-opacity shrink-0"
                                    title="Remove Block"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>

                              <div className="text-[10px] opacity-90 mt-1 flex items-center justify-between font-medium">
                                <span>
                                  {format(parseISO(block.start), 'h:mm a')} – {format(parseISO(block.end), 'h:mm a')}
                                </span>
                                {block.isSynced && (
                                  <span className="text-emerald-400 font-bold text-[9px] flex items-center gap-0.5">
                                    <CheckCircle2 className="w-3 h-3" /> Synced
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* Block Details Modal */}
      <BlockDetailModal
        item={selectedDetailItem}
        onClose={() => setSelectedDetailItem(null)}
        onDeleteBlock={onDeleteBlock}
      />
    </div>
  );
}
