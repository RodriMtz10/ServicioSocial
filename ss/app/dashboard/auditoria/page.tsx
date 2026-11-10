'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Download, Search } from 'lucide-react';
import RequireRole from '@/components/auth/RequireRole';
import { PaginaCargando } from '@/components/ui/Cargando';
import { api, ApiError } from '@/lib/api';
import { useAvisos } from '@/lib/avisos';
import { fmtFechaHora } from '@/lib/utils';

interface Fila { id: string; fecha: string; actor: string; rol: string; accion: string; entidad: string; entidadId: string | null; detalle: string; ip: string }
interface Pagina { total: number; pagina: number; porPagina: number; filas: Fila[] }

const GRUPOS = [['', 'Todo'], ['login', 'Bloqueos de acceso'], ['requisicion', 'Requisiciones'], ['evidencia', 'Archivos'], ['usuario', 'Usuarios'], ['cuenta', 'Cuentas'], ['catalogo', 'Catálogos'], ['recordatorios', 'Recordatorios']] as const;
const MALAS = /fallido|bloquead|corrupta|eliminar|quitar/;

function Contenido() {
  const avisos = useAvisos();
  const [datos, setDatos] = useState<Pagina | null>(null);
  const [q, setQ] = useState('');
  const [accion, setAccion] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [pagina, setPagina] = useState(1);

  const params = useCallback((extra: Record<string, string> = {}) => {
    const p = new URLSearchParams({ ...(q && { q }), ...(accion && { accion }), ...(desde && { desde }), ...(hasta && { hasta }), ...extra });
    return p.toString();
  }, [q, accion, desde, hasta]);

  useEffect(() => {
    const t = setTimeout(() => {
      api<Pagina>(`/api/auditoria?${params({ pagina: String(pagina) })}`).then(setDatos).catch((e) => avisos.error(e instanceof ApiError ? e.message : 'No se pudo cargar la bitácora'));
    }, 250);
    return () => clearTimeout(t);
  }, [params, pagina, avisos]);

  const paginas = datos ? Math.max(1, Math.ceil(datos.total / datos.porPagina)) : 1;
  const filtro = 'px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#0F3470]/30';

  return (
    <div className="max-w-7xl mx-auto space-y-5 font-sans">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Bitácora de auditoría</h1>
          <p className="text-xs text-gray-500 mt-0.5">Quién hizo qué y cuándo: sesiones, requisiciones, archivos, usuarios y catálogos. No se puede editar ni borrar desde la aplicación.</p>
        </div>
        <a href={`/api/auditoria?${params({ formato: 'csv' })}`} className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-300 text-gray-600 hover:bg-gray-50 text-xs font-bold rounded-xl"><Download size={14} /> Exportar CSV</a>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-3">
        <div className="flex flex-wrap gap-2">
          {GRUPOS.map(([k, t]) => (
            <button key={k} onClick={() => { setAccion(k); setPagina(1); }} className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${accion === k ? 'bg-[#0F3470] text-white' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'}`}>{t}</button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
            <input aria-label="Buscar en la bitácora" value={q} onChange={(e) => { setQ(e.target.value); setPagina(1); }} placeholder="Buscar persona, folio, correo…" className={`${filtro} w-full pl-8`} />
          </div>
          <label className="text-[11px] text-gray-500 flex items-center gap-1">Desde <input type="date" value={desde} onChange={(e) => { setDesde(e.target.value); setPagina(1); }} className={filtro} /></label>
          <label className="text-[11px] text-gray-500 flex items-center gap-1">Hasta <input type="date" value={hasta} onChange={(e) => { setHasta(e.target.value); setPagina(1); }} className={filtro} /></label>
        </div>
      </div>

      {!datos ? <PaginaCargando /> : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="text-left text-[10px] uppercase tracking-wider text-gray-400 bg-slate-50/70"><th className="px-4 py-2.5">Fecha</th><th className="px-4 py-2.5">Quién</th><th className="px-4 py-2.5">Acción</th><th className="px-4 py-2.5">Detalle</th><th className="px-4 py-2.5">IP</th></tr></thead>
            <tbody className="divide-y divide-gray-50 align-top">
              {datos.filas.map((f) => (
                <tr key={f.id}>
                  <td className="px-4 py-2.5 whitespace-nowrap text-gray-500">{fmtFechaHora(f.fecha)}</td>
                  <td className="px-4 py-2.5"><span className="font-semibold text-slate-800">{f.actor}</span>{f.rol && <span className="ml-1.5 text-[10px] text-gray-400">{f.rol}</span>}</td>
                  <td className="px-4 py-2.5"><span className={`font-mono text-[11px] px-2 py-0.5 rounded-md ${MALAS.test(f.accion) ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-[#0F3470]'}`}>{f.accion}</span></td>
                  <td className="px-4 py-2.5 text-gray-700 break-words max-w-[420px]">{f.detalle || '—'}</td>
                  <td className="px-4 py-2.5 text-gray-400 whitespace-nowrap">{f.ip || '—'}</td>
                </tr>
              ))}
              {datos.filas.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">No hay eventos con esos filtros.</td></tr>}
            </tbody>
          </table>
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-[11px] text-gray-500">
            <span>{datos.total} {datos.total === 1 ? 'evento' : 'eventos'}</span>
            <div className="flex items-center gap-2">
              <button disabled={pagina <= 1} onClick={() => setPagina(pagina - 1)} className="px-3 py-1.5 border border-gray-200 rounded-lg font-bold disabled:opacity-40 cursor-pointer disabled:cursor-default">Anterior</button>
              <span>Página {pagina} de {paginas}</span>
              <button disabled={pagina >= paginas} onClick={() => setPagina(pagina + 1)} className="px-3 py-1.5 border border-gray-200 rounded-lg font-bold disabled:opacity-40 cursor-pointer disabled:cursor-default">Siguiente</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AuditoriaPage() {
  return <RequireRole rol="admin"><Contenido /></RequireRole>;
}
