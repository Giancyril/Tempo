'use client';

import React, { useState, useEffect } from 'react';
import { TaskList, TaskItem } from '@/components/TaskList';
import { TaskFormModal } from '@/components/TaskFormModal';
import { NaturalLanguageTaskBar } from '@/components/NaturalLanguageTaskBar';
import { Plus, CheckSquare, Search, Filter, Sparkles } from 'lucide-react';
import { CustomSelectDropdown } from '@/components/CustomSelectDropdown';

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [quickCreateSuccess, setQuickCreateSuccess] = useState('');

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    try {
      const res = await fetch('/api/tasks');
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
    }
  }

  /** Called by NaturalLanguageTaskBar after AI parses + POSTs a task directly */
  async function handleQuickCreate(parsed: {
    title: string;
    durationMin: number;
    priority: number;
    category: string;
    deadline?: string | null;
    constraints?: string | null;
  }) {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: parsed.title,
          durationMin: parsed.durationMin,
          priority: parsed.priority,
          category: parsed.category,
          deadline: parsed.deadline || null,
          constraints: parsed.constraints || null,
        }),
      });
      if (res.ok) {
        await loadTasks();
        setQuickCreateSuccess(`✓ Task "${parsed.title}" added via AI!`);
        setTimeout(() => setQuickCreateSuccess(''), 4000);
      }
    } catch (err) {
      console.error('Quick create failed:', err);
    }
  }

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || t.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-indigo-400" />
            Task Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Organize tasks, define constraints, and set priorities for the AI scheduling agent.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary px-5 py-2.5 text-sm shadow-glow-indigo"
        >
          <Plus className="w-4 h-4" />
          <span>Add Task Manually</span>
        </button>
      </div>

      {/* ── Natural Language Quick Add Bar ────────────────────────── */}
      <div className="card p-4 space-y-2 border-indigo-500/20 bg-gradient-to-r from-dark-card via-indigo-950/20 to-dark-card">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <span className="text-xs font-bold text-indigo-300">AI Quick-Add</span>
          <span className="badge badge-indigo ml-1">Natural Language</span>
        </div>
        <NaturalLanguageTaskBar onTaskParsed={handleQuickCreate} />
        {quickCreateSuccess && (
          <p className="text-[11px] text-emerald-400 font-semibold pl-1 animate-fade-in">
            {quickCreateSuccess}
          </p>
        )}
      </div>

      {/* ── Filter & Search Bar ──────────────────────────────────── */}
      <div
        className="bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center gap-4"
        style={{ overflow: 'visible' }}
      >
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <CustomSelectDropdown
            value={selectedCategory}
            onChange={setSelectedCategory}
            allLabel="All Categories"
            allValue="all"
            options={[
              { id: 'work',     name: '💼 Work' },
              { id: 'study',    name: '📚 Study' },
              { id: 'personal', name: '🏡 Personal' },
              { id: 'health',   name: '🧘 Health' },
            ]}
            className="w-44"
          />
        </div>
      </div>

      {/* ── Task count summary ────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-1 text-xs text-slate-400">
        <span>
          Showing <span className="font-bold text-slate-200">{filteredTasks.length}</span> of{' '}
          <span className="font-bold text-slate-200">{tasks.length}</span> tasks
        </span>
        {selectedCategory !== 'all' && (
          <button
            onClick={() => setSelectedCategory('all')}
            className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors"
          >
            Clear filter
          </button>
        )}
      </div>

      {/* ── Tasks List ───────────────────────────────────────────── */}
      <TaskList
        tasks={filteredTasks}
        onTaskDeleted={loadTasks}
        onTaskUpdated={loadTasks}
      />

      <TaskFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTaskCreated={loadTasks}
      />
    </div>
  );
}
