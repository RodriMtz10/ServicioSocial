'use client';

import React from 'react';
import { PaginaCargando } from '@/components/ui/Cargando';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import KpiCards from '@/components/requisiciones/KpiCards';
import RequisicionTable from '@/components/requisiciones/RequisicionTable';
import { useRequisiciones } from '@/lib/store';
import { useUsuario } from '@/lib/useUsuario';
import { accionesVencidas } from '@/lib/utils';

export default function TableroPage() {
  const { usuario, esAdmin } = useUsuario();
  const { ready, requisiciones } = useRequisiciones();
  if (!ready || !usuario) return <PaginaCargando />;

  // Privacidad por rol: el admin ve todo menos borradores ajenos; el docente solo lo suyo.
  const visibles = requisiciones.filter((r) => (esAdmin ? r.estado !== 'borrador' || r.solicitanteId === usuario.id : r.solicitanteId === usuario.id));
  const n = (...e: string[]) => visibles.filter((r) => e.includes(r.estado)).length;
  const anio = String(new Date().getFullYear());
  const vencidas = visibles.reduce((s, r) => s + accionesVencidas(r), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">{esAdmin ? 'Tablero de gestión de acciones correctivas' : 'Mi tablero'}</h1>
          <p className="text-xs text-gray-500 mt-0.5">{esAdmin ? 'Seguimiento del Sistema de Gestión Integrado (SGI)' : 'Tus requisiciones de acciones correctivas'}</p>
        </div>
        <Link href="/dashboard/requisiciones/nueva" className="flex items-center gap-1.5 px-4 py-2.5 bg-[#0F3470] hover:bg-[#0A2552] text-white text-xs font-bold rounded-xl shadow-sm">
          <Plus size={15} /> Nueva requisición
        </Link>
      </div>

      <KpiCards items={esAdmin ? [
        { label: 'Total requisiciones', valor: visibles.length, tono: 'blue' },
        { label: 'Por revisar', valor: n('pendiente', 'verificacion'), tono: 'amber', nota: 'Pendientes de aprobar o verificar' },
        { label: 'En proceso', valor: n('en_proceso'), tono: 'violet', nota: vencidas ? `${vencidas} acciones vencidas` : 'Sin acciones vencidas' },
        { label: 'Cerradas este año', valor: visibles.filter((r) => r.estado === 'cerrada' && r.cierre?.fechaCierre.startsWith(anio)).length, tono: 'green' },
      ] : [
        { label: 'Mis requisiciones', valor: visibles.length, tono: 'blue' },
        { label: 'En revisión', valor: n('pendiente', 'verificacion'), tono: 'amber' },
        { label: 'En proceso', valor: n('en_proceso'), tono: 'violet', nota: vencidas ? `${vencidas} acciones vencidas` : undefined },
        { label: 'Cerradas', valor: n('cerrada'), tono: 'green' },
      ]} />

      <RequisicionTable datos={visibles} mostrarSolicitante={esAdmin} exportar={esAdmin} />
    </div>
  );
}
