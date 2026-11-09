/** Cliente mínimo de la API interna. Los errores del servidor llegan como ApiError con el mensaje listo para mostrar. */
export class ApiError extends Error {
  constructor(public status: number, mensaje: string, public errores?: Record<string, string>) {
    super(mensaje);
  }
}

export async function api<T>(url: string, metodo: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET', cuerpo?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: metodo,
      headers: cuerpo !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
      cache: 'no-store',
    });
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor. Revisa tu conexión.');
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data?.error ?? 'Ocurrió un error inesperado', data?.errores);
  return data as T;
}
