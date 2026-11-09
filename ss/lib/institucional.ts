/**
 * Listas cerradas del Instituto Tecnológico de Morelia / TecNM para departamentos y puestos.
 * Si falta alguna opción, agrégala aquí (un solo lugar): la usan el registro, el perfil y el panel de usuarios.
 */
export const DEPARTAMENTOS_ACADEMICOS = [
  'Arquitectura',
  'Ingeniería Ambiental',
  'Ingeniería Bioquímica',
  'Ingeniería Civil',
  'Ingeniería Eléctrica',
  'Ingeniería Electrónica',
  'Ingeniería en Gestión Empresarial',
  'Ingeniería en Materiales',
  'Ingeniería en Sistemas Computacionales',
  'Ingeniería en Tecnologías de la Información y Comunicaciones',
  'Ingeniería Industrial',
  'Ingeniería Informática',
  'Ingeniería Mecánica',
  'Ingeniería Mecatrónica',
  'Ingeniería Química',
  'Licenciatura en Administración',
  'Ciencias Básicas',
  'Ciencias Económico-Administrativas',
  'División de Estudios de Posgrado e Investigación',
] as const;

export const DEPARTAMENTOS_ADMINISTRATIVOS = [
  'Dirección',
  'Subdirección Académica',
  'Subdirección de Planeación y Vinculación',
  'Subdirección de Servicios Administrativos',
  'Sistema de Gestión Integrado',
  'Desarrollo Académico',
  'Servicios Escolares',
  'Gestión Tecnológica y Vinculación',
  'Planeación, Programación y Presupuestación',
  'Recursos Humanos',
  'Recursos Financieros',
  'Recursos Materiales y Servicios',
  'Centro de Cómputo',
  'Centro de Información (Biblioteca)',
  'Comunicación y Difusión',
  'Actividades Extraescolares',
  'Mantenimiento de Equipo',
  'Laboratorios',
] as const;

export const DEPARTAMENTOS = [...DEPARTAMENTOS_ACADEMICOS, ...DEPARTAMENTOS_ADMINISTRATIVOS] as const;

export const PUESTOS = [
  'Docente',
  'Docente de tiempo completo',
  'Docente investigador(a)',
  'Presidente(a) de Academia',
  'Coordinador(a) de Carrera',
  'Jefe(a) de Departamento',
  'Jefe(a) de Oficina',
  'Responsable de Laboratorio',
  'Subdirector(a) Académico(a)',
  'Subdirector(a) de Planeación y Vinculación',
  'Subdirector(a) de Servicios Administrativos',
  'Director(a)',
  'Representante de la Dirección',
  'Personal administrativo',
  'Personal de apoyo',
] as const;

export type Departamento = (typeof DEPARTAMENTOS)[number];
export type Puesto = (typeof PUESTOS)[number];

/** Cargos que pueden definir o verificar una acción correctiva (se suman a los que el administrador agregue en Catálogos). */
export const RESPONSABLES_BASE = [
  'Jefatura de Departamento', 'Coordinación de Carrera', 'Presidencia de Academia', 'Subdirección Académica',
  'Subdirección de Planeación y Vinculación', 'Subdirección de Servicios Administrativos', 'Dirección', 'Representante de la Dirección',
] as const;
