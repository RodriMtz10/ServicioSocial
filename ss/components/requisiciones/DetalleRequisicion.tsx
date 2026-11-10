'use client';

import React, { useState } from 'react';
import { PaginaCargando } from '@/components/ui/Cargando';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Clock, Pencil, Paperclip, Printer, Send, ShieldCheck, Trash2, Undo2 } from 'lucide-react';
import { EstadoBadge } from '@/components/ui/Badge';
import { Campo, inputCls } from '@/components/ui/Campo';
import Modal from '@/components/ui/Modal';
import { useRequisiciones } from '@/lib/store';
import { useUsuario } from '@/lib/useUsuario';
import { accionesVencidas, fmtFecha, fmtFechaHora, hoy } from '@/lib/utils';

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

const btn = 'flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-colors';

export default function DetalleRequisicion({ id }: { id: string }) {
  const { usuario, esAdmin, cargando } = useUsuario();
  const { ready, requisiciones, aprobar, devolver, marcarAccion, cambiarEstado, cerrar, agregarEvidencia, quitarEvidencia, eliminar } = useRequisiciones();
  const router = useRouter();
  const [modal, setModal] = useState<null | 'devolver' | 'cerrar' | 'eliminar' | 'estado'>(null);
  const [nuevoEstado, setNuevoEstado] = useState<'borrador' | 'en_proceso' | 'verificacion'>('verificacion');
  const [notaEstado, setNotaEstado] = useState('');
  const [comentario, setComentario] = useState('');
  const [cierre, setCierre] = useState({ causaEliminada: '' as '' | 'si' | 'no', observaciones: '', fechaCierre: hoy(), firmaRD: '' });
  const [errCierre, setErrCierre] = useState('');

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
  const devolucion = r.estado === 'devuelta' ? [...r.historial].reverse().find((e) => e.tipo === 'devuelta' || e.tipo === 'reabierta') : undefined;

  // Cambios de estado que puede hacer el solicitante (cerrar y aprobar son del administrador).
  const OPCIONES_ESTADO: Record<string, { a: 'borrador' | 'en_proceso' | 'verificacion'; etiqueta: string; ayuda: string }[]> = {
    pendiente: [{ a: 'borrador', etiqueta: 'Retirar para editar', ayuda: 'Regresa a borrador para que puedas corregirla antes de que el SGI la revise.' }],
    en_proceso: [{ a: 'verificacion', etiqueta: 'Pasar a verificación', ayuda: 'Avisa al SGI que terminaste el plan para que verifique la eficacia.' }],
    verificacion: [{ a: 'en_proceso', etiqueta: 'Regresar a en proceso', ayuda: 'Retira la solicitud de verificación para seguir trabajando en el plan.' }],
  };
  const opcionesEstado = esDueno ? OPCIONES_ESTADO[r.estado] ?? [] : [];
  const abrirEstado = (a: 'borrador' | 'en_proceso' | 'verificacion') => { setNuevoEstado(a); setNotaEstado(''); setModal('estado'); };
  const puedeAdjuntar = esDueno && (r.estado === 'en_proceso' || r.estado === 'verificacion');

  const abrirCierre = () => { setCierre({ causaEliminada: '', observaciones: '', fechaCierre: hoy(), firmaRD: usuario.nombre }); setErrCierre(''); setModal('cerrar'); };
  const confirmarCierre = async () => {
    if (!cierre.causaEliminada) return setErrCierre('Indica si se eliminó la causa raíz');
    if (!cierre.firmaRD.trim()) return setErrCierre('Falta el nombre del RD');
    if (cierre.causaEliminada === 'no' && cierre.observaciones.trim().length < 5) return setErrCierre('Explica por qué la causa raíz no se eliminó');
    const ok = await cerrar(r.id, { causaEliminada: cierre.causaEliminada === 'si', observaciones: cierre.observaciones.trim(), fechaCierre: cierre.fechaCierre, firmaRD: cierre.firmaRD.trim() });
    if (ok) setModal(null);
  };

  const subir = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) agregarEvidencia(r.id, { nombre: f.name, tamano: `${Math.max(1, Math.round(f.size / 1024))} KB` });
    e.target.value = '';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5 font-sans pb-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={volver} className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#0F3470]"><ArrowLeft size={15} /> Volver</Link>
        <div className="flex flex-wrap gap-2">
          <Link href={`/imprimir/${r.id}`} target="_blank" className={`${btn} border border-gray-300 text-gray-600 hover:bg-gray-50`}><Printer size={14} /> Formato / PDF</Link>
          {puedeEliminar && <button className={`${btn} border border-red-200 text-red-600 hover:bg-red-50`} onClick={() => setModal('eliminar')}><Trash2 size={14} /> Eliminar</button>}
          {esAdmin && <Link href={`/dashboard/requisiciones/${r.id}/editar`} className={`${btn} border border-violet-300 text-violet-700 bg-violet-50 hover:bg-violet-100`}><Pencil size={14} /> Editar como administrador</Link>}
          {puedeEditar && !esAdmin && <Link href={`/dashboard/requisiciones/${r.id}/editar`} className={`${btn} border border-gray-300 text-gray-600 hover:bg-gray-50`}><Pencil size={14} /> {r.estado === 'devuelta' ? 'Corregir y reenviar' : 'Continuar borrador'}</Link>}
          {esAdmin && r.estado === 'pendiente' && (
            <>
              <button className={`${btn} border border-red-200 text-red-600 hover:bg-red-50`} onClick={() => { setComentario(''); setModal('devolver'); }}><Undo2 size={14} /> Devolver</button>
              <button className={`${btn} bg-[#0F3470] text-white hover:bg-[#0A2552]`} onClick={() => aprobar(r.id)}><Check size={14} /> Aprobar plan</button>
            </>
          )}
          {esAdmin && r.estado === 'verificacion' && <button className={`${btn} bg-[#0F3470] text-white hover:bg-[#0A2552]`} onClick={abrirCierre}><ShieldCheck size={14} /> Verificar y cerrar</button>}
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

      {opcionesEstado.length > 0 && (
        <section aria-label="Cambiar estado" className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-900">Estado de tu requisición: <span className="text-[#0F3470]">{r.estado === 'en_proceso' ? 'en proceso' : r.estado === 'verificacion' ? 'en verificación' : r.estado}</span></p>
            <p className="text-[11px] text-gray-500 mt-0.5">{opcionesEstado[0].ayuda}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {opcionesEstado.map((o) => (
              <button key={o.a} className={`${btn} ${o.a === 'verificacion' ? 'bg-[#0F3470] text-white hover:bg-[#0A2552]' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'}`} onClick={() => abrirEstado(o.a)}>
                {o.a === 'verificacion' ? <Send size={14} /> : <Undo2 size={14} />} {o.etiqueta}
              </button>
            ))}
          </div>
        </section>
      )}

      {devolucion && (
        <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800"><Undo2 size={18} className="shrink-0 mt-0.5" />
          <div><p className="text-xs font-bold">Devuelta por el SGI</p><p className="text-xs mt-0.5">{devolucion.comentario}</p></div></div>
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
                    <th className="px-3 py-2 w-10" /><th className="px-3 py-2">Acción</th><th className="px-3 py-2">Responsable</th><th className="px-3 py-2">Fecha</th><th className="px-3 py-2">Evidencia</th></tr></thead>
                  <tbody className="divide-y divide-gray-50 align-top">
                    {r.planAccion.map((p) => {
                      const vence = !p.completado && r.estado === 'en_proceso' && p.fechaProgramada < hoy();
                      const editable = esDueno && r.estado === 'en_proceso';
                      return (
                        <tr key={p.id} className={p.completado ? 'text-gray-400' : ''}>
                          <td className="px-3 py-2.5"><input type="checkbox" checked={p.completado} disabled={!editable} onChange={(e) => marcarAccion(r.id, p.id, e.target.checked)} aria-label={`Completada: ${p.accion}`} className="w-4 h-4 accent-emerald-600 cursor-pointer disabled:cursor-default" /></td>
                          <td className={`px-3 py-2.5 ${p.completado ? 'line-through' : ''}`}>{p.accion}</td>
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
            {esDueno && r.estado === 'en_proceso' && <p className="text-[11px] text-gray-400 mt-3">Marca cada acción al completarla. Cuando termines, usa «Pasar a verificación» arriba.</p>}
          </Bloque>

          <Bloque titulo="Archivos de evidencia">
            <div className="grid sm:grid-cols-2 gap-2">
              {r.evidencias.map((ev) => (
                <div key={ev.id} className="p-2.5 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                  <div className="min-w-0"><p className="text-xs font-bold text-gray-800 truncate">{ev.nombre}</p><p className="text-[10px] text-gray-400">{ev.tamano} · {ev.fecha}</p></div>
                  {esDueno && ['borrador', 'devuelta', 'en_proceso', 'verificacion'].includes(r.estado) && <button onClick={() => quitarEvidencia(r.id, ev.id)} className="text-xs font-bold text-red-500 p-1 cursor-pointer">Quitar</button>}
                </div>
              ))}
              {r.evidencias.length === 0 && <p className="text-xs text-gray-400">Sin archivos adjuntos.</p>}
            </div>
            {puedeAdjuntar && (
              <label className="inline-flex items-center gap-1 mt-3 text-xs font-bold text-[#0F3470] bg-amber-400/20 hover:bg-amber-400/30 px-3 py-1.5 rounded-lg border border-amber-300 cursor-pointer">
                <Paperclip size={13} /> Adjuntar evidencia<input type="file" onChange={subir} className="sr-only" aria-label="Adjuntar evidencia" />
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
            <button className={`${btn} bg-[#0F3470] text-white disabled:opacity-50`} disabled={comentario.trim().length < 5} onClick={async () => { if (await devolver(r.id, comentario.trim())) setModal(null); }}>Devolver al solicitante</button>
          </>
        }>
          <Campo label="¿Qué debe corregir el solicitante?">
            <textarea autoFocus rows={4} value={comentario} onChange={(e) => setComentario(e.target.value)} placeholder="Sé específico: campo, problema y qué se espera." className={inputCls()} />
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
          {errCierre && <p className="text-[11px] font-semibold text-red-600">{errCierre}</p>}
        </Modal>
      )}
    </div>
  );
}
