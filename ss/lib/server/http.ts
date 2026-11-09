import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

/** Error con código HTTP; las rutas lo convierten en una respuesta JSON limpia. */
export class ErrorHttp extends Error {
  constructor(
    public status: number,
    mensaje: string,
    public errores?: Record<string, string>,
  ) {
    super(mensaje);
  }
}

/** Las respuestas de la API nunca se cachean (contienen datos personales y de sesión). */
export const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });

/** Ejecuta un handler y traduce errores conocidos. Nunca filtra detalles internos al cliente. */
export async function manejar(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof ErrorHttp) return json({ error: e.message, errores: e.errores }, e.status);
    if (e instanceof ZodError) {
      const errores: Record<string, string> = {};
      for (const i of e.issues) errores[i.path.join('.') || '_'] ??= i.message;
      return json({ error: 'Datos inválidos', errores }, 400);
    }
    console.error('[api] error no controlado:', e);
    return json({ error: 'Error interno del servidor' }, 500);
  }
}

/** Tamaño máximo del cuerpo de una petición (las evidencias son solo nombre y tamaño, no archivos). */
const MAX_CUERPO = 256 * 1024;

/** Lee el cuerpo JSON: 413 si es demasiado grande, 400 si no es JSON válido. */
export async function leerJson(req: Request): Promise<unknown> {
  const declarado = Number(req.headers.get('content-length') ?? 0);
  if (declarado > MAX_CUERPO) throw new ErrorHttp(413, 'La petición es demasiado grande');
  let texto: string;
  try {
    texto = await req.text();
  } catch {
    throw new ErrorHttp(400, 'No se pudo leer la petición');
  }
  if (texto.length > MAX_CUERPO) throw new ErrorHttp(413, 'La petición es demasiado grande');
  try {
    return JSON.parse(texto);
  } catch {
    throw new ErrorHttp(400, 'El cuerpo de la petición no es JSON válido');
  }
}

/** Error único de Prisma (P2002) sin depender de los tipos generados. */
export const esDuplicado = (e: unknown) => typeof e === 'object' && e !== null && (e as { code?: string }).code === 'P2002';

/** Violación de llave foránea (P2003): el registro está referenciado por otros. */
export const esRestriccion = (e: unknown) => typeof e === 'object' && e !== null && (e as { code?: string }).code === 'P2003';
