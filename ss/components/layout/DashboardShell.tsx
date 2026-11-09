'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import TopHeader from '@/components/layout/TopHeader';
import BarraNavegacion from '@/components/layout/BarraNavegacion';

/** Estructura del panel: barra lateral fija en escritorio y menú desplegable (cajón) en celular. */
export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [menu, setMenu] = useState(false);
  return (
    <div className="flex min-h-screen bg-[#F3F6FA]">
      <BarraNavegacion />
      <Sidebar abierto={menu} onCerrar={() => setMenu(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader onMenu={() => setMenu(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">{children}</main>
      </div>
    </div>
  );
}
