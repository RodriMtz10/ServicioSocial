import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';

export const MINUTOS_CODIGO = 15;
export const MAX_INTENTOS_CODIGO = 5;

/** Código numérico de 6 dígitos generado con aleatoriedad criptográfica. */
export const generarCodigo = () => String(randomInt(0, 1_000_000)).padStart(6, '0');

/** HMAC con el secreto de la app y el correo: el código de una persona no sirve para otro correo. */
export const hashCodigo = (correo: string, codigo: string) =>
  createHmac('sha256', process.env.NEXTAUTH_SECRET || 'solo-desarrollo').update(`${correo}:${codigo.trim()}`).digest('hex');

export function codigoCoincide(correo: string, codigo: string, hashGuardado: string): boolean {
  const a = Buffer.from(hashCodigo(correo, codigo));
  const b = Buffer.from(hashGuardado);
  return a.length === b.length && timingSafeEqual(a, b);
}
