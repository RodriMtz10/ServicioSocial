import { requerirActor } from '@/lib/server/actor';
import { json, leerJson, manejar } from '@/lib/server/http';
import { transicion } from '@/lib/server/requisiciones';
import { transicionSchema } from '@/lib/validacion';

export const dynamic = 'force-dynamic';

export const POST = (req: Request, { params }: { params: Promise<{ id: string }> }) => manejar(async () => {
  const a = await requerirActor();
  return json(await transicion(a, (await params).id, transicionSchema.parse(await leerJson(req))));
});
