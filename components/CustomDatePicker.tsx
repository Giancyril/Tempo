import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

export interface DateRange {
  from: Date | null;
  to: Date | null;
}

interface CustomDatePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function startOfMonth(y: number, m: number) {
  return new Date(y, m, 1);
}

function endOfMonth(y: number, m: number) {
  return new Date(y, m + 1, 0);
}

function isSameDay(a: Date | null, b: Date | null) {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function isBetween(d: Date, from: Date | null, to: Date | null) {
  if (!from || !to) return false;
  return d > from && d < to;
}

function formatDate(d: Date | null) {
  if (!d) return null;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  className = '',
}) => {
  const today = new Date();
  const [open, setOpen]       = useState(false);
  const [viewYear, setYear]   = useState(today.getFullYear());
  const [viewMonth, setMonth] = useState(today.getMonth());
  const [hovered, setHovered] = useState<Date | null>(null);
  const ref = useRef<HTMLDivElement>(null);

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
    if (viewMonth === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  const handleDayClick = (day: Date) => {
    if (!value.from || (value.from && value.to)) {
      // Start a new selection
      onChange({ from: day, to: null });
    } else {
      // Complete the range (enforce from <= to)
      if (day < value.from) {
        onChange({ from: day, to: value.from });
      } else {
        onChange({ from: value.from, to: day });
      }
      setOpen(false);
    }
  };

  const clearRange = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({ from: null, to: null });
  };

  // Build calendar grid
  const firstDay  = startOfMonth(viewYear, viewMonth).getDay(); // 0=Sun
  const lastDate  = endOfMonth(viewYear, viewMonth).getDate();
  const totalCells = Math.ceil((firstDay + lastDate) / 7) * 7;
  const cells: (Date | null)[] = Array.from({ length: totalCells }, (_, i) => {
    const d = i - firstDay + 1;
    return d >= 1 && d <= lastDate ? new Date(viewYear, viewMonth, d) : null;
  });

  // Effective "to" for hover-preview
  const effectiveTo = value.to ?? hovered;

  // Label shown in trigger button
  const label = value.from
    ? value.to
      ? `${formatDate(value.from)} → ${formatDate(value.to)}`
      : `${formatDate(value.from)} → …`
    : 'Date Range';

  const hasRange = value.from || value.to;

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`
          flex items-center gap-1.5 pl-3 pr-2.5 py-1.5 text-xs font-semibold
          bg-white/5 border border-white/[0.07] rounded-lg hover:bg-white/8 transition-colors focus:outline-none
          ${hasRange ? 'text-cyan-400' : 'text-gray-400'}
        `}
      >
        <Calendar className="w-3.5 h-3.5 shrink-0" />
        <span className="hidden sm:inline whitespace-nowrap max-w-[200px] truncate">{label}</span>
        {hasRange && (
          <span
            role="button"
            onClick={clearRange}
            className="ml-0.5 p-0.5 rounded hover:bg-white/10 text-gray-500 hover:text-gray-200 transition-colors"
          >
            <X className="w-2.5 h-2.5" />
          </span>
        )}
      </button>

      {/* Popover */}
      {open && (
        <div className="absolute top-full mt-1.5 right-0 z-50 bg-gray-900 border border-white/10 rounded-2xl shadow-2xl shadow-black/50 p-4 w-72">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-sm font-bold text-white">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map(d => (
              <div key={d} className="text-center text-[10px] font-semibold text-gray-600 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;

              const isFrom = isSameDay(day, value.from);
              const isTo   = isSameDay(day, value.to);
              const inRange = isBetween(day, value.from, effectiveTo) && !(!value.to && !hovered);
              const isToday = isSameDay(day, today);
              const isFuture = day > today;

              return (
                <button
                  key={i}
                  type="button"
                  disabled={isFuture}
                  onMouseEnter={() => value.from && !value.to && setHovered(day)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => handleDayClick(day)}
                  className={`
                    relative h-8 w-full flex items-center justify-center text-xs font-medium
                    transition-all duration-100 rounded-lg
                    ${isFuture ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer'}
                    ${isFrom || isTo
                      ? 'bg-cyan-500 text-white font-bold shadow-sm shadow-cyan-500/30'
                      : inRange
                        ? 'bg-cyan-500/15 text-cyan-300'
                        : isToday
                          ? 'text-cyan-400 font-bold'
                          : 'text-gray-300 hover:bg-white/5'}
                  `}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          {/* Range hint */}
          <div className="mt-3 pt-3 border-t border-white/5 text-center text-[11px] text-gray-600">
            {!value.from
              ? 'Click to set start date'
              : !value.to
                ? 'Click to set end date'
                : `${formatDate(value.from)} → ${formatDate(value.to)}`}
          </div>

          {/* Quick presets */}
          <div className="mt-2.5 flex flex-wrap gap-1.5 justify-center">
            {[
              { label: 'Today',   fn: () => { const d = new Date(); onChange({ from: d, to: d }); setOpen(false); } },
              { label: 'Last 7d', fn: () => { const t=new Date(),f=new Date(); f.setDate(t.getDate()-6); onChange({from:f,to:t}); setOpen(false); } },
              { label: 'Last 30d',fn: () => { const t=new Date(),f=new Date(); f.setDate(t.getDate()-29); onChange({from:f,to:t}); setOpen(false); } },
              { label: 'This month', fn: () => { const t=new Date(); onChange({from:startOfMonth(t.getFullYear(),t.getMonth()),to:t}); setOpen(false); } },
            ].map(p => (
              <button
                key={p.label}
                type="button"
                onClick={p.fn}
                className="px-2.5 py-1 text-[10px] font-semibold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/[0.06] rounded-lg transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
