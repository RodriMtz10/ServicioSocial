declare module 'nodemailer' {
  export function createTransport(opciones: unknown): { sendMail(mensaje: unknown): Promise<unknown> };
}
