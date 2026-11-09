'use client';

import React from 'react';
import RequireRole from '@/components/auth/RequireRole';
import RequisicionTable from '@/components/requisiciones/RequisicionTable';
import { useRequisiciones } from '@/lib/store';

export default function SolicitudesPendientesPage() {
  const { requisiciones } = useRequisiciones();
  const datos = requisiciones.filter((r) => r.estado === 'pendiente' || r.estado === 'verificacion');
  return (
    <RequireRole rol="admin">
      <div className="max-w-7xl mx-auto space-y-6 font-sans">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Solicitudes pendientes de revisión</h1>
          <p className="text-xs text-gray-500 mt-0.5">Requisiciones nuevas por aprobar y planes terminados por verificar y cerrar.</p>
        </div>
        <RequisicionTable datos={datos} vacioTexto="No hay solicitudes pendientes. ¡Todo al día!" />
      </div>
    </RequireRole>
  );
}
