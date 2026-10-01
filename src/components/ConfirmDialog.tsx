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
      className="fixed inset-0 z-[120] flex items-center justify-center bg-[#111412]/60 p-4 backdrop-blur-[3px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onMouseDown={onCancel}
    >
      <div
        className="w-full max-w-[460px] overflow-hidden rounded-[22px] border border-white/80 bg-[#fffef9] shadow-[0_28px_90px_rgba(16,20,12,0.34)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="relative px-6 pb-6 pt-7 sm:px-8">
          <button
            type="button"
            onClick={onCancel}
            className="absolute right-4 top-4 rounded-full p-2 text-[#8b8e89] transition-all hover:rotate-90 hover:bg-[#f0f1ec] hover:text-[#1a1c1b]"
            aria-label="Đóng hộp thoại"
          >
            <X size={18} />
          </button>

          <div className="flex items-start gap-4 pr-7">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 ring-8 ring-red-50/50">
              <AlertTriangle size={24} strokeWidth={2.2} />
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-600">Thao tác không thể hoàn tác</p>
              <h2 id="confirm-dialog-title" className="mt-2 font-sans text-[25px] font-extrabold leading-tight tracking-[-0.03em] text-[#171918]">{title}</h2>
              <p className="mt-3 text-[13px] leading-6 text-[#686d69]">{message}</p>
              {itemName && (
                <div className="mt-4 rounded-xl border border-red-200/70 bg-[#fff7f6] px-4 py-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-red-500">Đối tượng sẽ xóa</p>
                  <p className="mt-1.5 break-words text-sm font-bold text-[#343735]">{itemName}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2.5 border-t border-[#e7e8e2] bg-[#fafaf7] px-6 py-4.5 sm:flex-row sm:justify-end sm:px-8">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-[#cfd2cb] bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#4f554e] transition-all hover:-translate-y-0.5 hover:border-[#aeb3aa] hover:bg-[#f0f1ec]"
          >
            Hủy bỏ
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white bg-red-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-[0_0_0_2px_#dc2626,0_5px_12px_rgba(220,38,38,0.2)] transition-all hover:-translate-y-0.5 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
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
