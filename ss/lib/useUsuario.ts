'use client';
import { useSession } from 'next-auth/react';
import type { Role } from '@/types';

/** Usuario de la sesión de next-auth (reemplaza los localStorage 'user_role' / 'user_name'). */
export function useUsuario() {
  const { data, status } = useSession();
  const u = data?.user;
  return {
    cargando: status === 'loading',
    usuario: u ? { id: u.id, nombre: u.name, correo: u.email, rol: u.role as Role, departamento: u.department, puesto: u.puesto } : null,
    esAdmin: u?.role === 'admin',
  };
}
