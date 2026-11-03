import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credenciales Institucionales",
      credentials: {
        email: { label: "Correo Institucional", type: "email" },
        password: { label: "Contraseña", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Simulación de autenticación (Reemplazar con consulta a Base de Datos / Prisma)
        if (credentials.email.includes("admin")) {
          return {
            id: "admin-01",
            name: "Lic. Sandra Villaseñor Aguilar",
            email: credentials.email,
            role: "admin",
            department: "Coordinación del SGC"
          } as any;
        } else {
          return {
            id: "docente-01",
            name: "Dra. Mónica Pérez Lara",
            email: credentials.email,
            role: "docente",
            department: "Sistemas y Computación"
          } as any;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.department = (user as any).department;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).department = token.department;
        (session.user as any).id = token.sub;
      }
      return session;
    }
  }
};