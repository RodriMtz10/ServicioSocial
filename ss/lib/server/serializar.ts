import type { Requisicion } from '@/types';
import { VISIBLE_EN_LINEA, extension } from '@/lib/evidencia';
import { deFecha } from '@/lib/server/fechas';

/** Relaciones que siempre se cargan junto con la requisición. */
export const incluir = {
  acciones: { orderBy: { orden: 'asc' as const } },
  evidencias: { orderBy: { creada: 'asc' as const } },
  eventos: { orderBy: { fecha: 'asc' as const } },
};

// Tipo estructural mínimo: evita depender de los tipos generados por Prisma al compilar.
interface Fila {
  id: string; folio: string; fechaRegistro: Date; estado: string; solicitanteId: string; solicitanteNombre: string; departamento: string;
  descripcion: string; responsableDefinir: string; responsableVerificar: string; requiereAC: boolean | null; requiereCorreccion: boolean | null;
  tecnicaEstadistica: string; causaRaiz: string; accionRealizar: string; observacionesDocente: string; definio: string; verifico: string;
  causaEliminada: boolean | null; obsEficacia: string | null; fechaCierre: Date | null; firmaRD: string | null; actualizada: Date;
  acciones: { id: string; accion: string; responsable: string; fechaProgramada: Date | null; evidencia: string; completado: boolean }[];
  evidencias: { id: string; nombre: string; tamano: string; creada: Date; accionId: string | null; clave: string | null }[];
  eventos: { id: string; fecha: Date; autor: string; tipo: string; comentario: string | null }[];
}

export function serializar(r: Fila): Requisicion {
  return {
    id: r.id, folio: r.folio, fechaRegistro: deFecha(r.fechaRegistro), solicitanteId: r.solicitanteId, solicitante: r.solicitanteNombre,
    departamento: r.departamento, estado: r.estado as Requisicion['estado'],
    descripcion: r.descripcion, responsableDefinir: r.responsableDefinir, responsableVerificar: r.responsableVerificar,
    requiereAC: r.requiereAC, requiereCorreccion: r.requiereCorreccion,
    tecnicaEstadistica: r.tecnicaEstadistica, causaRaiz: r.causaRaiz, accionRealizar: r.accionRealizar,
    planAccion: r.acciones.map((a) => ({ id: a.id, accion: a.accion, responsable: a.responsable, fechaProgramada: deFecha(a.fechaProgramada), evidencia: a.evidencia, completado: a.completado })),
    evidencias: r.evidencias.map((e) => ({ id: e.id, nombre: e.nombre, tamano: e.tamano, fecha: deFecha(e.creada), accionId: e.accionId, disponible: !!e.clave, enLinea: !!e.clave && VISIBLE_EN_LINEA.includes(extension(e.nombre)) })),
    observacionesDocente: r.observacionesDocente, definio: r.definio, verifico: r.verifico,
    cierre: r.fechaCierre || r.causaEliminada !== null
      ? { causaEliminada: !!r.causaEliminada, observaciones: r.obsEficacia ?? '', fechaCierre: deFecha(r.fechaCierre), firmaRD: r.firmaRD ?? '' }
      : undefined,
    historial: r.eventos.map((e) => ({ id: e.id, fecha: e.fecha.toISOString(), autor: e.autor, tipo: e.tipo as Requisicion['historial'][number]['tipo'], comentario: e.comentario ?? undefined })),
    actualizada: r.actualizada.toISOString(),
  };
}
