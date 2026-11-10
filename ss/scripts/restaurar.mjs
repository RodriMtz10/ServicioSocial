/**
 * Restaura un respaldo hecho con «npm run respaldo». DESTRUYE los datos actuales de la base y de las evidencias.
 *   npm run restaurar -- respaldos/2026-11-10_031500 --confirmar
 * Antes de restaurar comprueba las huellas SHA-256 del respaldo; si algo no coincide, no toca nada.
 * Detén la aplicación mientras restauras.
 */
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { ALMACEN, ejecutarPg, modoPg } from './_comun.mjs';

const carpeta = process.argv[2] && !process.argv[2].startsWith('--') ? path.resolve(process.argv[2]) : null;
if (!carpeta || !process.argv.includes('--confirmar')) {
  console.error('Uso: npm run restaurar -- <carpeta-del-respaldo> --confirmar\n(Esto reemplaza TODA la base de datos y las evidencias actuales.)');
  process.exit(1);
}
const sha = (b) => createHash('sha256').update(b).digest('hex');
const man = JSON.parse(readFileSync(path.join(carpeta, 'manifiesto.json'), 'utf8'));
const sql = readFileSync(path.join(carpeta, 'base.sql'));
if (sha(sql) !== man.baseSha256) throw new Error('base.sql no coincide con su huella: el respaldo está dañado. No se restauró nada.');
const dirEv = path.join(carpeta, 'evidencias');
for (const [f, h] of Object.entries(man.huellas)) {
  if (!existsSync(path.join(dirEv, f)) || sha(readFileSync(path.join(dirEv, f))) !== h) throw new Error(`El archivo ${f} falta o está dañado en el respaldo. No se restauró nada.`);
}

console.log(`Restaurando ${path.basename(carpeta)} (PostgreSQL vía ${modoPg()})…`);
ejecutarPg('psql', ['-v', 'ON_ERROR_STOP=1', '--single-transaction', '--quiet'], { entrada: sql });
rmSync(ALMACEN, { recursive: true, force: true });
mkdirSync(ALMACEN, { recursive: true });
if (existsSync(dirEv)) cpSync(dirEv, ALMACEN, { recursive: true });
console.log(`Listo: base de datos restaurada y ${readdirSync(ALMACEN).length} archivos de evidencia copiados a ${ALMACEN}.`);
