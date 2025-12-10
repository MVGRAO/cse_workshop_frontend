'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { Toast, ToastVariant } from '@/hooks/useToast';

interface ToastContextType {
  toast: (options: { title: string; description?: string; variant?: ToastVariant }) => void;
  toasts: Toast[];
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(
    ({ title, description, variant = 'info' }: { title: string; description?: string; variant?: ToastVariant }) => {
      const id = Math.random().toString(36).substring(7);
      const newToast: Toast = { id, title, description, variant };

      setToasts((prev) => [...prev, newToast]);

      // Auto remove after 5 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast, toasts, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

// Re-export types for convenience
export type { Toast, ToastVariant } from '@/hooks/useToast';

