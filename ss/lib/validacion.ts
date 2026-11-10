import { z } from 'zod';
import { DEPARTAMENTOS, PUESTOS } from '@/lib/institucional';
import { problemaPassword } from '@/lib/security';

const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (AAAA-MM-DD)').refine((s) => !isNaN(new Date(s + 'T00:00:00Z').getTime()), 'Fecha inválida');
const texto = (max = 4000) => z.string().trim().max(max, `Máximo ${max} caracteres`);

export const accionSchema = z.object({
  accion: texto(1000),
  responsable: texto(200),
  fechaProgramada: fecha.or(z.literal('')),
  evidencia: texto(500),
  completado: z.boolean().default(false),
});

export const evidenciaSchema = z.object({ id: z.string().optional(), nombre: texto(255).min(1), tamano: texto(30) });

/** Campos del formulario (borrador: pueden estar incompletos). */
export const datosSchema = z.object({
  descripcion: texto(),
  responsableDefinir: texto(300),
  responsableVerificar: texto(300),
  requiereAC: z.boolean().nullable(),
  requiereCorreccion: z.boolean().nullable(),
  tecnicaEstadistica: texto(200),
  causaRaiz: texto(),
  accionRealizar: texto(),
  planAccion: z.array(accionSchema).max(50),
  evidencias: z.array(evidenciaSchema).max(50).optional(),
  observacionesDocente: texto(),
  definio: texto(300),
  verifico: texto(300),
});
export type Datos = z.infer<typeof datosSchema>;

/** Reglas para ENVIAR (las mismas que valida el formulario en el navegador; aquí son la autoridad). */
export function errorEnvio(d: Datos): Record<string, string> {
  const e: Record<string, string> = {};
  if (d.descripcion.length < 20) e.descripcion = 'Describe la no conformidad con al menos 20 caracteres';
  if (!d.responsableDefinir) e.responsableDefinir = 'Indica quién define la acción';
  if (!d.responsableVerificar) e.responsableVerificar = 'Indica quién verifica la implantación';
  if (d.requiereAC === null) e.requiereAC = 'Selecciona una opción';
  if (d.requiereCorreccion === null) e.requiereCorreccion = 'Selecciona una opción';
  if (d.requiereAC === false && d.requiereCorreccion === false) e.requiereAC = 'Debe requerirse al menos una acción correctiva o una corrección';
  if (!d.tecnicaEstadistica) e.tecnicaSel = 'Selecciona la técnica utilizada';
  if (d.causaRaiz.length < 10) e.causaRaiz = 'Describe la causa raíz identificada';
  if (d.accionRealizar.length < 10) e.accionRealizar = 'Describe la acción o corrección determinada';
  if (d.planAccion.length === 0) e.planAccion = 'Agrega al menos una acción';
  d.planAccion.forEach((p, i) => {
    if (!p.accion || !p.responsable || !p.fechaProgramada || !p.evidencia) e[`planAccion.${i}.accion`] = 'Completa todos los campos de la acción';
  });
  if (!d.definio) e.definio = 'Indica quién definió la acción';
  if (!d.verifico) e.verifico = 'Indica quién verificó el plan';
  return e;
}

export const guardarSchema = z.object({ datos: datosSchema, enviar: z.boolean().default(false) });

export const cierreSchema = z.object({
  causaEliminada: z.boolean(),
  observaciones: texto(),
  fechaCierre: fecha,
  firmaRD: texto(300).min(1, 'Falta el nombre del RD'),
});

export const transicionSchema = z.discriminatedUnion('accion', [
  z.object({ accion: z.literal('aprobar') }),
  z.object({ accion: z.literal('devolver'), comentario: texto(2000).min(5, 'Explica qué debe corregirse') }),
  z.object({ accion: z.literal('marcar'), accionId: z.string().min(1), completado: z.boolean() }),
  z.object({ accion: z.literal('solicitar_verificacion') }),
  z.object({ accion: z.literal('cerrar'), cierre: cierreSchema }),
  z.object({ accion: z.literal('cambiar_estado'), estado: z.enum(['borrador', 'en_proceso', 'verificacion']), comentario: texto(1000).optional() }),
  z.object({ accion: z.literal('agregar_evidencia'), evidencia: evidenciaSchema }),
  z.object({ accion: z.literal('quitar_evidencia'), evidenciaId: z.string().min(1) }),
]);
export type Transicion = z.infer<typeof transicionSchema>;

/** Edición del administrador: datos + (opcionalmente) estado y cierre, con motivo para la bitácora. */
export const adminEditarSchema = z.object({
  datos: datosSchema,
  estado: z.enum(['borrador', 'pendiente', 'devuelta', 'en_proceso', 'verificacion', 'cerrada']).optional(),
  cierre: z.object({
    causaEliminada: z.boolean().nullable(),
    observaciones: texto(),
    fechaCierre: fecha.or(z.literal('')),
    firmaRD: texto(300),
  }).optional(),
  motivo: texto(1000).optional(),
});
export type AdminEditar = z.infer<typeof adminEditarSchema>;

const departamento = z.enum(DEPARTAMENTOS, { message: 'Elige un departamento de la lista' });
const puesto = z.enum(PUESTOS, { message: 'Elige un puesto de la lista' });
const correo = z.string().trim().toLowerCase().email('Correo inválido').max(200);
const password = z.string().max(200, 'Contraseña demasiado larga');
/** Aplica la política de contraseñas (y que no contenga el correo) a un objeto con `password` y `correo`. */
const conPolitica = <T extends z.ZodTypeAny>(base: T, campo = 'password') =>
  base.superRefine((v: { password?: string; correo?: string }, ctx) => {
    const valor = campo === 'password' ? v.password : (v as Record<string, string | undefined>)[campo];
    if (valor === undefined) return;
    const m = problemaPassword(valor, v.correo);
    if (m) ctx.addIssue({ code: 'custom', path: [campo], message: m });
  });

export const crearUsuarioSchema = conPolitica(z.object({
  nombre: texto(200).min(3, 'Escribe el nombre completo'),
  correo,
  password,
  rol: z.enum(['docente', 'admin']),
  departamento,
  puesto,
}));

export const editarUsuarioSchema = conPolitica(z.object({
  nombre: texto(200).min(3, 'Escribe el nombre completo').optional(),
  correo: correo.optional(),
  rol: z.enum(['docente', 'admin']).optional(),
  departamento: departamento.optional(),
  puesto: puesto.optional(),
  activo: z.boolean().optional(),
  password: password.optional(),
}));

export const catalogoSchema = z.object({
  tipo: z.enum(['departamento', 'tecnica', 'responsable']),
  nombre: texto(200).min(1, 'Escribe un nombre'),
});

export const cambiarPasswordSchema = z.object({ actual: z.string().min(1, 'Escribe tu contraseña actual').max(200), nueva: password }).superRefine((v, ctx) => {
  const m = problemaPassword(v.nueva);
  if (m) ctx.addIssue({ code: 'custom', path: ['nueva'], message: m });
});

/** Paso 1 del registro: pedir el código al correo. */
export const pedirCodigoSchema = z.object({ correo });

/** Paso 2: código recibido + datos. Siempre crea un docente. */
export const registroSchema = conPolitica(z.object({
  codigo: z.string().trim().regex(/^\d{6}$/, 'El código tiene 6 dígitos'),
  nombre: texto(200).min(3, 'Escribe tu nombre completo'),
  correo,
  password,
  departamento,
  puesto,
}));

/** Datos que cada persona puede cambiar de su propio perfil (el correo y el rol solo los cambia un administrador). */
export const perfilSchema = z.object({
  nombre: texto(200).min(3, 'Escribe tu nombre completo'),
  departamento,
  puesto,
});

/** Recuperación de contraseña: código recibido por correo + nueva contraseña. */
export const recuperarSchema = conPolitica(z.object({
  correo,
  codigo: z.string().trim().regex(/^\d{6}$/, 'El código tiene 6 dígitos'),
  password,
}));
