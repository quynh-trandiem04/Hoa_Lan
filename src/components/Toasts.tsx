/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastsProps {
  toasts: Toast[];
  removeToast: (id: string) => void;
}

export const Toasts: React.FC<ToastsProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full">
      <AnimatePresence>
        {toasts.map((toast) => {
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              className={`p-4 rounded-lg shadow-lg border flex items-center justify-between gap-3 bg-white ${
                toast.type === 'success'
                  ? 'border-secondary/20'
                  : toast.type === 'error'
                  ? 'border-error/20'
                  : 'border-antique-gold/20'
              }`}
            >
              <div className="flex items-center gap-2">
                {toast.type === 'success' && (
                  <CheckCircle className="w-5 h-5 text-secondary shrink-0" />
                )}
                {toast.type === 'error' && (
                  <AlertCircle className="w-5 h-5 text-error shrink-0" />
                )}
                {toast.type === 'info' && (
                  <Info className="w-5 h-5 text-antique-gold shrink-0" />
                )}
                <span className="text-sm font-medium text-charcoal-text leading-tight">
                  {toast.message}
                </span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-outline hover:text-charcoal-text transition-colors p-0.5 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

// Hook utility definition
export function useToasts() {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}
