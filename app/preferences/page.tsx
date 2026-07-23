'use client';

import React from 'react';
import { PreferencesForm } from '@/components/PreferencesForm';
import { Settings } from 'lucide-react';

export default function PreferencesPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-brand-400" />
          Scheduling Preferences
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Customize working hours, focus time blocks, and buffer spacing for optimal calendar planning.
        </p>
      </div>

      <PreferencesForm />
    </div>
  );
}
