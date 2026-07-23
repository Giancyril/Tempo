'use client';

import React from 'react';
import { Clock, Calendar, AlertCircle, CheckCircle2, Trash2, Tag, Zap } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export interface TaskItem {
  id: string;
  title: string;
  durationMin: number;
  deadline?: string | null;
  priority: number;
  category: string;
  constraints?: string | null;
  status: string;
}

interface TaskListProps {
  tasks: TaskItem[];
  onTaskDeleted: (id: string) => void;
  onTaskUpdated: () => void;
}

export function TaskList({ tasks, onTaskDeleted, onTaskUpdated }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-8 text-center border border-dashed border-slate-800">
        <div className="w-12 h-12 rounded-full bg-slate-900 mx-auto flex items-center justify-center mb-3 text-slate-500">
          <Zap className="w-6 h-6 text-brand-400" />
        </div>
        <h4 className="text-slate-200 font-semibold text-base">No tasks added yet</h4>
        <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
          Add tasks with estimated durations and deadlines, then click "Generate AI Schedule" to automatically plan your week.
        </p>
      </div>
    );
  }

  const getPriorityBadge = (priority: number) => {
    switch (priority) {
      case 1:
        return <span className="px-2 py-0.5 rounded-md bg-red-500/20 text-red-300 border border-red-500/30 text-[11px] font-semibold">P1 - Urgent</span>;
      case 2:
        return <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-semibold">P2 - High</span>;
      case 3:
        return <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] font-semibold">P3 - Normal</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700 text-[11px]">P{priority}</span>;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category.toLowerCase()) {
      case 'work':
        return <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px]">💼 Work</span>;
      case 'study':
        return <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px]">📚 Study</span>;
      case 'personal':
        return <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px]">🏡 Personal</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 text-[11px]">{category}</span>;
    }
  };

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        onTaskDeleted(id);
      }
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="glass-panel-interactive rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
        >
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-white text-sm group-hover:text-brand-300 transition-colors">
                {task.title}
              </span>
              {getPriorityBadge(task.priority)}
              {getCategoryBadge(task.category)}
              {task.status === 'scheduled' && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 text-[10px] font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Scheduled
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-brand-400" />
                {task.durationMin} mins
              </span>
              {task.deadline && (
                <span className="flex items-center gap-1 text-slate-300">
                  <Calendar className="w-3.5 h-3.5 text-purple-400" />
                  Due: {format(parseISO(task.deadline), 'MMM d, h:mm a')}
                </span>
              )}
              {task.constraints && (
                <span className="text-amber-400/90 text-[11px] bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/50">
                  ⚡ {task.constraints}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
            <button
              onClick={() => handleDelete(task.id)}
              className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-900 transition-colors"
              title="Delete Task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
