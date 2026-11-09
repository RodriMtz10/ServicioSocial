/**
 * Crea (o actualiza) un usuario desde la terminal. Sirve para el PRIMER administrador:
 *   npm run db:crear-admin -- --nombre "Nombre Apellido" --correo admin@morelia.tecnm.mx --password "********" [--rol admin|docente] [--departamento "..."] [--puesto "..."]
 */
import 'dotenv/config';
import { prisma } from '../lib/prisma';
import { hashPassword, problemaPassword } from '../lib/security';

function arg(nombre: string): string | undefined {
  const i = process.argv.indexOf(`--${nombre}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const nombre = arg('nombre');
  const correo = arg('correo')?.trim().toLowerCase();
  const password = arg('password');
  const rol = (arg('rol') ?? 'admin') as 'admin' | 'docente';
  const departamento = arg('departamento') ?? 'Sistema de Gestión Integrado';
  const puesto = arg('puesto') ?? (rol === 'admin' ? 'Representante de la Dirección' : 'Docente');

  if (!nombre || !correo || !password) throw new Error('Uso: npm run db:crear-admin -- --nombre "..." --correo "..." --password "..."');
  const mal = problemaPassword(password, correo);
  if (mal) throw new Error(`Contraseña no válida: ${mal}`);
  if (rol !== 'admin' && rol !== 'docente') throw new Error('--rol debe ser admin o docente');

  const passwordHash = await hashPassword(password);
  const u = await prisma.usuario.upsert({
    where: { correo },
    create: { nombre, correo, passwordHash, rol, departamento, puesto },
    update: { nombre, passwordHash, credencialesActualizadas: new Date(), rol, departamento, puesto, activo: true, intentosFallidos: 0, bloqueadoHasta: null },
  });
  console.log(`✔ Usuario listo: ${u.nombre} <${u.correo}> (${u.rol})`);
}

main().catch((e) => { console.error('✖', e.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
