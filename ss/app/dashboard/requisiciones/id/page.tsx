"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ExpedienteDetallePage() {
  const [role, setRole] = useState<'docente' | 'admin'>('docente');
  const [dictamenAccion, setDictamenAccion] = useState<'si' | 'no'>('si');
  const [dictamenCorreccion, setDictamenCorreccion] = useState<'si' | 'no'>('no');
  const [causaEliminada, setCausaEliminada] = useState<'si' | 'no'>('si');
  const [evidencias, setEvidencias] = useState([
    { id: 1, nombre: 'Lista_Calificaciones_Parciales.pdf', fecha: '02 Nov 2026', tamaño: '1.2 MB' },
    { id: 2, nombre: 'Captura_Sistema_SII_Morelia.png', fecha: '03 Nov 2026', tamaño: '850 KB' }
  ]);

  useEffect(() => {
    const storedRole = localStorage.getItem('user_role') as 'docente' | 'admin';
    if (storedRole) setRole(storedRole);
  }, []);

  const handleSubirEvidencia = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setEvidencias([
        ...evidencias,
        {
          id: Date.now(),
          nombre: file.name,
          fecha: 'Hoy',
          tamaño: `${(file.size / 1024).toFixed(0)} KB`
        }
      ]);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-sans pb-12">
      {/* Encabezado del Expediente */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <div className="flex items-center space-x-3">
            <span className="text-xl font-bold text-[#0F3470]">AC-ITM-2026-023</span>
            <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full">
              Pendiente de revisión
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Requisición de Acciones Correctivas • Formato ITMORELIA-IT-CA-004-01
          </p>
        </div>

        <Link
          href="/dashboard/tablero"
          className="text-xs font-semibold text-gray-600 hover:text-[#0F3470] bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-xl transition-colors"
        >
          ← Regresar al tablero
        </Link>
      </div>

      {/* SECCIÓN 1: Solicitud Contestada */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-[#0F3470] flex items-center space-x-2 border-b border-gray-100 pb-3">
          <span className="w-6 h-6 rounded-full bg-[#0F3470] text-white text-xs flex items-center justify-center">1</span>
          <span>SOLICITUD Y DETECCIÓN DE NO CONFORMIDAD</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-bold text-gray-400 uppercase">Fecha de registro</label>
            <p className="text-sm font-semibold text-gray-800 bg-gray-50 p-2.5 rounded-xl border border-gray-100 mt-1">
              02 de noviembre de 2026
            </p>
          </div>
          <div>
            <label className="text-[11px] font-bold text-gray-400 uppercase">Solicitante / Responsable</label>
            <p className="text-sm font-semibold text-gray-800 bg-gray-50 p-2.5 rounded-xl border border-gray-100 mt-1">
              Dra. Mónica Pérez Lara (Sistemas y Computación)
            </p>
          </div>
        </div>

        <div>
          <label className="text-[11px] font-bold text-gray-400 uppercase">Descripción de la No Conformidad Detectada</label>
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs text-gray-700 mt-1 leading-relaxed">
            Se detectó que el 30% de los grupos de la carrera de Ingeniería en Sistemas Computacionales no entregaron calificaciones en la fecha establecida por el calendario escolar.
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: Evidencias Digitales Adjuntas */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <h2 className="text-sm font-bold text-[#0F3470] flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-[#0F3470] text-white text-xs flex items-center justify-center">📎</span>
            <span>EVIDENCIAS DOCUMENTALES ADJUNTAS</span>
          </h2>

          {/* Opción de subir evidencia accesible para el Docente */}
          <label className="bg-blue-50 hover:bg-blue-100 text-[#0F3470] px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center space-x-1">
            <span>+ Adjuntar Evidencia</span>
            <input type="file" onChange={handleSubirEvidencia} className="hidden" />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {evidencias.map((ev) => (
            <div key={ev.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="w-9 h-9 bg-white border border-gray-200 rounded-lg flex items-center justify-center font-bold text-xs text-blue-600 shrink-0">
                  📄
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-gray-800 truncate">{ev.nombre}</p>
                  <p className="text-[10px] text-gray-400">{ev.fecha} • {ev.tamaño}</p>
                </div>
              </div>
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); alert(`Descargando evidencia de prueba: ${ev.nombre}`); }}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-white px-2.5 py-1 rounded-lg border border-gray-200 shrink-0"
              >
                Ver
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* SECCIÓN 3: Evaluación y Dictamen Administrativo (Maestra / RD) */}
      <div className={`p-6 rounded-2xl border shadow-xs space-y-4 ${role === 'admin' ? 'bg-amber-50/40 border-amber-200' : 'bg-white border-gray-100'}`}>
        <div className="flex justify-between items-center border-b border-gray-200/60 pb-3">
          <h2 className="text-sm font-bold text-[#0F3470] flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center">🛡️</span>
            <span>DICTAMEN Y VERIFICACIÓN DE EFICACIA (EXCLUSIVO RD / SGC)</span>
          </h2>
          {role !== 'admin' && (
            <span className="text-[10px] bg-gray-100 text-gray-500 font-bold px-2.5 py-1 rounded-full">
              Solo Lectura
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-700">¿Requiere Acción Correctiva?</label>
            <div className="flex space-x-3 mt-2">
              <button
                disabled={role !== 'admin'}
                onClick={() => setDictamenAccion('si')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${dictamenAccion === 'si' ? 'bg-[#0F3470] text-white' : 'bg-white border text-gray-600'}`}
              >
                Sí
              </button>
              <button
                disabled={role !== 'admin'}
                onClick={() => setDictamenAccion('no')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${dictamenAccion === 'no' ? 'bg-[#0F3470] text-white' : 'bg-white border text-gray-600'}`}
              >
                No
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700">¿Se eliminó la causa raíz? (Eficacia)</label>
            <div className="flex space-x-3 mt-2">
              <button
                disabled={role !== 'admin'}
                onClick={() => setCausaEliminada('si')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${causaEliminada === 'si' ? 'bg-emerald-600 text-white' : 'bg-white border text-gray-600'}`}
              >
                Sí (Eficaz)
              </button>
              <button
                disabled={role !== 'admin'}
                onClick={() => setCausaEliminada('no')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${causaEliminada === 'no' ? 'bg-red-600 text-white' : 'bg-white border text-gray-600'}`}
              >
                No (En proceso)
              </button>
            </div>
          </div>
        </div>

        {role === 'admin' && (
          <div className="pt-4 border-t border-amber-200/60 flex justify-end space-x-3">
            <button className="px-4 py-2 bg-red-100 text-red-700 font-bold rounded-xl text-xs hover:bg-red-200">
              Devolver para corrección
            </button>
            <button className="px-5 py-2 bg-[#0F3470] text-white font-bold rounded-xl text-xs hover:bg-[#0A2552] shadow">
              Firmar y Cerrar Requisición
            </button>
          </div>
        )}
      </div>
    </div>
  );
}