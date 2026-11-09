import 'next-auth';
import 'next-auth/jwt';
import type { Role } from '@/types';

declare module 'next-auth' {
  interface User {
    role: Role;
    department: string;
    puesto: string;
    emitido: number;
  }
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: Role;
      department: string;
      puesto: string;
      emitido: number;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: Role;
    department?: string;
    puesto?: string;
    emitido?: number;
  }
}
