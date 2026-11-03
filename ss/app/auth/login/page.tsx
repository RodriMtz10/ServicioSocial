"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const ingresarAlSistema = (correoIngresado: string) => {
    if (!correoIngresado) {
      setError('Por favor ingresa un correo institucional.');
      return;
    }

    const isDocente = correoIngresado.toLowerCase().includes('docente') || 
                      correoIngresado.toLowerCase().includes('monica');
    
    const role = isDocente ? 'docente' : 'admin';
    const userName = isDocente ? 'Dra. Mónica Pérez Lara' : 'Lic. Sandra Villaseñor';

    // Guardar datos de sesión local
    try {
      localStorage.setItem('user_role', role);
      localStorage.setItem('user_name', userName);
      localStorage.setItem('user_email', correoIngresado);
      
      // Cookie de sesión simple para que Next.js o Middleware no reboten la ruta
      document.cookie = `user_role=${role}; path=/`;
      document.cookie = `user_name=${encodeURIComponent(userName)}; path=/`;
    } catch (e) {
      console.error("Error guardando sesión:", e);
    }

    // Redirección directa al tablero dentro de dashboard
    window.location.href = '/dashboard/tablero';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    ingresarAlSistema(email);
  };

  return (
    <div className="min-h-screen bg-[#F3F6FA] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#0F3470] text-white p-6 rounded-t-2xl shadow-lg text-center relative overflow-hidden">
          <div className="mx-auto w-14 h-14 bg-white/10 rounded-full flex items-center justify-center mb-3">
            <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight">Tecnológico Nacional de México</h1>
          <p className="text-xs text-blue-200 mt-1">Instituto Tecnológico de Morelia • Portal SGC</p>
        </div>

        <div className="bg-white py-8 px-6 shadow-xl rounded-b-2xl border border-gray-100">
          <div className="mb-6 text-center">
            <h2 className="text-lg font-bold text-gray-800">Acceso al Sistema de Acciones Correctivas</h2>
            <p className="text-xs text-gray-500 mt-1">Ingresa tus credenciales institucionales</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Correo Institucional
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="monica.perez@morelia.tecnm.mx"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F3470] focus:outline-none text-gray-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F3470] focus:outline-none text-gray-800"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-[#0F3470] hover:bg-[#0A2552] text-white font-medium rounded-lg text-sm shadow transition-colors cursor-pointer"
            >
              Iniciar Sesión
            </button>
          </form>

          {/* Botones de autocompletado y acceso rápido directo */}
          <div className="mt-6 pt-5 border-t border-gray-100 space-y-2">
            <p className="text-xs font-semibold text-gray-400 text-center uppercase tracking-wider mb-2">
              Autocompletado de prueba rápido
            </p>

            <button
              type="button"
              onClick={() => ingresarAlSistema('monica.perez@morelia.tecnm.mx')}
              className="w-full text-left p-3 rounded-xl border border-gray-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all flex items-center justify-between group cursor-pointer"
            >
              <div>
                <p className="text-xs font-bold text-gray-800">Vista Docente</p>
                <p className="text-[11px] text-gray-500">monica.perez@morelia.tecnm.mx</p>
              </div>
              <span className="text-xs text-blue-600 font-semibold group-hover:translate-x-1 transition-transform">Entrar →</span>
            </button>

            <button
              type="button"
              onClick={() => ingresarAlSistema('admin.sgc@morelia.tecnm.mx')}
              className="w-full text-left p-3 rounded-xl border border-gray-200 hover:border-amber-400 hover:bg-amber-50/50 transition-all flex items-center justify-between group cursor-pointer"
            >
              <div>
                <p className="text-xs font-bold text-gray-800">Vista Administradora (RD / SGC)</p>
                <p className="text-[11px] text-gray-500">admin.sgc@morelia.tecnm.mx</p>
              </div>
              <span className="text-xs text-amber-700 font-semibold group-hover:translate-x-1 transition-transform">Entrar →</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}