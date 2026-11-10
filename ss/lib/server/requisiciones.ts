import type { Prisma } from '../../generated/prisma/client';
import { prisma } from '@/lib/prisma';
import type { Requisicion } from '@/types';
import type { Actor } from '@/lib/server/actor';
import { ErrorHttp } from '@/lib/server/http';
import { aFecha, anioMX, hoyMX } from '@/lib/server/fechas';
import { incluir, serializar } from '@/lib/server/serializar';
import { auditar } from '@/lib/server/auditoria';
import { borrarArchivo } from '@/lib/server/archivos';
import { errorEnvio, type AdminEditar, type Datos, type Transicion } from '@/lib/validacion';

type Tx = Prisma.TransactionClient;
type Estado = Requisicion['estado'];

const filaPlan = (p: Datos['planAccion'][number], i: number) =>
  ({ orden: i, accion: p.accion, responsable: p.responsable, fechaProgramada: p.fechaProgramada ? aFecha(p.fechaProgramada) : null, evidencia: p.evidencia, completado: p.completado });
const planCreate = (d: Datos) => d.planAccion.map(filaPlan);

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

/**
 * Sincroniza el plan de acción conservando las acciones que ya existen (por id) para no perder sus evidencias:
 * actualiza las existentes, crea las nuevas y borra las que ya no están (sus evidencias quedan como generales).
 */
async function sincronizarPlan(tx: Tx, requisicionId: string, plan: Datos['planAccion']) {
  const existentes = await tx.accionPlan.findMany({ where: { requisicionId }, select: { id: true } });
  const ids = new Set<string>(existentes.map((e: { id: string }) => e.id));
  const conservar = new Set<string>();
  for (let i = 0; i < plan.length; i++) {
    const p = plan[i];
    if (p.id && ids.has(p.id) && !conservar.has(p.id)) {
      await tx.accionPlan.update({ where: { id: p.id }, data: filaPlan(p, i) });
      conservar.add(p.id);
    } else {
      await tx.accionPlan.create({ data: { ...filaPlan(p, i), requisicionId } });
    }
  }
  const borrar = [...ids].filter((x) => !conservar.has(x));
  if (borrar.length) await tx.accionPlan.deleteMany({ where: { requisicionId, id: { in: borrar } } });
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
  const r = await prisma.requisicion.findUnique({ where: { id }, include: { evidencias: { select: { clave: true } } } });
  if (!r || (a.rol !== 'admin' && r.solicitanteId !== a.id)) throw new ErrorHttp(404, 'Requisición no encontrada');
  if (a.rol !== 'admin' && !ELIMINABLE_POR_DOCENTE.includes(r.estado as Estado)) {
    throw new ErrorHttp(403, 'Esta requisición ya está en proceso o cerrada. Solo un administrador puede eliminarla.');
  }
  const res = await prisma.requisicion.deleteMany({
    where: a.rol === 'admin' ? { id } : { id, solicitanteId: a.id, estado: { in: ELIMINABLE_POR_DOCENTE } },
  });
  if (res.count !== 1) throw new ErrorHttp(409, 'La requisición cambió de estado y ya no se puede eliminar. Recarga la página.');
  for (const e of r.evidencias as { clave: string | null }[]) await borrarArchivo(e.clave);
  await auditar(a, 'requisicion.eliminar', 'requisicion', id, `${r.folio ?? r.id} (estado: ${r.estado}; ${r.evidencias.length} archivos)`);
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
    } else {
      reqId = id;
      const actual = await tx.requisicion.findFirst({ where: { id: reqId, solicitanteId: a.id } });
      if (!actual) throw new ErrorHttp(404, 'Requisición no encontrada');
      if (actual.estado !== 'borrador' && actual.estado !== 'devuelta') throw new ErrorHttp(409, 'Solo se editan borradores o requisiciones devueltas');
      await cambiarEstado(tx, reqId, [actual.estado], camposDatos(datos));
      await sincronizarPlan(tx, reqId, datos.planAccion);
    }
    if (enviar) {
      const reenvio = !!id;
      await cambiarEstado(tx, reqId, ['borrador', 'devuelta'], { estado: 'pendiente' });
      await evento(tx, reqId, a, 'enviada', reenvio ? 'Reenviada tras correcciones' : undefined);
    }
    return (await cargar(tx, reqId)) as Requisicion;
  }).then(async (r) => {
    if (enviar) await auditar(a, id ? 'requisicion.reenviar' : 'requisicion.enviar', 'requisicion', r.id, r.folio); // los borradores no se registran
    return r;
  });
}

/* ───────────────────────── transiciones ───────────────────────── */

function exigir(cond: boolean, msg: string, status = 403) {
  if (!cond) throw new ErrorHttp(status, msg);
}

/** Cambios de estado que el propio solicitante puede hacer (cerrar y aprobar son solo del administrador). */
const TRANSICIONES_DOCENTE: Partial<Record<Estado, Estado[]>> = {
  en_proceso: ['verificacion'],
  verificacion: ['en_proceso'],
};
const NOMBRE_ESTADO: Record<Estado, string> = {
  borrador: 'borrador', pendiente: 'pendiente de aprobación', devuelta: 'devuelta', en_proceso: 'en proceso', verificacion: 'en verificación', cerrada: 'cerrada',
};
const pendientes = (acc: { completado: boolean }[]) => {
  const n = acc.filter((x) => !x.completado).length;
  return n ? `Con ${n} ${n === 1 ? 'acción pendiente' : 'acciones pendientes'}` : undefined;
};

export async function transicion(a: Actor, id: string, t: Transicion): Promise<Requisicion> {
  const base = await cargarVisible(a, id);
  const estado = base.estado as Estado;
  const esDueno = base.solicitanteId === a.id;
  const esAdmin = a.rol === 'admin';
  const archivosABorrar: (string | null)[] = [];

  const resultado = await prisma.$transaction(async (tx) => {
    switch (t.accion) {
      case 'aprobar':
        exigir(esAdmin, 'Solo el administrador puede aprobar');
        exigir(estado === 'pendiente', 'Solo se aprueban requisiciones pendientes', 409);
        await cambiarEstado(tx, id, ['pendiente'], { estado: 'en_proceso' });
        await evento(tx, id, a, 'aprobada');
        break;

      case 'devolver':
        exigir(esAdmin, 'Solo el administrador puede devolver');
        // En la revisión inicial vuelve al solicitante para corregir y reenviar; en la verificación regresa a "en proceso".
        exigir(estado === 'pendiente' || estado === 'verificacion', 'Solo se devuelven requisiciones pendientes o en verificación', 409);
        await cambiarEstado(tx, id, [estado], { estado: estado === 'pendiente' ? 'devuelta' : 'en_proceso' });
        await evento(tx, id, a, 'devuelta', t.comentario || undefined);
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

      case 'agregar_accion': {
        exigir(esDueno, 'Solo el solicitante agrega acciones a su plan');
        exigir(estado === 'en_proceso', 'Solo se agregan acciones mientras la requisición está en proceso', 409);
        exigir(base.acciones.length < 50, 'El plan ya tiene el máximo de 50 acciones', 409);
        exigir(t.nueva.fechaProgramada >= hoyMX(), 'La fecha programada no puede ser anterior a hoy', 400);
        const orden = base.acciones.length;
        await tx.accionPlan.create({ data: { requisicionId: id, orden, accion: t.nueva.accion, responsable: t.nueva.responsable, fechaProgramada: aFecha(t.nueva.fechaProgramada), evidencia: t.nueva.evidencia, completado: false } });
        await evento(tx, id, a, 'avance', `Acción agregada: ${t.nueva.accion}`);
        break;
      }

      case 'quitar_evidencia': {
        exigir(esAdmin || esDueno, 'Solo el solicitante o el administrador quitan evidencias');
        exigir(estado !== 'cerrada', 'La requisición está cerrada (solo lectura): no se pueden quitar evidencias', 409);
        if (!esAdmin) exigir(estado === 'en_proceso', 'Solo se quitan evidencias mientras la requisición está en proceso', 409);
        const ev = base.evidencias.find((x) => x.id === t.evidenciaId);
        if (!ev) throw new ErrorHttp(404, 'Evidencia no encontrada');
        const res = await tx.evidencia.deleteMany({ where: { id: t.evidenciaId, requisicionId: id } });
        if (res.count !== 1) throw new ErrorHttp(404, 'Evidencia no encontrada');
        archivosABorrar.push(ev.clave);
        await evento(tx, id, a, 'avance', `Evidencia quitada: ${ev.nombre}`);
        break;
      }
    }
    return (await cargar(tx, id)) as Requisicion;
  });
  for (const c of archivosABorrar) await borrarArchivo(c);
  if (!['marcar', 'agregar_accion', 'quitar_evidencia'].includes(t.accion)) await auditar(a, `requisicion.${t.accion === 'solicitar_verificacion' ? 'verificacion' : t.accion === 'cambiar_estado' ? 'estado' : t.accion === 'quitar_evidencia' ? 'evidencia.quitar' : t.accion}`, 'requisicion', id, auditoriaDetalle(base.folio, estado, t));
  return resultado;
}

function auditoriaDetalle(folio: string, estado: string, t: Transicion): string {
  switch (t.accion) {
    case 'cambiar_estado': return `${folio}: ${estado} → ${t.estado}`;
    case 'devolver': return `${folio}${t.comentario ? ` · motivo: ${t.comentario}` : ''}`;
    case 'cerrar': return `${folio}: causa raíz ${t.cierre.causaEliminada ? 'eliminada (cerrada)' : 'NO eliminada (devuelta)'}`;
    case 'agregar_accion': return `${folio}: ${t.nueva.accion}`;
    case 'marcar': return `${folio}: ${t.completado ? 'completada' : 'reabierta'} (${t.accionId})`;
    default: return folio;
  }
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
  if (cambios.length === 0) return actual;

  return prisma.$transaction(async (tx) => {
    const cierreData: Prisma.RequisicionUpdateManyMutationInput = cierre
      ? { causaEliminada: cierre.causaEliminada, obsEficacia: cierre.observaciones || null, fechaCierre: cierre.fechaCierre ? aFecha(cierre.fechaCierre) : null, firmaRD: cierre.firmaRD || null }
      : {};
    await cambiarEstado(tx, id, [actual.estado as Estado], { ...camposDatos(d), ...cierreData, estado: nuevoEstado });

    await sincronizarPlan(tx, id, d.planAccion);

    await evento(tx, id, a, 'editada', `${cambios.join('; ')}${input.motivo ? `. Motivo: ${input.motivo}` : ''}`);
    return (await cargar(tx, id)) as Requisicion;
  }).then(async (r) => {
    await auditar(a, 'requisicion.editar', 'requisicion', id, `${actual.folio}: ${cambios.join('; ')}`);
    return r;
  });
}

