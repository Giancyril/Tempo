'use client';

import React from 'react';
import { Clock, Calendar, CheckCircle2, Trash2, Zap, AlertCircle } from 'lucide-react';
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

export function formatDuration(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function TaskList({ tasks, onTaskDeleted, onTaskUpdated }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="card p-8 text-center border-dashed border-slate-800/80">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mx-auto flex items-center justify-center mb-3 text-indigo-400">
          <Zap className="w-6 h-6" />
        </div>
        <h4 className="text-slate-200 font-bold text-base">No tasks found</h4>
        <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto leading-relaxed">
          Create tasks with duration estimates and deadlines, then trigger AI scheduling to auto-plan your week.
        </p>
      </div>
    );
  }

  const getPriorityBadge = (priority: number) => {
    switch (priority) {
      case 1:
        return <span className="badge badge-red">● P1 Urgent</span>;
      case 2:
        return <span className="badge badge-amber">● P2 High</span>;
      case 3:
        return <span className="badge badge-indigo">● P3 Normal</span>;
      default:
        return <span className="badge badge-slate">P{priority} Low</span>;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category.toLowerCase()) {
      case 'work':
        return <span className="badge badge-indigo">💼 Work</span>;
      case 'study':
        return <span className="badge badge-purple">📚 Study</span>;
      case 'personal':
        return <span className="badge badge-amber">🏡 Personal</span>;
      case 'health':
        return <span className="badge badge-emerald">🧘 Health</span>;
      default:
        return <span className="badge badge-slate">{category}</span>;
    }
  };

  const getCategoryBorderClass = (category: string) => {
    switch (category.toLowerCase()) {
      case 'work':     return 'cat-border-work';
      case 'study':    return 'cat-border-study';
      case 'personal': return 'cat-border-personal';
      case 'health':   return 'cat-border-health';
      default:         return 'cat-border-default';
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
    <div className="space-y-2.5">
      {tasks.map((task) => (
        <div
          key={task.id}
          className={`
            card card-hover p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group
            ${getCategoryBorderClass(task.category)}
          `}
        >
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-white text-sm group-hover:text-brand-300 transition-colors truncate">
                {task.title}
              </span>
              {getPriorityBadge(task.priority)}
              {getCategoryBadge(task.category)}
              {task.status === 'scheduled' && (
                <span className="badge badge-emerald">
                  <CheckCircle2 className="w-3 h-3" /> Scheduled
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
              <span className="flex items-center gap-1.5 font-medium text-slate-300">
                <Clock className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                {formatDuration(task.durationMin)}
              </span>
              {task.deadline && (
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Calendar className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  Due: {format(parseISO(task.deadline), 'MMM d, h:mm a')}
                </span>
              )}
              {task.constraints && (
                <span className="text-amber-300 text-[11px] bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-800/40 font-medium">
                  ⚡ {task.constraints}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60 shrink-0">
            <button
              onClick={() => handleDelete(task.id)}
              className="btn-danger text-slate-500 hover:text-red-400 p-2 rounded-lg transition-colors"
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
