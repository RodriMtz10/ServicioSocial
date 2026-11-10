import type { PlanAccionItem, Requisicion } from '@/types';
import { uid } from '@/lib/utils';

export interface FormValues {
  descripcion: string;
  responsableDefinir: string;
  responsableVerificar: string;
  requiereAC: '' | 'si' | 'no';
  requiereCorreccion: '' | 'si' | 'no';
  tecnicaSel: string;
  tecnicaOtra: string;
  causaRaiz: string;
  accionRealizar: string;
  planAccion: PlanAccionItem[];
  observacionesDocente: string;
  definio: string;
  verifico: string;
}

export type DatosFormulario = Pick<
  Requisicion,
  | 'descripcion' | 'responsableDefinir' | 'responsableVerificar' | 'requiereAC' | 'requiereCorreccion'
  | 'tecnicaEstadistica' | 'causaRaiz' | 'accionRealizar' | 'planAccion' | 'observacionesDocente' | 'definio' | 'verifico'
>;

export const filaPlan = (): PlanAccionItem => ({ id: uid(), accion: '', responsable: '', fechaProgramada: '', evidencia: '', completado: false });

export const valoresVacios = (nombreUsuario: string): FormValues => ({
  descripcion: '', responsableDefinir: '', responsableVerificar: '',
  requiereAC: '', requiereCorreccion: '',
  tecnicaSel: '', tecnicaOtra: '', causaRaiz: '', accionRealizar: '',
  planAccion: [filaPlan()],
  observacionesDocente: '', definio: nombreUsuario, verifico: '',
});

const aTri = (b: boolean | null): '' | 'si' | 'no' => (b === null ? '' : b ? 'si' : 'no');

export function deRequisicion(r: Requisicion, tecnicas: string[]): FormValues {
  const enCatalogo = !r.tecnicaEstadistica || tecnicas.includes(r.tecnicaEstadistica);
  return {
    descripcion: r.descripcion, responsableDefinir: r.responsableDefinir, responsableVerificar: r.responsableVerificar,
    requiereAC: aTri(r.requiereAC), requiereCorreccion: aTri(r.requiereCorreccion),
    tecnicaSel: enCatalogo ? r.tecnicaEstadistica : 'Otra', tecnicaOtra: enCatalogo ? '' : r.tecnicaEstadistica,
    causaRaiz: r.causaRaiz, accionRealizar: r.accionRealizar,
    planAccion: r.planAccion.length ? r.planAccion : [filaPlan()],
    observacionesDocente: r.observacionesDocente, definio: r.definio, verifico: r.verifico,
  };
}

export function aDatos(v: FormValues): DatosFormulario {
  const b = (x: string) => (x === '' ? null : x === 'si');
  return {
    descripcion: v.descripcion.trim(),
    responsableDefinir: v.responsableDefinir.trim(),
    responsableVerificar: v.responsableVerificar.trim(),
    requiereAC: b(v.requiereAC),
    requiereCorreccion: b(v.requiereCorreccion),
    tecnicaEstadistica: v.tecnicaSel === 'Otra' ? v.tecnicaOtra.trim() : v.tecnicaSel,
    causaRaiz: v.causaRaiz.trim(),
    accionRealizar: v.accionRealizar.trim(),
    planAccion: v.planAccion.filter((p) => p.accion || p.responsable || p.fechaProgramada || p.evidencia),
    observacionesDocente: v.observacionesDocente.trim(),
    definio: v.definio.trim(),
    verifico: v.verifico.trim(),
  };
}

/** Devuelve { "campo": "mensaje" } con rutas tipo "planAccion.0.accion". Objeto vacío = válido. */
export function validar(v: FormValues): Record<string, string> {
  const e: Record<string, string> = {};
  const falta = (k: string, val: string, msg: string, min = 1) => { if (val.trim().length < min) e[k] = msg; };

  falta('descripcion', v.descripcion, 'Describe la no conformidad con al menos 20 caracteres', 20);
  falta('responsableDefinir', v.responsableDefinir, 'Indica quién define la acción');
  falta('responsableVerificar', v.responsableVerificar, 'Indica quién verifica la implantación');
  if (!v.requiereAC) e.requiereAC = 'Selecciona una opción';
  if (!v.requiereCorreccion) e.requiereCorreccion = 'Selecciona una opción';
  if (v.requiereAC === 'no' && v.requiereCorreccion === 'no') e.requiereAC = 'Debe requerirse al menos una acción correctiva o una corrección';
  falta('tecnicaSel', v.tecnicaSel, 'Selecciona la técnica utilizada');
  if (v.tecnicaSel === 'Otra') falta('tecnicaOtra', v.tecnicaOtra, 'Especifica la técnica');
  falta('causaRaiz', v.causaRaiz, 'Describe la causa raíz identificada', 10);
  falta('accionRealizar', v.accionRealizar, 'Describe la acción o corrección determinada', 10);
  if (v.planAccion.length === 0) e.planAccion = 'Agrega al menos una acción';
  v.planAccion.forEach((p, i) => {
    falta(`planAccion.${i}.accion`, p.accion, 'Describe la acción');
    falta(`planAccion.${i}.responsable`, p.responsable, 'Indica el responsable');
    falta(`planAccion.${i}.fechaProgramada`, p.fechaProgramada, 'Indica la fecha');
    falta(`planAccion.${i}.evidencia`, p.evidencia, 'Indica la evidencia');
  });
  falta('definio', v.definio, 'Indica quién definió la acción');
  falta('verifico', v.verifico, 'Indica quién verificó el plan');
  return e;
}

export const SECCIONES = [
  { id: 's1', titulo: 'Solicitud y detección', campos: ['descripcion', 'responsableDefinir', 'responsableVerificar'] },
  { id: 's2', titulo: 'Dictamen del reporte', campos: ['requiereAC', 'requiereCorreccion'] },
  { id: 's3', titulo: 'Análisis de causa raíz', campos: ['tecnicaSel', 'tecnicaOtra', 'causaRaiz', 'accionRealizar'] },
  { id: 's4', titulo: 'Plan de acción', campos: ['planAccion'] },
  { id: 's5', titulo: 'Cierre y firmas', campos: ['definio', 'verifico'] },
] as const;

export const seccionCompleta = (errores: Record<string, string>, campos: readonly string[]) =>
  !Object.keys(errores).some((k) => campos.some((c) => k === c || k.startsWith(c + '.')));
