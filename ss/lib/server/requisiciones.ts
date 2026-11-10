import type { Prisma } from '../../generated/prisma/client';
import { prisma } from '@/lib/prisma';
import type { Requisicion } from '@/types';
import type { Actor } from '@/lib/server/actor';
import { ErrorHttp } from '@/lib/server/http';
import { aFecha, anioMX, hoyMX } from '@/lib/server/fechas';
import { incluir, serializar } from '@/lib/server/serializar';
import { errorEnvio, type AdminEditar, type Datos, type Transicion } from '@/lib/validacion';

type Tx = Prisma.TransactionClient;
type Estado = Requisicion['estado'];

const planCreate = (d: Datos) =>
  d.planAccion.map((p, i) => ({ orden: i, accion: p.accion, responsable: p.responsable, fechaProgramada: p.fechaProgramada ? aFecha(p.fechaProgramada) : null, evidencia: p.evidencia, completado: p.completado }));

const camposDatos = (d: Datos) => ({
  descripcion: d.descripcion, responsableDefinir: d.responsableDefinir, responsableVerificar: d.responsableVerificar,
  requiereAC: d.requiereAC, requiereCorreccion: d.requiereCorreccion,
  tecnicaEstadistica: d.tecnicaEstadistica, causaRaiz: d.causaRaiz, accionRealizar: d.accionRealizar,
  observacionesDocente: d.observacionesDocente, definio: d.definio, verifico: d.verifico,
});

/** Filtro de visibilidad: el docente solo ve lo suyo; el admin ve todo salvo borradores ajenos. */
const visible = (a: Actor): Prisma.RequisicionWhereInput =>
  a.rol === 'admin' ? { OR: [{ estado: { not: 'borrador' } }, { solicitanteId: a.id }] } : { solicitanteId: a.id };

const cargar = async (db: Tx | typeof prisma, id: string) => {
  const r = await db.requisicion.findUnique({ where: { id }, include: incluir });
  return r ? serializar(r) : null;
};

async function cargarVisible(a: Actor, id: string) {
  const r = await prisma.requisicion.findFirst({ where: { id, ...visible(a) }, include: incluir });
  if (!r) throw new ErrorHttp(404, 'Requisición no encontrada');
  return r;
}

const evento = (tx: Tx, requisicionId: string, a: Actor, tipo: Requisicion['historial'][number]['tipo'], comentario?: string) =>
  tx.evento.create({ data: { requisicionId, usuarioId: a.id, autor: a.nombre, tipo, comentario: comentario || null } });

/** Cambia el estado solo si sigue siendo el esperado (evita que dos personas pisen la misma transición). */
async function cambiarEstado(tx: Tx, id: string, desde: Estado[], data: Prisma.RequisicionUpdateManyMutationInput) {
  const res = await tx.requisicion.updateMany({ where: { id, estado: { in: desde } }, data });
  if (res.count !== 1) throw new ErrorHttp(409, 'La requisición cambió de estado mientras la editabas. Recarga la página.');
}

/** Sincroniza evidencias: conserva las que ya existen (por id), borra las ausentes y crea las nuevas. */
async function sincronizarEvidencias(tx: Tx, requisicionId: string, lista: NonNullable<Datos['evidencias']>) {
  const existentes = await tx.evidencia.findMany({ where: { requisicionId }, select: { id: true } });
  const ids = new Set<string>(existentes.map((e: { id: string }) => e.id));
  const conservar = new Set(lista.filter((e) => e.id && ids.has(e.id)).map((e) => e.id as string));
  const borrar = [...ids].filter((i) => !conservar.has(i));
  if (borrar.length) await tx.evidencia.deleteMany({ where: { requisicionId, id: { in: borrar } } });
  const nuevas = lista.filter((e) => !e.id || !ids.has(e.id));
  if (nuevas.length) await tx.evidencia.createMany({ data: nuevas.map((e) => ({ requisicionId, nombre: e.nombre, tamano: e.tamano })) });
}

/* ───────────────────────── consultas ───────────────────────── */

export async function listar(a: Actor): Promise<Requisicion[]> {
  const filas = await prisma.requisicion.findMany({ where: visible(a), include: incluir, orderBy: [{ anio: 'desc' }, { numero: 'desc' }] });
  return filas.map(serializar);
}

export async function obtener(a: Actor, id: string): Promise<Requisicion> {
  return serializar(await cargarVisible(a, id));
}

/* ───────────────────── eliminar ───────────────────── */

/** Estados en los que el propio solicitante puede eliminar su requisición (antes de que se trabaje en ella). */
const ELIMINABLE_POR_DOCENTE: Estado[] = ['borrador', 'devuelta', 'pendiente'];

/**
 * Elimina una requisición con sus acciones, evidencias e historial (borrado en cascada).
 *  - Docente: solo las suyas y solo si están en borrador, devuelta o pendiente de aprobación.
 *  - Administrador: en cualquier estado.
 * El borrado es condicional (id + dueño + estado) para que un cambio de estado simultáneo no lo eluda.
 */
export async function eliminar(a: Actor, id: string): Promise<void> {
  const r = await prisma.requisicion.findUnique({ where: { id } });
  if (!r || (a.rol !== 'admin' && r.solicitanteId !== a.id)) throw new ErrorHttp(404, 'Requisición no encontrada');
  if (a.rol !== 'admin' && !ELIMINABLE_POR_DOCENTE.includes(r.estado as Estado)) {
    throw new ErrorHttp(403, 'Esta requisición ya está en proceso o cerrada. Solo un administrador puede eliminarla.');
  }
  const res = await prisma.requisicion.deleteMany({
    where: a.rol === 'admin' ? { id } : { id, solicitanteId: a.id, estado: { in: ELIMINABLE_POR_DOCENTE } },
  });
  if (res.count !== 1) throw new ErrorHttp(409, 'La requisición cambió de estado y ya no se puede eliminar. Recarga la página.');
  console.log(`[auditoría] ${a.nombre} <${a.correo}> (${a.rol}) eliminó la requisición ${r.folio ?? r.id} (estado: ${r.estado})`);
}

/* ───────────────────── crear / guardar / enviar ───────────────────── */

async function siguienteFolio(tx: Tx) {
  const anio = anioMX();
  // upsert + increment es atómico en PostgreSQL: dos personas nunca reciben el mismo número.
  const c = await tx.contador.upsert({ where: { anio }, create: { anio, ultimo: 1 }, update: { ultimo: { increment: 1 } } });
  return { anio, numero: c.ultimo, folio: `AC-ITM-${anio}-${String(c.ultimo).padStart(3, '0')}` };
}

export async function guardar(a: Actor, datos: Datos, enviar: boolean, id?: string): Promise<Requisicion> {
  if (enviar) {
    const e = errorEnvio(datos);
    if (Object.keys(e).length) throw new ErrorHttp(400, 'Faltan datos para enviar la requisición', e);
  }

  return prisma.$transaction(async (tx) => {
    let reqId: string;
    if (!id) {
      const f = await siguienteFolio(tx);
      const r = await tx.requisicion.create({
        data: {
          ...f, fechaRegistro: aFecha(hoyMX()), estado: 'borrador', solicitanteId: a.id, solicitanteNombre: a.nombre, departamento: a.departamento,
          ...camposDatos(datos), acciones: { create: planCreate(datos) },
        },
      });
      reqId = r.id;
      await evento(tx, reqId, a, 'creada');
      if (datos.evidencias?.length) await sincronizarEvidencias(tx, reqId, datos.evidencias);
    } else {
      reqId = id;
      const actual = await tx.requisicion.findFirst({ where: { id: reqId, solicitanteId: a.id } });
      if (!actual) throw new ErrorHttp(404, 'Requisición no encontrada');
      if (actual.estado !== 'borrador' && actual.estado !== 'devuelta') throw new ErrorHttp(409, 'Solo se editan borradores o requisiciones devueltas');
      await cambiarEstado(tx, reqId, [actual.estado], camposDatos(datos));
      await tx.accionPlan.deleteMany({ where: { requisicionId: reqId } });
      await tx.accionPlan.createMany({ data: planCreate(datos).map((p) => ({ ...p, requisicionId: reqId })) });
      await sincronizarEvidencias(tx, reqId, datos.evidencias ?? []);
    }
    if (enviar) {
      const reenvio = !!id;
      await cambiarEstado(tx, reqId, ['borrador', 'devuelta'], { estado: 'pendiente' });
      await evento(tx, reqId, a, 'enviada', reenvio ? 'Reenviada tras correcciones' : undefined);
    }
    return (await cargar(tx, reqId)) as Requisicion;
  });
}

/* ───────────────────────── transiciones ───────────────────────── */

function exigir(cond: boolean, msg: string, status = 403) {
  if (!cond) throw new ErrorHttp(status, msg);
}

/** Cambios de estado que el propio solicitante puede hacer (cerrar y aprobar son solo del administrador). */
const TRANSICIONES_DOCENTE: Partial<Record<Estado, Estado[]>> = {
  pendiente: ['borrador'],
  en_proceso: ['verificacion'],
  verificacion: ['en_proceso'],
};
const NOMBRE_ESTADO: Record<Estado, string> = {
  borrador: 'borrador', pendiente: 'pendiente de aprobación', devuelta: 'devuelta', en_proceso: 'en proceso', verificacion: 'en verificación', cerrada: 'cerrada',
};
const EN_TRABAJO: Estado[] = ['borrador', 'devuelta', 'en_proceso', 'verificacion'];
const pendientes = (acc: { completado: boolean }[]) => {
  const n = acc.filter((x) => !x.completado).length;
  return n ? `Con ${n} ${n === 1 ? 'acción pendiente' : 'acciones pendientes'}` : undefined;
};

export async function transicion(a: Actor, id: string, t: Transicion): Promise<Requisicion> {
  const base = await cargarVisible(a, id);
  const estado = base.estado as Estado;
  const esDueno = base.solicitanteId === a.id;
  const esAdmin = a.rol === 'admin';

  return prisma.$transaction(async (tx) => {
    switch (t.accion) {
      case 'aprobar':
        exigir(esAdmin, 'Solo el administrador puede aprobar');
        exigir(estado === 'pendiente', 'Solo se aprueban requisiciones pendientes', 409);
        await cambiarEstado(tx, id, ['pendiente'], { estado: 'en_proceso' });
        await evento(tx, id, a, 'aprobada');
        break;

      case 'devolver':
        exigir(esAdmin, 'Solo el administrador puede devolver');
        exigir(estado === 'pendiente', 'Solo se devuelven requisiciones pendientes', 409);
        await cambiarEstado(tx, id, ['pendiente'], { estado: 'devuelta' });
        await evento(tx, id, a, 'devuelta', t.comentario);
        break;

      case 'marcar': {
        exigir(esDueno, 'Solo el solicitante marca el avance del plan');
        exigir(estado === 'en_proceso', 'El plan solo se actualiza mientras la requisición está en proceso', 409);
        const accion = base.acciones.find((x) => x.id === t.accionId);
        if (!accion) throw new ErrorHttp(404, 'Acción no encontrada');
        await tx.accionPlan.update({ where: { id: t.accionId }, data: { completado: t.completado } });
        await evento(tx, id, a, 'avance', `${t.completado ? 'Completada' : 'Reabierta'}: ${accion.accion}`);
        break;
      }

      case 'solicitar_verificacion':
        exigir(esDueno, 'Solo el solicitante puede solicitar la verificación');
        exigir(estado === 'en_proceso', 'La requisición no está en proceso', 409);
        await cambiarEstado(tx, id, ['en_proceso'], { estado: 'verificacion' });
        await evento(tx, id, a, 'verificacion', pendientes(base.acciones));
        break;

      case 'cambiar_estado': {
        exigir(esDueno, 'Solo el solicitante cambia el estado de su requisición');
        const desde = TRANSICIONES_DOCENTE[estado];
        exigir(!!desde && desde.includes(t.estado), 'Ese cambio de estado no está permitido desde «' + estado.replace('_', ' ') + '»', 409);
        await cambiarEstado(tx, id, [estado], { estado: t.estado });
        if (t.estado === 'verificacion') await evento(tx, id, a, 'verificacion', [t.comentario, pendientes(base.acciones)].filter(Boolean).join(' · ') || undefined);
        else await evento(tx, id, a, 'avance', `Estado: ${NOMBRE_ESTADO[estado]} → ${NOMBRE_ESTADO[t.estado]}${t.comentario ? `. ${t.comentario}` : ''}`);
        break;
      }

      case 'cerrar': {
        exigir(esAdmin, 'Solo el administrador puede verificar y cerrar');
        exigir(estado === 'verificacion', 'La requisición no está en verificación', 409);
        const c = t.cierre;
        if (!c.causaEliminada && c.observaciones.length < 5) throw new ErrorHttp(400, 'Explica por qué la causa raíz no se eliminó', { observaciones: 'Obligatorio' });
        if (c.causaEliminada) {
          await cambiarEstado(tx, id, ['verificacion'], { estado: 'cerrada', causaEliminada: true, obsEficacia: c.observaciones, fechaCierre: aFecha(c.fechaCierre), firmaRD: c.firmaRD });
          await evento(tx, id, a, 'cerrada', c.observaciones || undefined);
        } else {
          await cambiarEstado(tx, id, ['verificacion'], { estado: 'devuelta', causaEliminada: null, obsEficacia: null, fechaCierre: null, firmaRD: null });
          await evento(tx, id, a, 'reabierta', c.observaciones);
        }
        break;
      }

      case 'agregar_evidencia':
        exigir(esDueno, 'Solo el solicitante adjunta evidencias');
        exigir(EN_TRABAJO.includes(estado), 'Ya no se pueden adjuntar archivos', 409);
        await tx.evidencia.create({ data: { requisicionId: id, nombre: t.evidencia.nombre, tamano: t.evidencia.tamano } });
        if (estado === 'en_proceso' || estado === 'verificacion') await evento(tx, id, a, 'avance', `Evidencia adjuntada: ${t.evidencia.nombre}`);
        break;

      case 'quitar_evidencia': {
        exigir(esDueno, 'Solo el solicitante quita evidencias');
        exigir(EN_TRABAJO.includes(estado), 'Ya no se pueden quitar archivos', 409);
        const ev = base.evidencias.find((x) => x.id === t.evidenciaId);
        const res = await tx.evidencia.deleteMany({ where: { id: t.evidenciaId, requisicionId: id } });
        if (res.count !== 1) throw new ErrorHttp(404, 'Evidencia no encontrada');
        if (estado === 'en_proceso' || estado === 'verificacion') await evento(tx, id, a, 'avance', `Evidencia quitada: ${ev?.nombre ?? ''}`);
        break;
      }
    }
    return (await cargar(tx, id)) as Requisicion;
  });
}

/* ──────────────── edición del administrador (en cualquier momento) ──────────────── */

const ETIQUETAS: Record<string, string> = {
  descripcion: 'Descripción', responsableDefinir: 'Responsable de definir', responsableVerificar: 'Responsable de verificar',
  requiereAC: '¿Requiere AC?', requiereCorreccion: '¿Requiere corrección?', tecnicaEstadistica: 'Técnica estadística',
  causaRaiz: 'Causa raíz', accionRealizar: 'Acción a realizar', observacionesDocente: 'Observaciones del solicitante',
  definio: 'Definió', verifico: 'Verificó', planAccion: 'Plan de acción',
};

const normPlan = (p: { accion: string; responsable: string; fechaProgramada: string; evidencia: string; completado: boolean }[]) =>
  JSON.stringify(p.map((x) => [x.accion, x.responsable, x.fechaProgramada, x.evidencia, x.completado]));

export async function adminEditar(a: Actor, id: string, input: AdminEditar): Promise<Requisicion> {
  if (a.rol !== 'admin') throw new ErrorHttp(403, 'Permiso denegado');
  const actual = await cargarVisible(a, id).then(serializar);
  const d = input.datos;

  const nuevoEstado = (input.estado ?? actual.estado) as Estado;
  const cierre = input.cierre;
  if (nuevoEstado === 'cerrada') {
    const c = cierre ?? { causaEliminada: actual.cierre?.causaEliminada ?? null, fechaCierre: actual.cierre?.fechaCierre ?? '', firmaRD: actual.cierre?.firmaRD ?? '', observaciones: actual.cierre?.observaciones ?? '' };
    if (c.causaEliminada === null || !c.fechaCierre || !c.firmaRD) {
      throw new ErrorHttp(400, 'Una requisición cerrada necesita causa raíz eliminada, fecha de cierre y firma del RD', { cierre: 'Completa los datos de cierre' });
    }
  }
  // Solo borrador/devuelta admiten datos incompletos; cualquier otro estado exige la requisición completa.
  if (nuevoEstado !== 'borrador' && nuevoEstado !== 'devuelta') {
    const e = errorEnvio(d);
    if (Object.keys(e).length) throw new ErrorHttp(400, 'Faltan datos obligatorios para guardar la requisición en este estado', e);
  }

  // Resumen de cambios para la bitácora.
  const cambios: string[] = [];
  for (const k of Object.keys(ETIQUETAS)) {
    if (k === 'planAccion') { if (normPlan(d.planAccion) !== normPlan(actual.planAccion)) cambios.push(ETIQUETAS[k]); continue; }
    if ((d as Record<string, unknown>)[k] !== (actual as unknown as Record<string, unknown>)[k]) cambios.push(ETIQUETAS[k]);
  }
  if (nuevoEstado !== actual.estado) cambios.push(`Estado: ${actual.estado} → ${nuevoEstado}`);
  if (cierre) {
    const c0 = actual.cierre;
    if (cierre.causaEliminada !== (c0?.causaEliminada ?? null) || cierre.observaciones !== (c0?.observaciones ?? '') || cierre.fechaCierre !== (c0?.fechaCierre ?? '') || cierre.firmaRD !== (c0?.firmaRD ?? '')) cambios.push('Datos de cierre');
  }
  const evActuales = actual.evidencias.map((e) => e.id).sort().join();
  const evNuevas = (d.evidencias ?? actual.evidencias).map((e) => e.id ?? 'nuevo').sort().join();
  if (d.evidencias && evActuales !== evNuevas) cambios.push('Evidencias');
  if (cambios.length === 0) return actual;

  return prisma.$transaction(async (tx) => {
    const cierreData: Prisma.RequisicionUpdateManyMutationInput = cierre
      ? { causaEliminada: cierre.causaEliminada, obsEficacia: cierre.observaciones || null, fechaCierre: cierre.fechaCierre ? aFecha(cierre.fechaCierre) : null, firmaRD: cierre.firmaRD || null }
      : {};
    await cambiarEstado(tx, id, [actual.estado as Estado], { ...camposDatos(d), ...cierreData, estado: nuevoEstado });

    await tx.accionPlan.deleteMany({ where: { requisicionId: id } });
    await tx.accionPlan.createMany({ data: planCreate(d).map((p) => ({ ...p, requisicionId: id })) });
    if (d.evidencias) await sincronizarEvidencias(tx, id, d.evidencias);

    await evento(tx, id, a, 'editada', `${cambios.join('; ')}${input.motivo ? `. Motivo: ${input.motivo}` : ''}`);
    return (await cargar(tx, id)) as Requisicion;
  });
}

