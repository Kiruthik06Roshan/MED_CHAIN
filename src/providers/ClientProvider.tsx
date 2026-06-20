'use client';

import { AuthProvider } from '@/providers/AuthProvider';
import { Web3Provider } from '@/providers/Web3Provider';

export function ClientProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Web3Provider>{children}</Web3Provider>
    </AuthProvider>
  );
}
