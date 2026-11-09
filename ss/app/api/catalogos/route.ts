import { prisma } from '@/lib/prisma';
import { requerirActor, requerirAdmin } from '@/lib/server/actor';
import { ErrorHttp, esDuplicado, json, leerJson, manejar } from '@/lib/server/http';
import { catalogoSchema } from '@/lib/validacion';

export const dynamic = 'force-dynamic';

export const GET = () => manejar(async () => {
  await requerirActor();
  const filas = await prisma.catalogo.findMany({ orderBy: { nombre: 'asc' } });
  const de = (t: string) => filas.filter((f) => f.tipo === t).map((f) => ({ id: f.id, nombre: f.nombre }));
  return json({ departamentos: de('departamento'), tecnicas: de('tecnica'), responsables: de('responsable') });
});

export const POST = (req: Request) => manejar(async () => {
  await requerirAdmin();
  const d = catalogoSchema.parse(await leerJson(req));
  try {
    const c = await prisma.catalogo.create({ data: d });
    return json({ id: c.id, nombre: c.nombre }, 201);
  } catch (e) {
    if (esDuplicado(e)) throw new ErrorHttp(409, 'Ese elemento ya existe');
    throw e;
  }
});
