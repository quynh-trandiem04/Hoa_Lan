import type { MultiSelectOption } from './MultiSelect';
import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

interface InlineTreeMultiSelectProps {
  options: MultiSelectOption[];
  values: string[];
  onChange: (values: string[]) => void;
  allLabel?: string;
  emptyMessage?: string;
}

export default function InlineTreeMultiSelect({
  options,
  values,
  onChange,
  allLabel,
  emptyMessage = 'Chưa có danh mục.',
}: InlineTreeMultiSelectProps) {
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  const toggleValue = (value: string) => {
    onChange(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  };

  const toggleNode = (value: string) => {
    setExpandedNodes((current) => ({ ...current, [value]: !current[value] }));
  };

  if (options.length === 0) {
    return <p className="py-2 text-xs text-[#858a85]">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-0.5">
      {allLabel && (
        <button
          type="button"
          onClick={() => onChange([])}
          className={`flex w-full items-center justify-between gap-2 py-2 text-left text-xs transition-colors ${values.length === 0 ? 'font-bold text-[#56642b]' : 'font-medium text-[#434748] hover:text-[#56642b]'}`}
          aria-pressed={values.length === 0}
        >
          <span>{allLabel}</span>
          {values.length === 0 && <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden="true" />}
        </button>
      )}

      <div className={allLabel ? 'ml-2 border-l border-[#d9dcd5] pl-3' : ''}>
        {options.map((option, index) => {
          const selected = values.includes(option.value);
          const depth = option.depth ?? 0;
          const hasChildren = (options[index + 1]?.depth ?? 0) > depth;
          const ancestors = options.slice(0, index).reduce<Array<{ value: string; depth: number }>>((stack, candidate, candidateIndex) => {
            const candidateDepth = candidate.depth ?? 0;
            while (stack.length > 0 && stack[stack.length - 1].depth >= candidateDepth) stack.pop();
            if ((options[candidateIndex + 1]?.depth ?? 0) > candidateDepth) {
              stack.push({ value: candidate.value, depth: candidateDepth });
            }
            return stack;
          }, []).filter((ancestor) => ancestor.depth < depth);
          if (ancestors.some((ancestor) => !expandedNodes[ancestor.value])) return null;

          return (
            <div key={option.value} className="flex w-full items-center" style={{ paddingLeft: `${depth * 22}px` }}>
              <button
                type="button"
                onClick={() => toggleValue(option.value)}
                className={`flex min-w-0 flex-1 items-center justify-between gap-2 py-2 text-left text-xs leading-5 transition-colors ${selected ? 'font-bold text-[#56642b]' : depth === 0 ? 'font-semibold text-[#343837] hover:text-[#56642b]' : 'font-normal text-[#5f6461] hover:text-[#56642b]'}`}
                aria-pressed={selected}
              >
                <span>{option.label}</span>
                {selected && <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden="true" />}
              </button>
              {hasChildren && (
                <button
                  type="button"
                  onClick={() => toggleNode(option.value)}
                  className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center text-[#5f6461] transition-colors hover:text-[#56642b]"
                  aria-label={`${expandedNodes[option.value] ? 'Thu gọn' : 'Mở rộng'} ${option.label}`}
                  aria-expanded={Boolean(expandedNodes[option.value])}
                >
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expandedNodes[option.value] ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
