import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';

export interface MultiSelectOption {
  value: string;
  label: string;
  depth?: number;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  emptyMessage?: string;
}

export default function MultiSelect({
  options,
  values,
  onChange,
  placeholder = 'Chọn...',
  emptyMessage = 'Chưa có lựa chọn.',
}: MultiSelectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const selectedOptions = values
    .map((value) => options.find((option) => option.value === value))
    .filter((option): option is MultiSelectOption => Boolean(option));

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const toggleValue = (value: string) => {
    onChange(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  };

  return (
    <div ref={containerRef} className="relative">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setOpen((current) => !current);
          }
        }}
        className="flex min-h-11 w-full cursor-pointer items-center gap-2 rounded border border-[#747878]/25 bg-white px-2.5 py-2 text-left shadow-sm transition-colors focus:border-[#56642b] focus:outline-none"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
          {selectedOptions.length > 0 ? selectedOptions.map((option) => (
            <span key={option.value} className="inline-flex max-w-full items-center gap-1 rounded border border-[#cfd2cb] bg-[#eef0e9] px-2 py-1 text-[11px] font-medium text-[#343837]">
              <span className="truncate">{option.label}</span>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  toggleValue(option.value);
                }}
                className="shrink-0 rounded-full text-[#747878] hover:text-red-600"
                aria-label={`Bỏ chọn ${option.label}`}
              >
                <X size={12} />
              </button>
            </span>
          )) : <span className="px-1 text-xs text-[#858a85]">{placeholder}</span>}
        </div>

        {values.length > 0 && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onChange([]);
            }}
            className="shrink-0 border-r border-[#e2e3e1] py-1 pr-2 text-[#a0a4a1] hover:text-red-600"
            title="Xóa tất cả lựa chọn"
            aria-label="Xóa tất cả lựa chọn"
          >
            <X size={15} />
          </button>
        )}
        <ChevronDown className={`h-4 w-4 shrink-0 text-[#56642b] transition-transform ${open ? 'rotate-180' : ''}`} />
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-64 overflow-y-auto rounded border border-[#d5d7d3] bg-white p-1.5 shadow-xl" role="listbox" aria-multiselectable="true">
          {options.length > 0 ? options.map((option) => {
            const selected = values.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleValue(option.value)}
                className={`flex w-full items-center gap-2 rounded px-2 py-2 text-left text-xs transition-colors ${selected ? 'bg-[#56642b]/10 text-[#56642b]' : 'text-[#343837] hover:bg-[#f4f4f2]'}`}
                style={{ paddingLeft: `${8 + (option.depth ?? 0) * 18}px` }}
                role="option"
                aria-selected={selected}
              >
                <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${selected ? 'border-[#56642b] bg-[#56642b] text-white' : 'border-[#aeb2ad] bg-white'}`}>
                  {selected && <Check size={12} strokeWidth={3} />}
                </span>
                <span className={(option.depth ?? 0) === 0 ? 'font-semibold' : ''}>{option.label}</span>
              </button>
            );
          }) : <p className="px-3 py-5 text-center text-xs text-[#858a85]">{emptyMessage}</p>}
        </div>
      )}
    </div>
  );
}
