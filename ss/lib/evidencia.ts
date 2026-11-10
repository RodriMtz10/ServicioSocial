/**
 * Reglas de las evidencias (compartidas por el navegador y el servidor).
 * Solo imágenes y documentos comunes, de hasta 8 MB. Tanto el navegador como el servidor revisan el contenido real
 * del archivo (que un .pdf sea realmente un PDF, etc.), no solo la extensión.
 */

export const MAX_MB = 8;
export const MAX_KB = MAX_MB * 1024;

export const EXT_IMAGENES = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'heic', 'heif', 'tif', 'tiff'] as const;
export const EXT_DOCUMENTOS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp', 'txt', 'csv', 'rtf'] as const;
export const EXT_PERMITIDAS: readonly string[] = [...EXT_IMAGENES, ...EXT_DOCUMENTOS];

/** Valor para el atributo `accept` del selector de archivos. */
export const ACCEPT = EXT_PERMITIDAS.map((e) => '.' + e).join(',');
export const TEXTO_FORMATOS = 'Imágenes (JPG, PNG, GIF, WEBP, BMP, HEIC, TIFF) y documentos (PDF, Word, Excel, PowerPoint, OpenDocument, TXT, CSV, RTF), máximo ' + MAX_MB + ' MB.';

// Extensiones peligrosas: no se aceptan ni escondidas en medio del nombre (p. ej. «factura.exe.pdf»).
const PELIGROSAS = new Set(['exe', 'bat', 'cmd', 'com', 'scr', 'msi', 'js', 'mjs', 'vbs', 'ps1', 'sh', 'jar', 'dll', 'lnk', 'html', 'htm', 'svg', 'php', 'py', 'apk', 'app', 'hta', 'reg']);

export const extension = (nombre: string) => (nombre.includes('.') ? nombre.split('.').pop()!.toLowerCase() : '');

/** Problema con el nombre del archivo, o null si está bien. */
export function problemaNombre(nombre: string): string | null {
  const n = nombre.trim();
  if (!n) return 'El archivo no tiene nombre';
  if (n.length > 150) return 'El nombre del archivo es demasiado largo (máximo 150 caracteres)';
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f<>:"/\\|?*]/.test(n)) return 'El nombre del archivo tiene caracteres no permitidos';
  const partes = n.split('.');
  if (partes.length < 2 || !partes[0]) return 'El archivo debe tener nombre y extensión (por ejemplo evidencia.pdf)';
  const ext = partes[partes.length - 1].toLowerCase();
  if (!EXT_PERMITIDAS.includes(ext)) return `Formato «.${ext}» no permitido. ${TEXTO_FORMATOS}`;
  if (partes.slice(1, -1).some((p) => PELIGROSAS.has(p.toLowerCase()))) return 'El nombre del archivo contiene una extensión no permitida';
  return null;
}

/** Tamaño declarado como «123 KB» (así lo guarda el sistema). */
export function problemaTamano(t: string): string | null {
  const m = /^(\d{1,6}) KB$/.exec(t.trim());
  if (!m) return 'Tamaño de archivo no válido';
  const kb = Number(m[1]);
  if (kb < 1) return 'El archivo está vacío';
  if (kb > MAX_KB) return `El archivo supera el máximo de ${MAX_MB} MB`;
  return null;
}

export const MIME_POR_EXT: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', bmp: 'image/bmp', heic: 'image/heic', heif: 'image/heif', tif: 'image/tiff', tiff: 'image/tiff',
  pdf: 'application/pdf', doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  odt: 'application/vnd.oasis.opendocument.text', ods: 'application/vnd.oasis.opendocument.spreadsheet', odp: 'application/vnd.oasis.opendocument.presentation',
  txt: 'text/plain; charset=utf-8', csv: 'text/csv; charset=utf-8', rtf: 'application/rtf',
};
/** Tipos que el navegador puede mostrar sin riesgo dentro de la página (imágenes rasterizadas y PDF). */
export const VISIBLE_EN_LINEA = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'pdf'];

export const tamanoTexto = (bytes: number) => `${Math.max(1, Math.round(bytes / 1024))} KB`;

const empieza = (b: Uint8Array, ...bytes: number[]) => bytes.every((x, i) => b[i] === x);
const ascii = (b: Uint8Array, desde: number, s: string) => [...s].every((c, i) => b[desde + i] === c.charCodeAt(0));

/** ¿El contenido corresponde al formato que dice la extensión? */
export function contenidoCoincide(ext: string, b: Uint8Array): boolean {
  switch (ext) {
    case 'jpg': case 'jpeg': return empieza(b, 0xff, 0xd8, 0xff);
    case 'png': return empieza(b, 0x89, 0x50, 0x4e, 0x47);
    case 'gif': return ascii(b, 0, 'GIF8');
    case 'bmp': return empieza(b, 0x42, 0x4d);
    case 'webp': return ascii(b, 0, 'RIFF') && ascii(b, 8, 'WEBP');
    case 'tif': case 'tiff': return empieza(b, 0x49, 0x49, 0x2a, 0x00) || empieza(b, 0x4d, 0x4d, 0x00, 0x2a);
    case 'heic': case 'heif': return ascii(b, 4, 'ftyp');
    case 'pdf': { const cab = String.fromCharCode(...b.slice(0, 1024)); return cab.includes('%PDF-'); }
    case 'docx': case 'xlsx': case 'pptx': case 'odt': case 'ods': case 'odp': return empieza(b, 0x50, 0x4b, 0x03, 0x04);
    case 'doc': case 'xls': case 'ppt': return empieza(b, 0xd0, 0xcf, 0x11, 0xe0);
    case 'rtf': return ascii(b, 0, '{\\rtf');
    case 'txt': case 'csv': return !b.includes(0);
    default: return false;
  }
}

/** Revisión completa en el navegador: nombre, tamaño real y contenido. Devuelve el problema o null. */
export async function problemaArchivo(f: File): Promise<string | null> {
  const n = problemaNombre(f.name);
  if (n) return n;
  if (f.size === 0) return 'El archivo está vacío';
  if (f.size > MAX_MB * 1024 * 1024) return `El archivo supera el máximo de ${MAX_MB} MB`;
  const ext = extension(f.name);
  let cab: Uint8Array;
  try { cab = new Uint8Array(await f.slice(0, 2048).arrayBuffer()); } catch { return 'No se pudo leer el archivo'; }
  if (!contenidoCoincide(ext, cab)) return `El contenido de «${f.name}» no corresponde a un archivo .${ext} válido. Revisa que no esté dañado ni renombrado.`;
  return null;
}
