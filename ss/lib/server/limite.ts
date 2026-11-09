import { ErrorHttp } from '@/lib/server/http';

/**
 * Limitador por ventana deslizante, en memoria. Frena abusos básicos en un solo servidor;
 * si algún día se despliega en varias instancias hay que moverlo a Redis o a la base de datos.
 */
const cubetas = new Map<string, number[]>();

/** Registra un evento de `clave` y devuelve false si ya superó `max` en `ventanaMs`. */
export function permitir(clave: string, max: number, ventanaMs: number): boolean {
  const ahora = Date.now();
  const recientes = (cubetas.get(clave) ?? []).filter((t) => ahora - t < ventanaMs);
  if (recientes.length >= max) {
    cubetas.set(clave, recientes);
    return false;
  }
  recientes.push(ahora);
  cubetas.set(clave, recientes);
  if (cubetas.size > 5000) for (const [k, v] of cubetas) if (!v.some((t) => ahora - t < ventanaMs)) cubetas.delete(k);
  return true;
}

/** Cuenta un intento y lanza 429 si se excede. */
export function limitar(clave: string, max: number, ventanaMs: number, mensaje = 'Demasiados intentos. Inténtalo más tarde.') {
  if (!permitir(clave, max, ventanaMs)) throw new ErrorHttp(429, mensaje);
}

/** IP del cliente (detrás de un proxy confiable se toma de x-forwarded-for). */
export function ipDe(headers: { get(n: string): string | null } | Record<string, string | string[] | undefined> | undefined): string {
  if (!headers) return 'desconocida';
  const get = (n: string) => {
    if (typeof (headers as { get?: unknown }).get === 'function') return (headers as { get(n: string): string | null }).get(n);
    const v = (headers as Record<string, string | string[] | undefined>)[n];
    return Array.isArray(v) ? v[0] : v ?? null;
  };
  return get('x-forwarded-for')?.split(',')[0]?.trim() || get('x-real-ip') || 'local';
}
