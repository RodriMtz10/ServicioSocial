/**
 * Respaldo completo: base de datos (SQL) + archivos de evidencia + manifiesto con huellas SHA-256.
 *   npm run respaldo            → crea respaldos/AAAA-MM-DD_HHMMSS/
 * Variables opcionales (.env): RESPALDOS_DIR, RESPALDOS_CONSERVAR (cuántos respaldos guardar, por defecto 14), ALMACEN_DIR.
 * Prográmalo a diario (Programador de tareas de Windows o cron). Copia la carpeta «respaldos» a OTRO disco o nube:
 * un respaldo en el mismo disco no protege contra la falla del disco.
 */
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { ALMACEN, RESPALDOS, ejecutarPg, modoPg } from './_comun.mjs';

const sha = (b) => createHash('sha256').update(b).digest('hex');
const ahora = new Date();
const p2 = (n) => String(n).padStart(2, '0');
const nombre = `${ahora.getFullYear()}-${p2(ahora.getMonth() + 1)}-${p2(ahora.getDate())}_${p2(ahora.getHours())}${p2(ahora.getMinutes())}${p2(ahora.getSeconds())}`;
const destino = path.join(RESPALDOS, nombre);
mkdirSync(destino, { recursive: true });

console.log(`Respaldo ${nombre} (PostgreSQL vía ${modoPg()})`);
const sql = ejecutarPg('pg_dump', ['--clean', '--if-exists', '--no-owner', '--no-privileges'], { salida: 'buffer' });
if (!sql.length || !sql.includes('PostgreSQL database dump')) throw new Error('El volcado de la base de datos salió vacío o inválido.');
writeFileSync(path.join(destino, 'base.sql'), sql);

let archivos = 0, bytes = 0;
const huellas = {};
if (existsSync(ALMACEN)) {
  cpSync(ALMACEN, path.join(destino, 'evidencias'), { recursive: true });
  for (const f of readdirSync(path.join(destino, 'evidencias'))) {
    const b = readFileSync(path.join(destino, 'evidencias', f));
    huellas[f] = sha(b); archivos++; bytes += b.length;
  }
}
const manifiesto = { creado: ahora.toISOString(), baseSha256: sha(sql), baseBytes: sql.length, archivos, archivosBytes: bytes, huellas };
writeFileSync(path.join(destino, 'manifiesto.json'), JSON.stringify(manifiesto, null, 2));

// Retención: conserva los N más recientes.
const conservar = Math.max(1, Number(process.env.RESPALDOS_CONSERVAR) || 14);
const todos = readdirSync(RESPALDOS).filter((d) => /^\d{4}-\d{2}-\d{2}_\d{6}$/.test(d) && statSync(path.join(RESPALDOS, d)).isDirectory()).sort();
for (const viejo of todos.slice(0, Math.max(0, todos.length - conservar))) { rmSync(path.join(RESPALDOS, viejo), { recursive: true, force: true }); console.log(`  (se eliminó el respaldo antiguo ${viejo})`); }

console.log(`Listo: ${destino}\n  base de datos: ${(sql.length / 1024).toFixed(0)} KB · evidencias: ${archivos} archivos (${(bytes / 1048576).toFixed(1)} MB)`);
