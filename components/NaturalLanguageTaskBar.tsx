'use client';

import React, { useState } from 'react';
import { Sparkles, ArrowRight, CornerDownLeft, Loader2, Zap } from 'lucide-react';

interface NaturalLanguageTaskBarProps {
  onTaskParsed: (parsedData: {
    title: string;
    durationMin: number;
    priority: number;
    category: string;
    deadline?: string | null;
    constraints?: string | null;
  }) => void;
  placeholder?: string;
}

const QUICK_EXAMPLES = [
  'Draft Q3 financial report by Friday 5pm, 2 hrs, urgent',
  'Code review & refactor 45m high priority work',
  'Gym workout 60m tomorrow morning health',
];

export function NaturalLanguageTaskBar({
  onTaskParsed,
  placeholder = '✨ Express any task naturally... (e.g. "Prepare client pitch by tomorrow 3pm 90m high priority")',
}: NaturalLanguageTaskBarProps) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleParse(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/tasks/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to parse task');
      }

      onTaskParsed(data);
      setPrompt('');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <form onSubmit={handleParse} className="relative flex items-center">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-indigo-400 pointer-events-none">
          <Sparkles className="w-4 h-4 animate-pulse-slow" />
        </div>

        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-24 py-3 rounded-2xl bg-slate-900/90 border border-indigo-500/30 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 shadow-card transition-all"
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="btn btn-primary px-3.5 py-1.5 text-xs font-bold shadow-glow-indigo disabled:opacity-40"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden sm:inline">Parsing...</span>
              </>
            ) : (
              <>
                <span>Parse with AI</span>
                <CornerDownLeft className="w-3 h-3 opacity-70" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Quick Example Suggestions */}
      <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-400 pl-1">
        <span className="font-semibold text-slate-500 flex items-center gap-1">
          <Zap className="w-3 h-3 text-amber-400" /> Try:
        </span>
        {QUICK_EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => setPrompt(ex)}
            className="px-2 py-0.5 rounded-lg bg-slate-900/70 border border-slate-800 text-slate-400 hover:text-indigo-300 hover:border-indigo-500/40 transition-colors truncate max-w-xs"
          >
            "{ex}"
          </button>
        ))}
      </div>

      {error && (
        <p className="text-[11px] text-red-400 pl-1">{error}</p>
      )}
    </div>
  );
}
