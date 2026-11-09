import React from 'react';
import './globals.css';
import Providers from '@/components/providers/Providers';

export const metadata = {
  title: 'SGI - ITMorelia',
  description: 'Sistema de Gestión Integrado y Acciones Correctivas',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-[#F3F6FA] text-slate-800 antialiased font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
