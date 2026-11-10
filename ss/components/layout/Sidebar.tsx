// components/layout/Sidebar.tsx
"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cerrarSesion } from '@/lib/cerrarSesion';
import { useUsuario } from '@/lib/useUsuario';
import { useRequisiciones } from '@/lib/store';
import { LogoTecnm } from '@/components/ui/Logo';
import Avatar from "@/components/ui/Avatar";

export default function Sidebar({ abierto = false, onCerrar = () => {} }: { abierto?: boolean; onCerrar?: () => void }) {
  const pathname = usePathname();
  // En celular el menú se cierra al navegar.
  useEffect(() => { onCerrar(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);
  const { usuario } = useUsuario();
  const { requisiciones } = useRequisiciones();
  const role = usuario?.rol ?? 'docente';
  const userName = usuario?.nombre ?? '';
  const pendientes = requisiciones.filter((r) => r.estado === 'pendiente' || r.estado === 'verificacion').length;

  const navItems = [
    {
      label: 'Tablero de control',
      href: '/dashboard/tablero',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
      roles: ['admin', 'docente']
    },
    {
      label: 'Mis solicitudes',
      href: '/dashboard/mis-solicitudes',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      roles: ['docente']
    },
    {
      label: 'Solicitudes pendientes',
      href: '/dashboard/solicitudes-pendientes',
      badge: true,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      roles: ['admin']
    },
    {
      label: 'Reportes del SGI',
      href: '/dashboard/reportes',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      roles: ['admin']
    },
    {
      label: 'Usuarios',
      href: '/dashboard/usuarios',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      roles: ['admin']
    },
    {
      label: 'Bitácora (auditoría)',
      href: '/dashboard/auditoria',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      roles: ['admin']
    },
    {
      label: 'Catálogos',
      href: '/dashboard/catalogos',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      ),
      roles: ['admin']
    },
    {
      label: 'Mi perfil',
      href: '/dashboard/cuenta',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      roles: ['admin', 'docente']
    }
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(role));

  return (
    <>
    {abierto && <div className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden" onClick={onCerrar} aria-hidden="true" />}
    <aside aria-label="Menú principal" className={`fixed inset-y-0 left-0 z-50 w-64 max-w-[85vw] overflow-y-auto transform transition-transform duration-200 lg:sticky lg:top-0 lg:self-start lg:h-screen lg:translate-x-0 lg:z-auto bg-[#0F3470] text-white flex flex-col justify-between shrink-0 font-sans shadow-xl ${abierto ? 'translate-x-0' : '-translate-x-full'}`}>
      <div>
        {/* Encabezado de la marca institucional */}
        <div className="px-5 py-5 border-b border-blue-900/50">
          <LogoTecnm blanco className="h-11" />
          <p className="text-[10px] font-semibold text-blue-200 uppercase tracking-wider mt-3">Instituto Tecnológico de Morelia</p>
          <p className="text-[11px] text-blue-300">Panel SGI</p>
        </div>

        {/* Menú de navegación */}
        <nav className="p-4 space-y-1">
          <p className="px-3 text-[10px] font-semibold text-blue-300 uppercase tracking-wider mb-2">
            Menú SGI
          </p>

          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-white text-[#0F3470] font-bold shadow-md'
                    : 'text-blue-100 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge && pendientes > 0 && (
                  <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                    {pendientes}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Perfil del Usuario / Salida */}
      <div className="p-4 border-t border-blue-900/50">
        <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center space-x-2">
            <Avatar nombre={userName} foto={usuario?.foto} colores="bg-blue-500/30 text-white border border-white/20" />
            <div className="max-w-[110px] overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{userName}</p>
              <p className="text-[10px] text-blue-200 capitalize truncate">
                {role === 'admin' ? 'Representante RD' : 'Docente'}
              </p>
            </div>
          </div>

          <button
            onClick={() => cerrarSesion()}
            title="Cerrar sesión"
            className="p-1.5 text-blue-200 hover:text-red-400 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
    </>
  );
}