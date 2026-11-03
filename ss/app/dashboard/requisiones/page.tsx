"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NuevaRequisicionPage() {
  const router = useRouter();
  
  const [fechaRegistro, setFechaRegistro] = useState('2026-11-02');
  const [folio] = useState('AC-ITM-2026-024');
  const [descripcion, setDescripcion] = useState('');
  const [responsableDefinir, setResponsableDefinir] = useState('Jefatura de Sistemas y Computación');
  const [responsableVerificar, setResponsableVerificar] = useState('Subdirección Académica');
  const [tecnicaEstadistica, setTecnicaEstadistica] = useState('Diagrama de Pareto');
  const [causaRaiz, setCausaRaiz] = useState('');
  const [accionRealizar, setAccionRealizar] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const [planAccion, setPlanAccion] = useState([
    {
      id: '1',
      descripcion: 'Configurar recordatorios automáticos por correo',
      fechaProgramada: '2026-12-15',
      evidencia: 'Captura de pantalla de configuración SII'
    }
  ]);

  const [evidencias, setEvidencias] = useState<Array<{ id: number; nombre: string; tamaño: string }>>([
    { id: 1, nombre: 'Evidencia_Inicial_SGC.pdf', tamaño: '1.1 MB' }
  ]);

  const agregarFilaPlan = () => {
    setPlanAccion([
      ...planAccion,
      {
        id: Date.now().toString(),
        descripcion: '',
        fechaProgramada: '',
        evidencia: ''
      }
    ]);
  };

  const eliminarFilaPlan = (id: string) => {
    if (planAccion.length === 1) {
      alert('El plan de acción debe contener al menos una actividad.');
      return;
    }
    setPlanAccion(planAccion.filter(item => item.id !== id));
  };

  const handleSubirEvidencia = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setEvidencias([
        ...evidencias,
        {
          id: Date.now(),
          nombre: file.name,
          tamaño: `${(file.size / 1024).toFixed(0)} KB`
        }
      ]);
    }
  };

  const handleEliminarEvidencia = (id: number) => {
    setEvidencias(evidencias.filter(ev => ev.id !== id));
  };

  const handleGuardar = (esBorrador: boolean) => {
    if (!esBorrador && !descripcion.trim()) {
      alert('Por favor describe la No Conformidad antes de enviar la requisición oficial.');
      return;
    }

    const mensaje = esBorrador 
      ? `Requisición ${folio} guardada exitosamente en borrador.` 
      : `Requisición ${folio} enviada oficialmente al Sistema de Gestión de la Calidad.`;
    
    alert(mensaje);
    router.push('/dashboard/tablero');
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100 font-sans space-y-8">
      {/* Encabezado */}
      <div className="border-b border-gray-100 pb-5 flex justify-between items-start">
        <div>
          <h1 className="text-xl font-bold text-[#0F3470]">Requisición de Acciones Correctivas</h1>
          <p className="text-xs text-gray-500 mt-0.5">Formato Oficial ITMORELIA-IT-CA-004-01</p>
        </div>
        <span className="px-3 py-1 bg-blue-50 text-[#0F3470] font-mono font-bold text-xs rounded-lg border border-blue-100">
          {folio}
        </span>
      </div>

      {/* Bloque 1: Solicitud */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-[#0F3470] flex items-center space-x-2">
          <span className="w-6 h-6 rounded-full bg-[#0F3470] text-white text-xs flex items-center justify-center">1</span>
          <span>SOLICITUD Y DETECCIÓN DE NO CONFORMIDAD</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Fecha de Registro</label>
            <input
              type="date"
              value={fechaRegistro}
              onChange={(e) => setFechaRegistro(e.target.value)}
              className="w-full text-xs p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0F3470] outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Folio (Auto-generado)</label>
            <input
              type="text"
              readOnly
              value={folio}
              className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-mono text-gray-500 cursor-not-allowed"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Descripción de la No Conformidad Detectada *</label>
          <textarea
            rows={3}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Escriba a detalle la falla o desviación encontrada..."
            className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0F3470] outline-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Responsable de definir la acción</label>
            <input
              type="text"
              value={responsableDefinir}
              onChange={(e) => setResponsableDefinir(e.target.value)}
              className="w-full text-xs p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0F3470] outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Responsable de verificar implantación</label>
            <input
              type="text"
              value={responsableVerificar}
              onChange={(e) => setResponsableVerificar(e.target.value)}
              className="w-full text-xs p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0F3470] outline-none"
            />
          </div>
        </div>
      </div>

      {/* Bloque 2: Causa Raíz */}
      <div className="space-y-4 pt-4 border-t border-gray-100">
        <h2 className="text-sm font-bold text-[#0F3470] flex items-center space-x-2">
          <span className="w-6 h-6 rounded-full bg-[#0F3470] text-white text-xs flex items-center justify-center">2</span>
          <span>ANÁLISIS DE CAUSA RAÍZ Y ACCIÓN A REALIZAR</span>
        </h2>

        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Técnica Estadística Utilizada</label>
          <select
            value={tecnicaEstadistica}
            onChange={(e) => setTecnicaEstadistica(e.target.value)}
            className="w-full text-xs p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0F3470] outline-none"
          >
            <option>Diagrama de Pareto</option>
            <option>Diagrama Causa-Efecto (Ishikawa / Pescado)</option>
            <option>Lluvia de ideas (5 Porqués)</option>
            <option>Histograma</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Causa Raíz Identificada</label>
          <textarea
            rows={2}
            value={causaRaiz}
            onChange={(e) => setCausaRaiz(e.target.value)}
            placeholder="Resultado del análisis de causa raíz..."
            className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0F3470] outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Acción Correctiva o Corrección a Realizar</label>
          <input
            type="text"
            value={accionRealizar}
            onChange={(e) => setAccionRealizar(e.target.value)}
            placeholder="Acción concreta acordada"
            className="w-full text-xs p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0F3470] outline-none"
          />
        </div>
      </div>

      {/* Bloque 3: Plan de Acción */}
      <div className="space-y-4 pt-4 border-t border-gray-100">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-bold text-[#0F3470] flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-[#0F3470] text-white text-xs flex items-center justify-center">3</span>
            <span>PLAN DE ACCIÓN (ACTIVIDADES CLAVE)</span>
          </h2>
          <button
            type="button"
            onClick={agregarFilaPlan}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-colors cursor-pointer"
          >
            + Agregar Actividad
          </button>
        </div>

        <div className="space-y-3">
          {planAccion.map((item, index) => (
            <div key={item.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Actividad #{index + 1}</label>
                <input
                  type="text"
                  value={item.descripcion}
                  onChange={(e) => {
                    const newPlan = [...planAccion];
                    newPlan[index].descripcion = e.target.value;
                    setPlanAccion(newPlan);
                  }}
                  placeholder="Descripción de la tarea"
                  className="w-full text-xs p-2 border border-gray-200 rounded-lg bg-white mt-1"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Fecha Programada</label>
                <input
                  type="date"
                  value={item.fechaProgramada}
                  onChange={(e) => {
                    const newPlan = [...planAccion];
                    newPlan[index].fechaProgramada = e.target.value;
                    setPlanAccion(newPlan);
                  }}
                  className="w-full text-xs p-2 border border-gray-200 rounded-lg bg-white mt-1"
                />
              </div>
              <div className="flex items-end justify-between space-x-2">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase">Evidencia</label>
                  <input
                    type="text"
                    value={item.evidencia}
                    onChange={(e) => {
                      const newPlan = [...planAccion];
                      newPlan[index].evidencia = e.target.value;
                      setPlanAccion(newPlan);
                    }}
                    placeholder="Documento/Captura"
                    className="w-full text-xs p-2 border border-gray-200 rounded-lg bg-white mt-1"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => eliminarFilaPlan(item.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Eliminar actividad"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bloque 4: Evidencias */}
      <div className="space-y-4 pt-4 border-t border-gray-100">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-bold text-[#0F3470] flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-[#0F3470] text-white text-xs flex items-center justify-center">4</span>
            <span>ARCHIVOS Y EVIDENCIAS ADJUNTAS</span>
          </h2>
          <label className="text-xs font-bold text-[#0F3470] bg-amber-400/20 hover:bg-amber-400/30 px-3 py-1.5 rounded-lg border border-amber-300 transition-colors cursor-pointer">
            + Subir Archivo
            <input type="file" onChange={handleSubirEvidencia} className="hidden" />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {evidencias.map((ev) => (
            <div key={ev.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-2 overflow-hidden">
                <span className="text-base">📄</span>
                <div className="truncate">
                  <p className="text-xs font-bold text-gray-800 truncate">{ev.nombre}</p>
                  <p className="text-[10px] text-gray-400">{ev.tamaño}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleEliminarEvidencia(ev.id)}
                className="text-xs font-bold text-red-500 hover:text-red-700 p-1"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Observaciones */}
      <div>
        <label className="block text-xs font-bold text-gray-600 mb-1">Observaciones Opcionales</label>
        <input
          type="text"
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          placeholder="Comentarios adicionales para la coordinación de calidad..."
          className="w-full text-xs p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0F3470] outline-none"
        />
      </div>

      {/* Botones principales */}
      <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
        <button
          type="button"
          onClick={() => router.push('/dashboard/tablero')}
          className="px-5 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => handleGuardar(true)}
          className="px-5 py-2.5 rounded-xl border border-[#0F3470] text-[#0F3470] text-xs font-bold hover:bg-blue-50 transition-colors cursor-pointer"
        >
          Guardar Borrador
        </button>
        <button
          type="button"
          onClick={() => handleGuardar(false)}
          className="px-6 py-2.5 rounded-xl bg-[#0F3470] text-white text-xs font-bold hover:bg-[#0A2552] transition-colors shadow-md cursor-pointer"
        >
          Enviar Requisición Oficial
        </button>
      </div>
    </div>
  );
}