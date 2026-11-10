/**
 * Prepara una foto de perfil en el navegador: recorta al centro en cuadrado, reduce a `lado` px y la guarda como JPEG.
 * Así la subida pesa unos 20-60 KB aunque la foto original sea de varios MB. Lanza Error con un mensaje listo para mostrar.
 */
export async function prepararFoto(archivo: File, lado = 320): Promise<Blob> {
  if (!/^image\/(jpeg|png|webp)$/.test(archivo.type)) throw new Error('Elige una imagen JPG, PNG o WEBP.');
  if (archivo.size > 15 * 1024 * 1024) throw new Error('La imagen es demasiado grande (máximo 15 MB).');
  let bmp: ImageBitmap;
  try { bmp = await createImageBitmap(archivo); } catch { throw new Error('No se pudo leer la imagen. Prueba con otra.'); }
  const lado0 = Math.min(bmp.width, bmp.height);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = Math.min(lado, lado0);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Tu navegador no puede procesar la imagen.');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height); // PNG con transparencia → fondo blanco
  ctx.drawImage(bmp, (bmp.width - lado0) / 2, (bmp.height - lado0) / 2, lado0, lado0, 0, 0, canvas.width, canvas.height);
  bmp.close();
  const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, 'image/jpeg', 0.86));
  if (!blob) throw new Error('No se pudo procesar la imagen.');
  return blob;
}
