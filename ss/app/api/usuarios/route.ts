import { requerirActor, requerirAdmin } from '@/lib/server/actor';
import { ErrorHttp, esDuplicado, json, leerJson, manejar } from '@/lib/server/http';
import { aUsuario, listarUsuarios, nombresActivos } from '@/lib/server/usuarios';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/security';
import { crearUsuarioSchema } from '@/lib/validacion';

export const dynamic = 'force-dynamic';

/** Admin: lista completa. Docente: solo nombres (para autocompletar). */
export const GET = (req: Request) => manejar(async () => {
  await requerirActor();
  if (new URL(req.url).searchParams.get('nombres') === '1') return json(await nombresActivos());
  await requerirAdmin();
  return json(await listarUsuarios());
});

export const POST = (req: Request) => manejar(async () => {
  await requerirAdmin();
  const d = crearUsuarioSchema.parse(await leerJson(req));
  try {
    const u = await prisma.usuario.create({
      data: { nombre: d.nombre, correo: d.correo, passwordHash: await hashPassword(d.password), rol: d.rol, departamento: d.departamento, puesto: d.puesto },
    });
    return json(aUsuario(u), 201);
  } catch (e) {
    if (esDuplicado(e)) throw new ErrorHttp(409, 'Ya existe un usuario con ese correo', { correo: 'Correo ya registrado' });
    throw e;
  }
});
