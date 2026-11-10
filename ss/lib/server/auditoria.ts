import { prisma } from '@/lib/prisma';
import type { Actor } from '@/lib/server/actor';

/**
 * Bitácora general del sistema. Nunca debe romper la operación que audita: si no se puede escribir, solo se avisa en consola.
 * Acciones usadas: login.ok|fallido|bloqueado, registro.cuenta, cuenta.perfil|password, recuperacion.password,
 * usuario.crear|editar|eliminar, requisicion.crear|enviar|editar|eliminar|aprobar|devolver|verificacion|cerrar|estado,
 * evidencia.subir|quitar|descargar, catalogo.agregar|quitar, recordatorios.enviar.
 */
export type QuienAudita = Pick<Actor, 'id' | 'nombre' | 'rol'> | { id?: null; nombre: string; rol?: string } | null;

export async function auditar(quien: QuienAudita, accion: string, entidad: string, entidadId?: string | null, detalle?: string, ip?: string): Promise<void> {
  try {
    await prisma.auditoria.create({
      data: {
        actorId: quien?.id ?? null, actorNombre: quien?.nombre ?? null, actorRol: quien?.rol ?? null,
        accion, entidad, entidadId: entidadId ?? null, detalle: detalle ? detalle.slice(0, 1000) : null, ip: ip ?? null,
      },
    });
  } catch (e) {
    console.error('[auditoría] no se pudo registrar', accion, e instanceof Error ? e.message : e);
  }
}
