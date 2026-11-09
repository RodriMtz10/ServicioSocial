import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Prisma 7 lee la conexión desde aquí (no desde schema.prisma).
// `dotenv/config` carga el archivo `.env` (no `.env.local`): pon DATABASE_URL en `.env`.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
