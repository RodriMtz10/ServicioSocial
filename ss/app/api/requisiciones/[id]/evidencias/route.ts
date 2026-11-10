import { requerirActor } from '@/lib/server/actor';
import { ErrorHttp, json, manejar } from '@/lib/server/http';
import { MAX_BYTES, subirEvidencia } from '@/lib/server/evidencias';
import { ipDe } from '@/lib/server/limite';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Sube un archivo (multipart/form-data: `archivo` y, opcionalmente, `accionId`). Responde con la requisición actualizada. */
export const POST = (req: Request, { params }: { params: Promise<{ id: string }> }) => manejar(async () => {
  const a = await requerirActor();
  const declarado = Number(req.headers.get('content-length') ?? 0);
  if (declarado > MAX_BYTES + 64 * 1024) throw new ErrorHttp(413, 'El archivo es demasiado grande');
  let form: FormData;
  try { form = await req.formData(); } catch { throw new ErrorHttp(400, 'No se pudo leer el archivo enviado'); }
  const archivo = form.get('archivo');
  if (!(archivo instanceof File)) throw new ErrorHttp(400, 'No se recibió ningún archivo');
  if (archivo.size > MAX_BYTES) throw new ErrorHttp(413, 'El archivo supera el tamaño máximo permitido');
  const accionId = form.get('accionId');
  const datos = Buffer.from(await archivo.arrayBuffer());
  return json(await subirEvidencia(a, (await params).id, archivo.name, datos, typeof accionId === 'string' && accionId ? accionId : null, ipDe(req.headers)));
});
