import type { MultiSelectOption } from './MultiSelect';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

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
    return <p className="py-2 text-[14px] leading-6 text-[#858a85]">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-3">
      {allLabel && (
        <button
          type="button"
          onClick={() => onChange([])}
          className={`block w-full rounded-sm text-left text-[14px] leading-6 transition-colors hover:text-[#315f24] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#87905f] ${
            values.length === 0 ? 'font-semibold text-[#315f24]' : 'font-normal text-[#1a1c1b]'
          }`}
          aria-pressed={values.length === 0}
        >
          {allLabel}
        </button>
      )}

      <div className={allLabel ? 'relative ml-3 border-l border-[#d8dbd5] py-1' : 'relative py-1'}>
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
            <div key={option.value} className="relative flex min-h-11 w-full items-center">
              {selected && (
                <span
                  className="absolute -left-[3px] top-1/2 h-8 w-[5px] -translate-y-1/2 rounded-full bg-[#4da83d]"
                  aria-hidden="true"
                />
              )}
              <button
                type="button"
                onClick={() => toggleValue(option.value)}
                style={{ paddingLeft: `${20 + depth * 22}px` }}
                className={`flex min-w-0 flex-1 items-center py-2.5 pr-1 text-left text-[14px] leading-5 transition-colors hover:text-[#315f24] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#87905f] ${
                  selected ? 'font-bold text-[#315f24]' : 'font-normal text-[#171918]'
                }`}
                aria-pressed={selected}
              >
                <span>{option.label}</span>
              </button>
              {hasChildren && (
                <button
                  type="button"
                  onClick={() => toggleNode(option.value)}
                  className="ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-[#5f6461] transition-colors hover:text-[#315f24] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#87905f]"
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
