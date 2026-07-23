import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface CustomSingleDatePickerProps {
  value: string; // "YYYY-MM-DD"
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  allowFuture?: boolean;
  align?: 'left' | 'right';
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function startOfMonth(y: number, m: number) {
  return new Date(y, m, 1);
}

function endOfMonth(y: number, m: number) {
  return new Date(y, m + 1, 0);
}

function parseLocalDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const d = new Date(year, month, day);
  return isNaN(d.getTime()) ? null : d;
}

function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isSameDay(a: Date | null, b: Date | null) {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function formatDateLabel(dateStr: string) {
  const d = parseLocalDate(dateStr);
  if (!d) return null;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export const CustomSingleDatePicker: React.FC<CustomSingleDatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Select Date',
  className = '',
  allowFuture = true,
  align = 'left',
}) => {
  const today = new Date();
  const initialDate = parseLocalDate(value) || today;
  const [open, setOpen] = useState(false);
  const [viewYear, setYear] = useState(initialDate.getFullYear());
  const [viewMonth, setMonth] = useState(initialDate.getMonth());
  const ref = useRef<HTMLDivElement>(null);

  // Sync view when value changes from outside
  useEffect(() => {
    const d = parseLocalDate(value);
    if (d) {
      setYear(d.getFullYear());
      setMonth(d.getMonth());
    }
  }, [value]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setYear(y => y - 1);
      setMonth(11);
    } else {
      setMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setYear(y => y + 1);
      setMonth(0);
    } else {
      setMonth(m => m + 1);
    }
  };

  const handleDayClick = (day: Date) => {
    onChange(toLocalDateString(day));
    setOpen(false);
  };

  const clearValue = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  // Build calendar grid
  const firstDay = startOfMonth(viewYear, viewMonth).getDay(); // 0=Sun
  const lastDate = endOfMonth(viewYear, viewMonth).getDate();
  const totalCells = Math.ceil((firstDay + lastDate) / 7) * 7;
  const cells: (Date | null)[] = Array.from({ length: totalCells }, (_, i) => {
    const d = i - firstDay + 1;
    return d >= 1 && d <= lastDate ? new Date(viewYear, viewMonth, d) : null;
  });

  const selectedDate = parseLocalDate(value);
  const label = value ? formatDateLabel(value) : placeholder;

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`
          flex items-center justify-between w-full pl-3 pr-2.5 py-2 text-xs font-semibold
          bg-slate-950 border border-slate-800 rounded-lg hover:bg-slate-900 transition-colors focus:outline-none
          ${value ? 'text-cyan-400 border-cyan-500/30' : 'text-slate-500'}
        `}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <Calendar className="w-3.5 h-3.5 shrink-0 text-slate-500" />
          <span className="truncate">{label}</span>
        </div>
        {value && (
          <span
            role="button"
            onClick={clearValue}
            className="p-0.5 rounded hover:bg-white/10 text-slate-500 hover:text-slate-200 transition-colors"
          >
            <X className="w-3 h-3" />
          </span>
        )}
      </button>

      {/* Popover */}
      {open && (
        <div className={`absolute top-full mt-1.5 ${align === 'right' ? 'right-0' : 'left-0'} z-50 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-black/80 p-4 w-72`}>
          {/* Month/Year navigation */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-sm font-bold text-slate-200 select-none">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-slate-600 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;

              const isSelected = isSameDay(day, selectedDate);
              const isToday = isSameDay(day, today);
              const isFuture = day > today;
              const disabled = !allowFuture && isFuture;

              return (
                <button
                  key={i}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleDayClick(day)}
                  className={`
                    relative h-8 w-full flex items-center justify-center text-xs font-semibold
                    transition-all duration-100 rounded-lg
                    ${disabled ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer'}
                    ${isSelected
                      ? 'bg-indigo-600 text-white font-bold shadow-sm shadow-indigo-600/30'
                      : isToday
                        ? 'text-cyan-400 font-bold border border-cyan-400/20 bg-cyan-400/5'
                        : 'text-slate-300 hover:bg-slate-800'}
                  `}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          {/* Actions */}
          <div className="mt-3 pt-3 border-t border-slate-800 flex justify-between items-center">
            <button
              type="button"
              onClick={() => handleDayClick(today)}
              className="px-2.5 py-1 text-[10px] font-semibold text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/15 border border-cyan-500/20 rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-2.5 py-1 text-[10px] font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
