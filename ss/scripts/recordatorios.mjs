/**
 * Dispara el envío de recordatorios de acciones vencidas llamando a la API de la aplicación (que debe estar en marcha).
 *   npm run recordatorios            (usa NEXTAUTH_URL y CRON_SECRET de .env)
 * Prográmalo una vez al día (Programador de tareas de Windows, cron…).
 */
try { await import('dotenv/config'); } catch { /* sin dotenv: se usan las variables del sistema */ }

const base = (process.env.RECORDATORIOS_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/$/, '');
if (!process.env.CRON_SECRET) { console.error('Falta CRON_SECRET en .env'); process.exit(1); }
const res = await fetch(`${base}/api/recordatorios`, { method: 'POST', headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` } });
const cuerpo = await res.json().catch(() => null);
if (!res.ok) { console.error(`Error ${res.status}:`, cuerpo?.error ?? 'respuesta inválida'); process.exit(1); }
console.log(`Recordatorios: ${cuerpo.destinatarios} correos, ${cuerpo.acciones} acciones vencidas, ${cuerpo.omitidosRecientes} omitidas por aviso reciente, ${cuerpo.fallidos} fallidos.`);
