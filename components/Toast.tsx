'use client';

import { useState, useEffect, useCallback } from 'react';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastProps) {
  return (
    <div className="fixed top-16 right-4 z-50 flex flex-col gap-2 max-w-xs w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-3 rounded-xl px-4 py-3 shadow-lg text-sm font-medium border animate-toast-in
            ${t.type === 'success' ? 'bg-pandan/10 border-pandan text-pandan' : ''}
            ${t.type === 'warning' ? 'bg-amber-50 border-amber-300 text-amber-800' : ''}
            ${t.type === 'error' ? 'bg-red-50 border-red-300 text-sambal' : ''}
            ${t.type === 'info' ? 'bg-blue-50 border-blue-300 text-blue-800' : ''}
          `}
        >
          <span className="flex-1">{t.message}</span>
          <button
            onClick={() => onDismiss(t.id)}
            aria-label="Dismiss notification"
            className="text-current opacity-50 hover:opacity-100 ml-1 font-bold text-base leading-none"
          >
            ×
          </button>
        </div>
      ))}
      <style jsx>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateX(40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .animate-toast-in { animation: toast-in 0.25s ease-out; }
      `}</style>
    </div>
  );
}

/** Hook for managing toasts */
export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = 'info', duration = 5000) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, type, message, duration }]);
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
    },
    [dismiss]
  );

  return { toasts, toast, dismiss };
}
