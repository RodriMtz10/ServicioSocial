import { requerirActor } from '@/lib/server/actor';
import { json, leerJson, manejar } from '@/lib/server/http';
import { guardar, listar } from '@/lib/server/requisiciones';
import { guardarSchema } from '@/lib/validacion';

export const dynamic = 'force-dynamic';

export const GET = () => manejar(async () => json(await listar(await requerirActor())));

export const POST = (req: Request) => manejar(async () => {
  const a = await requerirActor();
  const { datos, enviar } = guardarSchema.parse(await leerJson(req));
  return json(await guardar(a, datos, enviar), 201);
});
