import { timingSafeEqual } from 'node:crypto';
import { obtenerActor } from '@/lib/server/actor';
import { ErrorHttp, json, manejar } from '@/lib/server/http';
import { enviarRecordatorios, vencidasPorSolicitante } from '@/lib/server/recordatorios';
import { limitar } from '@/lib/server/limite';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** ¿La petición trae `Authorization: Bearer <CRON_SECRET>`? (para el programador de tareas del servidor). */
function esCron(req: Request): boolean {
  const secreto = process.env.CRON_SECRET;
  if (!secreto || secreto.length < 16) return false;
  const h = req.headers.get('authorization') ?? '';
  const dado = Buffer.from(h.startsWith('Bearer ') ? h.slice(7) : '');
  const esperado = Buffer.from(secreto);
  return dado.length === esperado.length && timingSafeEqual(dado, esperado);
}

/** Administrador: vista previa de quién recibiría recordatorios. */
export const GET = () => manejar(async () => {
  const a = await obtenerActor();
  if (!a) throw new ErrorHttp(401, 'No autorizado');
  if (a.rol !== 'admin') throw new ErrorHttp(403, 'Permiso denegado: se requiere el rol de administrador');
  return json(await vencidasPorSolicitante());
});

/** Envía los recordatorios. Admin (sesión) o cron (Bearer CRON_SECRET). Body opcional: { forzar: true } solo para admin. */
export const POST = (req: Request) => manejar(async () => {
  const origen = new URL(req.url).origin;
  if (esCron(req)) return json(await enviarRecordatorios({ nombre: 'Sistema (tarea programada)', rol: 'sistema' }, { url: process.env.NEXTAUTH_URL || origen }));
  const a = await obtenerActor();
  if (!a) throw new ErrorHttp(401, 'No autorizado');
  if (a.rol !== 'admin') throw new ErrorHttp(403, 'Permiso denegado: se requiere el rol de administrador');
  limitar(`recordatorios:${a.id}`, 5, 10 * 60_000, 'Ya enviaste recordatorios hace unos minutos. Espera un poco.');
  const forzar = new URL(req.url).searchParams.get('forzar') === '1';
  return json(await enviarRecordatorios(a, { forzar, url: process.env.NEXTAUTH_URL || origen }));
});
