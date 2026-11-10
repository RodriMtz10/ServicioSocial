'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export interface Aviso { tipo: 'error' | 'ok'; texto: string }
interface Ctx { error: (texto: string) => void; ok: (texto: string) => void }
const Contexto = createContext<Ctx | null>(null);

/** Avisos de toda la app: errores como ventana emergente centrada y confirmaciones como aviso corto arriba. */
export function AvisosProvider({ children }: { children: React.ReactNode }) {
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const error = useCallback((texto: string) => setAviso({ tipo: 'error', texto }), []);
  const ok = useCallback((texto: string) => setAviso({ tipo: 'ok', texto }), []);
  const valor = useMemo(() => ({ error, ok }), [error, ok]);
  return <Contexto.Provider value={valor}>{children}{aviso && <Toast aviso={aviso} onClose={() => setAviso(null)} />}</Contexto.Provider>;
}

export function useAvisos(): Ctx {
  const c = useContext(Contexto);
  if (!c) throw new Error('useAvisos debe usarse dentro de <AvisosProvider>');
  return c;
}

/** Errores y avisos importantes: ventana emergente al centro (con fondo oscuro) que se queda hasta pulsar «Entendido».
 *  Confirmaciones: aviso corto arriba y centrado, que se quita solo. */
function Toast({ aviso, onClose }: { aviso: Aviso; onClose: () => void }) {
  const esError = aviso.tipo === 'error';
  useEffect(() => {
    if (esError) return;
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [aviso, esError, onClose]);
  useEffect(() => {
    if (!esError) return;
    const h = (e: KeyboardEvent) => (e.key === 'Escape' || e.key === 'Enter') && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [esError, onClose]);

  if (!esError) {
    return (
      <div role="status" className="anim-pop fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[calc(100vw-2rem)] max-w-sm px-4 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-start gap-3 bg-emerald-600 text-white">
        <span className="flex-1">{aviso.texto}</span>
        <button onClick={onClose} aria-label="Cerrar aviso" className="opacity-80 hover:opacity-100 cursor-pointer">✕</button>
      </div>
    );
  }
  return (
    <div className="anim-fade fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="aviso-titulo" aria-describedby="aviso-texto" className="anim-pop bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center text-2xl font-extrabold" aria-hidden="true">!</div>
        <h3 id="aviso-titulo" className="text-sm font-bold text-slate-900 mt-3">Atención</h3>
        <p id="aviso-texto" className="text-xs text-gray-600 mt-1.5 leading-relaxed">{aviso.texto}</p>
        <button autoFocus onClick={onClose} className="mt-5 w-full px-4 py-2.5 rounded-xl text-xs font-bold bg-[#0F3470] text-white hover:bg-[#0A2552] cursor-pointer">Entendido</button>
      </div>
    </div>
  );
}
