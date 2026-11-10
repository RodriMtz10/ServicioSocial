import { createHash } from 'node:crypto';
import type { Prisma } from '../../generated/prisma/client';
import { prisma } from '@/lib/prisma';
import type { Requisicion } from '@/types';
import type { Actor } from '@/lib/server/actor';
import { ErrorHttp } from '@/lib/server/http';
import { incluir, serializar } from '@/lib/server/serializar';
import { auditar } from '@/lib/server/auditoria';
import { borrarArchivo, guardarArchivo, leerArchivo } from '@/lib/server/archivos';
import { limitar } from '@/lib/server/limite';
import { MAX_MB, MIME_POR_EXT, VISIBLE_EN_LINEA, contenidoCoincide, extension, problemaNombre, tamanoTexto } from '@/lib/evidencia';

export const MAX_BYTES = MAX_MB * 1024 * 1024;
const MAX_POR_REQUISICION = 50;

/** Filtro de visibilidad (igual que en requisiciones): el docente solo ve lo suyo; el admin todo salvo borradores ajenos. */
const visible = (a: Actor): Prisma.RequisicionWhereInput =>
  a.rol === 'admin' ? { OR: [{ estado: { not: 'borrador' } }, { solicitanteId: a.id }] } : { solicitanteId: a.id };

/**
 * Guarda un archivo de evidencia. Reglas:
 *  - Docente: solo en SU requisición y solo mientras está «en proceso».
 *  - Administrador: en cualquier estado.
 *  - Nombre, tamaño real y contenido (firma del archivo) se validan aquí; el navegador solo es una comodidad.
 */
export async function subirEvidencia(a: Actor, requisicionId: string, nombreOriginal: string, datos: Buffer, accionId?: string | null, ip?: string): Promise<Requisicion> {
  limitar(`subida:${a.id}`, 30, 60_000, 'Estás subiendo archivos demasiado rápido. Espera un momento.');
  const nombre = nombreOriginal.trim();
  const pn = problemaNombre(nombre);
  if (pn) throw new ErrorHttp(400, pn);
  if (datos.length === 0) throw new ErrorHttp(400, 'El archivo está vacío');
  if (datos.length > MAX_BYTES) throw new ErrorHttp(413, `El archivo supera el máximo de ${MAX_MB} MB`);
  const ext = extension(nombre);
  if (!contenidoCoincide(ext, datos)) throw new ErrorHttp(400, `El contenido de «${nombre}» no corresponde a un archivo .${ext} válido. Revisa que no esté dañado ni renombrado.`);

  const base = await prisma.requisicion.findFirst({ where: { id: requisicionId, ...visible(a) }, include: incluir });
  if (!base) throw new ErrorHttp(404, 'Requisición no encontrada');
  if (base.estado === 'cerrada') throw new ErrorHttp(409, 'La requisición está cerrada (solo lectura): no se pueden adjuntar evidencias. Si hace falta, el administrador debe reabrirla primero.');
  if (a.rol !== 'admin') {
    if (base.solicitanteId !== a.id) throw new ErrorHttp(403, 'Solo el solicitante adjunta evidencias');
    if (base.estado !== 'en_proceso') {
      throw new ErrorHttp(409, base.estado === 'pendiente' ? 'Mientras está pendiente no se pueden adjuntar evidencias; espera a que el SGI la apruebe'
        : base.estado === 'verificacion' ? 'En verificación no se pueden adjuntar evidencias; regresa la requisición a «en proceso» si necesitas hacerlo'
        : 'Solo se adjuntan evidencias mientras la requisición está en proceso');
    }
  }
  if (base.evidencias.length >= MAX_POR_REQUISICION) throw new ErrorHttp(409, `La requisición ya tiene el máximo de ${MAX_POR_REQUISICION} archivos`);
  const accion = accionId ? base.acciones.find((x: { id: string }) => x.id === accionId) : null;
  if (accionId && !accion) throw new ErrorHttp(404, 'La acción indicada no pertenece a esta requisición');

  const { clave, sha256 } = await guardarArchivo(datos);
  try {
    await prisma.$transaction(async (tx) => {
      await tx.evidencia.create({
        data: { requisicionId, accionId: accion?.id ?? null, nombre, tamano: tamanoTexto(datos.length), clave, mime: MIME_POR_EXT[ext] ?? 'application/octet-stream', bytes: datos.length, sha256, subidaPor: a.nombre },
      });
      await tx.evento.create({ data: { requisicionId, usuarioId: a.id, autor: a.nombre, tipo: 'avance', comentario: `Evidencia adjuntada: ${nombre}${accion ? ` (acción: ${accion.accion.slice(0, 80)})` : ''}` } });
    });
  } catch (e) {
    await borrarArchivo(clave); // no dejar archivos huérfanos si la base de datos falla
    throw e;
  }
  const r = await prisma.requisicion.findUnique({ where: { id: requisicionId }, include: incluir });
  return serializar(r!);
}

export interface Descarga { datos: Buffer; nombre: string; mime: string; enLinea: boolean; sha256: string | null }

/** Lee una evidencia comprobando permisos y que el contenido no se haya alterado en disco. */
export async function leerEvidencia(a: Actor, id: string, ip?: string): Promise<Descarga> {
  const ev = await prisma.evidencia.findFirst({ where: { id, requisicion: visible(a) }, include: { requisicion: { select: { folio: true } } } });
  if (!ev) throw new ErrorHttp(404, 'Archivo no encontrado');
  if (!ev.clave) throw new ErrorHttp(404, 'Esta evidencia es antigua y solo conserva el nombre: el archivo no se guardó. Adjúntala de nuevo.');
  const datos = await leerArchivo(ev.clave);
  if (!datos) throw new ErrorHttp(404, 'El archivo ya no está en el servidor. Avisa al administrador del sistema.');
  if (ev.sha256 && createHash('sha256').update(datos).digest('hex') !== ev.sha256) {
    await auditar(a, 'evidencia.corrupta', 'evidencia', id, `${ev.requisicion.folio}: ${ev.nombre}`, ip);
    throw new ErrorHttp(500, 'El archivo está dañado en el servidor (su huella no coincide). Avisa al administrador del sistema.');
  }
  const ext = extension(ev.nombre);
  return { datos, nombre: ev.nombre, mime: ev.mime ?? MIME_POR_EXT[ext] ?? 'application/octet-stream', enLinea: VISIBLE_EN_LINEA.includes(ext), sha256: ev.sha256 };
}
