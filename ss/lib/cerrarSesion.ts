'use client';

import { signOut } from 'next-auth/react';

/**
 * Cierra la sesión y vuelve al login en el MISMO sitio desde el que se está usando la app.
 * (signOut con callbackUrl redirige a NEXTAUTH_URL, por eso desde otra dirección —IP de la red, celular, dominio— saltaba a localhost.)
 */
export async function cerrarSesion() {
  try { await signOut({ redirect: false }); } finally { window.location.href = '/auth/login'; }
}
