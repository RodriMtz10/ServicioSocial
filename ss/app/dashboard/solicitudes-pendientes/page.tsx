"use client";

import React from 'react';
import Link from 'next/link';
import { Clock, Eye, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function SolicitudesPendientesPage() {
  const pendientes = [
    {
      id: 'AC-ITM-2026-023',
      fecha: '02 nov 2026',
      motivo: 'Se detectó que el 30% de los grupos no entregó calificaciones en la fecha establecida por el calendario escolar.',
      solicitante: 'Dra. Mónica Pérez Lara',
      departamento: 'Sistemas y Computación',
      estado: 'Pendiente de revisión',
      diasPendientes: 1
    },
    {
      id: 'AC-ITM-2026-015',
      fecha: '28 ago 2026',
      motivo: 'El indicador de eficiencia terminal de la carrera de Ingeniería Industrial no alcanzó la meta anual.',
      solicitante: 'Ing. Alejandro Tello Cruz',
      departamento: 'Ingeniería Industrial',
      estado: 'Pendiente de revisión',
      diasPendientes: 5
    },
    {
      id: 'AC-ITM-2026-016',
      fecha: '06 sep 2026',
      motivo: 'No se cuenta con evidencia de la calibración de equipos de medición del laboratorio de Metrología.',
      solicitante: 'Dr. Gerardo Ramírez Solís',
      departamento: 'Ciencias Básicas',
      estado: 'Devuelta',
      diasPendientes: 12
    }
  ];

  return (
    <>
      <header className="bg-white border-b border-slate-200/80 px-8 py-4 flex items-center justify-between sticky top-0 z-20">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Solicitudes Pendientes de Revisión</h2>
          <p className="text-xs text-slate-500 mt-0.5">Bandeja de requisiciones que requieren evaluación o correcciones del SGI</p>
        </div>
        <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
          <Clock size={14} /> {pendientes.length} Pendientes
        </span>
      </header>

      <main className="p-8 max-w-7xl w-full mx-auto space-y-4">
        {pendientes.map((item) => (
          <div key={item.id} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-blue-200 transition-colors">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold bg-blue-50 text-[#0F3470] px-2.5 py-1 rounded-lg">
                  {item.id}
                </span>
                <span className="text-xs text-slate-400 font-medium">{item.fecha}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  item.estado === 'Devuelta' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
                }`}>
                  {item.estado}
                </span>
              </div>
              <p className="text-xs text-slate-800 font-semibold">{item.motivo}</p>
              <div className="flex items-center gap-4 text-[11px] text-slate-500">
                <span><strong>Solicitante:</strong> {item.solicitante} ({item.departamento})</span>
                <span className="text-amber-700 font-medium flex items-center gap-1">
                  <AlertCircle size={12} /> {item.diasPendientes} días en espera
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
              <Link
                href={`/requisiciones/${item.id}`}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#0F3470] hover:bg-[#0A2552] text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
              >
                <Eye size={14} /> Evaluar / Revisar
              </Link>
            </div>
          </div>
        ))}
      </main>
    </>
  );
}