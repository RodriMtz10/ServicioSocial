"use client";

import React, { useState, useEffect } from 'react';

export default function TableroPage() {
  const [role, setRole] = useState<'docente' | 'admin'>('docente');
  const [userName, setUserName] = useState('Dra. Mónica Pérez Lara');

  const [busqueda, setBusqueda] = useState('');
  const [filtroAnio, setFiltroAnio] = useState('todos');
  const [filtroArea, setFiltroArea] = useState('todas');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  useEffect(() => {
    const storedRole = localStorage.getItem('user_role') as 'docente' | 'admin';
    const storedName = localStorage.getItem('user_name');
    
    if (storedRole) setRole(storedRole);
    if (storedName) setUserName(storedName);
  }, []);

  // Base de datos de ejemplo del SGI
  const requisicionesIniciales = [
    { folio: 'AC-ITM-2026-022', fecha: '30 oct 2026', anio: '2026', solicitante: 'Ing. Alejandro Tello Cruz', area: 'Ingeniería Industrial', estado: 'En proceso', descripcion: 'Falla en equipos de laboratorio' },
    { folio: 'AC-ITM-2026-021', fecha: '21 oct 2026', anio: '2026', solicitante: 'Dra. Mónica Pérez Lara', area: 'Sistemas y Computación', estado: 'Pendiente de revisión', descripcion: 'Entrega extemporánea de actas' },
    { folio: 'AC-ITM-2026-020', fecha: '12 oct 2026', anio: '2026', solicitante: 'Dr. Gerardo Ramírez Solís', area: 'Ciencias Básicas', estado: 'Cerrada', descripcion: 'Desviación en reactivos de química' },
    { folio: 'AC-ITM-2026-019', fecha: '03 oct 2026', anio: '2026', solicitante: 'Dra. Mónica Pérez Lara', area: 'Sistemas y Computación', estado: 'Cerrada', descripcion: 'Mantenimiento de cañones' },
    { folio: 'AC-ITM-2025-018', fecha: '24 sep 2025', anio: '2025', solicitante: 'Ing. Alejandro Tello Cruz', area: 'Ingeniería Industrial', estado: 'Devuelta', descripcion: 'Inconsistencia en formatos SGI' },
  ];

  // FILTRADO DE SEGURIDAD Y PRIVACIDAD POR ROL
  const requisicionesVisiblesPorRol = requisicionesIniciales.filter(item => {
    if (role === 'admin') return true; // El Administrador / RD ve absolutamente todo
    return item.solicitante === userName; // El Docente solo ve sus propios expedientes
  });

  // Filtro multinivel dinámico en tiempo real sobre los datos permitidos
  const requisicionesFiltradas = requisicionesVisiblesPorRol.filter(item => {
    const q = busqueda.toLowerCase();
    const coincideBusqueda = item.folio.toLowerCase().includes(q) ||
                             item.solicitante.toLowerCase().includes(q) ||
                             item.descripcion.toLowerCase().includes(q);
    
    const coincideAnio = filtroAnio === 'todos' || item.anio === filtroAnio;
    const coincideArea = filtroArea === 'todas' || item.area.toLowerCase().includes(filtroArea.toLowerCase());
    const coincideEstado = filtroEstado === 'todos' || item.estado.toLowerCase().includes(filtroEstado.toLowerCase());

    return coincideBusqueda && coincideAnio && coincideArea && coincideEstado;
  });

  // Exportar solo las requisiciones permitidas a CSV
  const exportarCSV = () => {
    const headers = ["Folio,Fecha,Solicitante,Area,Estado,Descripcion\n"];
    const rows = requisicionesFiltradas.map(r => 
      `"${r.folio}","${r.fecha}","${r.solicitante}","${r.area}","${r.estado}","${r.descripcion}"`
    );
    const blob = new Blob([headers.concat(rows.join("\n")).join("")], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Reporte_SGI_${role}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const irANuevaRequisicion = () => {
    window.location.href = '/dashboard/requisiciones/nueva-requisicion';
  };

  const irAExpediente = () => {
    window.location.href = '/dashboard/requisiciones/expediente';
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Encabezado Principal */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {role === 'admin' ? 'Tablero General de Acciones Correctivas' : 'Mis Acciones Correctivas'}
          </h1>
          <p className="text-xs text-gray-500">
            {role === 'admin' 
              ? 'Vista Global de Control • Sistema de Gestión Integrado (SGI)' 
              : `Expedientes registrados a nombre de: ${userName}`}
          </p>
        </div>

        <button
          type="button"
          onClick={irANuevaRequisicion}
          className="bg-[#0F3470] hover:bg-[#0A2552] text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-md flex items-center space-x-2 transition-all cursor-pointer"
        >
          <span>+ Nueva requisición</span>
        </button>
      </div>

      {/* Tarjetas KPI adaptadas al rol */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              {role === 'admin' ? 'Total Requisiciones' : 'Mis Solicitudes'}
            </p>
            <p className="text-2xl font-extrabold text-gray-800 mt-1">
              {requisicionesVisiblesPorRol.length}
            </p>
          </div>
          <div className="w-10 h-10 bg-blue-50 text-[#0F3470] rounded-xl flex items-center justify-center font-bold">📋</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Por Revisar</p>
            <p className="text-2xl font-extrabold text-gray-800 mt-1">
              {requisicionesVisiblesPorRol.filter(r => r.estado === 'Pendiente de revisión').length}
            </p>
          </div>
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold">⏳</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">En Proceso</p>
            <p className="text-2xl font-extrabold text-gray-800 mt-1">
              {requisicionesVisiblesPorRol.filter(r => r.estado === 'En proceso').length}
            </p>
          </div>
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">🔄</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Cerradas</p>
            <p className="text-2xl font-extrabold text-gray-800 mt-1">
              {requisicionesVisiblesPorRol.filter(r => r.estado === 'Cerrada').length}
            </p>
          </div>
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold">✓</div>
        </div>
      </div>

      {/* FILTROS DE BÚSQUEDA Y TABLA PRIVADA */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* 1. Búsqueda por Folio / Solicitante */}
          <div className="relative flex-1 min-w-[240px]">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 text-xs">🔍</span>
            <input
              type="text"
              placeholder="Buscar por folio, solicitante o descripción..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0F3470] outline-none text-gray-800 bg-white"
            />
          </div>

          {/* 2. Filtro Año */}
          <select
            value={filtroAnio}
            onChange={(e) => setFiltroAnio(e.target.value)}
            className="text-xs p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0F3470] outline-none text-gray-700 bg-white min-w-[130px]"
          >
            <option value="todos">Todos los años</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>

          {/* 3. Filtro Área (Solo funcional si es Admin) */}
          {role === 'admin' && (
            <select
              value={filtroArea}
              onChange={(e) => setFiltroArea(e.target.value)}
              className="text-xs p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0F3470] outline-none text-gray-700 bg-white min-w-[170px]"
            >
              <option value="todas">Todas las áreas</option>
              <option value="sistemas">Sistemas y Computación</option>
              <option value="industrial">Ingeniería Industrial</option>
              <option value="basicas">Ciencias Básicas</option>
            </select>
          )}

          {/* 4. Filtro Estado */}
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="text-xs p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0F3470] outline-none text-gray-700 bg-white min-w-[150px]"
          >
            <option value="todos">Todos los estados</option>
            <option value="proceso">En proceso</option>
            <option value="revision">Pendiente de revisión</option>
            <option value="cerrada">Cerrada</option>
            <option value="devuelta">Devuelta</option>
          </select>

          {/* 5. Exportar CSV */}
          <button
            type="button"
            onClick={exportarCSV}
            className="px-4 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <span>📥</span>
            <span>CSV</span>
          </button>
        </div>

        {/* TABLA DE REQUISICIONES AMBIENTADA AL ROL */}
        <div className="overflow-x-auto pt-2">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-4">Folio</th>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Solicitante</th>
                <th className="py-3 px-4">Área</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs">
              {requisicionesFiltradas.length > 0 ? (
                requisicionesFiltradas.map((item) => (
                  <tr key={item.folio} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#0F3470]">{item.folio}</td>
                    <td className="py-3.5 px-4 text-gray-500">{item.fecha}</td>
                    <td className="py-3.5 px-4 font-medium text-gray-800">{item.solicitante}</td>
                    <td className="py-3.5 px-4 text-gray-500">{item.area}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${
                        item.estado === 'En proceso' ? 'bg-blue-50 text-blue-700' :
                        item.estado === 'Pendiente de revisión' ? 'bg-amber-50 text-amber-700' :
                        item.estado === 'Cerrada' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {item.estado}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={irAExpediente}
                        className="text-xs font-semibold text-[#0F3470] bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors inline-block cursor-pointer"
                      >
                        Ver Expediente →
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400 text-xs">
                    {role === 'docente' 
                      ? 'No tienes requisiciones registradas a tu nombre que coincidan con la búsqueda.' 
                      : 'No se encontraron requisiciones que coincidan con la búsqueda.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}