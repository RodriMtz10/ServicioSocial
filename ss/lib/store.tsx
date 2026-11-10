'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { api, ApiError } from '@/lib/api';
import type { Catalogos, EvidenciaArchivo, Requisicion, TipoCatalogo, Usuario } from '@/types';
import type { AdminEditar, Datos } from '@/lib/validacion';

interface ItemCatalogo { id: string; nombre: string }
interface CatalogosApi { departamentos: ItemCatalogo[]; tecnicas: ItemCatalogo[]; responsables: ItemCatalogo[] }
const VACIO: CatalogosApi = { departamentos: [], tecnicas: [], responsables: [] };

export interface Aviso { tipo: 'error' | 'ok'; texto: string }
export type CierreInput = { causaEliminada: boolean; observaciones: string; fechaCierre: string; firmaRD: string };
export type DatosEnvio = Omit<Datos, 'evidencias'> & { evidencias?: (Partial<EvidenciaArchivo> & { nombre: string; tamano: string })[] };

interface Ctx {
  ready: boolean;
  requisiciones: Requisicion[];
  catalogos: Catalogos;
  catalogoItems: CatalogosApi;
  personas: string[];
  aviso: Aviso | null;
  cerrarAviso: () => void;
  recargar: () => Promise<void>;
  /** Cada acción devuelve la requisición actualizada, o null si falló (el aviso ya se muestra solo). */
  guardar: (datos: DatosEnvio, id: string | undefined, enviar: boolean) => Promise<Requisicion | null>;
  aprobar: (id: string) => Promise<Requisicion | null>;
  devolver: (id: string, comentario: string) => Promise<Requisicion | null>;
  marcarAccion: (id: string, accionId: string, completado: boolean) => Promise<Requisicion | null>;
  solicitarVerificacion: (id: string) => Promise<Requisicion | null>;
  cambiarEstado: (id: string, estado: 'borrador' | 'en_proceso' | 'verificacion', comentario?: string) => Promise<Requisicion | null>;
  cerrar: (id: string, cierre: CierreInput) => Promise<Requisicion | null>;
  agregarEvidencia: (id: string, e: { nombre: string; tamano: string }) => Promise<Requisicion | null>;
  quitarEvidencia: (id: string, evidenciaId: string) => Promise<Requisicion | null>;
  adminEditar: (id: string, input: AdminEditar) => Promise<Requisicion | null>;
  eliminar: (id: string) => Promise<boolean>;
  agregarCatalogo: (tipo: TipoCatalogo, nombre: string) => Promise<boolean>;
  quitarCatalogo: (id: string) => Promise<boolean>;
}

const Contexto = createContext<Ctx | null>(null);

export function RequisicionesProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [ready, setReady] = useState(false);
  const [requisiciones, setReqs] = useState<Requisicion[]>([]);
  const [cat, setCat] = useState<CatalogosApi>(VACIO);
  const [personas, setPersonas] = useState<string[]>([]);
  const [aviso, setAviso] = useState<Aviso | null>(null);

  const fallo = useCallback((e: unknown) => {
    setAviso({ tipo: 'error', texto: e instanceof ApiError ? e.message : 'Ocurrió un error inesperado' });
  }, []);

  const recargar = useCallback(async () => {
    try {
      const [r, c, p] = await Promise.all([
        api<Requisicion[]>('/api/requisiciones'),
        api<CatalogosApi>('/api/catalogos'),
        api<string[]>('/api/usuarios?nombres=1'),
      ]);
      setReqs(r); setCat(c); setPersonas(p);
    } catch (e) {
      fallo(e);
    } finally {
      setReady(true);
    }
  }, [fallo]);

  useEffect(() => {
    if (status === 'authenticated') void recargar();
    if (status === 'unauthenticated') { setReqs([]); setReady(false); }
  }, [status, recargar]);

  const reemplazar = (r: Requisicion) =>
    setReqs((prev) => (prev.some((x) => x.id === r.id) ? prev.map((x) => (x.id === r.id ? r : x)) : [r, ...prev]));

  const ejecutar = useCallback(async (fn: () => Promise<Requisicion>): Promise<Requisicion | null> => {
    try {
      const r = await fn();
      reemplazar(r);
      return r;
    } catch (e) {
      fallo(e);
      // Si hubo conflicto (409), el estado local quedó viejo: se refresca.
      if (e instanceof ApiError && (e.status === 409 || e.status === 404)) void recargar();
      return null;
    }
  }, [fallo, recargar]);

  const transicion = useCallback((id: string, cuerpo: object) => ejecutar(() => api<Requisicion>(`/api/requisiciones/${id}/transicion`, 'POST', cuerpo)), [ejecutar]);

  const valor = useMemo<Ctx>(() => ({
    ready,
    requisiciones,
    catalogos: { departamentos: cat.departamentos.map((x) => x.nombre), tecnicas: cat.tecnicas.map((x) => x.nombre), responsables: cat.responsables.map((x) => x.nombre) },
    catalogoItems: cat,
    personas,
    aviso,
    cerrarAviso: () => setAviso(null),
    recargar,
    guardar: (datos, id, enviar) => ejecutar(() => (id ? api<Requisicion>(`/api/requisiciones/${id}`, 'PUT', { datos, enviar }) : api<Requisicion>('/api/requisiciones', 'POST', { datos, enviar }))),
    aprobar: (id) => transicion(id, { accion: 'aprobar' }),
    devolver: (id, comentario) => transicion(id, { accion: 'devolver', comentario }),
    marcarAccion: (id, accionId, completado) => transicion(id, { accion: 'marcar', accionId, completado }),
    solicitarVerificacion: (id) => transicion(id, { accion: 'solicitar_verificacion' }),
    cambiarEstado: async (id, estado, comentario) => { const r = await transicion(id, { accion: 'cambiar_estado', estado, comentario: comentario || undefined }); if (r) setAviso({ tipo: 'ok', texto: 'Estado actualizado.' }); return r; },
    cerrar: (id, cierre) => transicion(id, { accion: 'cerrar', cierre }),
    agregarEvidencia: async (id, evidencia) => { const r = await transicion(id, { accion: 'agregar_evidencia', evidencia }); if (r) setAviso({ tipo: 'ok', texto: `Evidencia «${evidencia.nombre}» adjuntada.` }); return r; },
    quitarEvidencia: (id, evidenciaId) => transicion(id, { accion: 'quitar_evidencia', evidenciaId }),
    eliminar: async (id) => {
      try {
        await api(`/api/requisiciones/${id}`, 'DELETE');
        setReqs((l) => l.filter((x) => x.id !== id));
        setAviso({ tipo: 'ok', texto: 'Requisición eliminada.' });
        return true;
      } catch (e) {
        fallo(e);
        if (e instanceof ApiError && (e.status === 409 || e.status === 404)) void recargar();
        return false;
      }
    },
    adminEditar: (id, input) => ejecutar(() => api<Requisicion>(`/api/requisiciones/${id}/admin`, 'PUT', input)),
    agregarCatalogo: async (tipo, nombre) => {
      try {
        const n = await api<ItemCatalogo>('/api/catalogos', 'POST', { tipo, nombre });
        const clave = (tipo === 'departamento' ? 'departamentos' : tipo === 'tecnica' ? 'tecnicas' : 'responsables') as keyof CatalogosApi;
        setCat((c) => ({ ...c, [clave]: [...c[clave], n].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')) }));
        return true;
      } catch (e) { fallo(e); return false; }
    },
    quitarCatalogo: async (id) => {
      try {
        await api('/api/catalogos/' + id, 'DELETE');
        setCat((c) => ({ departamentos: c.departamentos.filter((x) => x.id !== id), tecnicas: c.tecnicas.filter((x) => x.id !== id), responsables: c.responsables.filter((x) => x.id !== id) }));
        return true;
      } catch (e) { fallo(e); return false; }
    },
  }), [ready, requisiciones, cat, personas, aviso, recargar, ejecutar, transicion, fallo]);

  return <Contexto.Provider value={valor}>{children}{aviso && <Toast aviso={aviso} onClose={() => setAviso(null)} />}</Contexto.Provider>;
}

function Toast({ aviso, onClose }: { aviso: Aviso; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 6000);
    return () => clearTimeout(t);
  }, [aviso, onClose]);
  return (
    <div role="alert" className={`anim-toast fixed bottom-5 right-5 z-[100] max-w-sm px-4 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-start gap-3 ${aviso.tipo === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
      <span className="flex-1">{aviso.texto}</span>
      <button onClick={onClose} aria-label="Cerrar aviso" className="opacity-80 hover:opacity-100 cursor-pointer">✕</button>
    </div>
  );
}

export function useRequisiciones() {
  const c = useContext(Contexto);
  if (!c) throw new Error('useRequisiciones debe usarse dentro de <RequisicionesProvider>');
  return c;
}

export type { Usuario };
