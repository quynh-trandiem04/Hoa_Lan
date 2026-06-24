import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'info' | 'error';
  onClose: () => void;
}

export default function Toast({ message, type = 'success', onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-charcoal-text text-white px-5 py-3 rounded-lg shadow-xl border border-outline-variant/30 animate-bounce duration-500">
      {type === 'success' && <CheckCircle className="w-5 h-5 text-soft-olive" />}
      {type === 'error' && <AlertCircle className="w-5 h-5 text-red-400" />}
      <span className="text-sm font-sans tracking-wide font-medium">{message}</span>
      <button onClick={onClose} className="ml-3 hover:text-soft-olive transition-colors text-outline">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
