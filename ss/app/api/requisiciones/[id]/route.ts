import { requerirActor } from '@/lib/server/actor';
import { json, leerJson, manejar } from '@/lib/server/http';
import { eliminar, guardar, obtener } from '@/lib/server/requisiciones';
import { guardarSchema } from '@/lib/validacion';

export const dynamic = 'force-dynamic';
type Ctx = { params: Promise<{ id: string }> };

export const GET = (_req: Request, { params }: Ctx) => manejar(async () => {
  const a = await requerirActor();
  return json(await obtener(a, (await params).id));
});

/** El solicitante edita su borrador o requisición devuelta (y opcionalmente la envía). */
export const PUT = (req: Request, { params }: Ctx) => manejar(async () => {
  const a = await requerirActor();
  const { datos, enviar } = guardarSchema.parse(await leerJson(req));
  return json(await guardar(a, datos, enviar, (await params).id));
});

/** Docente: elimina la suya si es borrador, devuelta o pendiente. Administrador: cualquiera, en cualquier estado. */
export const DELETE = (_req: Request, { params }: Ctx) => manejar(async () => {
  const a = await requerirActor();
  await eliminar(a, (await params).id);
  return json({ ok: true });
});
