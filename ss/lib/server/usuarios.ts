import { prisma } from '@/lib/prisma';
import type { Usuario } from '@/types';

/** URL de la foto (con la fecha de cambio para que el navegador no use una copia vieja). */
export const urlFoto = (u: { id: string; fotoClave?: string | null; fotoActualizada?: Date | null }) =>
  u.fotoClave ? `/api/usuarios/${u.id}/foto?v=${u.fotoActualizada ? u.fotoActualizada.getTime() : 0}` : null;

export const aUsuario = (u: { id: string; nombre: string; correo: string; rol: string; departamento: string; puesto: string; activo: boolean; fotoClave?: string | null; fotoActualizada?: Date | null }): Usuario => ({
  id: u.id, nombre: u.nombre, correo: u.correo, rol: u.rol as Usuario['rol'], departamento: u.departamento, puesto: u.puesto, activo: u.activo, foto: urlFoto(u),
});

export async function listarUsuarios(): Promise<Usuario[]> {
  return (await prisma.usuario.findMany({ orderBy: { nombre: 'asc' } })).map(aUsuario);
}

/** Nombres para autocompletar responsables (cualquier usuario autenticado; sin correos). */
export async function nombresActivos(): Promise<string[]> {
  return (await prisma.usuario.findMany({ where: { activo: true }, select: { nombre: true }, orderBy: { nombre: 'asc' } })).map((u) => u.nombre);
}
