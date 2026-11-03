"use client";

import React from 'react';
import { Building, Users, Shield, Plus } from 'lucide-react';

export default function CatalogosPage() {
  const departamentos = [
    { id: 1, nombre: 'Sistemas y Computación', jefe: 'Dra. Mónica Pérez Lara', requisiciones: 8 },
    { id: 2, nombre: 'Ingeniería Industrial', jefe: 'Ing. Alejandro Tello Cruz', requisiciones: 6 },
    { id: 3, nombre: 'Ciencias Básicas', jefe: 'Dr. Gerardo Ramírez Solís', requisiciones: 4 },
    { id: 4, nombre: 'Gestión Tecnológica y Vinculación', jefe: 'Mtra. Laura Mendoza Ortiz', requisiciones: 3 }
  ];

  return (
    <>
      <header className="bg-white border-b border-slate-200/80 px-8 py-4 flex items-center justify-between sticky top-0 z-20">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Catálogo de Departamentos y Usuarios</h2>
          <p className="text-xs text-slate-500 mt-0.5">Configuración de responsables académicos y dependencias del ITMorelia</p>
        </div>
        <button className="flex items-center gap-2 bg-[#0F3470] hover:bg-[#0A2552] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm">
          <Plus size={15} /> Agregar Departamento
        </button>
      </header>

      <main className="p-8 max-w-7xl w-full mx-auto space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-600">Departamentos Registrados</h3>
            <span className="text-xs text-slate-400">{departamentos.length} áreas operativas</span>
          </div>
          <div className="divide-y divide-slate-100 text-xs">
            {departamentos.map((dep) => (
              <div key={dep.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0F3470] flex items-center justify-center font-bold">
                    <Building size={18} />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block text-sm">{dep.nombre}</span>
                    <span className="text-slate-500 text-[11px]">Responsable: {dep.jefe}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-medium">
                    {dep.requisiciones} requisiciones
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}