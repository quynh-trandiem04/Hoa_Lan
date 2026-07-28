import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, ChevronRight } from 'lucide-react';

interface InlineTreeCategory {
  id: string;
  name: string;
  parentId?: string | null;
}

interface InlineCategoryTreePickerProps {
  categories: InlineTreeCategory[];
  value: string;
  onChange: (id: string) => void;
  allLabel?: string;
  emptyLabel?: string;
}

export default function InlineCategoryTreePicker({
  categories,
  value,
  onChange,
  allLabel = 'Tất cả danh mục',
  emptyLabel = 'Chưa có danh mục phù hợp.',
}: InlineCategoryTreePickerProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const { categoryById, childrenByParent, roots } = useMemo(() => {
    const byId = new Map(categories.map((category) => [category.id, category]));
    const grouped = new Map<string | null, InlineTreeCategory[]>();

    categories.forEach((category) => {
      const parentKey = category.parentId && byId.has(category.parentId)
        ? category.parentId
        : null;
      grouped.set(parentKey, [...(grouped.get(parentKey) ?? []), category]);
    });

    return {
      categoryById: byId,
      childrenByParent: grouped,
      roots: grouped.get(null) ?? [],
    };
  }, [categories]);

  useEffect(() => {
    if (!value) return;

    const ancestorIds = new Set<string>();
    let current = categoryById.get(value);
    const visited = new Set<string>();

    while (current?.parentId && !visited.has(current.parentId)) {
      visited.add(current.parentId);
      ancestorIds.add(current.parentId);
      current = categoryById.get(current.parentId);
    }

    if (ancestorIds.size > 0) {
      setExpandedIds((existing) => new Set([...existing, ...ancestorIds]));
    }
  }, [categoryById, value]);

  const toggleExpanded = (id: string) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderCategory = (category: InlineTreeCategory, depth = 0): React.ReactNode => {
    const children = childrenByParent.get(category.id) ?? [];
    const hasChildren = children.length > 0;
    const expanded = expandedIds.has(category.id);
    const selected = value === category.id;

    return (
      <div key={category.id}>
        <div
          className={`flex min-h-10 items-center gap-2 text-sm transition-colors ${
            selected
              ? 'font-bold text-[#56642b]'
              : depth === 0
                ? 'font-semibold text-charcoal-text'
                : 'text-[#5f6461]'
          }`}
          style={{ paddingLeft: `${depth * 22}px` }}
        >
          <button
            type="button"
            onClick={() => onChange(category.id)}
            className="min-w-0 flex-1 py-2.5 text-left hover:text-[#56642b]"
            aria-pressed={selected}
          >
            {category.name}
          </button>

          {selected && <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />}

          {hasChildren && (
            <button
              type="button"
              onClick={() => toggleExpanded(category.id)}
              className="flex h-9 w-8 shrink-0 items-center justify-center rounded text-charcoal-text transition-colors hover:bg-[#f2f4e9] hover:text-[#56642b]"
              aria-label={`${expanded ? 'Thu gọn' : 'Mở rộng'} ${category.name}`}
              aria-expanded={expanded}
            >
              {expanded
                ? <ChevronDown className="h-3.5 w-3.5" />
                : <ChevronRight className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>

        {hasChildren && expanded && children.map((child) => renderCategory(child, depth + 1))}
      </div>
    );
  };

  if (roots.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-outline-variant px-4 py-6 text-center text-xs text-outline">
        {emptyLabel}
      </p>
    );
  }

  return (
    <div className="max-h-72 overflow-y-auto pr-1">
      <button
        type="button"
        onClick={() => onChange('')}
        className={`flex w-full items-center justify-between gap-2 py-2.5 text-left text-sm transition-colors ${
          !value
            ? 'font-bold text-[#56642b]'
            : 'font-medium text-[#434748] hover:text-[#56642b]'
        }`}
        aria-pressed={!value}
      >
        <span>{allLabel}</span>
        {!value && <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />}
      </button>

      <div className="ml-2 border-l border-[#d9dcd5] pl-3">
        {roots.map((category) => renderCategory(category))}
      </div>
    </div>
  );
}
