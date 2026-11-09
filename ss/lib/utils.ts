import type { EstadoRequisicion, Requisicion } from '@/types';

export const ESTADOS: Record<EstadoRequisicion, { label: string; tono: 'gray' | 'amber' | 'red' | 'blue' | 'violet' | 'green' }> = {
  borrador: { label: 'Borrador', tono: 'gray' },
  pendiente: { label: 'Pendiente de revisión', tono: 'amber' },
  devuelta: { label: 'Devuelta', tono: 'red' },
  en_proceso: { label: 'En proceso', tono: 'blue' },
  verificacion: { label: 'En verificación', tono: 'violet' },
  cerrada: { label: 'Cerrada', tono: 'green' },
};

export const uid = () => Math.random().toString(36).slice(2, 10);

/** Hoy (AAAA-MM-DD) en la hora de México, igual que en el servidor. */
export const hoy = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

export function fmtFecha(iso?: string, opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' }) {
  if (!iso) return '—';
  const d = new Date(iso.length === 10 ? iso + 'T12:00:00' : iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-MX', opts).replace('.', '');
}

export const fmtFechaHora = (iso: string) =>
  fmtFecha(iso, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export const diasEntre = (a: string, b: string) => Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);

/** Acciones del plan con fecha vencida y sin completar (solo requisiciones en proceso). */
export function accionesVencidas(r: Requisicion) {
  if (r.estado !== 'en_proceso') return 0;
  const h = hoy();
  return r.planAccion.filter((p) => !p.completado && p.fechaProgramada && p.fechaProgramada < h).length;
}

export const csv = (rows: (string | number)[][]) =>
  rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');

export const iniciales = (nombre: string) =>
  nombre.replace(/^(Dr\.|Dra\.|Ing\.|Mtra\.|Mtro\.|Lic\.|M\.C\.)\s+/, '').split(' ').slice(0, 2).map((x) => x[0]).join('');
