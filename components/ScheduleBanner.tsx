'use client';

import React from 'react';
import { Sparkles, RefreshCw, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

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
    <div className={`
      relative p-6 sm:p-7 rounded-2xl border transition-all duration-300 overflow-hidden shadow-card
      ${isGenerating
        ? 'border-brand-500/60 bg-gradient-to-r from-dark-card via-brand-950/40 to-dark-card animate-pulse-glow'
        : 'border-slate-800/90 bg-gradient-to-r from-dark-card via-slate-900/90 to-brand-950/30 hover:border-slate-700'}
    `}>
      {/* Ambient background glow spots */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top accent border */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-500 via-purple-500 to-emerald-400" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/25 text-brand-300 text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>LLM-Powered Scheduling Engine</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-snug">
            Generate Conflict-Free Schedule
          </h2>

          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Our AI planning agent analyzes your pending tasks, deadlines, focus preferences, and buffer constraints alongside existing Google Calendar events to construct an optimal week.
          </p>
        </div>

        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className="btn btn-primary px-6 py-3 text-sm font-bold shadow-glow-indigo shrink-0 lg:self-center self-start"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
              <span>AI Planning in Progress...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-emerald-300" />
              <span>Generate AI Schedule</span>
            </>
          )}
        </button>
      </div>

      {/* AI Reasoning Summary Notes */}
      {summaryNotes && (
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-start gap-2.5 text-xs text-slate-300 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/60">
          <Info className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-white">AI Planning Insights:</span>
            <p className="text-slate-400 leading-relaxed">{summaryNotes}</p>
          </div>
        </div>
      )}

      {/* Unscheduled Tasks Notice */}
      {unscheduledTasks.length > 0 && (
        <div className="mt-4 p-4 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-200 text-xs space-y-2">
          <div className="font-bold text-amber-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Unscheduled Tasks ({unscheduledTasks.length}):</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {unscheduledTasks.map((u) => (
              <div key={u.taskId} className="bg-slate-900/70 p-2.5 rounded-lg border border-amber-900/30 flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                <div className="min-w-0">
                  <div className="font-semibold text-slate-200 truncate">{u.title}</div>
                  <div className="text-[11px] text-amber-400/80 mt-0.5">{u.reason}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
