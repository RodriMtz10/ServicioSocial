/**
 * OPCIONAL. Carga las técnicas estadísticas habituales del formato (no son datos de prueba: son opciones del campo 6).
 * Es idempotente: se puede ejecutar varias veces. Todo lo demás (departamentos, responsables) se administra desde la pantalla "Usuarios y catálogos".
 *   npm run db:catalogos-base
 */
import 'dotenv/config';
import { prisma } from '../lib/prisma';

const TECNICAS = ['Lluvia de ideas', 'Diagrama de Pareto', 'Histograma', 'Diagrama de pescado (Ishikawa)', '5 porqués', 'Diagrama de dispersión'];

async function main() {
  for (const nombre of TECNICAS) {
    await prisma.catalogo.upsert({ where: { tipo_nombre: { tipo: 'tecnica', nombre } }, create: { tipo: 'tecnica', nombre }, update: {} });
  }
  console.log(`✔ ${TECNICAS.length} técnicas estadísticas disponibles`);
}
main().catch((e) => { console.error('✖', e.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
