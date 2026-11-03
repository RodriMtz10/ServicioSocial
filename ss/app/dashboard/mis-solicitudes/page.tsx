"use client";

import React, { useState } from 'react';
import Link from 'next/link';

export default function MisSolicitudesPage() {
  const [modalEvidencia, setModalEvidencia] = useState<string | null>(null);
  const [evidenciaTexto, setEvidenciaTexto] = useState('');

  const misSolicitudes = [
    { folio: 'AC-ITM-2026-021', fecha: '21 oct 2026', estado: 'Pendiente de revisión', motivo: 'Entrega extemporánea de actas parciales' },
    { folio: 'AC-ITM-2026-019', fecha: '03 oct 2026', estado: 'Cerrada', motivo: 'Mantenimiento de proyectores de laboratorios' },
  ];

  const handleSubirEvidenciaDocente = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidenciaTexto) return;
    alert(`Evidencia "${evidenciaTexto}" adjuntada correctamente al expediente ${modalEvidencia}.`);
    setModalEvidencia(null);
    setEvidenciaTexto('');
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mis Solicitudes de Acciones Correctivas</h1>
          <p className="text-xs text-gray-500">Listado de folios registrados a tu nombre</p>
        </div>
        <Link
          href="/dashboard/requisiciones/nueva"
          className="bg-[#0F3470] hover:bg-[#0A2552] text-white px-4 py-2 rounded-xl text-xs font-semibold shadow transition-all"
        >
          + Nueva Solicitud
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-4">Folio</th>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Motivo / Descripción</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs">
              {misSolicitudes.map((item) => (
                <tr key={item.folio} className="hover:bg-gray-50/50">
                  <td className="py-3.5 px-4 font-bold text-[#0F3470]">{item.folio}</td>
                  <td className="py-3.5 px-4 text-gray-500">{item.fecha}</td>
                  <td className="py-3.5 px-4 font-medium text-gray-800">{item.motivo}</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${
                      item.estado === 'Cerrada' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {item.estado}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    <button
                      onClick={() => setModalEvidencia(item.folio)}
                      className="px-3 py-1.5 bg-blue-50 text-[#0F3470] rounded-lg font-semibold hover:bg-blue-100 text-xs transition-colors cursor-pointer"
                    >
                      + Evidencias
                    </button>
                    <Link
                      href="/dashboard/requisiciones/1"
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 text-xs transition-colors inline-block"
                    >
                      Editar / Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para adjuntar evidencias */}
      {modalEvidencia && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold text-[#0F3470]">Adjuntar Evidencia • {modalEvidencia}</h3>
              <button onClick={() => setModalEvidencia(null)} className="text-gray-400 hover:text-gray-600 font-bold text-sm">✕</button>
            </div>
            
            <form onSubmit={handleSubirEvidenciaDocente} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Nombre o descripción del documento</label>
                <input
                  type="text"
                  required
                  value={evidenciaTexto}
                  onChange={(e) => setEvidenciaTexto(e.target.value)}
                  placeholder="Ej: Lista_de_asistencia_firmada.pdf"
                  className="w-full text-xs p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0F3470] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Seleccionar archivo local</label>
                <input type="file" required className="w-full text-xs text-gray-500" />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setModalEvidencia(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0F3470] text-white rounded-xl text-xs font-bold hover:bg-[#0A2552]"
                >
                  Subir Evidencia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}