'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Check, Sparkles, Zap, Sun, Sunset, Moon, Compass } from 'lucide-react';
import { CustomSelectDropdown } from './CustomSelectDropdown';

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

const CHRONOTYPES = [
  {
    id: 'morning',
    title: 'Morning Person',
    subtitle: 'Peak focus 9 AM – 12 PM',
    icon: Sun,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10 border-amber-500/30',
    defaultStart: '09:00',
    defaultEnd: '12:00',
  },
  {
    id: 'evening',
    title: 'Afternoon / Evening',
    subtitle: 'Peak focus 1 PM – 5 PM',
    icon: Sunset,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10 border-orange-500/30',
    defaultStart: '13:00',
    defaultEnd: '17:00',
  },
  {
    id: 'night',
    title: 'Night Owl',
    subtitle: 'Peak focus 6 PM – 10 PM',
    icon: Moon,
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10 border-indigo-500/30',
    defaultStart: '18:00',
    defaultEnd: '22:00',
  },
  {
    id: 'flexible',
    title: 'Flexible / Standard',
    subtitle: 'No energy profiling',
    icon: Compass,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10 border-emerald-500/30',
    defaultStart: '09:00',
    defaultEnd: '12:00',
  },
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

  // Chronotype & Energy fields
  const [chronotype, setChronotype] = useState('morning');
  const [peakStart, setPeakStart] = useState('09:00');
  const [peakEnd, setPeakEnd] = useState('12:00');

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
          if (data.chronotype) setChronotype(data.chronotype);
          if (data.peakStart) setPeakStart(data.peakStart);
          if (data.peakEnd) setPeakEnd(data.peakEnd);
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

  function handleSelectChronotype(c: typeof CHRONOTYPES[number]) {
    setChronotype(c.id);
    if (c.id !== 'flexible') {
      setPeakStart(c.defaultStart);
      setPeakEnd(c.defaultEnd);
    }
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
          chronotype,
          peakStart,
          peakEnd,
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

      {/* ── Working Hours ──────────────────────────── */}
      <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
              <Clock className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Working Hours</h3>
              <p className="text-[11px] text-slate-500">Define your overall productive window</p>
            </div>
          </div>
          {savedSuccess && (
            <span className="px-3 py-1 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 animate-fade-in">
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
          </div>
        </div>
      </section>

      {/* ── Chronotype & Energy-Level Scheduling ── */}
      <section className="bg-slate-900/60 border border-indigo-500/30 rounded-2xl p-6 space-y-5 bg-gradient-to-b from-indigo-950/20 to-slate-900/60">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <Sun className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Chronotype & Energy Profile</h3>
              <span className="badge badge-amber text-[10px]">AI Feature</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Schedules P1/P2 deep focus tasks during peak hours, and lightweight tasks during slump hours.
            </p>
          </div>
        </div>

        {/* Persona Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {CHRONOTYPES.map((c) => {
            const Icon = c.icon;
            const isSelected = chronotype === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => handleSelectChronotype(c)}
                className={`
                  p-3.5 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between space-y-2
                  ${isSelected
                    ? `${c.bgColor} shadow-lg ring-1 ring-amber-500/50 scale-[1.02]`
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'}
                `}
              >
                <div className="flex items-center justify-between w-full">
                  <Icon className={`w-5 h-5 ${c.color}`} />
                  {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-white">{c.title}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{c.subtitle}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Peak Energy Window Controls */}
        {chronotype !== 'flexible' && (
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 animate-fade-in">
            <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Customize Peak Energy Window
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-slate-400 uppercase">
                  Peak Start
                </label>
                <CustomSelectDropdown
                  value={peakStart}
                  onChange={setPeakStart}
                  options={TIME_SLOTS}
                  allLabel="Select peak start"
                  allValue=""
                  className="w-full"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-slate-400 uppercase">
                  Peak End
                </label>
                <CustomSelectDropdown
                  value={peakEnd}
                  onChange={setPeakEnd}
                  options={TIME_SLOTS}
                  allLabel="Select peak end"
                  allValue=""
                  className="w-full"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-500">
              High-priority (P1/P2) tasks will be placed in the <span className="text-amber-400 font-semibold">{peakStart} – {peakEnd}</span> slot first.
            </p>
          </div>
        )}
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
      </section>

      {/* ── Focus & Buffer Settings (Multi-Session Splitting) ── */}
      <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Focus & Smart Session Splitting</h3>
            <p className="text-[11px] text-slate-500">Control maximum session depth for multi-session splitting</p>
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
            <p className="text-[10px] text-emerald-400 font-medium">
              💡 Tasks exceeding {maxFocusBlockMin} mins automatically split into multi-day blocks.
            </p>
          </div>
        </div>
      </section>

      {/* ── Summary Preview ──────────────────────── */}
      <section className="bg-slate-950/80 border border-indigo-500/20 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold text-indigo-300">Active AI Scheduling Profile</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
            🕐 {workStart} – {workEnd}
          </span>
          {chronotype !== 'flexible' && (
            <span className="px-2.5 py-1 rounded-lg bg-amber-950/50 border border-amber-800/60 text-[11px] text-amber-300 font-medium">
              ⚡ Peak: {peakStart} – {peakEnd} ({chronotype})
            </span>
          )}
          <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
            📅 Off: {daysOff.length > 0 ? daysOff.map(d => DAY_SHORT[d]).join(', ') : 'None'}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
            ☕ {bufferMinutes}m buffer
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-[11px] text-emerald-300 font-medium">
            🔗 Max {maxFocusBlockMin}m split block
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
              Saving Profile...
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
