'use client';
import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Download, Eye, Printer, Search } from 'lucide-react';
import type { EstadoRequisicion, Requisicion } from '@/types';
import { Badge, EstadoBadge } from '@/components/ui/Badge';
import { ESTADOS, accionesVencidas, fmtFecha } from '@/lib/utils';
import { fechaCorta, generarCsv, sufijoFecha } from '@/lib/csv';

interface Props {
  datos: Requisicion[];
  mostrarSolicitante?: boolean;
  exportar?: boolean;
  porPagina?: number;
  vacioTexto?: string;
}

const sel = 'w-full sm:w-auto text-xs p-2.5 border border-gray-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-[#0F3470]';

export default function RequisicionTable({ datos, mostrarSolicitante = true, exportar = false, porPagina = 8, vacioTexto }: Props) {
  const [q, setQ] = useState('');
  const [estado, setEstado] = useState<EstadoRequisicion | 'todos'>('todos');
  const [depto, setDepto] = useState('todos');
  const [anio, setAnio] = useState('todos');
  const [pag, setPag] = useState(1);

  const deptos = useMemo(() => Array.from(new Set(datos.map((r) => r.departamento))).sort(), [datos]);
  const anios = useMemo(() => Array.from(new Set(datos.map((r) => r.fechaRegistro.slice(0, 4)))).sort().reverse(), [datos]);
  const estados = useMemo(() => (Object.keys(ESTADOS) as EstadoRequisicion[]).filter((e) => datos.some((r) => r.estado === e)), [datos]);

  const filtradas = useMemo(() => {
    const t = q.trim().toLowerCase();
    return datos
      .filter((r) => (estado === 'todos' || r.estado === estado) && (depto === 'todos' || r.departamento === depto) && (anio === 'todos' || r.fechaRegistro.startsWith(anio)))
      .filter((r) => !t || [r.folio, r.descripcion, r.solicitante, r.departamento].some((x) => x.toLowerCase().includes(t)))
      .sort((a, b) => (a.fechaRegistro === b.fechaRegistro ? b.folio.localeCompare(a.folio) : a.fechaRegistro < b.fechaRegistro ? 1 : -1));
  }, [datos, q, estado, depto, anio]);

  const paginas = Math.max(1, Math.ceil(filtradas.length / porPagina));
  const p = Math.min(pag, paginas);
  const visibles = filtradas.slice((p - 1) * porPagina, p * porPagina);
  const cambia = (fn: () => void) => { fn(); setPag(1); };

  const descargar = () => {
    const filas: (string | number)[][] = [[
      'Folio', 'Fecha de registro', 'Solicitante', 'Departamento', 'Estado', 'Descripción', 'Responsable de definir', 'Responsable de verificar',
      '¿Requiere acción correctiva?', 'Técnica estadística', 'Causa raíz', 'Acción a realizar',
      'Acciones del plan', 'Acciones completadas', 'Acciones vencidas', 'Evidencias', 'Fecha de cierre', 'Causa eliminada', 'Última actualización',
    ]];
    for (const r of filtradas) {
      filas.push([
        r.folio, fechaCorta(r.fechaRegistro), r.solicitante, r.departamento, ESTADOS[r.estado].label, r.descripcion, r.responsableDefinir, r.responsableVerificar,
        r.requiereAC === null ? '' : r.requiereAC ? 'Sí' : 'No', r.tecnicaEstadistica, r.causaRaiz, r.accionRealizar,
        r.planAccion.length, r.planAccion.filter((x) => x.completado).length, accionesVencidas(r), r.evidencias.length,
        fechaCorta(r.cierre?.fechaCierre), r.cierre ? (r.cierre.causaEliminada ? 'Sí' : 'No') : '', fechaCorta(r.actualizada),
      ]);
    }
    const blob = new Blob([generarCsv(filas)], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `requisiciones-ac-${sufijoFecha()}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-center">
        <div className="w-full sm:w-auto flex-1 sm:min-w-56 flex items-center gap-2 border border-gray-200 rounded-xl px-3 text-gray-400 focus-within:ring-2 focus-within:ring-[#0F3470]">
          <Search size={15} />
          <input value={q} onChange={(e) => cambia(() => setQ(e.target.value))} placeholder="Buscar por folio, solicitante o descripción…" aria-label="Buscar" className="w-full py-2.5 text-xs outline-none text-gray-800 bg-transparent" />
        </div>
        <select aria-label="Estado" className={sel} value={estado} onChange={(e) => cambia(() => setEstado(e.target.value as EstadoRequisicion | 'todos'))}>
          <option value="todos">Todos los estados</option>
          {estados.map((e) => <option key={e} value={e}>{ESTADOS[e].label}</option>)}
        </select>
        {mostrarSolicitante && (
          <select aria-label="Departamento" className={sel} value={depto} onChange={(e) => cambia(() => setDepto(e.target.value))}>
            <option value="todos">Todos los departamentos</option>
            {deptos.map((d) => <option key={d}>{d}</option>)}
          </select>
        )}
        <select aria-label="Año" className={sel} value={anio} onChange={(e) => cambia(() => setAnio(e.target.value))}>
          <option value="todos">Todos los años</option>
          {anios.map((a) => <option key={a}>{a}</option>)}
        </select>
        {exportar && (
          <button onClick={descargar} className="w-full sm:w-auto justify-center flex items-center gap-1.5 px-3 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer">
            <Download size={14} /> CSV
          </button>
        )}
      </div>

      {visibles.length === 0 ? (
        <div className="py-14 text-center text-xs text-gray-400">
          <p className="font-bold text-sm text-slate-700 mb-1">Sin resultados</p>
          {vacioTexto ?? 'Prueba con otros filtros o términos de búsqueda.'}
        </div>
      ) : (
        <>
        {/* Celular: tarjetas */}
        <ul className="anim-stagger md:hidden divide-y divide-gray-100">
          {visibles.map((r) => {
            const v = accionesVencidas(r);
            return (
              <li key={r.id}>
                <Link href={`/dashboard/requisiciones/${r.id}`} className="block p-4 active:bg-blue-50/60">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-xs text-[#0F3470]">{r.folio}</span>
                    <span className="flex items-center gap-1 shrink-0"><EstadoBadge estado={r.estado} />{v > 0 && <Badge tono="red" title="Acciones vencidas">{v}</Badge>}</span>
                  </div>
                  <p className="text-xs text-gray-700 mt-1.5 line-clamp-2">{r.descripcion || '(sin descripción)'}</p>
                  <p className="text-[11px] text-gray-400 mt-1.5">{mostrarSolicitante ? `${r.solicitante} · ` : ''}{fmtFecha(r.fechaRegistro)}</p>
                </Link>
              </li>
            );
          })}
        </ul>
        {/* Escritorio y tablet: tabla */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50/70 text-[10px] uppercase tracking-wider text-gray-400 text-left">
                <th className="px-4 py-3 font-bold">Folio</th>
                <th className="px-4 py-3 font-bold">Fecha</th>
                <th className="px-4 py-3 font-bold">Motivo</th>
                {mostrarSolicitante && <th className="px-4 py-3 font-bold">Solicitante</th>}
                <th className="px-4 py-3 font-bold">Estado</th>
                <th className="px-4 py-3 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="anim-stagger divide-y divide-gray-50">
              {visibles.map((r) => {
                const v = accionesVencidas(r);
                return (
                  <tr key={r.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 whitespace-nowrap"><Link href={`/dashboard/requisiciones/${r.id}`} className="font-bold text-[#0F3470] hover:underline">{r.folio}</Link></td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">{fmtFecha(r.fechaRegistro)}</td>
                    <td className="px-4 py-3 max-w-xs"><span title={r.descripcion} className="line-clamp-2 text-gray-700">{r.descripcion || '(sin descripción)'}</span></td>
                    {mostrarSolicitante && (
                      <td className="px-4 py-3"><p className="font-semibold text-slate-800">{r.solicitante}</p><p className="text-[11px] text-gray-400">{r.departamento}</p></td>
                    )}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <EstadoBadge estado={r.estado} />
                      {v > 0 && <span className="ml-1.5"><Badge tono="red" title="Acciones vencidas">{v} vencida{v > 1 ? 's' : ''}</Badge></span>}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Link href={`/dashboard/requisiciones/${r.id}`} aria-label="Ver" title="Ver" className="inline-flex p-1.5 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-[#0F3470]"><Eye size={15} /></Link>
                      <Link href={`/imprimir/${r.id}`} target="_blank" aria-label="Imprimir" title="Formato / PDF" className="inline-flex p-1.5 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-[#0F3470]"><Printer size={15} /></Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </>
      )}

      <div className="px-4 py-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-400">
        <span>Mostrando {filtradas.length === 0 ? 0 : (p - 1) * porPagina + 1}–{Math.min(p * porPagina, filtradas.length)} de {filtradas.length}</span>
        <div className="flex items-center gap-1">
          <button disabled={p <= 1} onClick={() => setPag(p - 1)} className="px-2.5 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-30 cursor-pointer">‹</button>
          {Array.from({ length: paginas }, (_, i) => i + 1).slice(Math.max(0, p - 3), Math.max(0, p - 3) + 5).map((n) => (
            <button key={n} onClick={() => setPag(n)} className={`min-w-7 py-1.5 rounded-lg font-bold cursor-pointer ${n === p ? 'bg-[#0F3470] text-white' : 'hover:bg-gray-50 text-gray-500'}`}>{n}</button>
          ))}
          <button disabled={p >= paginas} onClick={() => setPag(p + 1)} className="px-2.5 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-30 cursor-pointer">›</button>
        </div>
      </div>
    </div>
  );
}
