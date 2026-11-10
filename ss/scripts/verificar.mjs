/**
 * Revisión del entorno antes de usar el sistema «de verdad»:  npm run verificar
 * Comprueba: variables de .env, conexión y tablas de PostgreSQL, carpeta de evidencias (escritura), SMTP real
 * (con SMTP_PROBAR_A=correo@... además envía un correo de prueba) y que existan las migraciones nuevas.
 */
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { ALMACEN, RAIZ } from './_comun.mjs';

let fallos = 0, avisos = 0;
const ok = (m) => console.log(`  ✓ ${m}`);
const mal = (m) => { fallos++; console.log(`  ✗ ${m}`); };
const ojo = (m) => { avisos++; console.log(`  ! ${m}`); };
const env = process.env;

console.log('Variables de entorno');
env.DATABASE_URL ? ok('DATABASE_URL definida') : mal('Falta DATABASE_URL');
(env.NEXTAUTH_SECRET && env.NEXTAUTH_SECRET.length >= 32) ? ok('NEXTAUTH_SECRET definida') : mal('NEXTAUTH_SECRET vacía o muy corta (openssl rand -base64 32)');
env.NEXTAUTH_URL ? ok(`NEXTAUTH_URL = ${env.NEXTAUTH_URL}`) : mal('Falta NEXTAUTH_URL');
(env.CRON_SECRET && env.CRON_SECRET.length >= 16) ? ok('CRON_SECRET definida (recordatorios programados)') : ojo('CRON_SECRET no definida o corta: los recordatorios solo se podrán enviar con el botón del administrador');

console.log('Base de datos');
try {
  const { default: pg } = await import('pg');
  const u = new URL(env.DATABASE_URL); u.search = '';
  const c = new pg.Client({ connectionString: u.toString() });
  await c.connect();
  ok('Conexión a PostgreSQL');
  const t = (await c.query("select table_name from information_schema.tables where table_schema='public'")).rows.map((r) => r.table_name);
  t.includes('auditoria') ? ok('Tabla «auditoria» (migración aplicada)') : mal('Falta la tabla «auditoria»: ejecuta «npx prisma migrate dev --name archivos_auditoria»');
  const col = (await c.query("select column_name from information_schema.columns where table_name='evidencias'")).rows.map((r) => r.column_name);
  ['clave', 'mime', 'bytes', 'sha256', 'accionId'].every((x) => col.includes(x)) ? ok('Tabla evidencias con columnas de archivo real') : mal('La tabla «evidencias» no tiene las columnas nuevas (clave, mime, bytes, sha256, accionId): aplica la migración');
  await c.end();
} catch (e) { mal(`PostgreSQL: ${e.message}`); }

console.log('Almacén de evidencias');
try {
  mkdirSync(ALMACEN, { recursive: true });
  const prueba = path.join(ALMACEN, `.prueba-${process.pid}`);
  writeFileSync(prueba, 'ok'); rmSync(prueba);
  ok(`Carpeta con permiso de escritura: ${ALMACEN} (${readdirSync(ALMACEN).length} archivos)`);
  if (!env.ALMACEN_DIR) ojo('ALMACEN_DIR no definida: se usa «storage/evidencias» dentro del proyecto. En producción apunta a un disco con respaldo.');
} catch (e) { mal(`No se puede escribir en ${ALMACEN}: ${e.message}`); }

console.log('Correo (SMTP)');
if (!env.SMTP_HOST) ojo('SMTP_HOST vacío: los códigos y recordatorios solo se imprimen en la terminal (no sirve en producción)');
else {
  try {
    const nm = await import('nodemailer');
    const port = Number(env.SMTP_PORT || 587);
    const t = nm.createTransport({ host: env.SMTP_HOST, port, secure: port === 465, auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined });
    await t.verify();
    ok(`Conexión y credenciales SMTP correctas (${env.SMTP_HOST}:${port})`);
    if (env.SMTP_PROBAR_A) { await t.sendMail({ from: env.SMTP_FROM || env.SMTP_USER, to: env.SMTP_PROBAR_A, subject: 'Prueba del sistema de acciones correctivas', text: 'Si lees esto, el correo funciona.' }); ok(`Correo de prueba enviado a ${env.SMTP_PROBAR_A}`); }
  } catch (e) { mal(`SMTP: ${e.message}`); }
}

console.log('Proyecto');
existsSync(path.join(RAIZ, 'prisma', 'migrations')) ? ok('Carpeta prisma/migrations presente') : mal('No existe prisma/migrations');

console.log(`\n${fallos ? `✗ ${fallos} problema(s)` : '✓ Todo bien'}${avisos ? `, ${avisos} aviso(s)` : ''}.`);
process.exit(fallos ? 1 : 0);
