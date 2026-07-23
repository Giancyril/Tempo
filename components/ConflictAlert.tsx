'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, X, Calendar, ArrowRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export interface ConflictItem {
  blockId: string;
  blockTitle: string;
  conflictingEventTitle: string;
  eventStart: string;
  eventEnd: string;
}

interface ConflictAlertProps {
  conflicts: ConflictItem[];
  onReplan: () => void;
  isReplanning: boolean;
  onDismiss: () => void;
}

export function ConflictAlert({
  conflicts,
  onReplan,
  isReplanning,
  onDismiss,
}: ConflictAlertProps) {
  if (!conflicts || conflicts.length === 0) return null;

  return (
    <div className="card p-4 bg-amber-950/40 border-amber-500/40 text-amber-200 animate-scale-in space-y-3 shadow-lg shadow-amber-900/10">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-extrabold text-white tracking-tight">
                Calendar Conflict Detected!
              </h4>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                {conflicts.length} Overlap{conflicts.length > 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-xs text-amber-200/90 mt-0.5">
              New events on your calendar overlap with existing AI focus blocks. Re-plan to automatically push affected blocks into clear slots without touching fixed events.
            </p>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="p-1 rounded-lg text-amber-400/80 hover:text-white hover:bg-amber-900/50 transition-colors shrink-0"
          title="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Conflict list snippet */}
      <div className="space-y-1.5 pt-1 border-t border-amber-500/20">
        {conflicts.slice(0, 3).map((c, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between text-[11px] bg-slate-950/60 p-2 rounded-lg border border-amber-500/20"
          >
            <div className="flex items-center gap-2 truncate">
              <span className="font-bold text-amber-300 truncate">✨ {c.blockTitle}</span>
              <ArrowRight className="w-3 h-3 text-amber-500 shrink-0" />
              <span className="text-slate-300 truncate font-semibold">📅 {c.conflictingEventTitle}</span>
            </div>
            <span className="text-[10px] text-amber-400/80 shrink-0 ml-2 font-mono">
              {format(parseISO(c.eventStart), 'EEE h:mm a')}
            </span>
          </div>
        ))}
        {conflicts.length > 3 && (
          <div className="text-[10px] text-amber-400 font-semibold pl-1">
            + {conflicts.length - 3} more conflict(s)
          </div>
        )}
      </div>

      {/* Action button */}
      <div className="flex justify-end pt-1">
        <button
          onClick={onReplan}
          disabled={isReplanning}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
        >
          {isReplanning ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Re-planning Schedule...</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Re-plan Affected Blocks Automatically</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
