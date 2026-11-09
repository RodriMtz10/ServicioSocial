import { prisma } from '@/lib/prisma';
import { requerirAdmin } from '@/lib/server/actor';
import { ErrorHttp, json, manejar } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

export const DELETE = (_req: Request, { params }: { params: Promise<{ id: string }> }) => manejar(async () => {
  await requerirAdmin();
  const res = await prisma.catalogo.deleteMany({ where: { id: (await params).id } });
  if (res.count !== 1) throw new ErrorHttp(404, 'Elemento no encontrado');
  return json({ ok: true });
});
