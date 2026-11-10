import { prisma } from '@/lib/prisma';
import { requerirActor } from '@/lib/server/actor';
import { ErrorHttp, json, leerJson, manejar } from '@/lib/server/http';
import { limitar } from '@/lib/server/limite';
import { auditar } from '@/lib/server/auditoria';
import { hashPassword, verificarPassword } from '@/lib/security';
import { cambiarPasswordSchema } from '@/lib/validacion';

export const dynamic = 'force-dynamic';

export const POST = (req: Request) => manejar(async () => {
  const a = await requerirActor();
  const { actual, nueva } = cambiarPasswordSchema.parse(await leerJson(req));
  limitar(`pw:${a.id}`, 10, 15 * 60_000, 'Demasiados intentos. Espera unos minutos.');
  if (actual === nueva) throw new ErrorHttp(400, 'La nueva contraseña debe ser distinta de la actual', { nueva: 'Debe ser distinta' });
  const u = await prisma.usuario.findUnique({ where: { id: a.id } });
  if (!u || !(await verificarPassword(actual, u.passwordHash))) throw new ErrorHttp(400, 'La contraseña actual es incorrecta', { actual: 'Incorrecta' });
  await prisma.usuario.update({ where: { id: a.id }, data: { passwordHash: await hashPassword(nueva), credencialesActualizadas: new Date() } });
  await auditar(a, 'cuenta.password', 'usuario', a.id);
  return json({ ok: true });
});
