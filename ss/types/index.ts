export type Role = 'docente' | 'admin';

export type EstadoRequisicion = 
  | 'Pendiente de revisión'
  | 'En proceso'
  | 'Cerrada'
  | 'Devuelta';

export interface PlanAccionItem {
  id: string;
  accion: string;
  responsable: string;
  fechaProgramada: string;
  evidencia: string;
}

export interface Requisicion {
  id: string;
  folio: string;
  fechaRegistro: string;
  motivo: string;
  solicitante: string;
  departamento: string;
  docenteId: string;
  estado: EstadoRequisicion;
  evidenciasCount: number;
  responsableDefinir: string;
  responsableVerificar: string;
  requiereAC: 'Si' | 'No';
  requiereCorreccion: 'Si' | 'No';
  tecnicaEstadistica: string;
  causaRaiz: string;
  accionRealizar: string;
  planAccion: PlanAccionItem[];
  observacionesDocente?: string;
  observacionesEficacia?: string;
  eliminadoCausaRaiz?: boolean;
}