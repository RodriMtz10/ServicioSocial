import { prisma } from '@/lib/prisma';
import { ErrorHttp, json, leerJson, manejar } from '@/lib/server/http';
import { ipDe, limitar } from '@/lib/server/limite';
import { codigoCoincide, MAX_INTENTOS_CODIGO } from '@/lib/server/verificacion';
import { hashPassword } from '@/lib/security';
import { auditar } from '@/lib/server/auditoria';
import { recuperarSchema } from '@/lib/validacion';

export const dynamic = 'force-dynamic';

const ERROR_CODIGO = 'El código es incorrecto o ya venció. Revisa tu correo o solicita uno nuevo.';

/**
 * Paso 2 de "Olvidé mi contraseña": código + nueva contraseña.
 * El código vence a los 15 min, admite 5 intentos y sirve una vez. Al cambiar la contraseña se cierran las sesiones
 * anteriores de la cuenta y se desbloquea si estaba bloqueada por intentos fallidos.
 */
export const POST = (req: Request) => manejar(async () => {
  limitar(`rec:${ipDe(req.headers)}`, 20, 15 * 60_000, 'Demasiados intentos. Inténtalo más tarde.');
  const d = recuperarSchema.parse(await leerJson(req));

  const v = await prisma.verificacionCorreo.findFirst({ where: { correo: d.correo, proposito: 'recuperacion', usadaEn: null } });
  if (!v || v.expira <= new Date() || v.intentos >= MAX_INTENTOS_CODIGO) throw new ErrorHttp(400, ERROR_CODIGO, { codigo: 'Código no válido' });
  if (!codigoCoincide(d.correo, d.codigo, v.codigoHash)) {
    await prisma.verificacionCorreo.update({ where: { id: v.id }, data: { intentos: v.intentos + 1 } });
    throw new ErrorHttp(400, ERROR_CODIGO, { codigo: 'Código incorrecto' });
  }

  await prisma.$transaction(async (tx) => {
    // Reclamo atómico: si dos peticiones usan el mismo código a la vez, solo una gana.
    const r = await tx.verificacionCorreo.updateMany({ where: { id: v.id, usadaEn: null, intentos: { lt: MAX_INTENTOS_CODIGO } }, data: { usadaEn: new Date() } });
    if (r.count !== 1) throw new ErrorHttp(400, ERROR_CODIGO, { codigo: 'Código no válido' });
    const u = await tx.usuario.findUnique({ where: { correo: d.correo } });
    if (!u || !u.activo) throw new ErrorHttp(400, ERROR_CODIGO, { codigo: 'Código no válido' });
    await tx.usuario.update({
      where: { id: u.id },
      data: { passwordHash: await hashPassword(d.password), credencialesActualizadas: new Date(), intentosFallidos: 0, bloqueadoHasta: null },
    });
  });
  await auditar({ nombre: d.correo }, 'recuperacion.password', 'usuario', null, 'Contraseña restablecida con código', ipDe(req.headers));
  return json({ ok: true });
});
