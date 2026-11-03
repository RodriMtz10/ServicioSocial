"use client";

import React, { useState, useEffect, useRef } from 'react';

export default function TopHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const [role, setRole] = useState<'docente' | 'admin'>('docente');
  const [userName, setUserName] = useState('Dra. Mónica Pérez Lara');
  const [userEmail, setUserEmail] = useState('monica.perez@morelia.tecnm.mx');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedRole = localStorage.getItem('user_role') as 'docente' | 'admin';
    const storedName = localStorage.getItem('user_name');
    const storedEmail = localStorage.getItem('user_email');

    if (storedRole) setRole(storedRole);
    if (storedName) setUserName(storedName);
    if (storedEmail) setUserEmail(storedEmail);

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    document.cookie = "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    window.location.href = '/auth/login';
  };

  return (
    <header className="h-16 bg-white border-b border-gray-100 px-8 flex items-center justify-between shrink-0 font-sans shadow-xs">
      <div>
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Sistema de Gestión de la Calidad • ITMorelia
        </span>
      </div>

      {/* Menú de Usuario desplegable (Arriba a la Derecha) */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-3 p-1.5 rounded-full hover:bg-gray-50 border border-gray-200 transition-all cursor-pointer focus:outline-none"
        >
          <div className="w-8 h-8 rounded-full bg-[#0F3470] text-amber-400 font-bold flex items-center justify-center text-xs shadow-xs">
            {userName.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div className="text-left hidden sm:block pr-1">
            <p className="text-xs font-bold text-gray-800 leading-tight">{userName}</p>
            <p className="text-[10px] text-gray-500 capitalize">
              {role === 'admin' ? 'Coordinadora de Calidad (RD)' : 'Docente / Investigador'}
            </p>
          </div>
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Modal / Menú Desplegable de Información del Usuario */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
              <p className="text-xs font-bold text-gray-800">{userName}</p>
              <p className="text-[11px] text-gray-500 font-mono mt-0.5">{userEmail}</p>
              <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-[#0F3470]">
                {role === 'admin' ? '🛡️ Rol Administrador (SGC)' : '👨‍🏫 Rol Docente'}
              </div>
            </div>

            <div className="px-4 py-2 text-[11px] text-gray-500 space-y-1">
              <p><span className="font-semibold text-gray-700">Departamento:</span> {role === 'admin' ? 'Dirección / Calidad' : 'Sistemas y Computación'}</p>
              <p><span className="font-semibold text-gray-700">Plantel:</span> Instituto Tecnológico de Morelia</p>
            </div>

            <div className="border-t border-gray-100 mt-2 pt-1">
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