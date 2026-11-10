import { requerirActor } from '@/lib/server/actor';
import { manejar } from '@/lib/server/http';
import { leerEvidencia } from '@/lib/server/evidencias';
import { ipDe } from '@/lib/server/limite';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Descarga (o vista en línea de imágenes y PDF) de una evidencia, solo con permiso sobre su requisición. */
export const GET = (req: Request, { params }: { params: Promise<{ id: string }> }) => manejar(async () => {
  const a = await requerirActor();
  const d = await leerEvidencia(a, (await params).id, ipDe(req.headers));
  const descargar = new URL(req.url).searchParams.get('descargar') === '1' || !d.enLinea;
  const nombreSeguro = d.nombre.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_');
  return new Response(new Uint8Array(d.datos), {
    headers: {
      'Content-Type': d.mime,
      'Content-Length': String(d.datos.length),
      'Content-Disposition': `${descargar ? 'attachment' : 'inline'}; filename="${nombreSeguro}"; filename*=UTF-8''${encodeURIComponent(d.nombre)}`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox",
    },
  });
});
