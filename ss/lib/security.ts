import { compare, hash } from 'bcryptjs';

/** Costo de bcrypt (12 ≈ 250 ms por verificación). */
const COSTO = 12;

export const MIN_PASSWORD = 8;
/** bcrypt solo usa los primeros 72 bytes: se limita para que no haya contraseñas "recortadas" en silencio. */
export const MAX_PASSWORD = 72;

export const MAX_INTENTOS = 5;
export const MINUTOS_BLOQUEO = 15;

export const hashPassword = (password: string) => hash(password, COSTO);
export const verificarPassword = (password: string, passwordHash: string) => compare(password, passwordHash);

let hashFalso: Promise<string> | null = null;
/** Compara contra un hash falso para que "usuario inexistente" tarde lo mismo que "contraseña incorrecta". */
export async function gastarTiempo(password: string) {
  hashFalso ??= hash('contraseña-inexistente', COSTO);
  await compare(password, await hashFalso);
}

const COMUNES = new Set([
  'password', 'password1', 'password123', 'contrasena', 'contrasena1', 'contrasena123', '12345678', '123456789', '1234567890',
  '11111111', '00000000', 'qwertyui', 'qwerty123', 'qwertyuiop', 'abc12345', 'abcd1234', 'iloveyou', 'admin123', 'administrador',
  'bienvenido', 'bienvenido1', 'tecnm123', 'morelia123', 'itmorelia', 'itmorelia1', 'tecnologico', 'letmein123', 'welcome123',
]);

/** Devuelve el motivo por el que una contraseña NO es aceptable, o null si cumple la política. */
export function problemaPassword(password: string, correo?: string): string | null {
  if (password.length < MIN_PASSWORD) return `Mínimo ${MIN_PASSWORD} caracteres`;
  if (password.length > MAX_PASSWORD) return `Máximo ${MAX_PASSWORD} caracteres`;
  if (!/[A-Za-zÁÉÍÓÚÑáéíóúñ]/.test(password) || !/\d/.test(password)) return 'Debe combinar letras y números';
  if (/^(.)\1+$/.test(password)) return 'No uses un solo carácter repetido';
  const limpia = password.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (COMUNES.has(limpia)) return 'Es una contraseña demasiado común';
  const local = correo?.split('@')[0]?.toLowerCase();
  if (local && local.length >= 4 && password.toLowerCase().includes(local)) return 'No debe contener tu correo';
  return null;
}
