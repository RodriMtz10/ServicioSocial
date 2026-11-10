import { prisma } from '@/lib/prisma';
import { requerirAdmin } from '@/lib/server/actor';
import { json, manejar } from '@/lib/server/http';
import { fechaHoraLocal, generarCsv, sufijoFecha } from '@/lib/csv';

export const dynamic = 'force-dynamic';

const POR_PAGINA = 50;

/** Bitácora: solo administradores. Filtros: q (texto), accion (prefijo, p. ej. «login»), desde/hasta (AAAA-MM-DD), pagina. `formato=csv` descarga hasta 5000 filas. */
export const GET = (req: Request) => manejar(async () => {
  await requerirAdmin();
  const u = new URL(req.url).searchParams;
  const q = (u.get('q') ?? '').trim().slice(0, 100);
  const accion = (u.get('accion') ?? '').trim().slice(0, 40);
  const fecha = (s: string | null, fin: boolean) => (s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(s + (fin ? 'T23:59:59.999Z' : 'T00:00:00.000Z')) : undefined);
  const desde = fecha(u.get('desde'), false), hasta = fecha(u.get('hasta'), true);
  const where = {
    ...(accion ? { accion: { startsWith: accion } } : {}),
    ...(desde || hasta ? { fecha: { ...(desde ? { gte: desde } : {}), ...(hasta ? { lte: hasta } : {}) } } : {}),
    ...(q ? { OR: [{ actorNombre: { contains: q, mode: 'insensitive' as const } }, { detalle: { contains: q, mode: 'insensitive' as const } }, { accion: { contains: q, mode: 'insensitive' as const } }] } : {}),
  };
  const fila = (f: { id: string; fecha: Date; actorNombre: string | null; actorRol: string | null; accion: string; entidad: string; entidadId: string | null; detalle: string | null; ip: string | null }) =>
    ({ id: f.id, fecha: f.fecha.toISOString(), actor: f.actorNombre ?? '—', rol: f.actorRol ?? '', accion: f.accion, entidad: f.entidad, entidadId: f.entidadId, detalle: f.detalle ?? '', ip: f.ip ?? '' });

  if (u.get('formato') === 'csv') {
    const filas = await prisma.auditoria.findMany({ where, orderBy: { fecha: 'desc' }, take: 5000 });
    const lineas: unknown[][] = [['Fecha (hora de Morelia)', 'Actor', 'Rol', 'Acción', 'Entidad', 'Id', 'Detalle', 'IP'],
      ...filas.map((f) => [fechaHoraLocal(f.fecha), f.actorNombre ?? '—', f.actorRol ?? '', f.accion, f.entidad, f.entidadId ?? '', f.detalle ?? '', f.ip ?? ''])];
    return new Response(generarCsv(lineas), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="bitacora-${sufijoFecha()}.csv"`, 'Cache-Control': 'no-store' } });
  }

  const pagina = Math.max(1, Math.min(10_000, Number(u.get('pagina')) || 1));
  const [total, filas] = await Promise.all([
    prisma.auditoria.count({ where }),
    prisma.auditoria.findMany({ where, orderBy: { fecha: 'desc' }, skip: (pagina - 1) * POR_PAGINA, take: POR_PAGINA }),
  ]);
  return json({ total, pagina, porPagina: POR_PAGINA, filas: filas.map(fila) });
});
