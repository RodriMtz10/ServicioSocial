"use client";

import React, { useState, useEffect, useRef } from 'react';
import { cerrarSesion } from '@/lib/cerrarSesion';
import Link from 'next/link';
import { useUsuario } from '@/lib/useUsuario';

export default function TopHeader({ onMenu }: { onMenu?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const { usuario } = useUsuario();
  const role = usuario?.rol ?? 'docente';
  const userName = usuario?.nombre ?? '';
  const userEmail = usuario?.correo ?? '';
  const departamento = usuario?.departamento ?? '';
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const alEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false); };
    document.addEventListener('keydown', alEscape);
    return () => document.removeEventListener('keydown', alEscape);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => cerrarSesion();

  return (
    <header className="h-16 bg-white border-b border-gray-100 px-4 sm:px-8 flex items-center justify-between gap-3 shrink-0 font-sans shadow-xs sticky top-0 z-30">
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={onMenu} aria-label="Abrir menú" className="lg:hidden p-2 -ml-2 rounded-lg text-[#0F3470] hover:bg-gray-100 cursor-pointer">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider truncate">
          <span className="hidden sm:inline">Sistema de Gestión Integrado • </span>ITMorelia
        </span>
      </div>

      {/* Menú de Usuario desplegable (Arriba a la Derecha) */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-label="Menú de mi perfil"
          className="flex items-center space-x-3 p-1.5 rounded-full hover:bg-gray-50 border border-gray-200 transition-all cursor-pointer focus:outline-none"
        >
          <div className="w-8 h-8 rounded-full bg-[#0F3470] text-amber-400 font-bold flex items-center justify-center text-xs shadow-xs">
            {userName.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div className="text-left hidden sm:block pr-1">
            <p className="text-xs font-bold text-gray-800 leading-tight">{userName}</p>
            <p className="text-[10px] text-gray-500 capitalize">
              {role === 'admin' ? 'Administrador SGI' : 'Docente'}
            </p>
          </div>
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Modal / Menú Desplegable de Información del Usuario */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 anim-pop-top">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
              <p className="text-xs font-bold text-gray-800">{userName}</p>
              <p className="text-[11px] text-gray-500 font-mono mt-0.5">{userEmail}</p>
              <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-[#0F3470]">
                {role === 'admin' ? '🛡️ Rol Administrador (SGI)' : '👨‍🏫 Rol Docente'}
              </div>
            </div>

            <div className="px-4 py-2 text-[11px] text-gray-500 space-y-1">
              <p><span className="font-semibold text-gray-700">Departamento:</span> {departamento}</p>
              <p><span className="font-semibold text-gray-700">Puesto:</span> {usuario?.puesto}</p>
              <p><span className="font-semibold text-gray-700">Plantel:</span> Instituto Tecnológico de Morelia</p>
            </div>

            <div className="border-t border-gray-100 mt-2 pt-1">
              <Link href="/dashboard/cuenta" onClick={() => setIsOpen(false)} className="block w-full text-left px-4 py-3 sm:py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">Mi perfil: datos y contraseña</Link>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center space-x-2 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}