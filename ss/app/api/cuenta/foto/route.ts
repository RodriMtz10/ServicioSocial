import { requerirActor } from '@/lib/server/actor';
import { ErrorHttp, json, manejar } from '@/lib/server/http';
import { MAX_FOTO_BYTES, guardarFoto, quitarFoto } from '@/lib/server/foto';
import { ipDe } from '@/lib/server/limite';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Sube mi foto de perfil (multipart, campo `foto`). */
export const POST = (req: Request) => manejar(async () => {
  const a = await requerirActor();
  if (Number(req.headers.get('content-length') ?? 0) > MAX_FOTO_BYTES + 64 * 1024) throw new ErrorHttp(413, 'La foto supera el máximo de 2 MB');
  let form: FormData;
  try { form = await req.formData(); } catch { throw new ErrorHttp(400, 'No se pudo leer la foto enviada'); }
  const f = form.get('foto');
  if (!(f instanceof File)) throw new ErrorHttp(400, 'No se recibió ninguna foto');
  if (f.size > MAX_FOTO_BYTES) throw new ErrorHttp(413, 'La foto supera el máximo de 2 MB');
  return json(await guardarFoto(a, Buffer.from(await f.arrayBuffer()), ipDe(req.headers)));
});

/** Quita mi foto de perfil (vuelven las iniciales). */
export const DELETE = (req: Request) => manejar(async () => json(await quitarFoto(await requerirActor(), ipDe(req.headers))));
