'use client';
import { SessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';
import { RequisicionesProvider } from '@/lib/store';
import { AvisosProvider } from '@/lib/avisos';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AvisosProvider>
        <RequisicionesProvider>{children}</RequisicionesProvider>
      </AvisosProvider>
    </SessionProvider>
  );
}
