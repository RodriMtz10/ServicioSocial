import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Barrera optimista: revisa sesión y rol para redirigir rápido, y protege la API contra CSRF.
 * La autorización real vive en cada ruta de /api (lib/server/actor.ts) consultando la base de datos.
 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // CSRF: toda petición que modifica datos en /api (salvo /api/auth, que next-auth protege con su propio token)
  // debe venir del mismo origen. Sec-Fetch-Site lo envían los navegadores y no se puede falsificar desde una página web.
  if (pathname.startsWith('/api/')) {
    if (pathname.startsWith('/api/auth')) return NextResponse.next();
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      const sitio = req.headers.get('sec-fetch-site');
      const origen = req.headers.get('origin');
      const mismoOrigen = origen ? origen === req.nextUrl.origin || origen === `${req.headers.get('x-forwarded-proto') ?? req.nextUrl.protocol.replace(':', '')}://${req.headers.get('host')}` : true;
      if ((sitio && sitio !== 'same-origin' && sitio !== 'none') || !mismoOrigen) {
        return NextResponse.json({ error: 'Origen no permitido' }, { status: 403 });
      }
    }
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    const url = new URL('/auth/login', req.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }
  const soloAdmin = ['/dashboard/solicitudes-pendientes', '/dashboard/reportes', '/dashboard/catalogos', '/dashboard/usuarios'];
  if (token.role !== 'admin' && soloAdmin.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL('/unauthorized', req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ['/dashboard/:path*', '/imprimir/:path*', '/api/:path*'] };
