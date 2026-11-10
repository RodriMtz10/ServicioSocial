'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Clock, Mail } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useAvisos } from '@/lib/avisos';
import { fmtFecha, hoy } from '@/lib/utils';
import type { Requisicion } from '@/types';

interface Resumen { destinatarios: number; requisiciones: number; acciones: number; omitidosRecientes: number; fallidos: number }

/** Acciones vencidas (fecha pasada, sin completar) de requisiciones en proceso, de la más atrasada a la menos. */
export function listarVencidas(reqs: Requisicion[]) {
  const h = hoy();
  const dias = (f: string) => Math.round((new Date(h + 'T00:00:00Z').getTime() - new Date(f + 'T00:00:00Z').getTime()) / 86400000);
  return reqs
    .filter((r) => r.estado === 'en_proceso')
    .flatMap((r) => r.planAccion.filter((p) => !p.completado && p.fechaProgramada && p.fechaProgramada < h).map((p) => ({ r, p, dias: dias(p.fechaProgramada) })))
    .sort((a, b) => b.dias - a.dias);
}

export default function PanelVencidas({ requisiciones, esAdmin }: { requisiciones: Requisicion[]; esAdmin: boolean }) {
  const avisos = useAvisos();
  const [enviando, setEnviando] = useState(false);
  const lista = listarVencidas(requisiciones);
  if (lista.length === 0) return null;

  const enviar = async () => {
    setEnviando(true);
    try {
      const r = await api<Resumen>('/api/recordatorios', 'POST');
      avisos.ok(r.destinatarios
        ? `Recordatorios enviados a ${r.destinatarios} ${r.destinatarios === 1 ? 'persona' : 'personas'} (${r.acciones} acciones).${r.omitidosRecientes ? ` ${r.omitidosRecientes} requisición(es) ya se habían avisado hace poco.` : ''}`
        : r.fallidos ? 'No se pudo enviar ningún correo. Revisa la configuración SMTP.' : 'No hay recordatorios nuevos que enviar: todos se avisaron hace poco.');
    } catch (e) {
      avisos.error(e instanceof ApiError ? e.message : 'No se pudieron enviar los recordatorios');
    } finally { setEnviando(false); }
  };

  return (
    <section aria-label="Acciones vencidas" className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <Clock size={18} className="text-amber-700 shrink-0" aria-hidden="true" />
        <h2 className="text-sm font-bold text-amber-900 flex-1">{lista.length} {lista.length === 1 ? 'acción vencida' : 'acciones vencidas'}</h2>
        {esAdmin && (
          <button onClick={enviar} disabled={enviando} className="flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl cursor-pointer">
            <Mail size={13} /> {enviando ? 'Enviando…' : 'Enviar recordatorios por correo'}
          </button>
        )}
      </div>
      <ul className="divide-y divide-amber-100 bg-white/70 rounded-xl">
        {lista.slice(0, 8).map(({ r, p, dias }) => (
          <li key={p.id}>
            <Link href={`/dashboard/requisiciones/${r.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2.5 hover:bg-amber-50 rounded-xl">
              <span className="font-bold text-xs text-[#0F3470] whitespace-nowrap">{r.folio}</span>
              <span className="flex-1 min-w-[160px] text-xs text-gray-700">{p.accion}</span>
              {esAdmin && <span className="text-[11px] text-gray-500">{r.solicitante}</span>}
              <span className="text-[11px] font-bold text-red-600 whitespace-nowrap">{dias} {dias === 1 ? 'día' : 'días'} de retraso · {fmtFecha(p.fechaProgramada)}</span>
            </Link>
          </li>
        ))}
      </ul>
      {lista.length > 8 && <p className="text-[11px] text-amber-800 mt-2">Y {lista.length - 8} más. Los correos llegan una vez por persona y se repiten cada 3 días mientras sigan vencidas.</p>}
    </section>
  );
}
