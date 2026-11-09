import { prisma } from '@/lib/prisma';
import { enviarCodigo } from '@/lib/server/correo';
import { ErrorHttp, json, leerJson, manejar } from '@/lib/server/http';
import { ipDe, limitar } from '@/lib/server/limite';
import { generarCodigo, hashCodigo, MINUTOS_CODIGO } from '@/lib/server/verificacion';
import { pedirCodigoSchema } from '@/lib/validacion';

export const dynamic = 'force-dynamic';

const abierto = () => process.env.REGISTRO_ABIERTO !== 'false';
const dominios = () => (process.env.REGISTRO_DOMINIOS ?? '').split(',').map((d) => d.trim().toLowerCase().replace(/^@/, '')).filter(Boolean);

/**
 * Paso 1 del registro: envía un código de 6 dígitos al correo institucional.
 * La respuesta es la misma exista o no una cuenta con ese correo (no revela quién está registrado).
 */
export const POST = (req: Request) => manejar(async () => {
  if (!abierto()) throw new ErrorHttp(403, 'El registro está desactivado. Pide a un administrador que te dé de alta.');
  limitar(`cod-ip:${ipDe(req.headers)}`, 8, 15 * 60_000, 'Demasiadas solicitudes. Inténtalo en unos minutos.');
  const { correo } = pedirCodigoSchema.parse(await leerJson(req));

  const permitidos = dominios();
  if (permitidos.length && !permitidos.includes(correo.split('@')[1] ?? '')) {
    throw new ErrorHttp(400, `Usa tu correo institucional (${permitidos.map((x) => '@' + x).join(', ')})`, { correo: 'Correo no permitido' });
  }
  limitar(`cod-correo:${correo}`, 3, 15 * 60_000, 'Ya pediste varios códigos. Espera unos minutos o revisa tu bandeja de entrada y spam.');

  const existente = await prisma.usuario.findUnique({ where: { correo } });
  if (existente && process.env.NODE_ENV !== 'production') {
    // Solo en desarrollo: la pantalla responde igual (para no revelar cuentas), pero aquí se avisa por qué no hay código.
    console.log(`\n[correo · modo desarrollo] NO se envió código a ${correo}: ya existe una cuenta con ese correo. Usa otro correo o inicia sesión.\n`);
  }
  if (!existente) {
    const codigo = generarCodigo();
    await prisma.verificacionCorreo.deleteMany({ where: { OR: [{ correo, proposito: 'registro' }, { expira: { lt: new Date() } }] } });
    await prisma.verificacionCorreo.create({ data: { correo, proposito: 'registro', codigoHash: hashCodigo(correo, codigo), expira: new Date(Date.now() + MINUTOS_CODIGO * 60_000) } });
    await enviarCodigo(correo, codigo, 'registro');
  }
  return json({ ok: true, minutos: MINUTOS_CODIGO });
});
