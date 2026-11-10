/** Utilidades CSV compartidas (requisiciones y bitácora): compatibles con Excel en español. */

/** Escapa una celda: comillas dobles, y antepone «'» si empieza con =, +, -, @ (evita inyección de fórmulas en Excel). */
export function celdaCsv(valor: unknown): string {
  const v = valor === null || valor === undefined ? '' : String(valor);
  const t = /^[=+\-@\t\r]/.test(v) && !/^-?\d+([.,]\d+)?$/.test(v) ? "'" + v : v;
  return `"${t.replace(/"/g, '""')}"`;
}

/** Filas → texto CSV con BOM (para acentos en Excel), saltos CRLF y separador «,». */
export function generarCsv(filas: unknown[][]): string {
  return '﻿' + filas.map((f) => f.map(celdaCsv).join(',')).join('\r\n') + '\r\n';
}

/** AAAA-MM-DD → DD/MM/AAAA (vacío si no hay fecha). */
export function fechaCorta(iso?: string | null): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
}

/** Fecha y hora local de Morelia (America/Mexico_City): DD/MM/AAAA HH:mm:ss. */
export function fechaHoraLocal(d: Date | string): string {
  const f = new Intl.DateTimeFormat('es-MX', { timeZone: 'America/Mexico_City', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).formatToParts(new Date(d));
  const g = (t: string) => f.find((x) => x.type === t)?.value ?? '';
  return `${g('day')}/${g('month')}/${g('year')} ${g('hour') === '24' ? '00' : g('hour')}:${g('minute')}:${g('second')}`;
}

/** Sufijo de fecha para nombres de archivo: AAAA-MM-DD. */
export const sufijoFecha = (d = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City' }).format(d);
