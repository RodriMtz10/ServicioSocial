"use client";

import React, { useState, useEffect } from 'react';

export default function MisSolicitudesPage() {
  const [userName, setUserName] = useState('Dra. Mónica Pérez Lara');
  const [pestanaActiva, setPestanaActiva] = useState<'todas' | 'borradores'>('todas');
  const [modalEvidencia, setModalEvidencia] = useState<string | null>(null);
  const [nombreArchivo, setNombreArchivo] = useState('');
  const [archivoSubido, setArchivoSubido] = useState<File | null>(null);

  // Estado inicial por defecto para el SGI
  const solicitudesIniciales = [
    {
      folio: 'AC-ITM-2026-025',
      fecha: '02 nov 2026',
      motivo: '[BORRADOR] Desviación en equipos de cómputo del laboratorio 3',
      estado: 'Borrador',
      esBorrador: true
    },
    {
      folio: 'AC-ITM-2026-021',
      fecha: '21 oct 2026',
      motivo: 'Entrega extemporánea de actas parciales',
      estado: 'Pendiente de revisión',
      esBorrador: false
    },
    {
      folio: 'AC-ITM-2026-019',
      fecha: '03 oct 2026',
      motivo: 'Mantenimiento de proyectores de laboratorios',
      estado: 'Cerrada',
      esBorrador: false
    }
  ];

  const [misSolicitudes, setMisSolicitudes] = useState(solicitudesIniciales);

  // Cargar datos y usuario del localStorage al iniciar la página
  useEffect(() => {
    const storedName = localStorage.getItem('user_name');
    if (storedName) setUserName(storedName);

    const savedSolicitudes = localStorage.getItem('sgi_mis_solicitudes');
    if (savedSolicitudes) {
      try {
        setMisSolicitudes(JSON.parse(savedSolicitudes));
      } catch (e) {
        console.error("Error al leer solicitudes guardadas", e);
      }
    }
  }, []);

  // Guardar en localStorage cada vez que el usuario elimine o modifique la lista
  const actualizarYGuardar = (nuevaLista: typeof solicitudesIniciales) => {
    setMisSolicitudes(nuevaLista);
    localStorage.setItem('sgi_mis_solicitudes', JSON.stringify(nuevaLista));
  };

  // Filtrar según la pestaña seleccionada
  const solicitudesFiltradas = misSolicitudes.filter(item => {
    if (pestanaActiva === 'borradores') return item.esBorrador;
    return true;
  });

  const irANuevaSolicitud = () => {
    window.location.href = '/dashboard/requisiones/nueva-requisicion';
  };

  const continuarEdicion = (folio: string) => {
    window.location.href = `/dashboard/requisiones/nueva-requisicion?folio=${folio}`;
  };

  // Función para eliminar el borrador de manera persistente
  const eliminarBorrador = (folio: string) => {
    if (confirm(`¿Estás seguro de eliminar el borrador con folio ${folio}?`)) {
      const nuevaLista = misSolicitudes.filter(item => item.folio !== folio);
      actualizarYGuardar(nuevaLista);
    }
  };

  const irAExpediente = () => {
    window.location.href = '/dashboard/requisiones/expediente';
  };

  const handleSubirEvidencia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreArchivo && !archivoSubido) {
      alert('Por favor selecciona un archivo o escribe una descripción.');
      return;
    }
    alert(`Evidencia adjuntada correctamente al folio ${modalEvidencia}.`);
    setModalEvidencia(null);
    setNombreArchivo('');
    setArchivoSubido(null);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mis Solicitudes de Acciones Correctivas</h1>
          <p className="text-xs text-gray-500">Listado de folios y borradores registrados a tu nombre</p>
        </div>

        <button
          type="button"
          onClick={irANuevaSolicitud}
          className="bg-[#0F3470] hover:bg-[#0A2552] text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-md flex items-center space-x-2 transition-all cursor-pointer"
        >
          <span>+ Nueva Solicitud</span>
        </button>
      </div>

      {/* Pestañas de Filtrado */}
      <div className="flex space-x-2 border-b border-gray-100 pb-3">
        <button
          type="button"
          onClick={() => setPestanaActiva('todas')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            pestanaActiva === 'todas' 
              ? 'bg-[#0F3470] text-white shadow-sm' 
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          Todas mis solicitudes ({misSolicitudes.length})
        </button>

        <button
          type="button"
          onClick={() => setPestanaActiva('borradores')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5 ${
            pestanaActiva === 'borradores' 
              ? 'bg-[#0F3470] text-white shadow-sm' 
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <span>📁 Borradores guardados</span>
          <span className="bg-amber-400 text-[#0F3470] px-1.5 py-0.2 rounded-full text-[10px] font-extrabold">
            {misSolicitudes.filter(s => s.esBorrador).length}
          </span>
        </button>
      </div>

      {/* Tabla Principal */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Folio</th>
                <th className="py-3.5 px-4">Fecha</th>
                <th className="py-3.5 px-4">Motivo / Descripción</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs">
              {solicitudesFiltradas.length > 0 ? (
                solicitudesFiltradas.map((item) => (
                  <tr key={item.folio} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-4 font-bold text-[#0F3470]">{item.folio}</td>
                    <td className="py-4 px-4 text-gray-500">{item.fecha}</td>
                    <td className="py-4 px-4 font-medium text-gray-800">{item.motivo}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${
                        item.estado === 'Cerrada' 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : item.estado === 'Borrador'
                          ? 'bg-purple-50 text-purple-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {item.estado}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right space-x-2">
                      {item.esBorrador ? (
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => continuarEdicion(item.folio)}
                            className="px-3 py-1.5 bg-purple-600 text-white hover:bg-purple-700 rounded-lg font-semibold text-xs transition-colors cursor-pointer shadow-2xs"
                          >
                            Continuar Edición ✏️
                          </button>
                          <button
                            type="button"
                            onClick={() => eliminarBorrador(item.folio)}
                            className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                            title="Eliminar borrador"
                          >
                            🗑️ Eliminar
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => setModalEvidencia(item.folio)}
                            className="px-3 py-1.5 bg-blue-50 text-[#0F3470] hover:bg-blue-100 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                          >
                            + Evidencias
                          </button>

                          <button
                            type="button"
                            onClick={irAExpediente}
                            className="px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                          >
                            Editar / Ver
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400 text-xs">
                    No hay elementos en esta sección.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para Subir Evidencia */}
      {modalEvidencia && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-gray-100">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#0F3470]">Adjuntar Evidencia Documental</h3>
                <p className="text-[11px] text-gray-400 font-mono">Folio: {modalEvidencia}</p>
              </div>
              <button
                type="button"
                onClick={() => setModalEvidencia(null)}
                className="text-gray-400 hover:text-gray-600 font-bold text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubirEvidencia} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  Descripción o Identificador del Documento
                </label>
                <input
                  type="text"
                  placeholder="Ej: Evidencia_Falla.pdf"
                  value={nombreArchivo}
                  onChange={(e) => setNombreArchivo(e.target.value)}
                  className="w-full text-xs p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0F3470] outline-none text-gray-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  Seleccionar archivo
                </label>
                <input
                  type="file"
                  onChange={(e) => setArchivoSubido(e.target.files?.[0] || null)}
                  className="w-full text-xs text-gray-500 cursor-pointer"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalEvidencia(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0F3470] text-white rounded-xl text-xs font-bold hover:bg-[#0A2552] shadow transition-colors cursor-pointer"
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