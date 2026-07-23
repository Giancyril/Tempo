'use client';

import React from 'react';
import { Sparkles, RefreshCw, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

interface ScheduleBannerProps {
  onGenerate: () => void;
  isGenerating: boolean;
  summaryNotes?: string;
  unscheduledTasks?: { taskId: string; title: string; reason: string }[];
}

export function ScheduleBanner({
  onGenerate,
  isGenerating,
  summaryNotes,
  unscheduledTasks = [],
}: ScheduleBannerProps) {
  return (
    <div className="glass-panel p-6 rounded-2xl border border-brand-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 relative overflow-hidden shadow-glow-indigo">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> LLM-Powered Scheduling Engine
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            Optimize Your Weekly Schedule
          </h2>
          <p className="text-xs text-slate-300 max-w-xl">
            Our LangChain planning agent balances your pending tasks, deadlines, focus block limits, and buffer times around existing calendar events.
          </p>
        </div>

        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-600 via-purple-600 to-emerald-500 hover:from-brand-500 hover:to-emerald-400 text-white font-bold text-sm shadow-glow-indigo transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 shrink-0"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
              <span>AI Engine Planning...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Generate AI Schedule</span>
            </>
          )}
        </button>
      </div>

      {/* Summary Notes */}
      {summaryNotes && (
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-start gap-2 text-xs text-slate-300">
          <Info className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
          <span>{summaryNotes}</span>
        </div>
      )}

      {/* Unscheduled Tasks Notice */}
      {unscheduledTasks.length > 0 && (
        <div className="mt-3 p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs space-y-1">
          <div className="font-semibold flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Some tasks could not fit in the target week:</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-200/90 pl-1">
            {unscheduledTasks.map((u) => (
              <li key={u.taskId}>
                <span className="font-medium">{u.title}</span> — {u.reason}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
