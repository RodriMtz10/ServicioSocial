import { prisma } from '@/lib/prisma';
import type { Actor } from '@/lib/server/actor';
import { ErrorHttp } from '@/lib/server/http';
import { auditar } from '@/lib/server/auditoria';
import { borrarArchivo, guardarArchivo, leerArchivo } from '@/lib/server/archivos';
import { limitar } from '@/lib/server/limite';
import { contenidoCoincide } from '@/lib/evidencia';
import { aUsuario } from '@/lib/server/usuarios';

export const MAX_FOTO_BYTES = 2 * 1024 * 1024;
const TIPOS = [['jpg', 'image/jpeg'], ['png', 'image/png'], ['webp', 'image/webp']] as const;

/** Tipo real de la imagen según su contenido (no según lo que diga el navegador); null si no es JPG, PNG o WEBP. */
export const tipoDeImagen = (b: Uint8Array) => TIPOS.find(([ext]) => contenidoCoincide(ext, b))?.[1] ?? null;

/** Reemplaza la foto de perfil de `a`. Devuelve el usuario actualizado. */
export async function guardarFoto(a: Actor, datos: Buffer, ip?: string) {
  limitar(`foto:${a.id}`, 10, 10 * 60_000, 'Cambiaste la foto demasiadas veces seguidas. Espera unos minutos.');
  if (datos.length === 0) throw new ErrorHttp(400, 'El archivo está vacío');
  if (datos.length > MAX_FOTO_BYTES) throw new ErrorHttp(413, 'La foto supera el máximo de 2 MB');
  if (!tipoDeImagen(datos)) throw new ErrorHttp(400, 'La foto debe ser una imagen JPG, PNG o WEBP válida');
  const previo = await prisma.usuario.findUnique({ where: { id: a.id } });
  if (!previo) throw new ErrorHttp(404, 'Usuario no encontrado');
  const { clave } = await guardarArchivo(datos);
  let u;
  try {
    u = await prisma.usuario.update({ where: { id: a.id }, data: { fotoClave: clave, fotoActualizada: new Date() } });
  } catch (e) { await borrarArchivo(clave); throw e; }
  await borrarArchivo(previo.fotoClave);
  return aUsuario(u);
}

export async function quitarFoto(a: Actor, ip?: string) {
  const previo = await prisma.usuario.findUnique({ where: { id: a.id } });
  if (!previo) throw new ErrorHttp(404, 'Usuario no encontrado');
  const u = await prisma.usuario.update({ where: { id: a.id }, data: { fotoClave: null, fotoActualizada: null } });
  await borrarArchivo(previo.fotoClave);
  return aUsuario(u);
}

/** Foto de `id`: solo la propia persona o un administrador. */
export async function leerFoto(a: Actor, id: string) {
  if (a.rol !== 'admin' && a.id !== id) throw new ErrorHttp(404, 'Foto no encontrada');
  const u = await prisma.usuario.findUnique({ where: { id } });
  const datos = u?.fotoClave ? await leerArchivo(u.fotoClave) : null;
  const tipo = datos ? tipoDeImagen(datos) : null;
  if (!datos || !tipo) throw new ErrorHttp(404, 'Foto no encontrada');
  return { datos, tipo };
}
