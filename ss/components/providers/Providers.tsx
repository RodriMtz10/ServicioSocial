'use client';
import { SessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';
import { RequisicionesProvider } from '@/lib/store';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <RequisicionesProvider>{children}</RequisicionesProvider>
    </SessionProvider>
  );
}
