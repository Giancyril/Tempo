'use client';

import React, { useEffect, useState } from 'react';
import { format, addDays, startOfWeek, parseISO, isSameDay, getHours, getMinutes, differenceInMinutes } from 'date-fns';
import { Sparkles, Calendar as CalendarIcon, CheckCircle2, Trash2, RefreshCw, Link as LinkIcon } from 'lucide-react';
import { BlockDetailModal, DetailItem } from './BlockDetailModal';

export interface CalendarBlock {
  id: string;
  taskId?: string;
  title: string;
  category: string;
  start: string;
  end: string;
  reasoning?: string;
  isSynced?: boolean;
  googleEventId?: string;
  partIndex?: number;
  totalParts?: number;
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

const HOURS_IN_DAY = 16; // 06:00 to 22:00
const START_HOUR = 6;

function getCategoryCardStyle(category: string): string {
  const cat = (category || 'Work').toLowerCase();
  switch (cat) {
    case 'work':
      return 'cat-border-work bg-indigo-950/60 border-indigo-500/40 text-indigo-100 hover:border-indigo-400';
    case 'study':
      return 'cat-border-study bg-purple-950/60 border-purple-500/40 text-purple-100 hover:border-purple-400';
    case 'personal':
      return 'cat-border-personal bg-amber-950/60 border-amber-500/40 text-amber-100 hover:border-amber-400';
    case 'health':
      return 'cat-border-health bg-emerald-950/60 border-emerald-500/40 text-emerald-100 hover:border-emerald-400';
    default:
      return 'cat-border bg-slate-900/80 border-slate-700 text-slate-200 hover:border-slate-500';
  }
}

export function WeekCalendarGrid({
  weekStart,
  proposedBlocks,
  existingEvents,
  onDeleteBlock,
  onSyncGoogleCalendar,
  isSyncing = false,
}: WeekCalendarGridProps) {
  const [now, setNow] = useState<Date | null>(null);
  const [selectedDetailItem, setSelectedDetailItem] = useState<DetailItem | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: HOURS_IN_DAY }, (_, i) => START_HOUR + i);

  function isCurrentTimeSlot(dayDate: Date, hour: number): boolean {
    if (!now) return false;
    return isSameDay(now, dayDate) && getHours(now) === hour;
  }

  function getCurrentTimeOffsetPercent(): number {
    if (!now) return 0;
    const mins = getMinutes(now);
    return (mins / 60) * 100;
  }

  return (
    <div className="space-y-3">

      {/* Header bar with total hours & sync button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
            <CalendarIcon className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-2">
              Weekly AI Focus Schedule
            </h3>
            <p className="text-[11px] text-slate-400">
              {proposedBlocks.length} planned block{proposedBlocks.length !== 1 ? 's' : ''} •{' '}
              {existingEvents.length} calendar event{existingEvents.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {onSyncGoogleCalendar && proposedBlocks.length > 0 && (
          <button
            onClick={onSyncGoogleCalendar}
            disabled={isSyncing}
            className="btn btn-outline px-4 py-2 text-xs flex items-center gap-2 border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/40 hover:border-emerald-400"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                <span>Syncing with Google...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sync to Google Calendar</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Main Grid Container */}
      <div className="bg-slate-950/90 border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl">
        <div className="overflow-x-auto">
          <div className="min-w-[850px]">

            {/* Days Header Row */}
            <div className="grid grid-cols-8 border-b border-slate-800/80 bg-slate-900/80 select-none">
              <div className="p-3 text-center text-xs font-bold text-slate-400 border-r border-slate-800/80 flex items-center justify-center">
                GMT
              </div>
              {days.map((day) => {
                const isToday = now ? isSameDay(now, day) : false;
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

            {/* Empty State Banner */}
            {proposedBlocks.length === 0 && (
              <div className="p-4 bg-indigo-950/20 border-b border-slate-800 flex items-center justify-between text-xs text-indigo-300">
                <div className="flex items-center gap-2">
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

                  {/* Day Columns */}
                  {days.map((day) => {
                    const dayBlocks = proposedBlocks.filter((b) => {
                      const bStart = parseISO(b.start);
                      return isSameDay(bStart, day) && getHours(bStart) === hour;
                    });

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
                        {/* Half-hour divider line */}
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

                        {/* Render Existing Events */}
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
                          const isSplitBlock = block.partIndex && block.totalParts && block.totalParts > 1;

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

                              {/* Multi-session Split Badge */}
                              {isSplitBlock && (
                                <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-500/20 border border-indigo-400/30 text-[9px] font-bold text-indigo-300">
                                  <LinkIcon className="w-2.5 h-2.5" />
                                  <span>Part {block.partIndex} of {block.totalParts}</span>
                                </div>
                              )}

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
