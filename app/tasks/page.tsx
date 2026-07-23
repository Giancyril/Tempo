'use client';

import React, { useState, useEffect } from 'react';
import { TaskList, TaskItem } from '@/components/TaskList';
import { TaskFormModal } from '@/components/TaskFormModal';
import { Plus, CheckSquare, Search, Filter } from 'lucide-react';
import { CustomSelectDropdown } from '@/components/CustomSelectDropdown';

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

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

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || t.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-brand-400" />
            Task Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Organize tasks, define constraints, and set priorities for the AI scheduling agent.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-semibold text-sm shadow-glow-indigo transition-all transform hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" /> Add New Task
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="relative bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center gap-4" style={{ overflow: 'visible' }}>
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500"
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

      {/* Tasks List Component */}
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
