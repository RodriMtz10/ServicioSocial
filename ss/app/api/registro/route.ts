import { DEPARTAMENTOS_ACADEMICOS, DEPARTAMENTOS_ADMINISTRATIVOS, PUESTOS } from '@/lib/institucional';
import { prisma } from '@/lib/prisma';
import { ErrorHttp, esDuplicado, json, leerJson, manejar } from '@/lib/server/http';
import { ipDe, limitar } from '@/lib/server/limite';
import { codigoCoincide, MAX_INTENTOS_CODIGO } from '@/lib/server/verificacion';
import { hashPassword } from '@/lib/security';
import { registroSchema } from '@/lib/validacion';

export const dynamic = 'force-dynamic';

/**
 * Registro público en dos pasos:  1) POST /api/registro/codigo → llega un código de 6 dígitos al correo
 *                                  2) POST /api/registro        → código + datos → se crea un DOCENTE.
 * El código demuestra que la persona es dueña del correo; vence a los 15 min, admite 5 intentos y sirve una sola vez.
 * Los administradores los crea otro administrador (Usuarios) o el comando db:crear-admin.
 * .env:  REGISTRO_ABIERTO="false" apaga el registro · REGISTRO_DOMINIOS="morelia.tecnm.mx" limita los dominios de correo.
 */
const abierto = () => process.env.REGISTRO_ABIERTO !== 'false';
const dominios = () => (process.env.REGISTRO_DOMINIOS ?? '').split(',').map((d) => d.trim().toLowerCase().replace(/^@/, '')).filter(Boolean);
const ERROR_CODIGO = 'El código es incorrecto o ya venció. Revisa tu correo o solicita uno nuevo.';

/** Datos para armar el formulario: listas cerradas y dominios permitidos. */
export const GET = (req: Request) => manejar(async () => {
  limitar(`reg-get:${ipDe(req.headers)}`, 120, 15 * 60_000);
  return json({
    abierto: abierto(), dominios: dominios(),
    departamentos: { academicos: DEPARTAMENTOS_ACADEMICOS, administrativos: DEPARTAMENTOS_ADMINISTRATIVOS },
    puestos: PUESTOS,
  });
});

export const POST = (req: Request) => manejar(async () => {
  if (!abierto()) throw new ErrorHttp(403, 'El registro está desactivado. Pide a un administrador que te dé de alta.');
  limitar(`reg:${ipDe(req.headers)}`, 20, 15 * 60_000, 'Demasiados intentos de registro. Inténtalo más tarde.');

  const d = registroSchema.parse(await leerJson(req));
  const permitidos = dominios();
  if (permitidos.length && !permitidos.includes(d.correo.split('@')[1] ?? '')) {
    throw new ErrorHttp(400, `Usa tu correo institucional (${permitidos.map((x) => '@' + x).join(', ')})`, { correo: 'Correo no permitido' });
  }

  // La comprobación (y el conteo de intentos) va FUERA de la transacción para que un fallo no deshaga el conteo.
  const v = await prisma.verificacionCorreo.findFirst({ where: { correo: d.correo, proposito: 'registro', usadaEn: null } });
  if (!v || v.expira <= new Date() || v.intentos >= MAX_INTENTOS_CODIGO) throw new ErrorHttp(400, ERROR_CODIGO, { codigo: 'Código no válido' });
  if (!codigoCoincide(d.correo, d.codigo, v.codigoHash)) {
    await prisma.verificacionCorreo.update({ where: { id: v.id }, data: { intentos: v.intentos + 1 } });
    throw new ErrorHttp(400, ERROR_CODIGO, { codigo: 'Código incorrecto' });
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Reclamo atómico: si dos peticiones usan el mismo código a la vez, solo una gana.
      const r = await tx.verificacionCorreo.updateMany({ where: { id: v.id, usadaEn: null, intentos: { lt: MAX_INTENTOS_CODIGO } }, data: { usadaEn: new Date() } });
      if (r.count !== 1) throw new ErrorHttp(400, ERROR_CODIGO, { codigo: 'Código no válido' });
      await tx.usuario.create({
        data: { nombre: d.nombre, correo: d.correo, passwordHash: await hashPassword(d.password), rol: 'docente', departamento: d.departamento, puesto: d.puesto },
      });
    });
  } catch (e) {
    if (esDuplicado(e)) throw new ErrorHttp(409, 'Ya existe una cuenta con ese correo. Inicia sesión.', { correo: 'Correo ya registrado' });
    throw e;
  }
  return json({ ok: true }, 201);
});
