'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, CheckSquare, Calendar, Sparkles } from 'lucide-react';

interface GlobalSearchModalProps {
  open: boolean;
  onClose: () => void;
  pcs?: any[];
  onSelectPc?: (pcName: string | null) => void;
  setActiveTab?: (tab: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  open,
  onClose,
  setActiveTab,
}) => {
  const [query, setQuery] = useState('');
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      fetch('/api/tasks')
        .then((res) => res.json())
        .then((data) => setTasks(Array.isArray(data) ? data : []))
        .catch((err) => console.error(err));
    }
  }, [open]);

  if (!open) return null;

  const filteredTasks = tasks.filter((t) =>
    t.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header Search Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800 bg-slate-950">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks, categories, or schedule items..."
            className="flex-1 bg-transparent text-white text-sm placeholder-slate-500 focus:outline-none"
            autoFocus
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Body */}
        <div className="p-4 max-h-96 overflow-y-auto space-y-2">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              No matching tasks found.
            </div>
          ) : (
            filteredTasks.map((t) => (
              <div
                key={t.id}
                onClick={() => {
                  if (setActiveTab) setActiveTab('tasks');
                  onClose();
                }}
                className="p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800/80 cursor-pointer flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <CheckSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">{t.title}</div>
                    <div className="text-[10px] text-slate-400">
                      {t.category} • {t.durationMin} mins
                    </div>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  Priority P{t.priority}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
