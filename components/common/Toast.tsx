'use client';

import React from 'react';
import { useToast } from '@/components/common/ToastProvider';
import type { Toast } from '@/hooks/useToast';
import styles from './Toast.module.scss';

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
  const getVariantClass = () => {
    switch (toast.variant) {
      case 'success':
        return styles.success;
      case 'error':
        return styles.error;
      case 'warning':
        return styles.warning;
      default:
        return styles.info;
    }
  };

  return (
    <div className={`${styles.toast} ${getVariantClass()}`}>
      <div className={styles.content}>
        <h4 className={styles.title}>{toast.title}</h4>
        {toast.description && <p className={styles.description}>{toast.description}</p>}
      </div>
      <button className={styles.close} onClick={() => onRemove(toast.id)}>
        ×
      </button>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className={styles.container}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
};

