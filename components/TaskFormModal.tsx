'use client';

import React, { useState } from 'react';
import { X, Clock, Calendar as CalendarIcon, Tag, AlertCircle, Sparkles, Plus } from 'lucide-react';
import { CustomSelectDropdown } from './CustomSelectDropdown';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
}

const DURATION_OPTIONS = [
  { id: '15',  name: '15 minutes' },
  { id: '30',  name: '30 minutes' },
  { id: '45',  name: '45 minutes' },
  { id: '60',  name: '1 hour (60m)' },
  { id: '90',  name: '1.5 hours (90m)' },
  { id: '120', name: '2 hours (120m)' },
  { id: '180', name: '3 hours (180m)' },
  { id: '240', name: '4 hours (240m)' },
];

const PRIORITIES = [
  { level: 1, label: 'P1 Urgent', color: 'border-red-500/50 text-red-300 bg-red-500/10' },
  { level: 2, label: 'P2 High',   color: 'border-amber-500/50 text-amber-300 bg-amber-500/10' },
  { level: 3, label: 'P3 Normal', color: 'border-indigo-500/50 text-indigo-300 bg-indigo-500/10' },
  { level: 4, label: 'P4 Low',    color: 'border-slate-700 text-slate-400 bg-slate-800/40' },
];

const CATEGORIES = [
  { id: 'Work',     label: '💼 Work',     color: 'border-indigo-500/50 text-indigo-300' },
  { id: 'Study',    label: '📚 Study',    color: 'border-purple-500/50 text-purple-300' },
  { id: 'Personal', label: '🏡 Personal', color: 'border-amber-500/50 text-amber-300' },
  { id: 'Health',   label: '🧘 Health',   color: 'border-emerald-500/50 text-emerald-300' },
];

export function TaskFormModal({ isOpen, onClose, onTaskCreated }: TaskFormModalProps) {
  const [title, setTitle] = useState('');
  const [durationMin, setDurationMin] = useState('60');
  const [priority, setPriority] = useState(2);
  const [category, setCategory] = useState('Work');
  const [deadline, setDeadline] = useState('');
  const [constraints, setConstraints] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter a task title.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          durationMin: Number(durationMin),
          priority,
          category,
          deadline: deadline ? new Date(deadline).toISOString() : null,
          constraints: constraints.trim() || null,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to create task');
      }

      // Reset form
      setTitle('');
      setDurationMin('60');
      setPriority(2);
      setCategory('Work');
      setDeadline('');
      setConstraints('');
      onTaskCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg card p-6 relative overflow-hidden animate-scale-in border-slate-700/80 shadow-modal">
        {/* Top Glow Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">Create New Task</h3>
              <p className="text-[11px] text-slate-400">Add a task constraint for the AI scheduler</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Task Title <span className="text-indigo-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Prepare Q3 Quarterly Financial Presentation"
              className="input-field text-sm"
              required
              autoFocus
            />
          </div>

          {/* Duration & Category Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                Est. Duration
              </label>
              <CustomSelectDropdown
                value={durationMin}
                onChange={setDurationMin}
                options={DURATION_OPTIONS}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-purple-400" />
                Category
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`
                        px-2 py-1.5 rounded-lg text-xs font-medium border transition-all text-center truncate
                        ${isSelected
                          ? `${cat.color} bg-slate-800/90 shadow-sm border-current`
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'}
                      `}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Priority Pills */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Priority Level</label>
            <div className="grid grid-cols-4 gap-2">
              {PRIORITIES.map((p) => {
                const isSelected = priority === p.level;
                return (
                  <button
                    key={p.level}
                    type="button"
                    onClick={() => setPriority(p.level)}
                    className={`
                      py-2 px-1 rounded-xl text-xs font-bold border transition-all text-center
                      ${isSelected
                        ? `${p.color} border-current shadow-sm`
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'}
                    `}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-emerald-400" />
              Target Deadline (Optional)
            </label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="input-field text-xs text-slate-300"
            />
          </div>

          {/* Constraints */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Scheduling Preferences / Constraints
            </label>
            <input
              type="text"
              value={constraints}
              onChange={(e) => setConstraints(e.target.value)}
              placeholder="e.g., Morning focus block only, Avoid Fridays"
              className="input-field text-xs"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Add Task</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
