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

/** Sube un archivo (multipart). No fija Content-Type: el navegador agrega el «boundary». */
export async function subirArchivo<T>(url: string, campos: Record<string, string | Blob | undefined>, nombreArchivo?: string): Promise<T> {
  const form = new FormData();
  for (const [k, v] of Object.entries(campos)) if (v !== undefined) (v instanceof Blob && nombreArchivo ? form.append(k, v, nombreArchivo) : form.append(k, v));
  let res: Response;
  try {
    res = await fetch(url, { method: 'POST', body: form, cache: 'no-store' });
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor. Revisa tu conexión.');
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data?.error ?? (res.status === 413 ? 'El archivo es demasiado grande' : 'Ocurrió un error inesperado'), data?.errores);
  return data as T;
}
