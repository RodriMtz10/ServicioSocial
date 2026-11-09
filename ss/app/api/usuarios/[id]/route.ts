import { requerirAdmin } from '@/lib/server/actor';
import { ErrorHttp, esDuplicado, esRestriccion, json, leerJson, manejar } from '@/lib/server/http';
import { aUsuario } from '@/lib/server/usuarios';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/security';
import { editarUsuarioSchema } from '@/lib/validacion';

export const dynamic = 'force-dynamic';

export const PATCH = (req: Request, { params }: { params: Promise<{ id: string }> }) => manejar(async () => {
  const admin = await requerirAdmin();
  const { id } = await params;
  const d = editarUsuarioSchema.parse(await leerJson(req));

  // Evita dejar el sistema sin administradores o que alguien se quite el acceso a sí mismo.
  if (id === admin.id && (d.activo === false || (d.rol && d.rol !== 'admin'))) {
    throw new ErrorHttp(400, 'No puedes desactivarte ni quitarte el rol de administrador a ti mismo');
  }
  const { password, ...resto } = d;
  const existe = await prisma.usuario.findUnique({ where: { id } });
  if (!existe) throw new ErrorHttp(404, 'Usuario no encontrado');

  try {
    const u = await prisma.usuario.update({
      where: { id },
      data: { ...resto, ...(password ? { passwordHash: await hashPassword(password), credencialesActualizadas: new Date(), intentosFallidos: 0, bloqueadoHasta: null } : {}), ...(d.activo === true ? { intentosFallidos: 0, bloqueadoHasta: null } : {}) },
    });
    return json(aUsuario(u));
  } catch (e) {
    if (esDuplicado(e)) throw new ErrorHttp(409, 'Ya existe otro usuario con ese correo', { correo: 'Correo ya registrado' });
    throw e;
  }

});

/**
 * Elimina un usuario. Solo si no tiene requisiciones (el historial no se pierde): en ese caso se debe desactivar.
 * Un administrador no puede eliminarse a sí mismo, así que siempre queda al menos uno.
 */
export const DELETE = (_req: Request, { params }: { params: Promise<{ id: string }> }) => manejar(async () => {
  const admin = await requerirAdmin();
  const { id } = await params;
  if (id === admin.id) throw new ErrorHttp(400, 'No puedes eliminar tu propia cuenta');
  const u = await prisma.usuario.findUnique({ where: { id } });
  if (!u) throw new ErrorHttp(404, 'Usuario no encontrado');
  const MENSAJE = 'Este usuario tiene requisiciones registradas, por lo que no se puede eliminar sin perder el historial. Desactívalo para quitarle el acceso.';
  if ((await prisma.requisicion.count({ where: { solicitanteId: id } })) > 0) throw new ErrorHttp(409, MENSAJE);
  try {
    await prisma.usuario.delete({ where: { id } });
  } catch (e) {
    if (esRestriccion(e)) throw new ErrorHttp(409, MENSAJE);
    throw e;
  }
  return json({ ok: true });
});
