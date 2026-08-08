import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export interface ConfirmDialogOptions {
  title?: string;
  message?: string;
  itemName?: string;
  confirmLabel?: string;
}

interface ConfirmDialogProps extends ConfirmDialogOptions {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title = 'Xác nhận xóa',
  message = 'Dữ liệu sau khi xóa sẽ không thể khôi phục.',
  itemName,
  confirmLabel = 'Xóa',
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    confirmButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-[#111412]/55 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onMouseDown={onCancel}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-white/60 bg-[#fffef9] shadow-[0_24px_80px_rgba(16,20,12,0.32)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="relative px-6 pb-5 pt-6 sm:px-7">
          <button
            type="button"
            onClick={onCancel}
            className="absolute right-4 top-4 rounded-full p-2 text-[#747878] transition-colors hover:bg-[#f0f1ec] hover:text-[#1a1c1b]"
            aria-label="Đóng hộp thoại"
          >
            <X size={18} />
          </button>

          <div className="flex items-start gap-4 pr-8">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 ring-8 ring-red-50/50">
              <AlertTriangle size={23} strokeWidth={2} />
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-red-600">Thao tác không thể hoàn tác</p>
              <h2 id="confirm-dialog-title" className="mt-1.5 font-serif text-2xl font-bold leading-tight text-[#1a1c1b]">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-[#666b69]">{message}</p>
              {itemName && (
                <div className="mt-4 rounded-lg border border-red-100 bg-red-50/60 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-red-500">Đối tượng sẽ xóa</p>
                  <p className="mt-1 break-words text-sm font-bold text-[#3d403e]">{itemName}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-[#e7e8e2] bg-[#f8f8f4] px-6 py-4 sm:flex-row sm:justify-end sm:px-7">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-[#cfd2cb] bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#4f554e] transition-colors hover:bg-[#f0f1ec]"
          >
            Hủy bỏ
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            <Trash2 size={15} /> {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function useConfirmDialog() {
  const [options, setOptions] = useState<ConfirmDialogOptions | null>(null);
  const resolverRef = useRef<((confirmed: boolean) => void) | null>(null);

  const settle = useCallback((confirmed: boolean) => {
    resolverRef.current?.(confirmed);
    resolverRef.current = null;
    setOptions(null);
  }, []);

  const confirm = useCallback((nextOptions: ConfirmDialogOptions = {}) => new Promise<boolean>((resolve) => {
    resolverRef.current?.(false);
    resolverRef.current = resolve;
    setOptions(nextOptions);
  }), []);

  useEffect(() => () => resolverRef.current?.(false), []);

  const confirmDialog = (
    <ConfirmDialog
      isOpen={options !== null}
      {...(options ?? {})}
      onCancel={() => settle(false)}
      onConfirm={() => settle(true)}
    />
  );

  return { confirm, confirmDialog };
}
