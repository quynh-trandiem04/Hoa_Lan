import type { MultiSelectOption } from './MultiSelect';

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
  const toggleValue = (value: string) => {
    onChange(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
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
          className={`block w-full py-2 text-left text-xs transition-colors ${values.length === 0 ? 'font-bold text-[#56642b]' : 'font-medium text-[#434748] hover:text-[#56642b]'}`}
          aria-pressed={values.length === 0}
        >
          {allLabel}
        </button>
      )}

      <div className={allLabel ? 'ml-2 border-l border-[#d9dcd5] pl-3' : ''}>
        {options.map((option) => {
          const selected = values.includes(option.value);
          const depth = option.depth ?? 0;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => toggleValue(option.value)}
              className={`block w-full py-2 text-left text-xs leading-5 transition-colors ${selected ? 'font-bold text-[#56642b]' : depth === 0 ? 'font-semibold text-[#343837] hover:text-[#56642b]' : 'font-normal text-[#5f6461] hover:text-[#56642b]'}`}
              style={{ paddingLeft: `${depth * 22}px` }}
              aria-pressed={selected}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
