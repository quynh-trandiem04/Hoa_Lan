import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AdminPaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
}

const getVisiblePages = (currentPage: number, totalPages: number) => {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);
  const start = Math.min(Math.max(currentPage - 2, 1), totalPages - 4);
  return Array.from({ length: 5 }, (_, index) => start + index);
};

export default function AdminPagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  itemLabel = 'mục',
}: AdminPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);
  const startItem = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endItem = Math.min(safePage * pageSize, totalItems);

  return (
    <div className="mt-auto flex flex-col items-center justify-between gap-3 rounded-xl border border-outline-variant/50 bg-white px-4 py-3 sm:flex-row">
      <p className="text-xs text-outline">
        Hiển thị <strong className="text-on-surface">{startItem}–{endItem}</strong> trong{' '}
        <strong className="text-on-surface">{totalItems}</strong> {itemLabel}
      </p>
      <nav className="flex items-center gap-1" aria-label="Phân trang">
        <button
          type="button"
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage === 1}
          className="flex h-9 items-center gap-1 rounded-md border border-outline-variant px-2.5 text-xs font-semibold text-[#56642b] transition-colors hover:bg-[#eef1e2] disabled:cursor-not-allowed disabled:opacity-35"
          aria-label="Trang trước"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Trước</span>
        </button>
        {getVisiblePages(safePage, totalPages).map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={`flex h-9 min-w-9 items-center justify-center rounded-md border px-2 text-xs font-bold transition-colors ${
              page === safePage
                ? 'border-[#56642b] bg-[#56642b] text-white'
                : 'border-outline-variant bg-white text-on-surface hover:bg-[#eef1e2] hover:text-[#56642b]'
            }`}
            aria-current={page === safePage ? 'page' : undefined}
            aria-label={`Trang ${page}`}
          >
            {page}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage === totalPages}
          className="flex h-9 items-center gap-1 rounded-md border border-outline-variant px-2.5 text-xs font-semibold text-[#56642b] transition-colors hover:bg-[#eef1e2] disabled:cursor-not-allowed disabled:opacity-35"
          aria-label="Trang sau"
        >
          <span className="hidden sm:inline">Sau</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </nav>
    </div>
  );
}
