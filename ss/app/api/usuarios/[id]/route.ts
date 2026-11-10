import { requerirAdmin } from '@/lib/server/actor';
import { ErrorHttp, esDuplicado, esRestriccion, json, leerJson, manejar } from '@/lib/server/http';
import { borrarArchivo } from '@/lib/server/archivos';
import { aUsuario } from '@/lib/server/usuarios';
import { prisma } from '@/lib/prisma';
import { auditar } from '@/lib/server/auditoria';
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
  const resto = d; // el administrador no cambia contraseñas ajenas: cada persona usa «Mi perfil» o «Olvidé mi contraseña»
  const existe = await prisma.usuario.findUnique({ where: { id } });
  if (!existe) throw new ErrorHttp(404, 'Usuario no encontrado');

  try {
    const u = await prisma.usuario.update({
      where: { id },
      data: { ...resto, ...(d.activo === true ? { intentosFallidos: 0, bloqueadoHasta: null } : {}) },
    });
    const cambios = [
      resto.nombre !== undefined && resto.nombre !== existe.nombre && 'nombre', resto.correo !== undefined && resto.correo !== existe.correo && `correo → ${resto.correo}`,
      resto.rol !== undefined && resto.rol !== existe.rol && `rol ${existe.rol} → ${resto.rol}`, resto.departamento !== undefined && resto.departamento !== existe.departamento && 'departamento',
      resto.puesto !== undefined && resto.puesto !== existe.puesto && 'puesto', resto.activo !== undefined && resto.activo !== existe.activo && (resto.activo ? 'reactivado' : 'desactivado'),
    ].filter(Boolean).join('; ');
    await auditar(admin, 'usuario.editar', 'usuario', id, `${existe.correo}: ${cambios || 'sin cambios'}`);
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
    await borrarArchivo(u.fotoClave);
  } catch (e) {
    if (esRestriccion(e)) throw new ErrorHttp(409, MENSAJE);
    throw e;
  }
  await auditar(admin, 'usuario.eliminar', 'usuario', id, u.correo);
  return json({ ok: true });
});
