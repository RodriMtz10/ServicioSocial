export type Role = 'docente' | 'admin';

/** Ciclo de vida: borrador → pendiente → en_proceso → verificacion → cerrada  (y "devuelta" cuando el SGI pide correcciones) */
export type EstadoRequisicion =
  | 'borrador'
  | 'pendiente'
  | 'devuelta'
  | 'en_proceso'
  | 'verificacion'
  | 'cerrada';

export interface PlanAccionItem {
  id: string;
  accion: string;
  responsable: string;
  fechaProgramada: string; // YYYY-MM-DD
  evidencia: string;
  completado: boolean;
}

/** Archivo de evidencia. `accionId` la vincula a una acción del plan (null = evidencia general). */
export interface EvidenciaArchivo {
  id: string;
  nombre: string;
  tamano: string;
  fecha: string;
  accionId: string | null;
  /** false en evidencias antiguas que solo guardaron el nombre (sin archivo). */
  disponible: boolean;
  /** Se puede mostrar dentro del navegador (imagen o PDF). */
  enLinea: boolean;
}

export type TipoEvento =
  | 'creada' | 'enviada' | 'devuelta' | 'aprobada'
  | 'avance' | 'verificacion' | 'cerrada' | 'reabierta' | 'editada';

export interface Evento {
  id: string;
  fecha: string; // ISO datetime
  autor: string;
  tipo: TipoEvento;
  comentario?: string;
}

export interface CierreRequisicion {
  causaEliminada: boolean;
  observaciones: string;
  fechaCierre: string;
  firmaRD: string;
}

export interface Requisicion {
  id: string;
  folio: string;
  fechaRegistro: string;
  solicitanteId: string;
  solicitante: string;
  departamento: string;
  estado: EstadoRequisicion;
  // 1. Solicitud
  descripcion: string;
  responsableDefinir: string;
  responsableVerificar: string;
  // 2. Dictamen
  requiereAC: boolean | null;
  requiereCorreccion: boolean | null;
  // 3. Análisis
  tecnicaEstadistica: string;
  causaRaiz: string;
  accionRealizar: string;
  // 4. Plan y evidencias
  planAccion: PlanAccionItem[];
  evidencias: EvidenciaArchivo[];
  // 5. Cierre
  observacionesDocente: string;
  definio: string;
  verifico: string;
  cierre?: CierreRequisicion;
  historial: Evento[];
  actualizada: string;
}

export interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  rol: Role;
  departamento: string;
  puesto: string;
  activo: boolean;
  /** URL de la foto de perfil (null = sin foto: se muestran las iniciales). */
  foto: string | null;
}

export type TipoCatalogo = 'departamento' | 'tecnica' | 'responsable';

export interface Catalogos {
  departamentos: string[];
  tecnicas: string[];
  /** Puestos / responsables sugeridos en el formulario (texto libre sigue permitido). */
  responsables: string[];
}
