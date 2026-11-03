// components/layout/Sidebar.tsx
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();
  const [role, setRole] = useState<'docente' | 'admin'>('docente');
  const [userName, setUserName] = useState('Dra. Mónica Pérez Lara');

  useEffect(() => {
    const storedRole = localStorage.getItem('user_role') as 'docente' | 'admin';
    const storedName = localStorage.getItem('user_name');
    if (storedRole) setRole(storedRole);
    if (storedName) setUserName(storedName);
  }, []);

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
      badge: 3,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      roles: ['admin']
    },
    {
      label: 'Reportes del SGC',
      href: '/dashboard/reportes',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      roles: ['admin']
    },
    {
      label: 'Usuarios y catálogos',
      href: '/dashboard/catalogos',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      roles: ['admin']
    }
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(role));

  return (
    <aside className="w-64 bg-[#0F3470] text-white flex flex-col justify-between min-h-screen shrink-0 font-sans shadow-xl">
      <div>
        {/* Encabezado de la marca institucional */}
        <div className="p-6 border-b border-blue-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-amber-400/20 border border-amber-400/40 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">Tecnológico Nacional</h2>
              <p className="text-[11px] text-blue-200">de México • Panel SGC</p>
            </div>
          </div>
        </div>

        {/* Menú de navegación */}
        <nav className="p-4 space-y-1">
          <p className="px-3 text-[10px] font-semibold text-blue-300 uppercase tracking-wider mb-2">
            Gestión de Calidad
          </p>

          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href;
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
                {item.badge && (
                  <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                    {item.badge}
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
            <div className="w-8 h-8 rounded-full bg-blue-500/30 text-white flex items-center justify-center text-xs font-bold border border-white/20">
              {userName.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div className="max-w-[110px] overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{userName}</p>
              <p className="text-[10px] text-blue-200 capitalize truncate">
                {role === 'admin' ? 'Representante RD' : 'Docente'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = '/auth/login';
            }}
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
  );
}