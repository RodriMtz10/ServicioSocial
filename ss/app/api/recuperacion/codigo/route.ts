import { prisma } from '@/lib/prisma';
import { enviarCodigo } from '@/lib/server/correo';
import { json, leerJson, manejar } from '@/lib/server/http';
import { ipDe, limitar } from '@/lib/server/limite';
import { generarCodigo, hashCodigo, MINUTOS_CODIGO } from '@/lib/server/verificacion';
import { pedirCodigoSchema } from '@/lib/validacion';

export const dynamic = 'force-dynamic';

/**
 * Paso 1 de "Olvidé mi contraseña": envía un código de 6 dígitos al correo de la cuenta.
 * La respuesta es SIEMPRE la misma exista o no la cuenta (o esté desactivada): no revela quién está registrado.
 */
export const POST = (req: Request) => manejar(async () => {
  limitar(`rec-ip:${ipDe(req.headers)}`, 8, 15 * 60_000, 'Demasiadas solicitudes. Inténtalo en unos minutos.');
  const { correo } = pedirCodigoSchema.parse(await leerJson(req));
  limitar(`rec-correo:${correo}`, 3, 15 * 60_000, 'Ya pediste varios códigos. Espera unos minutos o revisa tu bandeja de entrada y spam.');

  const u = await prisma.usuario.findUnique({ where: { correo } });
  if (u && u.activo) {
    const codigo = generarCodigo();
    await prisma.verificacionCorreo.deleteMany({ where: { OR: [{ correo, proposito: 'recuperacion' }, { expira: { lt: new Date() } }] } });
    await prisma.verificacionCorreo.create({ data: { correo, proposito: 'recuperacion', codigoHash: hashCodigo(correo, codigo), expira: new Date(Date.now() + MINUTOS_CODIGO * 60_000) } });
    await enviarCodigo(correo, codigo, 'recuperacion');
  } else if (process.env.NODE_ENV !== 'production') {
    console.log(`\n[correo · modo desarrollo] NO se envió código de recuperación a ${correo}: ${u ? 'la cuenta está desactivada' : 'no existe una cuenta con ese correo'}.\n`);
  }
  return json({ ok: true, minutos: MINUTOS_CODIGO });
});
