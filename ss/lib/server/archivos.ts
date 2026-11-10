import { createHash, randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';

/**
 * Almacén de evidencias en disco. Cada archivo se guarda con un nombre aleatorio (sin extensión ni nombre original),
 * en una carpeta que NO está dentro de /public: solo se puede leer por la API, que comprueba permisos.
 * Para producción conviene apuntar ALMACEN_DIR a un disco con respaldo.
 */
export const ALMACEN_DIR = path.resolve(process.env.ALMACEN_DIR || path.join(process.cwd(), 'storage', 'evidencias'));

const CLAVE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Ruta segura de una clave (rechaza cualquier cosa que no sea un UUID, para evitar «../»). */
function ruta(clave: string): string {
  if (!CLAVE.test(clave)) throw new Error('Clave de archivo no válida');
  return path.join(ALMACEN_DIR, clave);
}

export async function guardarArchivo(datos: Buffer): Promise<{ clave: string; sha256: string }> {
  await fs.mkdir(ALMACEN_DIR, { recursive: true });
  const clave = randomUUID();
  await fs.writeFile(ruta(clave), datos, { flag: 'wx', mode: 0o600 });
  return { clave, sha256: createHash('sha256').update(datos).digest('hex') };
}

export async function leerArchivo(clave: string): Promise<Buffer | null> {
  try { return await fs.readFile(ruta(clave)); } catch { return null; }
}

/** Borra el archivo si existe; nunca lanza (un archivo huérfano no debe romper la operación). */
export async function borrarArchivo(clave: string | null | undefined): Promise<void> {
  if (!clave) return;
  try { await fs.unlink(ruta(clave)); } catch { /* ya no estaba */ }
}
