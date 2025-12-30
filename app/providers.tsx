'use client';

import { AuthProvider } from './auth/AuthProvider';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster theme="dark" position="bottom-center" />
    </AuthProvider>
  );
}
