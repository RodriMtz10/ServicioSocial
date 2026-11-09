import { prisma } from '@/lib/prisma';
import { requerirActor } from '@/lib/server/actor';
import { json, leerJson, manejar } from '@/lib/server/http';
import { aUsuario } from '@/lib/server/usuarios';
import { perfilSchema } from '@/lib/validacion';

export const dynamic = 'force-dynamic';

/** Mi perfil (docente o administrador). */
export const GET = () => manejar(async () => {
  const a = await requerirActor();
  const u = await prisma.usuario.findUnique({ where: { id: a.id } });
  return json(aUsuario(u!));
});

/** Cada persona edita su nombre, departamento y puesto. El correo y el rol solo los cambia un administrador. */
export const PATCH = (req: Request) => manejar(async () => {
  const a = await requerirActor();
  const d = perfilSchema.parse(await leerJson(req));
  const u = await prisma.usuario.update({ where: { id: a.id }, data: { nombre: d.nombre, departamento: d.departamento, puesto: d.puesto } });
  return json(aUsuario(u));
});
