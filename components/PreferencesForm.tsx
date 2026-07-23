'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Check, Sparkles, Coffee, Zap } from 'lucide-react';
import { CustomSelectDropdown } from './CustomSelectDropdown';
import { CustomSingleDatePicker } from './CustomSingleDatePicker';

// Generate half-hour time slots for work start/end dropdowns
const TIME_SLOTS = Array.from({ length: 32 }, (_, i) => {
  const totalMins = 6 * 60 + i * 30; // 06:00 to 21:30
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  const hh = String(h).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  const label12 = h === 0
    ? `12:${mm} AM`
    : h < 12
      ? `${h}:${mm} AM`
      : h === 12
        ? `12:${mm} PM`
        : `${h - 12}:${mm} PM`;
  return { id: `${hh}:${mm}`, name: `${label12}  (${hh}:${mm})` };
});

const BUFFER_OPTIONS = [
  { id: '0', name: 'No buffer (0 mins)' },
  { id: '10', name: '10 minutes' },
  { id: '15', name: '15 minutes — Recommended' },
  { id: '30', name: '30 minutes' },
];

const FOCUS_BLOCK_OPTIONS = [
  { id: '60', name: '1 hour (60 mins)' },
  { id: '90', name: '1.5 hours (90 mins)' },
  { id: '120', name: '2 hours (120 mins) — Recommended' },
  { id: '180', name: '3 hours (180 mins)' },
];

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DAY_SHORT: Record<string, string> = {
  Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed',
  Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun',
};

export function PreferencesForm() {
  const [workStart, setWorkStart] = useState('09:00');
  const [workEnd, setWorkEnd] = useState('18:00');
  const [daysOff, setDaysOff] = useState<string[]>(['Saturday', 'Sunday']);
  const [bufferMinutes, setBufferMinutes] = useState('15');
  const [maxFocusBlockMin, setMaxFocusBlockMin] = useState('120');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    async function loadPreferences() {
      try {
        const res = await fetch('/api/preferences');
        if (res.ok) {
          const data = await res.json();
          if (data.workStart) setWorkStart(data.workStart);
          if (data.workEnd) setWorkEnd(data.workEnd);
          if (data.daysOffArray) setDaysOff(data.daysOffArray);
          if (data.bufferMinutes) setBufferMinutes(String(data.bufferMinutes));
          if (data.maxFocusBlockMin) setMaxFocusBlockMin(String(data.maxFocusBlockMin));
        }
      } catch (err) {
        console.error('Failed to load preferences:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPreferences();
  }, []);

  function toggleDayOff(day: string) {
    setDaysOff((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    try {
      const res = await fetch('/api/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workStart,
          workEnd,
          daysOff,
          bufferMinutes: Number(bufferMinutes),
          maxFocusBlockMin: Number(maxFocusBlockMin),
        }),
      });
      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save preferences:', err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-10 text-center text-slate-400 text-sm animate-pulse">
        Loading preference settings...
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-5">

      {/* ── Work Hours ──────────────────────────── */}
      <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
              <Clock className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Working Hours</h3>
              <p className="text-[11px] text-slate-500">Define your productive hours window</p>
            </div>
          </div>
          {savedSuccess && (
            <span className="px-3 py-1 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" /> Saved!
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Work Start Time
            </label>
            <CustomSelectDropdown
              value={workStart}
              onChange={setWorkStart}
              options={TIME_SLOTS}
              allLabel="Select start time"
              allValue=""
              className="w-full"
            />
            <p className="text-[10px] text-slate-600">AI will not schedule tasks before this time</p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Work End Time
            </label>
            <CustomSelectDropdown
              value={workEnd}
              onChange={setWorkEnd}
              options={TIME_SLOTS}
              allLabel="Select end time"
              allValue=""
              className="w-full"
            />
            <p className="text-[10px] text-slate-600">AI will not schedule tasks after this time</p>
          </div>
        </div>
      </section>

      {/* ── Days Off ────────────────────────────── */}
      <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Days Off</h3>
            <p className="text-[11px] text-slate-500">No tasks will be scheduled on selected days</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {WEEK_DAYS.map((day) => {
            const isOff = daysOff.includes(day);
            return (
              <button
                key={day}
                type="button"
                onClick={() => toggleDayOff(day)}
                className={`
                  flex flex-col items-center gap-0.5 w-14 py-2.5 rounded-xl text-xs font-semibold
                  border transition-all duration-150
                  ${isOff
                    ? 'bg-purple-600/20 border-purple-500/50 text-purple-300 shadow-sm shadow-purple-500/10'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'}
                `}
              >
                <span className="text-[11px] font-bold">{DAY_SHORT[day]}</span>
                {isOff && (
                  <span className="text-[9px] font-medium text-purple-400">Off</span>
                )}
              </button>
            );
          })}
        </div>

        <p className="text-[11px] text-slate-600">
          Currently off: {daysOff.length > 0 ? daysOff.join(', ') : 'None — AI will plan every day of the week'}
        </p>
      </section>

      {/* ── Focus & Buffer Settings ──────────────── */}
      <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Focus & Buffer Settings</h3>
            <p className="text-[11px] text-slate-500">Control session depth and mental recovery time</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Buffer Between Blocks
            </label>
            <CustomSelectDropdown
              value={bufferMinutes}
              onChange={setBufferMinutes}
              options={BUFFER_OPTIONS}
              allLabel="Select buffer time"
              allValue=""
              className="w-full"
            />
            <p className="text-[10px] text-slate-600">Breathing room between back-to-back focus sessions</p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Max Focus Session Length
            </label>
            <CustomSelectDropdown
              value={maxFocusBlockMin}
              onChange={setMaxFocusBlockMin}
              options={FOCUS_BLOCK_OPTIONS}
              allLabel="Select max session"
              allValue=""
              className="w-full"
            />
            <p className="text-[10px] text-slate-600">Longer tasks get split across multiple sessions</p>
          </div>
        </div>
      </section>

      {/* ── Summary Preview ──────────────────────── */}
      <section className="bg-slate-950/80 border border-indigo-500/20 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold text-indigo-300">Current AI Scheduling Constraints</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
            🕐 {workStart} – {workEnd}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
            📅 Off: {daysOff.length > 0 ? daysOff.map(d => DAY_SHORT[d]).join(', ') : 'None'}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
            ☕ {bufferMinutes}m buffer
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
            ⚡ Max {maxFocusBlockMin}m focus block
          </span>
        </div>
      </section>

      {/* ── Save Button ──────────────────────────── */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
        >
          {saving ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Save Preferences
            </>
          )}
        </button>
      </div>
    </form>
  );
}
