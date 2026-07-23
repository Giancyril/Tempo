import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

interface SelectOption {
  id: string;
  name: string;
}

interface CustomSelectDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  /**
   * Optional leading "all" option label. If omitted or allValue is empty-string,
   * no leading option is prepended – the options array is used as-is.
   */
  allLabel?: string;
  allValue?: string;
  className?: string;
}

export const CustomSelectDropdown: React.FC<CustomSelectDropdownProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  allLabel,
  allValue = 'all',
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Position the portal dropdown relative to the trigger button
  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: 'fixed',
      top: rect.bottom + 6,
      left: rect.left,
      width: Math.max(rect.width, 200),
      zIndex: 9999,
    });
  }, [open]);

  // Close when clicking outside either the trigger or the portal dropdown
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Only prepend the "all" option when allLabel is provided and allValue is non-empty
  const allOption: SelectOption[] =
    allLabel && allValue ? [{ id: allValue, name: allLabel }] : [];
  const allOptions: SelectOption[] = [...allOption, ...options];
  const selected = allOptions.find(o => o.id === value);
  const label = selected?.name ?? placeholder;

  const dropdownList = (
    <div
      ref={dropdownRef}
      style={dropdownStyle}
      className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl shadow-black/60 overflow-hidden py-1 max-h-60 overflow-y-auto"
    >
      {allOptions.map(opt => (
        <button
          key={opt.id}
          type="button"
          onClick={() => {
            onChange(opt.id);
            setOpen(false);
          }}
          className={`
            w-full flex items-center justify-between gap-3 px-3 py-2 text-xs text-left
            transition-colors hover:bg-slate-800/80 focus:outline-none
            ${value === opt.id ? 'text-indigo-400 font-semibold bg-indigo-500/5' : 'text-slate-300 font-medium'}
          `}
        >
          <span>{opt.name}</span>
          {value === opt.id && <Check className="w-3 h-3 text-indigo-400 shrink-0" />}
        </button>
      ))}
      {options.length === 0 && (
        <p className="px-3 py-2 text-[11px] text-slate-600 italic">No options available</p>
      )}
    </div>
  );

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center justify-between gap-1.5 w-full pl-3 pr-2.5 py-2 text-xs font-semibold text-slate-300 bg-slate-950 border border-slate-800 rounded-lg hover:bg-slate-900 hover:border-slate-700 transition-colors focus:outline-none select-none"
      >
        <span className="truncate text-left">{label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-500 shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {mounted && open && createPortal(dropdownList, document.body)}
    </div>
  );
};
