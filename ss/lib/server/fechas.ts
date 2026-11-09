/** Hoy en formato AAAA-MM-DD según la hora de México (no la del servidor, que suele estar en UTC). */
export const hoyMX = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
export const anioMX = () => Number(hoyMX().slice(0, 4));

/** AAAA-MM-DD → Date a medianoche UTC (columna @db.Date, sin corrimientos de zona horaria). */
export const aFecha = (s: string) => new Date(s + 'T00:00:00Z');
export const deFecha = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : '');
