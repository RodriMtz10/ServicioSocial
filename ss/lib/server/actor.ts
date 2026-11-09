import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { Role } from '@/types';
import { ErrorHttp } from '@/lib/server/http';

export interface Actor {
  id: string;
  nombre: string;
  correo: string;
  rol: Role;
  departamento: string;
  puesto: string;
}

/**
 * Usuario autenticado, tomado de la BASE DE DATOS (no del token): si un admin cambia el rol o
 * desactiva a alguien, el cambio aplica de inmediato en la API aunque su sesión siga vigente.
 */
export async function obtenerActor(): Promise<Actor | null> {
  const session = await getServerSession(authOptions);
  const id = session?.user?.id;
  if (!id) return null;
  const u = await prisma.usuario.findUnique({ where: { id } });
  if (!u || !u.activo) return null;
  // Si la contraseña cambió después de emitirse esta sesión, la sesión ya no vale.
  if ((session.user.emitido ?? 0) < u.credencialesActualizadas.getTime()) return null;
  return { id: u.id, nombre: u.nombre, correo: u.correo, rol: u.rol as Role, departamento: u.departamento, puesto: u.puesto };
}

export async function requerirActor(): Promise<Actor> {
  const a = await obtenerActor();
  if (!a) throw new ErrorHttp(401, 'No autorizado');
  return a;
}

export async function requerirAdmin(): Promise<Actor> {
  const a = await requerirActor();
  if (a.rol !== 'admin') throw new ErrorHttp(403, 'Permiso denegado: se requiere el rol de administrador');
  return a;
}
