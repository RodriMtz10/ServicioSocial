'use client';
import React from 'react';
import { PaginaCargando } from '@/components/ui/Cargando';
import Link from 'next/link';
import { useUsuario } from '@/lib/useUsuario';
import type { Role } from '@/types';

/** Segunda barrera en la interfaz (la primera es proxy.ts). Nunca sustituye la validación en servidor. */
export default function RequireRole({ rol, children }: { rol: Role; children: React.ReactNode }) {
  const { usuario, cargando } = useUsuario();
  if (cargando) return <PaginaCargando />;
  if (!usuario || usuario.rol !== rol) {
    return (
      <div className="max-w-md mx-auto bg-white p-8 rounded-2xl border border-gray-100 text-center space-y-3">
        <p className="text-sm font-bold text-slate-900">Sin permisos para ver esta sección</p>
        <Link href="/dashboard/tablero" className="inline-block px-4 py-2 bg-[#0F3470] text-white text-xs font-bold rounded-xl">Ir al tablero</Link>
      </div>
    );
  }
  return <>{children}</>;
}
