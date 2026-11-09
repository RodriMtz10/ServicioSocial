'use client';

import React, { useMemo } from 'react';
import RequireRole from '@/components/auth/RequireRole';
import KpiCards from '@/components/requisiciones/KpiCards';
import { useRequisiciones } from '@/lib/store';
import type { EstadoRequisicion, Requisicion } from '@/types';
import { ESTADOS, accionesVencidas, diasEntre } from '@/lib/utils';

function Barras({ datos, color = 'bg-[#254A8C]' }: { datos: [string, number][]; color?: string }) {
  const max = Math.max(1, ...datos.map((d) => d[1]));
  if (!datos.length) return <p className="text-xs text-gray-400">Sin datos</p>;
  return (
    <ul className="space-y-2.5">
      {datos.map(([k, v]) => (
        <li key={k} className="grid grid-cols-[minmax(110px,40%)_1fr_28px] items-center gap-3 text-xs">
          <span className="truncate text-gray-700" title={k}>{k}</span>
          <span className="h-2.5 bg-slate-100 rounded-full overflow-hidden"><i className={`block h-full rounded-full ${color}`} style={{ width: `${(v / max) * 100}%` }} /></span>
          <b className="text-right">{v}</b>
        </li>
      ))}
    </ul>
  );
}

function Tarjeta({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
      <h2 className="text-sm font-bold text-[#0F3470] uppercase border-b border-gray-100 pb-3 mb-4">{titulo}</h2>
      {children}
    </section>
  );
}

function indicadores(datos: Requisicion[]) {
  const cerradas = datos.filter((x) => x.estado === 'cerrada' && x.cierre);
  const dias = cerradas.map((x) => diasEntre(x.fechaRegistro, x.cierre!.fechaCierre));
  const eficaces = cerradas.filter((x) => x.cierre!.causaEliminada).length;
  const cuenta = (f: (x: Requisicion) => string) => {
    const m = new Map<string, number>();
    datos.forEach((x) => { const k = f(x); if (k) m.set(k, (m.get(k) ?? 0) + 1); });
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  };
  const meses: [string, number][] = [];
  const h = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(h.getFullYear(), h.getMonth() - i, 1);
    const clave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    meses.push([d.toLocaleDateString('es-MX', { month: 'short' }).replace('.', ''), datos.filter((x) => x.fechaRegistro.startsWith(clave)).length]);
  }
  const plan = datos.flatMap((x) => (x.estado === 'en_proceso' || x.estado === 'verificacion' ? x.planAccion : []));
  return {
    prom: dias.length ? Math.round(dias.reduce((a, b) => a + b, 0) / dias.length) : 0,
    eficacia: cerradas.length ? Math.round((eficaces / cerradas.length) * 100) : 0,
    avance: plan.length ? Math.round((plan.filter((p) => p.completado).length / plan.length) * 100) : 0,
    vencidas: datos.reduce((s, x) => s + accionesVencidas(x), 0),
    porEstado: (Object.keys(ESTADOS) as EstadoRequisicion[]).filter((e) => e !== 'borrador').map((e) => [ESTADOS[e].label, datos.filter((x) => x.estado === e).length] as [string, number]),
    porDepto: cuenta((x) => x.departamento),
    porTecnica: cuenta((x) => x.tecnicaEstadistica),
    meses,
  };
}

export default function ReportesPage() {
  const { requisiciones } = useRequisiciones();
  const datos = useMemo(() => requisiciones.filter((r) => r.estado !== 'borrador'), [requisiciones]);
  const r = useMemo(() => indicadores(datos), [datos]);
  const maxMes = Math.max(1, ...r.meses.map((m) => m[1]));

  return (
    <RequireRole rol="admin">
      <div className="max-w-7xl mx-auto space-y-6 font-sans">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Reportes e indicadores del SGI</h1>
          <p className="text-xs text-gray-500 mt-0.5">Calculados en vivo a partir de las requisiciones registradas.</p>
        </div>
        <KpiCards items={[
          { label: 'Tiempo promedio de cierre', valor: `${r.prom} d`, tono: 'blue', nota: 'Del registro al cierre' },
          { label: 'Eficacia de las acciones', valor: `${r.eficacia}%`, tono: 'green', nota: 'Cerradas con causa raíz eliminada' },
          { label: 'Avance de planes activos', valor: `${r.avance}%`, tono: 'violet', nota: 'Acciones completadas' },
          { label: 'Acciones vencidas', valor: r.vencidas, tono: r.vencidas ? 'red' : 'green' },
        ]} />
        <div className="grid lg:grid-cols-2 gap-5 items-start">
          <Tarjeta titulo="Requisiciones por mes">
            <div className="grid grid-cols-6 gap-3 h-44 items-end">
              {r.meses.map(([m, v]) => (
                <div key={m} className="h-full flex flex-col justify-end items-center gap-1">
                  <b className="text-xs">{v}</b>
                  <i className="block w-full max-w-11 bg-[#254A8C] rounded-t-lg min-h-0.5" style={{ height: `${(v / maxMes) * 100}%` }} />
                  <span className="text-[11px] text-gray-400 capitalize">{m}</span>
                </div>
              ))}
            </div>
          </Tarjeta>
          <Tarjeta titulo="Por estado"><Barras datos={r.porEstado} /></Tarjeta>
          <Tarjeta titulo="Por departamento"><Barras datos={r.porDepto} color="bg-violet-500" /></Tarjeta>
          <Tarjeta titulo="Técnicas de análisis utilizadas"><Barras datos={r.porTecnica} color="bg-emerald-500" /></Tarjeta>
        </div>
      </div>
    </RequireRole>
  );
}
