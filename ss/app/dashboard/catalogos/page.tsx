'use client';

import React, { useState } from 'react';
import { Info, Plus, X } from 'lucide-react';
import RequireRole from '@/components/auth/RequireRole';
import { useRequisiciones } from '@/lib/store';
import type { TipoCatalogo } from '@/types';

function Catalogo({ titulo, tipo, ayuda }: { titulo: string; tipo: TipoCatalogo; ayuda: string }) {
  const { catalogoItems, agregarCatalogo, quitarCatalogo } = useRequisiciones();
  const items = catalogoItems[tipo === 'departamento' ? 'departamentos' : tipo === 'tecnica' ? 'tecnicas' : 'responsables'];
  const [nuevo, setNuevo] = useState('');
  const agregar = async () => { if (nuevo.trim() && (await agregarCatalogo(tipo, nuevo.trim()))) setNuevo(''); };
  return (
    <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
      <h2 className="text-sm font-bold text-[#0F3470] uppercase border-b border-gray-100 pb-3 mb-1">{titulo}</h2>
      <p className="text-[11px] text-gray-400 mb-4">{ayuda}</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {items.length === 0 && <p className="text-xs text-gray-400">Aún no hay elementos.</p>}
        {items.map((x) => (
          <span key={x.id} className="inline-flex items-center gap-1 bg-blue-50 text-[#0F3470] border border-blue-100 rounded-full pl-3 pr-1.5 py-1 text-xs font-medium">
            {x.nombre}
            <button onClick={() => quitarCatalogo(x.id)} aria-label={`Quitar ${x.nombre}`} className="p-0.5 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 cursor-pointer"><X size={12} /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={nuevo} onChange={(e) => setNuevo(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && agregar()} maxLength={200} placeholder="Agregar…" className="flex-1 min-w-0 text-xs p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#0F3470]" />
        <button onClick={agregar} disabled={!nuevo.trim()} className="shrink-0 flex items-center gap-1 px-3 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40 cursor-pointer"><Plus size={14} /> Agregar</button>
      </div>
    </section>
  );
}

export default function CatalogosPage() {
  return (
    <RequireRole rol="admin">
      <div className="max-w-7xl mx-auto space-y-6 font-sans">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Catálogos</h1>
          <p className="text-xs text-gray-500 mt-0.5">Listas de opciones del formulario. Los usuarios se administran en la sección Usuarios.</p>
        </div>

        <aside className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 sm:p-5 text-xs text-slate-700 leading-relaxed" aria-label="Para qué sirve esta sección">
          <h2 className="flex items-center gap-1.5 text-sm font-bold text-[#0F3470] mb-2"><Info size={16} aria-hidden /> ¿Para qué sirve esta sección?</h2>
          <p>
            Aquí el administrador decide <b>qué opciones aparecen en las listas desplegables</b> del formulario de requisición, sin tener que tocar el código.
            Lo que agregues se ve de inmediato para todos los docentes al llenar una requisición; lo que quites deja de ofrecerse.
          </p>
          <ul className="mt-3 space-y-1.5 list-disc pl-5">
            <li><b>Técnicas estadísticas:</b> opciones del campo «Técnica estadística utilizada» (por ejemplo, Diagrama de Pareto o Ishikawa). La opción «Otra» siempre está disponible.</li>
            <li><b>Responsables sugeridos:</b> cargos o áreas que se pueden elegir en «Responsable de definir», «Responsable de verificar» y «Verificó la AC». Se suman a los cargos que ya trae el sistema (Jefatura de Departamento, Subdirección Académica, Dirección…).</li>
            <li><b>Departamentos:</b> lista de referencia. Los departamentos y carreras de las personas ya no se eligen de aquí, sino de la lista oficial del sistema (<code className="bg-white px-1 rounded">lib/institucional.ts</code>), así que cambiar esta lista no afecta el registro ni los perfiles.</li>
          </ul>
          <p className="mt-3 text-slate-500">
            Quitar una opción <b>no modifica las requisiciones ya creadas</b>: conservan lo que se eligió en su momento. Los nombres de las personas (campos «Definió» y responsable de cada acción) salen de los usuarios activos, no de esta sección.
          </p>
        </aside>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          <Catalogo titulo="Departamentos" tipo="departamento" ayuda="Solo de referencia: los departamentos de los usuarios salen de la lista oficial del sistema." />
          <Catalogo titulo="Técnicas estadísticas" tipo="tecnica" ayuda="Aparecen en el campo (6) del formulario. “Otra” siempre está disponible." />
          <Catalogo titulo="Responsables sugeridos" tipo="responsable" ayuda="Se eligen en los campos de responsable de la requisición (se suman a los cargos base del sistema)." />
        </div>
      </div>
    </RequireRole>
  );
}
