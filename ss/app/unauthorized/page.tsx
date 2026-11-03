"use client";

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-[#F3F6FA] flex items-center justify-center p-4 text-slate-800 font-sans">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xl text-center space-y-4">
        <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Acceso Restringido</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          No tienes permisos suficientes para acceder a esta sección. Esta área está reservada exclusivamente para la administración del SGC o Representante de la Dirección (RD).
        </p>
        <div className="pt-4">
          <Link
            href="/tablero"
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 bg-[#0F3470] hover:bg-[#0A2552] text-white text-xs font-bold rounded-xl shadow transition-all"
          >
            <ArrowLeft size={16} /> Volver al Tablero Principal
          </Link>
        </div>
      </div>
    </div>
  );
}