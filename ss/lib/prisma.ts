import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

// Una sola instancia del cliente (en desarrollo, Next recarga módulos y abriría conexiones de más).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function crearCliente() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('Falta DATABASE_URL en el archivo .env (ver .env.example).');
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

export const prisma = globalForPrisma.prisma ?? crearCliente();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
