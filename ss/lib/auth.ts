import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import { ipDe, permitir } from '@/lib/server/limite';
import { auditar } from '@/lib/server/auditoria';
import { urlFoto } from '@/lib/server/usuarios';
import { MAX_INTENTOS, MINUTOS_BLOQUEO, gastarTiempo, verificarPassword } from '@/lib/security';

/**
 * Autenticación con correo y contraseña contra la tabla `usuarios` (contraseñas con bcrypt).
 * - Tras MAX_INTENTOS fallos la cuenta se bloquea MINUTOS_BLOQUEO minutos.
 * - El rol vive en el token solo para ocultar/mostrar pantallas; la API vuelve a consultarlo en la base de datos.
 */
export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt', maxAge: 60 * 60 * 8 }, // 8 horas
  pages: { signIn: '/auth/login' },
  providers: [
    CredentialsProvider({
      name: 'Credenciales Institucionales',
      credentials: {
        email: { label: 'Correo institucional', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials, req) {
        const correo = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;
        if (!correo || !password || correo.length > 200 || password.length > 200) return null;

        // Freno por IP (además del bloqueo por cuenta): 30 intentos de login cada 15 minutos.
        const ip = ipDe(req?.headers as Record<string, string | string[] | undefined>);
        if (!permitir(`login:${ip}`, 30, 15 * 60_000)) {
          await auditar({ nombre: correo }, 'login.bloqueado_ip', 'usuario', null, 'Demasiados intentos desde esta IP', ip);
          return null;
        }

        const u = await prisma.usuario.findUnique({ where: { correo } });
        if (!u || !u.activo) {
          await gastarTiempo(password);
          return null;
        }
        if (u.bloqueadoHasta && u.bloqueadoHasta > new Date()) {
          return null;
        }

        if (!(await verificarPassword(password, u.passwordHash))) {
          const intentos = u.intentosFallidos + 1;
          const bloquear = intentos >= MAX_INTENTOS;
          await prisma.usuario.update({
            where: { id: u.id },
            data: { intentosFallidos: bloquear ? 0 : intentos, bloqueadoHasta: bloquear ? new Date(Date.now() + MINUTOS_BLOQUEO * 60_000) : null },
          });
          if (bloquear) await auditar({ id: u.id, nombre: u.nombre, rol: u.rol }, 'login.cuenta_bloqueada', 'usuario', u.id, `Cuenta bloqueada ${MINUTOS_BLOQUEO} min por intentos fallidos`, ip);
          return null;
        }

        if (u.intentosFallidos > 0 || u.bloqueadoHasta) {
          await prisma.usuario.update({ where: { id: u.id }, data: { intentosFallidos: 0, bloqueadoHasta: null } });
        }
        return { id: u.id, name: u.nombre, email: u.correo, role: u.rol, department: u.departamento, puesto: u.puesto, emitido: u.credencialesActualizadas.getTime(), foto: urlFoto(u) };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      // Tras editar el perfil, el cliente llama a update(): se relee la base para refrescar nombre/departamento/puesto.
      if (trigger === 'update' && token.sub) {
        const u = await prisma.usuario.findUnique({ where: { id: token.sub } });
        if (u) {
          token.name = u.nombre;
          token.department = u.departamento;
          token.puesto = u.puesto;
          token.role = u.rol;
          token.foto = urlFoto(u);
        }
      }
      if (user) {
        token.role = user.role;
        token.department = user.department;
        token.puesto = user.puesto;
        token.emitido = user.emitido;
        token.foto = user.foto;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? '';
        session.user.role = token.role ?? 'docente';
        session.user.department = token.department ?? '';
        session.user.puesto = token.puesto ?? '';
        session.user.emitido = token.emitido ?? 0;
        session.user.foto = token.foto ?? null;
      }
      return session;
    },
  },
};
