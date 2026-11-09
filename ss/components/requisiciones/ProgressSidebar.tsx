import React from 'react';
import { SECCIONES, seccionCompleta } from '@/lib/formulario';

/** Progreso por sección del formulario (solo visible en pantallas grandes). */
export default function ProgressSidebar({ errores }: { errores: Record<string, string> }) {
  const completas = SECCIONES.filter((s) => seccionCompleta(errores, s.campos)).length;
  return (
    <>
    <div className="lg:hidden fixed top-16 inset-x-0 z-20 bg-white/95 backdrop-blur border-b border-gray-100 px-4 py-2 flex items-center gap-3" aria-label="Progreso">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 transition-all duration-700 ease-out" style={{ width: `${(completas / SECCIONES.length) * 100}%` }} /></div>
      <span className="text-[11px] font-semibold text-gray-500 whitespace-nowrap">{completas}/{SECCIONES.length} secciones</span>
    </div>
    <aside className="hidden lg:block w-52 shrink-0">
      <div className="sticky top-6 bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Progreso</p>
        <div className="h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
          <div className="h-full bg-emerald-500 transition-all duration-700 ease-out" style={{ width: `${(completas / SECCIONES.length) * 100}%` }} />
        </div>
        <p className="text-[11px] text-gray-500 mt-1.5 mb-3">{completas} de {SECCIONES.length} secciones completas</p>
        <nav className="space-y-0.5">
          {SECCIONES.map((s, i) => {
            const ok = seccionCompleta(errores, s.campos);
            return (
              <a key={s.id} href={`#${s.id}`} className={`flex items-center gap-2 px-1.5 py-1.5 rounded-lg text-xs hover:bg-blue-50 ${ok ? 'text-slate-800' : 'text-gray-500'}`}>
                <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center border ${ok ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300'}`}>
                  {ok ? '✓' : i + 1}
                </span>
                {s.titulo}
              </a>
            );
          })}
        </nav>
      </div>
    </aside>
    </>
  );
}
