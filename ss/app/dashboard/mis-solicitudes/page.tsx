'use client';

import React, { useState } from 'react';
import { PaginaCargando } from '@/components/ui/Cargando';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import RequisicionTable from '@/components/requisiciones/RequisicionTable';
import { EstadoBadge } from '@/components/ui/Badge';
import { useRequisiciones } from '@/lib/store';
import { useUsuario } from '@/lib/useUsuario';
import { accionesVencidas, fmtFecha } from '@/lib/utils';

export default function MisSolicitudesPage() {
  const { usuario } = useUsuario();
  const { ready, requisiciones } = useRequisiciones();
  const [pestana, setPestana] = useState<'todas' | 'borradores'>('todas');
  if (!ready || !usuario) return <PaginaCargando />;

  const mias = requisiciones.filter((r) => r.solicitanteId === usuario.id);
  const borradores = mias.filter((r) => r.estado === 'borrador');
  const atencion = mias.filter((r) => r.estado === 'devuelta' || r.estado === 'borrador' || accionesVencidas(r) > 0 || (r.estado === 'en_proceso' && r.planAccion.length > 0 && r.planAccion.every((p) => p.completado)));

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Mis solicitudes</h1>
          <p className="text-xs text-gray-500 mt-0.5">Hola, {usuario.nombre.split(' ').slice(0, 2).join(' ')}. Aquí están tus requisiciones.</p>
        </div>
        <Link href="/dashboard/requisiciones/nueva" className="flex items-center gap-1.5 px-4 py-2.5 bg-[#0F3470] hover:bg-[#0A2552] text-white text-xs font-bold rounded-xl shadow-sm">
          <Plus size={15} /> Nueva requisición
        </Link>
      </div>

      {atencion.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <h2 className="text-sm font-bold text-[#0F3470] uppercase mb-2">Requiere tu atención</h2>
          <ul className="divide-y divide-gray-50">
            {atencion.map((r) => {
              const v = accionesVencidas(r);
              const motivo = r.estado === 'devuelta' ? 'El SGI pidió correcciones' : r.estado === 'borrador' ? 'Borrador sin enviar' : v ? `${v} acción(es) vencida(s)` : 'Todas las acciones completadas: solicita la verificación';
              return (
                <li key={r.id}>
                  <Link href={`/dashboard/requisiciones/${r.id}`} className="flex items-center gap-4 py-2.5 px-1 rounded-lg hover:bg-blue-50/50">
                    <span className="font-bold text-xs text-[#0F3470] whitespace-nowrap">{r.folio}</span>
                    <span className="flex-1 text-xs text-gray-700">{motivo}</span>
                    <EstadoBadge estado={r.estado} />
                    <span className="text-[11px] text-gray-400 whitespace-nowrap">{fmtFecha(r.fechaRegistro)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="flex gap-2">
        {([['todas', `Todas (${mias.length})`], ['borradores', `Borradores (${borradores.length})`]] as const).map(([k, t]) => (
          <button key={k} onClick={() => setPestana(k)} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${pestana === k ? 'bg-[#0F3470] text-white' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'}`}>{t}</button>
        ))}
      </div>

      <RequisicionTable datos={pestana === 'todas' ? mias : borradores} mostrarSolicitante={false} vacioTexto="Aún no tienes requisiciones en esta vista." />
    </div>
  );
}
