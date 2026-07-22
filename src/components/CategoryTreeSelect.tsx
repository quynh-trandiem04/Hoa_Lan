import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface TreeCategory {
  id: string;
  name: string;
  parentId?: string | null;
}

interface CategoryTreeSelectProps {
  categories: TreeCategory[];
  value: string;
  onChange: (id: string) => void;
  excludeId?: string;
  placeholder?: string;
  allLabel?: string;
  className?: string;
  triggerClassName?: string;
}

export default function CategoryTreeSelect({
  categories,
  value,
  onChange,
  excludeId,
  placeholder = 'Chọn danh mục cha',
  allLabel,
  className = '',
  triggerClassName = '',
}: CategoryTreeSelectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const { childrenByParent, roots, selectableCategories } = useMemo(() => {
    const excludedIds = new Set<string>();
    if (excludeId) excludedIds.add(excludeId);

    let changed = true;
    while (changed) {
      changed = false;
      categories.forEach((category) => {
        if (category.parentId && excludedIds.has(category.parentId) && !excludedIds.has(category.id)) {
          excludedIds.add(category.id);
          changed = true;
        }
      });
    }

    const selectable = categories.filter((category) => !excludedIds.has(category.id));
    const selectableIds = new Set(selectable.map((category) => category.id));
    const grouped = new Map<string | null, TreeCategory[]>();

    selectable.forEach((category) => {
      const parentKey = category.parentId && selectableIds.has(category.parentId) ? category.parentId : null;
      const siblings = grouped.get(parentKey) ?? [];
      siblings.push(category);
      grouped.set(parentKey, siblings);
    });

    grouped.forEach((siblings) => siblings.sort((a, b) => a.name.localeCompare(b.name, 'vi')));
    return {
      childrenByParent: grouped,
      roots: grouped.get(null) ?? [],
      selectableCategories: selectable,
    };
  }, [categories, excludeId]);

  const selectedCategory = selectableCategories.find((category) => category.id === value);

  useEffect(() => {
    setExpandedIds(new Set());
  }, [categories, excludeId]);

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

  const toggleExpanded = (id: string) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderNode = (category: TreeCategory, depth = 0): React.ReactNode => {
    const children = childrenByParent.get(category.id) ?? [];
    const hasChildren = children.length > 0;
    const expanded = expandedIds.has(category.id);
    const selected = category.id === value;

    return (
      <div key={category.id}>
        <div
          className={`flex items-center rounded transition-colors ${selected ? 'bg-[#56642b]/10 text-[#56642b]' : 'text-[#343837] hover:bg-[#f4f4f2]'}`}
          style={{ paddingLeft: `${8 + depth * 20}px` }}
        >
          {hasChildren ? (
            <button
              type="button"
              onClick={() => toggleExpanded(category.id)}
              className="flex h-8 w-7 shrink-0 items-center justify-center text-[#899073]"
              aria-label={`${expanded ? 'Thu gọn' : 'Mở rộng'} ${category.name}`}
            >
              {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          ) : (
            <span className="w-7 shrink-0" />
          )}
          <button
            type="button"
            onClick={() => {
              onChange(category.id);
              setOpen(false);
            }}
            className={`min-w-0 flex-1 py-2.5 pr-3 text-left text-sm ${depth === 0 ? 'font-semibold' : 'font-normal'}`}
          >
            {category.name}
          </button>
        </div>
        {hasChildren && expanded && children.map((child) => renderNode(child, depth + 1))}
      </div>
    );
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`flex min-h-10 w-full items-center justify-between gap-3 rounded-md border bg-white px-3 py-2 text-left text-xs shadow-sm transition-colors focus:outline-none ${open ? 'border-[#56642b] ring-2 ring-[#56642b]/10' : 'border-outline-variant hover:border-[#87905f]'} ${triggerClassName}`}
        aria-haspopup="tree"
        aria-expanded={open}
      >
        <span className={selectedCategory ? 'text-[#1a1c1b]' : 'text-[#747878]'}>
          {selectedCategory?.name ?? allLabel ?? placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-[90] max-h-72 w-max min-w-full max-w-[min(22rem,calc(100vw-2rem))] overflow-y-auto rounded-lg border border-outline-variant bg-white p-1.5 shadow-xl" role="tree">
          {allLabel && (
            <button
              type="button"
              onClick={() => {
                onChange('');
                setOpen(false);
              }}
              className={`flex w-full items-center rounded px-3 py-2.5 text-left text-sm transition-colors ${!value ? 'bg-[#56642b]/10 font-semibold text-[#56642b]' : 'text-[#343837] hover:bg-[#f4f4f2]'}`}
            >
              {allLabel}
            </button>
          )}
          {roots.length > 0
            ? roots.map((category) => renderNode(category))
            : <p className="px-3 py-4 text-center text-xs text-[#747878]">Chưa có danh mục phù hợp.</p>}
        </div>
      )}
    </div>
  );
}
