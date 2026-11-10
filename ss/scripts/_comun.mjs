// Utilidades compartidas por los scripts de respaldo, restauración y verificación (Node 20+, sin dependencias extra salvo dotenv).
try { await import('dotenv/config'); } catch { /* sin dotenv: se usan las variables del sistema */ }
import { spawnSync } from 'node:child_process';
import path from 'node:path';

export const RAIZ = process.cwd();
export const ALMACEN = path.resolve(process.env.ALMACEN_DIR || path.join(RAIZ, 'storage', 'evidencias'));
export const RESPALDOS = path.resolve(process.env.RESPALDOS_DIR || path.join(RAIZ, 'respaldos'));

/** DATABASE_URL → partes. Se quita «?schema=...» porque las herramientas de PostgreSQL (libpq) no lo aceptan. */
export function datosBd() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('Falta DATABASE_URL en .env');
  const u = new URL(url);
  const limpia = new URL(url); limpia.search = '';
  return { host: u.hostname, puerto: u.port || '5432', usuario: decodeURIComponent(u.username), clave: decodeURIComponent(u.password), base: u.pathname.slice(1), urlLimpia: limpia.toString() };
}

export const existe = (cmd) => !spawnSync(cmd, ['--version'], { stdio: 'ignore', shell: process.platform === 'win32' }).error;

/**
 * Elige cómo hablar con PostgreSQL: herramientas instaladas en el equipo (pg_dump/psql) o, si no están,
 * el contenedor «db» de docker-compose. Se puede forzar con PG_MODO=local|docker.
 */
export function modoPg() {
  const forzado = process.env.PG_MODO;
  if (forzado === 'local' || forzado === 'docker') return forzado;
  if (existe(process.env.PG_DUMP || 'pg_dump') && existe(process.env.PSQL || 'psql')) return 'local';
  if (existe('docker')) return 'docker';
  throw new Error('No encontré pg_dump/psql ni Docker. Instala las herramientas de PostgreSQL o levanta la base con «docker compose up -d».');
}

/** Ejecuta pg_dump/psql según el modo. `entrada` es el SQL que se envía por stdin (restauración). */
export function ejecutarPg(herramienta, args, { entrada, salida } = {}) {
  const bd = datosBd();
  const modo = modoPg();
  let cmd, a, env = process.env;
  if (modo === 'local') {
    cmd = herramienta === 'pg_dump' ? process.env.PG_DUMP || 'pg_dump' : process.env.PSQL || 'psql';
    a = ['--host', bd.host, '--port', bd.puerto, '--username', bd.usuario, '--dbname', bd.base, ...args];
    env = { ...process.env, PGPASSWORD: bd.clave };
  } else {
    cmd = 'docker';
    a = ['compose', 'exec', '-T', '-e', `PGPASSWORD=${bd.clave}`, process.env.PG_SERVICIO || 'db', herramienta, '--username', bd.usuario, '--dbname', bd.base, ...args];
  }
  const r = spawnSync(cmd, a, { env, input: entrada, maxBuffer: 1024 * 1024 * 1024, encoding: salida === 'buffer' ? 'buffer' : 'utf8', shell: process.platform === 'win32' && modo === 'local' });
  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error(`${herramienta} falló (${modo}): ${String(r.stderr).trim().slice(0, 600)}`);
  return r.stdout;
}
