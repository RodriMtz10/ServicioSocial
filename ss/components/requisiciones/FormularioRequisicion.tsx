'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PaginaCargando } from '@/components/ui/Cargando';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Save, Send, Trash2, Undo2, Lock, Paperclip, ShieldCheck } from 'lucide-react';
import ProgressSidebar from '@/components/requisiciones/ProgressSidebar';
import { Ayuda, Campo, inputCls } from '@/components/ui/Campo';
import { SelectCerrado } from '@/components/ui/ListasInstitucionales';
import { RESPONSABLES_BASE } from '@/lib/institucional';
import { aDatos, deRequisicion, filaPlan, validar, valoresVacios, type FormValues } from '@/lib/formulario';
import { useRequisiciones } from '@/lib/store';
import { useAvisos } from '@/lib/avisos';
import { TEXTO_FORMATOS } from '@/lib/evidencia';
import { useUsuario } from '@/lib/useUsuario';
import { ESTADOS, fmtFecha, hoy } from '@/lib/utils';
import type { EstadoRequisicion } from '@/types';

const draftKey = (userId: string) => `itm-ac:draft:${userId}`;

function SiNo({ nombre, valor, onChange }: { nombre: string; valor: string; onChange: (v: 'si' | 'no') => void }) {
  return (
    <div className="inline-flex border border-gray-200 rounded-xl overflow-hidden" role="radiogroup">
      {(['si', 'no'] as const).map((o) => (
        <label key={o} className={`px-6 py-2 text-xs font-bold cursor-pointer select-none border-r last:border-r-0 border-gray-200 ${valor === o ? 'bg-[#0F3470] text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
          <input type="radio" name={nombre} value={o} checked={valor === o} onChange={() => onChange(o)} className="sr-only" />
          {o === 'si' ? 'Sí' : 'No'}
        </label>
      ))}
    </div>
  );
}

function Seccion({ id, n, titulo, children, derecha }: { id: string; n: number; titulo: string; children: React.ReactNode; derecha?: React.ReactNode }) {
  return (
    <section id={id} className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4 scroll-mt-6">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <h2 className="text-sm font-bold text-[#0F3470] flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#0F3470] text-white text-xs flex items-center justify-center">{n}</span>
          <span className="uppercase">{titulo}</span>
        </h2>
        {derecha}
      </div>
      {children}
    </section>
  );
}

export default function FormularioRequisicion({ id }: { id?: string }) {
  const router = useRouter();
  const { usuario, esAdmin, cargando } = useUsuario();
  const { ready, requisiciones, catalogos, personas, guardar, adminEditar } = useRequisiciones();
  const responsables = useMemo(() => [...catalogos.responsables, ...RESPONSABLES_BASE], [catalogos.responsables]);
  const existente = id ? requisiciones.find((r) => r.id === id) : undefined;

  const [v, setV] = useState<FormValues | null>(null);
  const [intento, setIntento] = useState(false);
  const [guardadoEn, setGuardadoEn] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const iniciado = useRef(false);

  // Panel exclusivo del administrador (edición en cualquier estado).
  const [estadoA, setEstadoA] = useState<EstadoRequisicion>('borrador');
  const [cierreA, setCierreA] = useState({ causaEliminada: '' as '' | 'si' | 'no', observaciones: '', fechaCierre: '', firmaRD: '' });
  const [motivo, setMotivo] = useState('');
  const avisos = useAvisos();

  const inicio = esAdmin ? '/dashboard/tablero' : '/dashboard/mis-solicitudes';
  // El admin edita cualquier requisición, salvo su propio borrador/devuelta, que sigue el flujo normal de envío.
  const modoAdmin = !!(esAdmin && existente && usuario && !(existente.solicitanteId === usuario.id && ['borrador', 'devuelta'].includes(existente.estado)));

  // Carga inicial: requisición existente → borrador local (solo nuevas) → vacío.
  useEffect(() => {
    if (!ready || !usuario || iniciado.current) return;
    if (id && !existente) return;
    iniciado.current = true;
    if (existente) {
      setV(deRequisicion(existente, catalogos.tecnicas));
      setEstadoA(existente.estado);
      setCierreA({ causaEliminada: existente.cierre ? (existente.cierre.causaEliminada ? 'si' : 'no') : '', observaciones: existente.cierre?.observaciones ?? '', fechaCierre: existente.cierre?.fechaCierre ?? '', firmaRD: existente.cierre?.firmaRD ?? '' });
      return;
    }
    try {
      const raw = localStorage.getItem(draftKey(usuario.id));
      if (raw) { setV(JSON.parse(raw)); setGuardadoEn('restaurado'); return; }
    } catch { /* ignorar */ }
    setV(valoresVacios(usuario.nombre));
  }, [ready, usuario, id, existente, catalogos.tecnicas]);

  // Autoguardado local del borrador (solo requisiciones nuevas).
  useEffect(() => {
    if (id || !v || !usuario) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(draftKey(usuario.id), JSON.stringify(v));
        setGuardadoEn(new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }));
      } catch { /* ignorar */ }
    }, 800);
    return () => clearTimeout(t);
  }, [v, id, usuario]);

  const todos = useMemo(() => (v ? validar(v) : {}), [v]);
  const errores = intento ? todos : {};

  if (cargando || !ready || !usuario) return <PaginaCargando />;
  if (id && !existente) return <div className="p-10 text-center text-xs text-gray-500">No se encontró la requisición.</div>;
  if (existente && !modoAdmin && (!['borrador', 'devuelta'].includes(existente.estado) || existente.solicitanteId !== usuario.id)) {
    return (
      <div className="max-w-md mx-auto bg-white p-8 rounded-2xl border border-gray-100 text-center space-y-3">
        <p className="text-sm font-bold text-slate-900">Esta requisición ya no se puede editar</p>
        <p className="text-xs text-gray-500">Solo se editan borradores o requisiciones devueltas por el SGI.</p>
        <Link href={`/dashboard/requisiciones/${existente.id}`} className="inline-block px-4 py-2 bg-[#0F3470] text-white text-xs font-bold rounded-xl">Ver requisición</Link>
      </div>
    );
  }
  if (!v) return <PaginaCargando />;

  const set = <K extends keyof FormValues>(k: K, val: FormValues[K]) => setV((p) => (p ? { ...p, [k]: val } : p));
  const setFila = (i: number, patch: Partial<FormValues['planAccion'][number]>) =>
    setV((p) => (p ? { ...p, planAccion: p.planAccion.map((f, j) => (j === i ? { ...f, ...patch } : f)) } : p));
  const addFila = () => setV((p) => (p ? { ...p, planAccion: [...p.planAccion, filaPlan()] } : p));
  const delFila = (i: number) =>
    setV((p) => (p ? { ...p, planAccion: p.planAccion.length > 1 ? p.planAccion.filter((_, j) => j !== i) : [filaPlan()] } : p));

  const limpiarBorrador = () => { try { localStorage.removeItem(draftKey(usuario.id)); } catch { /* ignorar */ } };

  const irAlDetalle = (rid: string) => router.push(`/dashboard/requisiciones/${rid}`);
  const ETIQ: Record<string, string> = { descripcion: 'Descripción de la no conformidad', responsableDefinir: 'Quién define la acción', responsableVerificar: 'Quién verifica la implantación', requiereAC: 'Acción correctiva / corrección (dictamen)', requiereCorreccion: 'Corrección (dictamen)', tecnicaSel: 'Técnica utilizada', tecnicaOtra: 'Técnica (especificar)', causaRaiz: 'Causa raíz', accionRealizar: 'Acción o corrección determinada', planAccion: 'Plan de acción', definio: 'Quién definió la acción', verifico: 'Quién verificó el plan' };
  const nombreCampo = (k: string) => { const m = k.match(/^planAccion\.(\d+)\.(\w+)$/); return m ? `Plan de acción, fila ${Number(m[1]) + 1} (${m[2] === 'accion' ? 'acción' : m[2] === 'fechaProgramada' ? 'fecha' : m[2]})` : ETIQ[k] ?? k; };
  const faltan = () => {
    const nombres = [...new Set(Object.keys(todos).map(nombreCampo))];
    const lista = nombres.slice(0, 6).join('; ') + (nombres.length > 6 ? `; y ${nombres.length - 6} más` : '');
    avisos.error(`Faltan datos por completar: ${lista}.${modoAdmin ? ' Si necesitas guardarla incompleta, cambia el estado a Borrador o Devuelta.' : ''}`);
  };
  const irAlPrimerError = () => setTimeout(() => document.querySelector('[data-invalid="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 30);

  const onBorrador = async () => {
    if (guardando) return;
    setGuardando(true);
    const r = await guardar(aDatos(v), id, false);
    setGuardando(false);
    if (r) { limpiarBorrador(); irAlDetalle(r.id); }
  };

  const onEnviar = async () => {
    if (guardando) return;
    setIntento(true);
    if (Object.keys(todos).length) { faltan(); irAlPrimerError(); return; }
    setGuardando(true);
    const r = await guardar(aDatos(v), id, true);
    setGuardando(false);
    if (r) { limpiarBorrador(); irAlDetalle(r.id); }
  };

  const onAdminGuardar = async () => {
    if (guardando || !id) return;
    setIntento(true);
    // Una requisición activa debe estar completa; solo borrador/devuelta admiten datos a medias.
    if (!['borrador', 'devuelta'].includes(estadoA) && Object.keys(todos).length) { faltan(); irAlPrimerError(); return; }
    if (estadoA === 'cerrada' && (!cierreA.causaEliminada || !cierreA.fechaCierre || !cierreA.firmaRD.trim())) {
      avisos.error('Para dejarla cerrada indica si se eliminó la causa raíz, la fecha de cierre y la firma del RD.');
      return;
    }
    setGuardando(true);
    const r = await adminEditar(id, {
      datos: aDatos(v),
      estado: estadoA,
      cierre: { causaEliminada: cierreA.causaEliminada === '' ? null : cierreA.causaEliminada === 'si', observaciones: cierreA.observaciones.trim(), fechaCierre: cierreA.fechaCierre, firmaRD: cierreA.firmaRD.trim() },
      motivo: motivo.trim() || undefined,
    });
    setGuardando(false);
    if (r) { if (r.historial.length === existente?.historial.length) avisos.ok('No había cambios que guardar.'); irAlDetalle(r.id); }
  };

  const devolucion = existente?.estado === 'devuelta' ? [...existente.historial].reverse().find((e) => e.tipo === 'devuelta' || e.tipo === 'reabierta') : undefined;
  const folio = existente?.folio ?? 'Se asigna al guardar';

  return (
    <div className="max-w-6xl mx-auto flex gap-6 items-start font-sans pb-24 pt-9 lg:pt-0">
      <ProgressSidebar errores={todos} />

      <div className="flex-1 min-w-0 space-y-5">
        <div className="flex flex-wrap justify-between items-start gap-2">
          <div>
            <h1 className="text-xl font-bold text-[#0F3470]">Requisición de Acciones Correctivas</h1>
            <p className="text-xs text-gray-500 mt-0.5">Sistema de Gestión Integrado • Formato ITMORELIA-IT-CA-004-01</p>
          </div>
          <span className="px-3 py-1 bg-blue-50 text-[#0F3470] font-mono font-bold text-xs rounded-lg border border-blue-100">{folio}</span>
        </div>

        {modoAdmin && (
          <div className="flex gap-3 p-4 bg-violet-50 border border-violet-200 rounded-xl text-violet-900">
            <ShieldCheck size={18} className="shrink-0 mt-0.5" />
            <div><p className="text-xs font-bold">Edición del administrador</p><p className="text-xs mt-0.5">Puedes modificar cualquier campo en cualquier estado. Cada cambio queda registrado en el historial con tu nombre.</p></div>
          </div>
        )}

        {devolucion && (
          <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800">
            <Undo2 size={18} className="shrink-0 mt-0.5" />
            <div><p className="text-xs font-bold">El SGI devolvió esta requisición</p><p className="text-xs mt-0.5">{devolucion.comentario}</p></div>
          </div>
        )}

        {/* 1. SOLICITUD */}
        <Seccion id="s1" n={1} titulo="Solicitud y detección de no conformidad">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Campo label="Fecha de registro" num={1}>
              <input readOnly value={fmtFecha(existente?.fechaRegistro ?? hoy(), { day: '2-digit', month: 'long', year: 'numeric' })} className={`${inputCls()} bg-gray-50 text-gray-600`} />
            </Campo>
            <Campo label="Folio (auto-generado)" num={2}>
              <input readOnly value={folio} className={`${inputCls()} bg-blue-50 font-mono font-bold text-[#0F3470] border-blue-100`} />
            </Campo>
          </div>
          <Campo id="descripcion" label="Descripción de la no conformidad detectada *" num={4} error={errores.descripcion}>
            <textarea rows={4} value={v.descripcion} onChange={(e) => set('descripcion', e.target.value)} placeholder="Describe qué ocurrió, dónde, cuándo y con qué evidencia se detectó." className={inputCls(errores.descripcion)} />
          </Campo>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Campo id="responsableDefinir" label="Responsable de definir la acción correctiva" error={errores.responsableDefinir}>
              <SelectCerrado value={v.responsableDefinir} onChange={(x) => set('responsableDefinir', x)} opciones={responsables} placeholder="Selecciona…" clase={inputCls(errores.responsableDefinir)} />
            </Campo>
            <Campo id="responsableVerificar" label="Responsable de verificar la implantación" error={errores.responsableVerificar}>
              <SelectCerrado value={v.responsableVerificar} onChange={(x) => set('responsableVerificar', x)} opciones={responsables} placeholder="Selecciona…" clase={inputCls(errores.responsableVerificar)} />
            </Campo>
          </div>
        </Seccion>

        {/* 2. DICTAMEN */}
        <Seccion id="s2" n={2} titulo="Dictamen del reporte y diagnóstico">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Campo id="requiereAC" label="¿Requiere acción correctiva?" num={5} error={errores.requiereAC}>
              <SiNo nombre="ac" valor={v.requiereAC} onChange={(x) => set('requiereAC', x)} />
            </Campo>
            <Campo id="requiereCorreccion" label="¿Requiere corrección?" num={5} error={errores.requiereCorreccion}>
              <SiNo nombre="corr" valor={v.requiereCorreccion} onChange={(x) => set('requiereCorreccion', x)} />
            </Campo>
          </div>
        </Seccion>

        {/* 3. ANÁLISIS */}
        <Seccion id="s3" n={3} titulo="Análisis de causa raíz">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Campo id="tecnicaSel" label="Técnica estadística utilizada" num={6} error={errores.tecnicaSel}>
              <select value={v.tecnicaSel} onChange={(e) => set('tecnicaSel', e.target.value)} className={inputCls(errores.tecnicaSel)}>
                <option value="">Selecciona…</option>
                {catalogos.tecnicas.map((t) => <option key={t}>{t}</option>)}
                {!catalogos.tecnicas.includes('Otra') && <option>Otra</option>}
              </select>
            </Campo>
            {v.tecnicaSel === 'Otra' && (
              <Campo id="tecnicaOtra" label="Especifica la técnica" error={errores.tecnicaOtra}>
                <input value={v.tecnicaOtra} onChange={(e) => set('tecnicaOtra', e.target.value)} className={inputCls(errores.tecnicaOtra)} />
              </Campo>
            )}
          </div>
          <Campo id="causaRaiz" label="Causa raíz identificada" num={6} error={errores.causaRaiz}>
            <textarea rows={3} value={v.causaRaiz} onChange={(e) => set('causaRaiz', e.target.value)} placeholder="¿Cuál es la causa de fondo que originó la no conformidad?" className={inputCls(errores.causaRaiz)} />
          </Campo>
          <Campo id="accionRealizar" label="Acción correctiva o corrección a realizar" num={7} error={errores.accionRealizar}>
            <textarea rows={3} value={v.accionRealizar} onChange={(e) => set('accionRealizar', e.target.value)} className={inputCls(errores.accionRealizar)} />
          </Campo>
        </Seccion>

        {/* 4. PLAN */}
        <Seccion id="s4" n={4} titulo="Plan de acción"
          derecha={<button type="button" onClick={addFila} className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-100 cursor-pointer"><Plus size={14} /> Agregar acción</button>}>
          {v.requiereAC === 'no' && v.requiereCorreccion === 'no' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">Marcaste que no se requiere acción correctiva ni corrección. Cambia el dictamen en la sección 2 para poder enviar.</div>
          )}
          <div className="hidden md:grid grid-cols-[2.2fr_1.4fr_1.1fr_1.7fr_32px] gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 px-1">
            <span>Acción<Ayuda num={8} /></span><span>Responsable<Ayuda num={9} /></span><span>Fecha programada<Ayuda num={10} /></span><span>Evidencia<Ayuda num={11} /></span><span />
          </div>
          <div className="space-y-2">
            {v.planAccion.map((f, i) => {
              const e = (k: string) => errores[`planAccion.${i}.${k}`];
              const malo = ['accion', 'responsable', 'fechaProgramada', 'evidencia'].some((k) => e(k));
              return (
                <div key={f.id} data-invalid={malo ? 'true' : undefined} className="grid grid-cols-1 md:grid-cols-[2.2fr_1.4fr_1.1fr_1.7fr_32px] gap-2 p-2 bg-gray-50 border border-gray-200 rounded-xl items-start">
                  <textarea aria-label={`Acción ${i + 1}`} rows={2} value={f.accion} onChange={(ev) => setFila(i, { accion: ev.target.value })} placeholder="Acción específica" className={inputCls(e('accion'))} />
                  <SelectCerrado aria-label={`Responsable ${i + 1}`} value={f.responsable} onChange={(x) => setFila(i, { responsable: x })} opciones={personas} placeholder="Responsable…" clase={inputCls(e('responsable'))} />
                  <input aria-label={`Fecha ${i + 1}`} type="date" min={modoAdmin ? undefined : existente?.fechaRegistro ?? hoy()} value={f.fechaProgramada} onChange={(ev) => setFila(i, { fechaProgramada: ev.target.value })} className={inputCls(e('fechaProgramada'))} />
                  <input aria-label={`Evidencia ${i + 1}`} value={f.evidencia} onChange={(ev) => setFila(i, { evidencia: ev.target.value })} placeholder="Qué se entregará" className={inputCls(e('evidencia'))} />
                  <button type="button" onClick={() => delFila(i)} aria-label={`Quitar acción ${i + 1}`} className="p-2 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"><Trash2 size={15} /></button>
                </div>
              );
            })}
          </div>
          {errores.planAccion && <p className="text-[11px] font-semibold text-red-600">{errores.planAccion}</p>}
          {Object.keys(errores).some((k) => k.startsWith('planAccion.')) && <p className="text-[11px] font-semibold text-red-600">Completa todos los campos de cada acción del plan.</p>}

          <p className="pt-3 border-t border-gray-100 text-[11px] text-gray-500 flex items-start gap-1.5"><Paperclip size={12} className="shrink-0 mt-0.5" aria-hidden="true" />
            Los archivos de evidencia se adjuntan a cada acción desde la vista de la requisición, una vez que el SGI la aprueba y pasa a «en proceso». {TEXTO_FORMATOS}</p>
        </Seccion>

        {/* 5. CIERRE */}
        <Seccion id="s5" n={5} titulo="Cierre y firmas del formato">
          <div className="flex gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl text-blue-900">
            <Lock size={16} className="shrink-0 mt-0.5" />
            <div className="text-xs"><p className="font-bold">Eficacia y cierre los registra el SGI</p>
              <p className="mt-0.5">Los campos (12) “Se eliminó la causa raíz”, (13) observaciones de eficacia, (16) fecha de cierre y firma del RD se capturan al verificar la requisición. No tienes que llenarlos.</p></div>
          </div>
          <Campo label="Observaciones del solicitante (opcional)">
            <textarea rows={2} value={v.observacionesDocente} onChange={(e) => set('observacionesDocente', e.target.value)} placeholder="Comentarios adicionales para la coordinación de calidad…" className={inputCls()} />
          </Campo>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Campo id="definio" label="Definió la AC o corrección" num={14} error={errores.definio}>
              <SelectCerrado value={v.definio} onChange={(x) => set('definio', x)} opciones={personas} placeholder="Selecciona…" clase={inputCls(errores.definio)} />
            </Campo>
            <Campo id="verifico" label="Verificó la AC o corrección" num={15} error={errores.verifico}>
              <SelectCerrado value={v.verifico} onChange={(x) => set('verifico', x)} opciones={[...responsables, ...personas]} placeholder="Selecciona…" clase={inputCls(errores.verifico)} />
            </Campo>
          </div>
        </Seccion>

        {modoAdmin && (
          <Seccion id="s6" n={6} titulo="Control del administrador">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Campo label="Estado de la requisición">
                <select value={estadoA} onChange={(e) => setEstadoA(e.target.value as EstadoRequisicion)} className={inputCls()}>
                  {(Object.keys(ESTADOS) as EstadoRequisicion[]).map((k) => <option key={k} value={k}>{ESTADOS[k].label}</option>)}
                </select>
              </Campo>
              <Campo label="Motivo del cambio (queda en el historial)">
                <input value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={1000} placeholder="Ej. Corrección de fecha solicitada por el docente" className={inputCls()} />
              </Campo>
            </div>
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider pt-2">Eficacia y cierre</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Campo label="¿Se eliminó la causa raíz?" num={12}>
                <div className="inline-flex border border-gray-200 rounded-xl overflow-hidden" role="radiogroup">
                  {([['', '—'], ['si', 'Sí'], ['no', 'No']] as const).map(([o, t]) => (
                    <label key={o} className={`px-5 py-2 text-xs font-bold cursor-pointer border-r last:border-r-0 border-gray-200 ${cierreA.causaEliminada === o ? 'bg-[#0F3470] text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
                      <input type="radio" name="eliminadaAdmin" className="sr-only" checked={cierreA.causaEliminada === o} onChange={() => setCierreA({ ...cierreA, causaEliminada: o })} />{t}
                    </label>
                  ))}
                </div>
              </Campo>
              <Campo label="Fecha de cierre" num={16}><input type="date" value={cierreA.fechaCierre} onChange={(e) => setCierreA({ ...cierreA, fechaCierre: e.target.value })} className={inputCls()} /></Campo>
              <Campo label="Observaciones de eficacia" num={13}><textarea rows={2} value={cierreA.observaciones} onChange={(e) => setCierreA({ ...cierreA, observaciones: e.target.value })} className={inputCls()} /></Campo>
              <Campo label="Nombre y firma RD" num={16}><input value={cierreA.firmaRD} onChange={(e) => setCierreA({ ...cierreA, firmaRD: e.target.value })} className={inputCls()} /></Campo>
            </div>
          </Seccion>
        )}


        <div className="sticky bottom-0 -mx-2 px-3 sm:px-4 py-3 bg-white/95 backdrop-blur border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 z-20">
          <span className="text-[11px] text-gray-400">
            {modoAdmin ? 'Edición del administrador' : id ? 'Edición de requisición existente' : guardadoEn === 'restaurado' ? 'Borrador local restaurado' : guardadoEn ? `Borrador local guardado a las ${guardadoEn}` : 'Se guarda automáticamente en este equipo'}
          </span>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto [&>button]:flex-1 sm:[&>button]:flex-none [&>button]:justify-center">
            <button type="button" onClick={() => router.push(id ? `/dashboard/requisiciones/${id}` : inicio)} className="px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer">Cancelar</button>
            {modoAdmin ? (
              <button type="button" disabled={guardando} onClick={onAdminGuardar} className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0F3470] text-white text-xs font-bold hover:bg-[#0A2552] shadow-md cursor-pointer disabled:opacity-60"><Save size={14} /> {guardando ? 'Guardando…' : 'Guardar cambios'}</button>
            ) : (
              <>
                <button type="button" disabled={guardando} onClick={onBorrador} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#0F3470] text-[#0F3470] text-xs font-bold hover:bg-blue-50 cursor-pointer disabled:opacity-60"><Save size={14} /> Guardar borrador</button>
                <button type="button" disabled={guardando} onClick={onEnviar} className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0F3470] text-white text-xs font-bold hover:bg-[#0A2552] shadow-md cursor-pointer disabled:opacity-60">
                  <Send size={14} /> {guardando ? 'Guardando…' : existente?.estado === 'devuelta' ? 'Reenviar requisición' : 'Enviar requisición oficial'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
