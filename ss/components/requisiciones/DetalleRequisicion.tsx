'use client';

import React, { useState } from 'react';
import { PaginaCargando } from '@/components/ui/Cargando';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Clock, Download, Eye, Lock, Pencil, Paperclip, Plus, Printer, Send, ShieldCheck, Trash2, Undo2 } from 'lucide-react';
import { EstadoBadge } from '@/components/ui/Badge';
import { Campo, inputCls } from '@/components/ui/Campo';
import Modal from '@/components/ui/Modal';
import { useRequisiciones } from '@/lib/store';
import { useAvisos } from '@/lib/avisos';
import { useUsuario } from '@/lib/useUsuario';
import { accionesVencidas, fmtFecha, fmtFechaHora, hoy } from '@/lib/utils';
import { ACCEPT, TEXTO_FORMATOS, problemaArchivo } from '@/lib/evidencia';
import type { EvidenciaArchivo } from '@/types';
import { SelectCerrado } from '@/components/ui/ListasInstitucionales';
import { RESPONSABLES_BASE } from '@/lib/institucional';

const PUNTO: Record<string, string> = {
  creada: 'bg-slate-400', enviada: 'bg-amber-500', devuelta: 'bg-red-500', reabierta: 'bg-red-500',
  aprobada: 'bg-blue-500', editada: 'bg-violet-400', avance: 'bg-blue-500', verificacion: 'bg-violet-500', cerrada: 'bg-emerald-500',
};
const TEXTO: Record<string, string> = {
  creada: 'Requisición creada', enviada: 'Enviada al SGI', devuelta: 'Devuelta por el SGI', reabierta: 'Devuelta: causa raíz no eliminada',
  aprobada: 'Plan aprobado', editada: 'Editada por el administrador', avance: 'Avance o cambio registrado', verificacion: 'Solicitud de verificación', cerrada: 'Requisición cerrada',
};
const sn = (b: boolean | null | undefined) => (b === null || b === undefined ? '—' : b ? 'Sí' : 'No');

function Dato({ k, v, ancho }: { k: string; v?: string; ancho?: boolean }) {
  return (
    <div className={ancho ? 'md:col-span-2' : ''}>
      <dt className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{k}</dt>
      <dd className="text-xs text-slate-800 mt-0.5 whitespace-pre-wrap">{v?.trim() ? v : '—'}</dd>
    </div>
  );
}

function Bloque({ n, titulo, children, meta }: { n?: number; titulo: string; children: React.ReactNode; meta?: string }) {
  return (
    <section className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-xs">
      <h2 className="flex items-center gap-2 text-sm font-bold text-[#0F3470] uppercase border-b border-gray-100 pb-3 mb-4">
        {n ? <span className="w-6 h-6 rounded-full bg-[#0F3470] text-white text-xs flex items-center justify-center">{n}</span> : null}
        {titulo}
        {meta ? <span className="ml-auto text-[11px] font-semibold text-gray-400 normal-case">{meta}</span> : null}
      </h2>
      {children}
    </section>
  );
}

function ArchivoItem({ ev, puedeQuitar, onQuitar }: { ev: EvidenciaArchivo; puedeQuitar: boolean; onQuitar: () => void }) {
  return (
    <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between gap-2">
      <div className="min-w-0">
        <p className="text-xs font-bold text-gray-800 truncate" title={ev.nombre}>{ev.nombre}</p>
        <p className="text-[10px] text-gray-400">{ev.tamano} · {ev.fecha}{!ev.disponible ? ' · sin archivo (registro antiguo)' : ''}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {ev.disponible && ev.enLinea && <a href={`/api/evidencias/${ev.id}`} target="_blank" rel="noopener noreferrer" aria-label={`Ver ${ev.nombre}`} title="Ver" className="p-1.5 text-[#0F3470] hover:bg-blue-50 rounded-lg"><Eye size={14} /></a>}
        {ev.disponible && <a href={`/api/evidencias/${ev.id}?descargar=1`} aria-label={`Descargar ${ev.nombre}`} title="Descargar" className="p-1.5 text-[#0F3470] hover:bg-blue-50 rounded-lg"><Download size={14} /></a>}
        {puedeQuitar && <button onClick={onQuitar} className="text-xs font-bold text-red-500 p-1 cursor-pointer">Quitar</button>}
      </div>
    </div>
  );
}

const btn = 'accion flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold cursor-pointer';

export default function DetalleRequisicion({ id }: { id: string }) {
  const { usuario, esAdmin, cargando } = useUsuario();
  const { ready, requisiciones, aprobar, devolver, marcarAccion, agregarAccion, catalogos, cambiarEstado, cerrar, subirEvidencia, quitarEvidencia, eliminar } = useRequisiciones();
  const router = useRouter();
  const [modal, setModal] = useState<null | 'devolver' | 'cerrar' | 'eliminar' | 'estado' | 'accion'>(null);
  const [nuevoEstado, setNuevoEstado] = useState<'en_proceso' | 'verificacion'>('verificacion');
  const [notaEstado, setNotaEstado] = useState('');
  const [nueva, setNueva] = useState({ accion: '', responsable: '', fechaProgramada: '', evidencia: '' });
  const [intentoNueva, setIntentoNueva] = useState(false);
  const [comentario, setComentario] = useState('');
  const [subiendo, setSubiendo] = useState<string | null>(null);
  const [cierre, setCierre] = useState({ causaEliminada: '' as '' | 'si' | 'no', observaciones: '', fechaCierre: hoy(), firmaRD: '' });
  const avisos = useAvisos();
  const setErrCierre = (t: string) => { if (t) avisos.error(t); };

  const r = requisiciones.find((x) => x.id === id);
  if (cargando || !ready || !usuario) return <PaginaCargando />;
  if (!r) return <div className="p-10 text-center text-xs text-gray-500">No se encontró la requisición.</div>;
  // Un docente solo puede ver lo suyo (la regla real debe repetirse en la API).
  if (!esAdmin && r.solicitanteId !== usuario.id) {
    return <div className="max-w-md mx-auto bg-white p-8 rounded-2xl border border-gray-100 text-center text-sm font-bold text-slate-900">No tienes acceso a esta requisición</div>;
  }

  const volver = esAdmin ? '/dashboard/tablero' : '/dashboard/mis-solicitudes';
  const esDueno = r.solicitanteId === usuario.id;
  const puedeEliminar = esAdmin || (esDueno && ['borrador', 'devuelta', 'pendiente'].includes(r.estado));
  const puedeEditar = (esDueno || esAdmin) && (r.estado === 'borrador' || r.estado === 'devuelta');
  const hechas = r.planAccion.filter((p) => p.completado).length;
  const todoHecho = r.planAccion.length > 0 && hechas === r.planAccion.length;
  const vencidas = accionesVencidas(r);
  // Aviso de devolución: en "devuelta", o en "en proceso" cuando el SGI la regresó desde la verificación.
  const ultimoHito = [...r.historial].reverse().find((e) => ['devuelta', 'reabierta', 'aprobada', 'verificacion'].includes(e.tipo));
  const devolucion = r.estado === 'devuelta' ? [...r.historial].reverse().find((e) => e.tipo === 'devuelta' || e.tipo === 'reabierta')
    : r.estado === 'en_proceso' && ultimoHito?.tipo === 'devuelta' ? ultimoHito : undefined;

  // Cambios de estado que puede hacer el solicitante (cerrar y aprobar son del administrador).
  const OPCIONES_ESTADO: Record<string, { a: 'en_proceso' | 'verificacion'; etiqueta: string; ayuda: string }[]> = {
    en_proceso: [{ a: 'verificacion', etiqueta: 'Pasar a verificación', ayuda: 'Avisa al SGI que terminaste el plan para que verifique la eficacia.' }],
    verificacion: [{ a: 'en_proceso', etiqueta: 'Regresar a en proceso', ayuda: 'Retira la solicitud de verificación para seguir trabajando en el plan.' }],
  };
  const opcionesEstado = esDueno ? OPCIONES_ESTADO[r.estado] ?? [] : [];
  const abrirEstado = (a: 'en_proceso' | 'verificacion') => { setNuevoEstado(a); setNotaEstado(''); setModal('estado'); };
  const puedeAdjuntar = (esDueno && r.estado === 'en_proceso') || (esAdmin && r.estado !== 'cerrada');
  const puedeAgregarAccion = esDueno && r.estado === 'en_proceso';

  const errNueva: Record<string, string> = {};
  if (nueva.accion.trim().length < 5) errNueva.accion = 'Describe la acción (mínimo 5 caracteres)';
  if (!nueva.responsable) errNueva.responsable = 'Indica el responsable';
  if (!nueva.fechaProgramada) errNueva.fechaProgramada = 'Indica la fecha';
  else if (nueva.fechaProgramada < hoy()) errNueva.fechaProgramada = 'No puede ser anterior a hoy';
  if (!nueva.evidencia.trim()) errNueva.evidencia = 'Indica qué evidencia se presentará';

  const abrirCierre = () => { setCierre({ causaEliminada: '', observaciones: '', fechaCierre: hoy(), firmaRD: usuario.nombre }); setErrCierre(''); setModal('cerrar'); };
  const confirmarCierre = async () => {
    if (!cierre.causaEliminada) return setErrCierre('Indica si se eliminó la causa raíz');
    if (!cierre.firmaRD.trim()) return setErrCierre('Falta el nombre del RD');
    if (cierre.causaEliminada === 'no' && cierre.observaciones.trim().length < 5) return setErrCierre('Explica por qué la causa raíz no se eliminó');
    const ok = await cerrar(r.id, { causaEliminada: cierre.causaEliminada === 'si', observaciones: cierre.observaciones.trim(), fechaCierre: cierre.fechaCierre, firmaRD: cierre.firmaRD.trim() });
    if (ok) setModal(null);
  };

  const subir = (accionId?: string) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const problema = await problemaArchivo(f);
    if (problema) { avisos.error(problema); return; }
    setSubiendo(accionId ?? 'general');
    await subirEvidencia(r.id, f, accionId);
    setSubiendo(null);
  };
  const evDe = (accionId: string) => r.evidencias.filter((e) => e.accionId === accionId);
  const evGenerales = r.evidencias.filter((e) => !e.accionId || !r.planAccion.some((p) => p.id === e.accionId));

  return (
    <div className="max-w-5xl mx-auto space-y-5 font-sans pb-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={volver} className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#0F3470]"><ArrowLeft size={15} /> Volver</Link>
        <div className="flex flex-wrap gap-2">
          <Link href={`/imprimir/${r.id}`} target="_blank" className={`${btn} border border-gray-300 text-gray-600 hover:bg-gray-50`}><Printer size={14} /> PDF</Link>
          {esAdmin && <Link href={`/dashboard/requisiciones/${r.id}/editar`} className={`${btn} border border-violet-300 text-violet-700 bg-violet-50 hover:bg-violet-100`}><Pencil size={14} /> Editar</Link>}
          {puedeEditar && !esAdmin && <Link href={`/dashboard/requisiciones/${r.id}/editar`} className={`${btn} border border-gray-300 text-gray-600 hover:bg-gray-50`}><Pencil size={14} /> {r.estado === 'devuelta' ? 'Corregir' : 'Continuar'}</Link>}
          {esAdmin && r.estado === 'pendiente' && (
            <>
              <button className={`${btn} border border-red-200 text-red-600 hover:bg-red-50`} onClick={() => { setComentario(''); setModal('devolver'); }}><Undo2 size={14} /> Devolver</button>
              <button className={`${btn} bg-[#0F3470] text-white hover:bg-[#0A2552]`} onClick={() => aprobar(r.id)}><Check size={14} /> Aprobar</button>
            </>
          )}
          {esAdmin && r.estado === 'verificacion' && (
            <>
              <button className={`${btn} border border-red-200 text-red-600 hover:bg-red-50`} onClick={() => { setComentario(''); setModal('devolver'); }}><Undo2 size={14} /> Devolver</button>
              <button className={`${btn} bg-[#0F3470] text-white hover:bg-[#0A2552]`} onClick={abrirCierre}><ShieldCheck size={14} /> Verificar</button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row justify-between gap-4">
        <div className="min-w-0">
          <span className="inline-block px-3 py-1 bg-blue-50 text-[#0F3470] font-mono font-bold text-xs rounded-lg border border-blue-100">{r.folio}</span>
          <h1 className="text-base font-bold text-slate-900 mt-2 leading-snug">{r.descripcion.length > 170 ? r.descripcion.slice(0, 168) + '…' : r.descripcion || '(Borrador sin descripción)'}</h1>
          <p className="text-xs text-gray-500 mt-1">{r.solicitante} · {r.departamento} · Registrada el {fmtFecha(r.fechaRegistro, { day: '2-digit', month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="shrink-0"><EstadoBadge estado={r.estado} /></div>
      </div>

      {esDueno && ['pendiente', 'en_proceso', 'verificacion'].includes(r.estado) && (
        <section aria-label="Estado de la requisición" className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              {r.estado !== 'en_proceso' && <Lock size={13} className="text-gray-400" aria-hidden="true" />}
              Estado de tu requisición: <span className="text-[#0F3470]">{r.estado === 'en_proceso' ? 'en proceso' : r.estado === 'verificacion' ? 'en verificación' : 'pendiente de aprobación'}</span>
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {r.estado === 'pendiente' && 'El SGI la está revisando. Mientras tanto no puedes editarla ni adjuntar evidencias; podrás hacerlo cuando la apruebe (pasa a «en proceso»).'}
              {r.estado === 'en_proceso' && 'Puedes marcar acciones como completadas, agregar nuevas (no se pueden eliminar) y adjuntar evidencias. Al terminar, pásala a verificación.'}
              {r.estado === 'verificacion' && 'Está bloqueada para que el SGI la verifique: no se puede editar, marcar acciones ni adjuntar evidencias. Si necesitas cambiar algo, regrésala a «en proceso».'}
            </p>
          </div>
          {opcionesEstado.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {opcionesEstado.map((o) => (
                <button key={o.a} className={`${btn} ${o.a === 'verificacion' ? 'bg-[#0F3470] text-white hover:bg-[#0A2552]' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'}`} onClick={() => abrirEstado(o.a)}>
                  {o.a === 'verificacion' ? <Send size={14} /> : <Undo2 size={14} />} {o.etiqueta}
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {devolucion && (
        <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800"><Undo2 size={18} className="shrink-0 mt-0.5" />
          <div><p className="text-xs font-bold">Devuelta por el SGI</p><p className="text-xs mt-0.5">{devolucion.comentario || 'El SGI no dejó un comentario.'}</p></div></div>
      )}
      {vencidas > 0 && (
        <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800"><Clock size={18} className="shrink-0 mt-0.5" />
          <div><p className="text-xs font-bold">{vencidas} {vencidas === 1 ? 'acción vencida' : 'acciones vencidas'}</p><p className="text-xs mt-0.5">La fecha programada ya pasó y no se ha marcado como completada.</p></div></div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 items-start">
        <div className="space-y-5 min-w-0">
          <Bloque n={1} titulo="Solicitud">
            <dl className="grid md:grid-cols-2 gap-4">
              <Dato k="Descripción de la no conformidad" v={r.descripcion} ancho />
              <Dato k="Responsable de definir la acción" v={r.responsableDefinir} />
              <Dato k="Responsable de verificar" v={r.responsableVerificar} />
            </dl>
          </Bloque>

          <Bloque n={2} titulo="Reporte y análisis">
            <dl className="grid md:grid-cols-2 gap-4">
              <Dato k="Requiere acción correctiva" v={sn(r.requiereAC)} />
              <Dato k="Requiere corrección" v={sn(r.requiereCorreccion)} />
              <Dato k="Técnica estadística" v={r.tecnicaEstadistica} ancho />
              <Dato k="Causa raíz" v={r.causaRaiz} ancho />
              <Dato k="Acción correctiva o corrección" v={r.accionRealizar} ancho />
            </dl>
          </Bloque>

          <Bloque n={3} titulo="Plan de acción" meta={r.planAccion.length ? `${hechas}/${r.planAccion.length} completadas` : undefined}>
            {r.planAccion.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="text-left text-[10px] uppercase tracking-wider text-gray-400 bg-slate-50/70">
                    <th className="px-3 py-2 w-10" /><th className="px-3 py-2">Acción y archivos</th><th className="px-3 py-2">Responsable</th><th className="px-3 py-2">Fecha</th><th className="px-3 py-2">Evidencia</th></tr></thead>
                  <tbody className="divide-y divide-gray-50 align-top">
                    {r.planAccion.map((p) => {
                      const vence = !p.completado && r.estado === 'en_proceso' && p.fechaProgramada < hoy();
                      const editable = esDueno && r.estado === 'en_proceso';
                      return (
                        <tr key={p.id} className={p.completado ? 'text-gray-400' : ''}>
                          <td className="px-3 py-2.5"><input type="checkbox" checked={p.completado} disabled={!editable} onChange={(e) => marcarAccion(r.id, p.id, e.target.checked)} aria-label={`Completada: ${p.accion}`} className="w-4 h-4 accent-emerald-600 cursor-pointer disabled:cursor-default" /></td>
                          <td className="px-3 py-2.5 min-w-[200px]">
                            <span className={p.completado ? 'line-through' : ''}>{p.accion}</span>
                            <div className="space-y-1.5 mt-2 no-underline font-normal" style={{ textDecoration: 'none' }}>
                              {evDe(p.id).map((ev) => <ArchivoItem key={ev.id} ev={ev} puedeQuitar={puedeAdjuntar} onQuitar={() => quitarEvidencia(r.id, ev.id)} />)}
                              {evDe(p.id).length === 0 && <p className="text-[11px] text-gray-400">{p.completado && r.estado !== 'borrador' ? 'Completada sin archivo' : 'Sin archivo'}</p>}
                              {puedeAdjuntar && (
                                <label className={`inline-flex items-center gap-1 text-[11px] font-bold text-[#0F3470] bg-amber-400/20 hover:bg-amber-400/30 px-2 py-1 rounded-lg border border-amber-300 cursor-pointer ${subiendo === p.id ? 'opacity-60 pointer-events-none' : ''}`}>
                                  <Paperclip size={12} /> {subiendo === p.id ? 'Subiendo…' : 'Adjuntar'}<input type="file" accept={ACCEPT} onChange={subir(p.id)} className="sr-only" aria-label={`Adjuntar evidencia a: ${p.accion}`} />
                                </label>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2.5">{p.responsable}</td>
                          <td className={`px-3 py-2.5 whitespace-nowrap ${vence ? 'text-red-600 font-bold' : ''}`}>{fmtFecha(p.fechaProgramada)}{vence ? ' · vencida' : ''}</td>
                          <td className="px-3 py-2.5">{p.evidencia}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : <p className="text-xs text-gray-400">Aún no se capturan acciones.</p>}
            {puedeAgregarAccion && (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button onClick={() => { setNueva({ accion: '', responsable: '', fechaProgramada: '', evidencia: '' }); setModal('accion'); }} className={`${btn} border border-[#0F3470] text-[#0F3470] hover:bg-blue-50`}><Plus size={14} /> Agregar acción</button>
                <p className="text-[11px] text-gray-400">Marca cada acción al completarla. Las acciones no se pueden eliminar.</p>
              </div>
            )}
          </Bloque>

          <Bloque titulo="Evidencia general" meta={`${r.evidencias.length} ${r.evidencias.length === 1 ? 'archivo' : 'archivos'} en total`}>
            <div className="grid sm:grid-cols-2 gap-2">
              {evGenerales.map((ev) => <ArchivoItem key={ev.id} ev={ev} puedeQuitar={puedeAdjuntar} onQuitar={() => quitarEvidencia(r.id, ev.id)} />)}
              {evGenerales.length === 0 && <p className="text-xs text-gray-400">Sin archivos generales (los archivos de cada acción aparecen en la tabla del plan).</p>}
            </div>
            {puedeAdjuntar ? <p className="text-[11px] text-gray-400 mt-3">{TEXTO_FORMATOS}</p> : (esDueno || esAdmin) && ['pendiente', 'verificacion', 'cerrada'].includes(r.estado) && (
              <p className="text-xs text-gray-400 mt-3 flex items-center gap-1.5"><Lock size={12} aria-hidden="true" /> No se pueden adjuntar ni quitar evidencias {r.estado === 'pendiente' ? 'mientras la requisición está pendiente de aprobación' : r.estado === 'cerrada' ? 'porque la requisición está cerrada (solo lectura)' : 'mientras está en verificación'}.</p>
            )}
            {puedeAdjuntar && (
              <label className={`inline-flex items-center gap-1 mt-3 text-xs font-bold text-[#0F3470] bg-amber-400/20 hover:bg-amber-400/30 px-3 py-1.5 rounded-lg border border-amber-300 cursor-pointer ${subiendo === 'general' ? 'opacity-60 pointer-events-none' : ''}`}>
                <Paperclip size={13} /> {subiendo === 'general' ? 'Subiendo…' : 'Adjuntar evidencia general'}<input type="file" accept={ACCEPT} onChange={subir()} className="sr-only" aria-label="Adjuntar evidencia general" />
              </label>
            )}
          </Bloque>

          <Bloque n={4} titulo="Cierre y eficacia">
            <dl className="grid md:grid-cols-2 gap-4">
              <Dato k="Definió la AC o corrección" v={r.definio} />
              <Dato k="Verificó la AC o corrección" v={r.verifico} />
              <Dato k="Observaciones del solicitante" v={r.observacionesDocente} ancho />
              <Dato k="¿Se eliminó la causa raíz?" v={r.cierre ? sn(r.cierre.causaEliminada) : 'Pendiente'} />
              <Dato k="Fecha de cierre" v={r.cierre ? fmtFecha(r.cierre.fechaCierre) : 'Pendiente'} />
              <Dato k="Observaciones de eficacia" v={r.cierre?.observaciones} ancho />
              <Dato k="Nombre y firma RD" v={r.cierre?.firmaRD} />
            </dl>
          </Bloque>
        </div>

        <aside>
          <Bloque titulo="Historial">
            <ol className="border-l-2 border-gray-100 pl-4 space-y-4">
              {[...r.historial].reverse().map((e) => (
                <li key={e.id} className="relative">
                  <span className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full ring-2 ring-white ${PUNTO[e.tipo]}`} />
                  <p className="text-xs font-bold text-slate-800">{TEXTO[e.tipo]}</p>
                  <p className="text-[11px] text-gray-400">{e.autor} · {fmtFechaHora(e.fecha)}</p>
                  {e.comentario && <p className="text-[11px] text-gray-600 bg-slate-50 rounded-lg px-2 py-1.5 mt-1">{e.comentario}</p>}
                </li>
              ))}
            </ol>
          </Bloque>
        </aside>
      </div>

      {puedeEliminar && (
        <div className="anim-fade-up flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-dashed border-gray-200">
          <p className="text-[11px] text-gray-400">Eliminar borra la requisición, su historial y sus evidencias. No se puede deshacer.</p>
          <button className={`${btn} border border-red-200 text-red-600 hover:bg-red-50`} onClick={() => setModal('eliminar')}><Trash2 size={13} /> Eliminar</button>
        </div>
      )}

      {modal === 'eliminar' && (
        <Modal titulo="Eliminar requisición" onClose={() => setModal(null)} pie={
          <>
            <button className={`${btn} border border-gray-300 text-gray-600`} onClick={() => setModal(null)}>Cancelar</button>
            <button className={`${btn} bg-red-600 text-white hover:bg-red-700`} onClick={async () => { if (await eliminar(r.id)) { setModal(null); router.push(volver); } else setModal(null); }}>Sí, eliminar</button>
          </>
        }>
          <p className="text-sm text-slate-700">¿Seguro que quieres eliminar la requisición <b className="font-mono">{r.folio}</b>?</p>
          <p className="text-xs text-gray-500">Se borran también su plan de acción, evidencias e historial. Esta acción no se puede deshacer.</p>
          {esAdmin && !['borrador', 'devuelta', 'pendiente'].includes(r.estado) && (
            <p role="alert" className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">Esta requisición está en estado «{r.estado.replace('_', ' ')}»: ya se trabajó en ella. Elimínala solo si es necesario.</p>
          )}
        </Modal>
      )}

      {modal === 'accion' && (
        <Modal titulo="Agregar acción al plan" onClose={() => { setModal(null); setIntentoNueva(false); }} pie={
          <>
            <button className={`${btn} border border-gray-300 text-gray-600`} onClick={() => { setModal(null); setIntentoNueva(false); }}>Cancelar</button>
            <button className={`${btn} bg-[#0F3470] text-white`} onClick={async () => {
              setIntentoNueva(true);
              if (Object.keys(errNueva).length) return;
              if (await agregarAccion(r.id, { ...nueva, accion: nueva.accion.trim(), evidencia: nueva.evidencia.trim() })) { setModal(null); setIntentoNueva(false); }
            }}>Agregar acción</button>
          </>
        }>
          <Campo label="Acción *" error={intentoNueva ? errNueva.accion : undefined}><textarea autoFocus rows={3} value={nueva.accion} onChange={(e) => setNueva({ ...nueva, accion: e.target.value })} placeholder="Qué se va a hacer" className={inputCls(intentoNueva ? errNueva.accion : undefined)} /></Campo>
          <Campo label="Responsable *" error={intentoNueva ? errNueva.responsable : undefined}>
            <SelectCerrado value={nueva.responsable} onChange={(v) => setNueva({ ...nueva, responsable: v })} opciones={[...catalogos.responsables, ...RESPONSABLES_BASE]} placeholder="Selecciona…" clase={inputCls(intentoNueva ? errNueva.responsable : undefined)} />
          </Campo>
          <Campo label="Fecha programada *" error={intentoNueva ? errNueva.fechaProgramada : undefined}><input type="date" min={hoy()} value={nueva.fechaProgramada} onChange={(e) => setNueva({ ...nueva, fechaProgramada: e.target.value })} className={inputCls(intentoNueva ? errNueva.fechaProgramada : undefined)} /></Campo>
          <Campo label="Evidencia que se presentará *" error={intentoNueva ? errNueva.evidencia : undefined}><input value={nueva.evidencia} onChange={(e) => setNueva({ ...nueva, evidencia: e.target.value })} placeholder="Ej. Lista de asistencia, fotografías…" className={inputCls(intentoNueva ? errNueva.evidencia : undefined)} /></Campo>
        </Modal>
      )}

      {modal === 'estado' && (
        <Modal titulo={opcionesEstado.find((o) => o.a === nuevoEstado)?.etiqueta ?? 'Cambiar estado'} onClose={() => setModal(null)} pie={
          <>
            <button className={`${btn} border border-gray-300 text-gray-600`} onClick={() => setModal(null)}>Cancelar</button>
            <button className={`${btn} bg-[#0F3470] text-white`} onClick={async () => { if (await cambiarEstado(r.id, nuevoEstado, notaEstado.trim())) setModal(null); }}>Confirmar cambio</button>
          </>
        }>
          <p className="text-sm text-slate-700">{opcionesEstado.find((o) => o.a === nuevoEstado)?.ayuda}</p>
          {nuevoEstado === 'verificacion' && !todoHecho && (
            <p role="alert" className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
              Aún {r.planAccion.length - hechas === 1 ? 'tienes 1 acción' : `tienes ${r.planAccion.length - hechas} acciones`} sin marcar como completada{r.planAccion.length - hechas === 1 ? '' : 's'}. Puedes continuar, pero el SGI lo verá en el historial.
            </p>
          )}
          <Campo label="Comentario (opcional)"><textarea rows={3} value={notaEstado} onChange={(e) => setNotaEstado(e.target.value)} placeholder="Ej. Se terminó la capacitación y se adjuntó la evidencia." className={inputCls()} /></Campo>
        </Modal>
      )}

      {modal === 'devolver' && (
        <Modal titulo="Devolver requisición" onClose={() => setModal(null)} pie={
          <>
            <button className={`${btn} border border-gray-300 text-gray-600`} onClick={() => setModal(null)}>Cancelar</button>
            <button className={`${btn} bg-[#0F3470] text-white`} onClick={async () => { if (await devolver(r.id, comentario.trim())) setModal(null); }}>Devolver al solicitante</button>
          </>
        }>
          <p className="text-sm text-slate-700">{r.estado === 'verificacion'
            ? 'La requisición regresa a «en proceso» para que el solicitante siga trabajando en el plan y las evidencias.'
            : 'La requisición regresa al solicitante para que la corrija y la reenvíe.'}</p>
          <Campo label="Motivo de la devolución (opcional)">
            <textarea autoFocus rows={4} value={comentario} onChange={(e) => setComentario(e.target.value)} placeholder="Ej. Falta evidencia de la acción 2; indica qué se espera." className={inputCls()} />
          </Campo>
        </Modal>
      )}

      {modal === 'cerrar' && (
        <Modal titulo="Verificación de eficacia y cierre" onClose={() => setModal(null)} pie={
          <>
            <button className={`${btn} border border-gray-300 text-gray-600`} onClick={() => setModal(null)}>Cancelar</button>
            <button className={`${btn} bg-[#0F3470] text-white`} onClick={confirmarCierre}>{cierre.causaEliminada === 'no' ? 'Devolver al solicitante' : 'Cerrar requisición'}</button>
          </>
        }>
          <Campo label="¿Se eliminó la causa raíz?" num={12}>
            <div className="inline-flex border border-gray-200 rounded-xl overflow-hidden" role="radiogroup">
              {(['si', 'no'] as const).map((o) => (
                <label key={o} className={`px-6 py-2 text-xs font-bold cursor-pointer border-r last:border-r-0 border-gray-200 ${cierre.causaEliminada === o ? 'bg-[#0F3470] text-white' : 'bg-white text-gray-500'}`}>
                  <input type="radio" name="eliminada" className="sr-only" checked={cierre.causaEliminada === o} onChange={() => setCierre({ ...cierre, causaEliminada: o })} />{o === 'si' ? 'Sí' : 'No'}
                </label>
              ))}
            </div>
          </Campo>
          <Campo label="Observaciones de eficacia" num={13}><textarea rows={3} value={cierre.observaciones} onChange={(e) => setCierre({ ...cierre, observaciones: e.target.value })} className={inputCls()} /></Campo>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Campo label="Fecha de cierre" num={16}><input type="date" value={cierre.fechaCierre} onChange={(e) => setCierre({ ...cierre, fechaCierre: e.target.value })} className={inputCls()} /></Campo>
            <Campo label="Nombre y firma RD" num={16}><input value={cierre.firmaRD} onChange={(e) => setCierre({ ...cierre, firmaRD: e.target.value })} className={inputCls()} /></Campo>
          </div>
          {cierre.causaEliminada === 'no' && <p className="text-[11px] text-gray-500">Si la causa raíz no se eliminó, la requisición regresa al solicitante para replantear el plan.</p>}
        </Modal>
      )}
    </div>
  );
}
