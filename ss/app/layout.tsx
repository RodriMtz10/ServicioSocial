import React from 'react';
import './globals.css';

export const metadata = {
  title: 'SGC - ITMorelia',
  description: 'Sistema de Gestión de Calidad y Acciones Correctivas',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-[#F3F6FA] text-slate-800 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}