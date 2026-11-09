'use client';
/* eslint-disable @next/next/no-img-element */
import React from 'react';
import { PaginaCargando } from '@/components/ui/Cargando';
import { useParams } from 'next/navigation';
import { useRequisiciones } from '@/lib/store';
import { useUsuario } from '@/lib/useUsuario';
import { fmtFecha } from '@/lib/utils';

const Casilla = ({ on }: { on: boolean | null | undefined }) => (
  <span className="inline-block w-4 h-4 border border-black text-center leading-[14px] text-[11px] font-bold align-[-3px] mx-1.5">{on ? 'X' : ''}</span>
);
const td = 'border border-black px-2 py-1.5 align-top';

/** Réplica imprimible del formato IT-CA-004-01. Botón "Imprimir" → Guardar como PDF. */
export default function ImprimirPage() {
  const { id } = useParams<{ id: string }>();
  // El formato impreso siempre es claro; se restaura el tema al salir.
  React.useEffect(() => {
    const h = document.documentElement, estaba = h.classList.contains('dark');
    h.classList.remove('dark');
    return () => { if (estaba) h.classList.add('dark'); };
  }, []);
  const { usuario, esAdmin, cargando } = useUsuario();
  const { ready, requisiciones } = useRequisiciones();
  if (cargando || !ready) return <PaginaCargando />;
  const r = requisiciones.find((x) => x.id === id);
  if (!r || !usuario || (!esAdmin && r.solicitanteId !== usuario.id)) return <div className="p-10 text-center text-xs text-gray-500">No se encontró la requisición.</div>;
  const vacias = Math.max(0, 6 - r.planAccion.length);

  return (
    <div className="min-h-screen bg-slate-200 p-3 sm:p-5 overflow-x-auto print:bg-white print:p-0 print:overflow-visible">
      <div className="max-w-[210mm] mx-auto mb-3 flex gap-2 print:hidden">
        <button onClick={() => window.print()} className="px-4 py-2.5 bg-[#0F3470] text-white text-xs font-bold rounded-xl cursor-pointer">Imprimir / Guardar como PDF</button>
        <button onClick={() => window.close()} className="px-4 py-2.5 bg-white border border-gray-300 text-xs font-bold rounded-xl text-gray-600 cursor-pointer">Cerrar</button>
      </div>

      <div className="bg-white text-black w-[210mm] min-h-[297mm] mx-auto p-[12mm] shadow-xl print:shadow-none print:w-auto print:min-h-0 text-[10.5pt] leading-snug">
        <table className="w-full border-collapse table-fixed">
          <tbody>
            <tr>
              <td className={`${td} w-[30%] !p-0 align-middle`}><img src="/logo-tecnm.png" alt="TecNM" className="h-[78px] w-auto -my-2" /></td>
              <td className={`${td} text-center align-middle`}><b className="block text-[13pt]">Requisición de Acciones Correctivas</b><span className="text-[9pt]">Sistema de Gestión Integrado</span></td>
              <td className={`${td} w-[26%] text-center align-middle`}><img src="/logo-itm.png" alt="ITM" className="h-[44px] w-auto mx-auto mb-0.5" /><b className="block text-[10pt]">ITMORELIA-IT-CA-004-01</b></td>
            </tr>
          </tbody>
        </table>
        <table className="w-full border-collapse table-fixed"><tbody>
          <tr><td className={td}><b>Fecha (1):</b> {fmtFecha(r.fechaRegistro, { day: '2-digit', month: 'long', year: 'numeric' })}</td><td className={td}><b>Folio de Requisición: (2)</b> {r.folio}</td></tr>
          <tr><td className={td} colSpan={2}><b>Solicitante:</b> {r.solicitante} — {r.departamento}</td></tr>
        </tbody></table>

        <p className="font-bold pt-2 pb-0.5">SOLICITUD:</p>
        <table className="w-full border-collapse table-fixed"><tbody>
          <tr><td className={td}><b>Descripción (4)</b><p className="whitespace-pre-wrap min-h-[18px] mt-0.5">{r.descripcion}</p></td></tr>
          <tr><td className={td}><b>Responsable de definir la(s) acción(es) correctiva y/o correcciones para eliminar la No Conformidad y/o SNC identificado:</b> {r.responsableDefinir}</td></tr>
          <tr><td className={td}><b>Responsable de verificar el cumplimiento de las acciones de mejora definidas en el plan:</b> {r.responsableVerificar}</td></tr>
        </tbody></table>

        <p className="font-bold pt-2 pb-0.5">REPORTE:</p>
        <table className="w-full border-collapse table-fixed"><tbody><tr>
          <td className={td}><b>Requiere Acción Correctiva (5)</b> Sí<Casilla on={r.requiereAC === true} /> No<Casilla on={r.requiereAC === false} /></td>
          <td className={td}><b>Requiere Corrección</b> Sí<Casilla on={r.requiereCorreccion === true} /> No<Casilla on={r.requiereCorreccion === false} /></td>
        </tr></tbody></table>

        <p className="font-bold pt-2 pb-0.5">ANÁLISIS DE DATOS:</p>
        <table className="w-full border-collapse table-fixed"><tbody>
          <tr><td className={td}><b>Técnica estadística utilizada:</b> {r.tecnicaEstadistica}</td></tr>
          <tr><td className={td}><b>Causa raíz identificada (6)</b><p className="whitespace-pre-wrap min-h-[18px] mt-0.5">{r.causaRaiz}</p></td></tr>
          <tr><td className={td}><b>Acción Correctiva o corrección a realizar: (7)</b><p className="whitespace-pre-wrap min-h-[18px] mt-0.5">{r.accionRealizar}</p></td></tr>
        </tbody></table>

        <p className="font-bold pt-2 pb-0.5">PLAN:</p>
        <table className="w-full border-collapse table-fixed">
          <thead><tr>{['Acciones (8)', 'Responsable (9)', 'Fecha programada (10)', 'Evidencias (11)'].map((h) => <th key={h} className={`${td} bg-slate-100 text-center text-[9.5pt]`}>{h}</th>)}</tr></thead>
          <tbody>
            {r.planAccion.map((p) => (
              <tr key={p.id}><td className={td}>{p.accion}</td><td className={td}>{p.responsable}</td><td className={td}>{fmtFecha(p.fechaProgramada)}</td><td className={td}>{p.evidencia}</td></tr>
            ))}
            {Array.from({ length: vacias }).map((_, i) => <tr key={`v${i}`}><td className={`${td} h-[26px]`} /><td className={td} /><td className={td} /><td className={td} /></tr>)}
          </tbody>
        </table>

        <table className="w-full border-collapse table-fixed"><tbody><tr>
          <td className={td}><b>Se eliminó la causa raíz: (12)</b> Sí<Casilla on={r.cierre?.causaEliminada === true} /> No<Casilla on={r.cierre?.causaEliminada === false} /></td>
          <td className={td}><b>Observaciones: (13)</b> {r.cierre?.observaciones || r.observacionesDocente}</td>
        </tr></tbody></table>

        <table className="w-full border-collapse table-fixed"><tbody><tr>
          <td className={td}><b>Definió la AC o Corrección: (14)</b><div className="mt-5 border-t border-black pt-0.5 text-center">{r.definio}</div></td>
          <td className={td}><b>Verificó AC o Corrección (15)</b><div className="mt-5 border-t border-black pt-0.5 text-center">{r.verifico}</div></td>
          <td className={td}><b>Fecha de cierre: (16)</b> {r.cierre ? fmtFecha(r.cierre.fechaCierre) : ''}<br /><b>Nombre y Firma RD:</b><div className="mt-5 border-t border-black pt-0.5 text-center">{r.cierre?.firmaRD}</div></td>
        </tr></tbody></table>
      </div>
    </div>
  );
}
