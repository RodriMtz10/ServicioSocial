import { ErrorHttp } from '@/lib/server/http';
import { MINUTOS_CODIGO } from '@/lib/server/verificacion';

/**
 * Envío del código de verificación por SMTP (paquete "nodemailer").
 * .env:  SMTP_HOST, SMTP_PORT (587 o 465), SMTP_USER, SMTP_PASS, SMTP_FROM ("SGI ITM <correo@dominio>")
 * Sin SMTP_HOST, en desarrollo el código se imprime en la terminal donde corre `npm run dev`; en producción falla con 503.
 */
interface Transporte { sendMail(o: { from: string; to: string; subject: string; text: string; html: string }): Promise<unknown> }

let transporte: Transporte | null = null;
async function obtenerTransporte(): Promise<Transporte> {
  if (transporte) return transporte;
  const nodemailer = await import('nodemailer');
  const puerto = Number(process.env.SMTP_PORT ?? 587);
  transporte = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: puerto,
    secure: puerto === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  }) as Transporte;
  return transporte;
}

export type Proposito = 'registro' | 'recuperacion';

export async function enviarCodigo(correo: string, codigo: string, proposito: Proposito = 'registro'): Promise<void> {
  const rec = proposito === 'recuperacion';
  if (!process.env.SMTP_HOST) {
    if (process.env.NODE_ENV === 'production') throw new ErrorHttp(503, 'El envío de correos no está configurado. Avisa al administrador del sistema.');
    console.log(`\n[correo · modo desarrollo] Código de ${rec ? 'recuperación' : 'registro'} para ${correo}: ${codigo}\n`);
    return;
  }
  const texto = `Tu código ${rec ? 'para recuperar tu contraseña' : 'de verificación'} en el Sistema de Acciones Correctivas del ITMorelia es: ${codigo}\n\nVence en ${MINUTOS_CODIGO} minutos. Si no lo solicitaste, ignora este mensaje${rec ? ' (tu contraseña actual no cambia)' : ''}.`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:420px;margin:auto;color:#1e293b">
    <h2 style="color:#0F3470;margin:0 0 8px">${rec ? 'Recupera tu contraseña' : 'Verifica tu correo'}</h2>
    <p>Usa este código para ${rec ? 'crear una nueva contraseña' : 'terminar tu registro'} en el Sistema de Acciones Correctivas del Instituto Tecnológico de Morelia:</p>
    <p style="font-size:34px;letter-spacing:8px;font-weight:bold;background:#F3F6FA;padding:14px;text-align:center;border-radius:12px;color:#0F3470">${codigo}</p>
    <p style="font-size:13px;color:#64748b">Vence en ${MINUTOS_CODIGO} minutos. Si no lo solicitaste, ignora este mensaje.</p></div>`;
  try {
    await (await obtenerTransporte()).sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@localhost', to: correo, subject: rec ? `Código para recuperar tu contraseña: ${codigo}` : `Tu código de verificación: ${codigo}`, text: texto, html });
  } catch (e) {
    console.error('[correo] no se pudo enviar:', e);
    throw new ErrorHttp(503, 'No pudimos enviar el correo. Inténtalo de nuevo en unos minutos.');
  }
}
