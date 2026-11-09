import { requerirAdmin } from '@/lib/server/actor';
import { json, leerJson, manejar } from '@/lib/server/http';
import { adminEditar } from '@/lib/server/requisiciones';
import { adminEditarSchema } from '@/lib/validacion';

export const dynamic = 'force-dynamic';

/** Edición del administrador en cualquier estado. Queda registrada en el historial (evento "editada"). */
export const PUT = (req: Request, { params }: { params: Promise<{ id: string }> }) => manejar(async () => {
  const a = await requerirAdmin();
  return json(await adminEditar(a, (await params).id, adminEditarSchema.parse(await leerJson(req))));
});
