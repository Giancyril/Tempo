'use client';

import React from 'react';
import { X, Sparkles, Clock, Calendar, CheckCircle2, Trash2, Tag, ShieldCheck, AlertCircle } from 'lucide-react';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { formatDuration } from './TaskList';

export interface DetailItem {
  type: 'ai-block' | 'existing-event';
  id?: string;
  title: string;
  category?: string;
  start: string; // ISO
  end: string;   // ISO
  reasoning?: string;
  isSynced?: boolean;
  source?: string;
}

interface BlockDetailModalProps {
  item: DetailItem | null;
  onClose: () => void;
  onDeleteBlock?: (id: string) => void;
}

export function BlockDetailModal({ item, onClose, onDeleteBlock }: BlockDetailModalProps) {
  if (!item) return null;

  const startDate = parseISO(item.start);
  const endDate = parseISO(item.end);
  const durationMin = differenceInMinutes(endDate, startDate);

  const getCategoryBadge = (category?: string, type?: string) => {
    if (type === 'existing-event') {
      return <span className="badge badge-slate">📅 Google Calendar Event</span>;
    }
    switch (category?.toLowerCase()) {
      case 'work':
        return <span className="badge badge-indigo">💼 Work Focus Block</span>;
      case 'study':
        return <span className="badge badge-purple">📚 Study Session</span>;
      case 'personal':
        return <span className="badge badge-amber">🏡 Personal Task</span>;
      case 'health':
        return <span className="badge badge-emerald">🧘 Health & Fitness</span>;
      default:
        return <span className="badge badge-indigo">✨ AI Focus Block</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md card p-6 relative overflow-hidden animate-scale-in border-slate-700/80 shadow-modal">
        
        {/* Top Glow Accent Bar */}
        <div className={`absolute top-0 left-0 right-0 h-1 ${
          item.type === 'existing-event'
            ? 'bg-slate-500'
            : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400'
        }`} />

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="space-y-1 pr-2">
            <div className="flex items-center gap-2 flex-wrap">
              {getCategoryBadge(item.category, item.type)}
              {item.isSynced && (
                <span className="badge badge-emerald">
                  <CheckCircle2 className="w-3 h-3" /> Synced to Google Calendar
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight leading-snug pt-1">
              {item.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Details Grid */}
        <div className="py-4 space-y-4 text-xs">
          {/* Time & Duration Card */}
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 space-y-2">
            <div className="flex items-center gap-2 text-slate-300 font-semibold">
              <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>{format(startDate, 'EEEE, MMMM d, yyyy')}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-800/60">
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                {format(startDate, 'h:mm a')} – {format(endDate, 'h:mm a')}
              </span>
              <span className="badge badge-indigo font-mono">
                {formatDuration(durationMin)}
              </span>
            </div>
          </div>

          {/* AI Reasoning Section (For AI Focus Blocks) */}
          {item.reasoning && (
            <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 space-y-1.5">
              <div className="font-bold text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>AI Scheduling Reasoning:</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                {item.reasoning}
              </p>
            </div>
          )}

          {/* Existing Event info badge */}
          {item.type === 'existing-event' && (
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 text-[11px] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Imported directly from your Google Calendar. Read-only event.</span>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
          {item.type === 'ai-block' && item.id && onDeleteBlock ? (
            <button
              onClick={() => {
                onDeleteBlock(item.id!);
                onClose();
              }}
              className="btn btn-danger text-xs text-red-400 hover:bg-red-950/40 border border-red-900/40 px-3 py-2 rounded-xl"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove Block</span>
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={onClose}
            className="btn btn-outline text-xs px-5 py-2 rounded-xl"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
