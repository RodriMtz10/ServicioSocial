import { requerirActor } from '@/lib/server/actor';
import { manejar } from '@/lib/server/http';
import { leerFoto } from '@/lib/server/foto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = (_req: Request, { params }: { params: Promise<{ id: string }> }) => manejar(async () => {
  const f = await leerFoto(await requerirActor(), (await params).id);
  return new Response(new Uint8Array(f.datos), {
    headers: { 'Content-Type': f.tipo, 'Content-Length': String(f.datos.length), 'Cache-Control': 'private, max-age=3600', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; sandbox" },
  });
});
