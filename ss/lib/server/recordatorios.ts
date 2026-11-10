import { prisma } from '@/lib/prisma';
import { aFecha, deFecha, hoyMX } from '@/lib/server/fechas';
import { enviarCorreo } from '@/lib/server/correo';
import { auditar, type QuienAudita } from '@/lib/server/auditoria';

/** Cada cuántos días se vuelve a recordar la misma requisición (RECORDATORIO_DIAS, por defecto 3). */
const diasEntreRecordatorios = () => Math.max(1, Number(process.env.RECORDATORIO_DIAS) || 3);

export interface AccionVencida { accion: string; fechaProgramada: string; diasRetraso: number }
export interface GrupoVencidas {
  solicitanteId: string; solicitante: string; correo: string;
  requisiciones: { id: string; folio: string; recordatorioEn: string | null; acciones: AccionVencida[] }[];
}

const dias = (desde: string, hasta: string) => Math.round((new Date(hasta + 'T00:00:00Z').getTime() - new Date(desde + 'T00:00:00Z').getTime()) / 86400000);

/** Acciones vencidas (fecha pasada, sin completar) de requisiciones en proceso, agrupadas por solicitante. */
export async function vencidasPorSolicitante(): Promise<GrupoVencidas[]> {
  const hoy = hoyMX();
  const filas = await prisma.requisicion.findMany({
    where: { estado: 'en_proceso', acciones: { some: { completado: false, fechaProgramada: { lt: aFecha(hoy) } } } },
    include: { solicitante: { select: { id: true, nombre: true, correo: true, activo: true } }, acciones: { where: { completado: false, fechaProgramada: { lt: aFecha(hoy) } }, orderBy: { fechaProgramada: 'asc' } } },
    orderBy: { folio: 'asc' },
  });
  const grupos = new Map<string, GrupoVencidas>();
  for (const r of filas) {
    if (!r.solicitante.activo) continue;
    const g: GrupoVencidas = grupos.get(r.solicitanteId) ?? { solicitanteId: r.solicitanteId, solicitante: r.solicitante.nombre, correo: r.solicitante.correo, requisiciones: [] };
    g.requisiciones.push({
      id: r.id, folio: r.folio, recordatorioEn: r.recordatorioEn ? r.recordatorioEn.toISOString() : null,
      acciones: r.acciones.map((a: { accion: string; fechaProgramada: Date | null }) => ({ accion: a.accion, fechaProgramada: deFecha(a.fechaProgramada), diasRetraso: dias(deFecha(a.fechaProgramada), hoy) })),
    });
    grupos.set(r.solicitanteId, g);
  }
  return [...grupos.values()];
}

export interface ResumenEnvio { destinatarios: number; requisiciones: number; acciones: number; omitidosRecientes: number; fallidos: number }

/**
 * Envía un correo por solicitante con sus acciones vencidas. No repite el aviso de una requisición antes de
 * RECORDATORIO_DIAS días (a menos que `forzar`). Lo puede disparar un administrador o el cron (Bearer CRON_SECRET).
 */
export async function enviarRecordatorios(quien: QuienAudita, opciones: { forzar?: boolean; url?: string } = {}): Promise<ResumenEnvio> {
  const limite = Date.now() - diasEntreRecordatorios() * 86_400_000;
  const res: ResumenEnvio = { destinatarios: 0, requisiciones: 0, acciones: 0, omitidosRecientes: 0, fallidos: 0 };
  for (const g of await vencidasPorSolicitante()) {
    const toca = g.requisiciones.filter((r) => opciones.forzar || !r.recordatorioEn || new Date(r.recordatorioEn).getTime() < limite);
    res.omitidosRecientes += g.requisiciones.length - toca.length;
    if (toca.length === 0) continue;
    const n = toca.reduce((s, r) => s + r.acciones.length, 0);
    const lineas = toca.flatMap((r) => [`• ${r.folio}`, ...r.acciones.map((a) => `    – ${a.accion.slice(0, 120)} (programada ${a.fechaProgramada}, ${a.diasRetraso} ${a.diasRetraso === 1 ? 'día' : 'días'} de retraso)`)]);
    const texto = `Hola ${g.solicitante},\n\nTienes ${n} ${n === 1 ? 'acción vencida' : 'acciones vencidas'} en tus requisiciones de acciones correctivas:\n\n${lineas.join('\n')}\n\nMárcalas como completadas (con su evidencia) en el sistema o, si necesitas más tiempo, comunícate con el SGI.${opciones.url ? `\n\n${opciones.url}/dashboard/mis-solicitudes` : ''}\n\nInstituto Tecnológico de Morelia · Sistema de Gestión Integrado`;
    const ok = await enviarCorreo(g.correo, `Acciones correctivas vencidas (${n})`, texto);
    if (!ok) { res.fallidos++; continue; }
    await prisma.requisicion.updateMany({ where: { id: { in: toca.map((r) => r.id) } }, data: { recordatorioEn: new Date() } });
    res.destinatarios++; res.requisiciones += toca.length; res.acciones += n;
  }
  await auditar(quien, 'recordatorios.enviar', 'sistema', null, `${res.destinatarios} correos, ${res.acciones} acciones, ${res.omitidosRecientes} omitidas por aviso reciente, ${res.fallidos} fallidos${opciones.forzar ? ' (forzado)' : ''}`);
  return res;
}
