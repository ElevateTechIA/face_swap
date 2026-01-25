'use client';

import { AuthProvider } from './auth/AuthProvider';
import { ThemeProvider } from './contexts/ThemeContext';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        {children}
        <Toaster theme="dark" position="bottom-center" />
      </AuthProvider>
    </ThemeProvider>
  );
}
