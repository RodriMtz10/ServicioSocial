import { prisma } from '@/lib/prisma';
import { requerirAdmin } from '@/lib/server/actor';
import { auditar } from '@/lib/server/auditoria';
import { ErrorHttp, json, manejar } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

export const DELETE = (_req: Request, { params }: { params: Promise<{ id: string }> }) => manejar(async () => {
  const admin = await requerirAdmin();
  const id = (await params).id;
  const previo = await prisma.catalogo.findUnique({ where: { id } });
  const res = await prisma.catalogo.deleteMany({ where: { id } });
  if (res.count !== 1) throw new ErrorHttp(404, 'Elemento no encontrado');
  await auditar(admin, 'catalogo.quitar', 'catalogo', id, previo ? `${previo.tipo}: ${previo.nombre}` : undefined);
  return json({ ok: true });
});
