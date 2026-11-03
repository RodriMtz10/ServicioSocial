"use client";

import React from 'react';
import { Layers, Download, CheckCircle2, AlertTriangle, FileSpreadsheet } from 'lucide-react';

export default function ReportesPage() {
  return (
    <>
      <header className="bg-white border-b border-slate-200/80 px-8 py-4 flex items-center justify-between sticky top-0 z-20">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Reportes e Indicadores del SGC</h2>
          <p className="text-xs text-slate-500 mt-0.5">Resumen de eficacia, acciones correctivas por departamento y auditorías</p>
        </div>
        <button className="flex items-center gap-2 bg-[#0F3470] hover:bg-[#0A2552] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm">
          <Download size={15} /> Exportar Informe Anual PDF
        </button>
      </header>

      <main className="p-8 max-w-7xl w-full mx-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Índice de Eficacia</span>
            <span className="text-3xl font-extrabold text-emerald-600">86.4%</span>
            <p className="text-xs text-slate-500">Causas raíz eliminadas satisfactoriamente en el primer intento</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Tiempo Promedio de Cierre</span>
            <span className="text-3xl font-extrabold text-[#0F3470]">18 Días</span>
            <p className="text-xs text-slate-500">Desde el registro de la no conformidad hasta la verificación del RD</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Atendidas</span>
            <span className="text-3xl font-extrabold text-slate-900">21 / 24</span>
            <p className="text-xs text-slate-500">Acciones programadas en el ciclo institucional actual</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900">Descarga de Reportes Consolidados</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">Reporte de Auditorías Internas 2026</span>
                <span className="text-[11px] text-slate-500">Formato Excel (.xlsx)</span>
              </div>
              <button className="p-2 hover:bg-slate-200 text-[#0F3470] rounded-lg font-bold">
                <FileSpreadsheet size={18} />
              </button>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">Matriz de Acciones Correctivas Abiertas</span>
                <span className="text-[11px] text-slate-500">Formato CSV / Data Layer</span>
              </div>
              <button className="p-2 hover:bg-slate-200 text-[#0F3470] rounded-lg font-bold">
                <FileSpreadsheet size={18} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}