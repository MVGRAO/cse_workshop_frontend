'use client';

import { ToastProvider } from '@/components/common/ToastProvider';
import { ToastContainer } from '@/components/common/Toast';
import { ReactNode } from 'react';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      {children}
      <ToastContainer />
    </ToastProvider>
  );
}

