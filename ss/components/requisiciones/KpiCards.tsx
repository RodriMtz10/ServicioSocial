'use client';
import React, { useEffect, useState } from 'react';

export interface KpiItem {
  label: string;
  valor: number | string;
  tono?: 'blue' | 'amber' | 'violet' | 'green' | 'red';
  nota?: string;
}

const TONOS = {
  blue: 'bg-blue-50 text-blue-700',
  amber: 'bg-amber-50 text-amber-700',
  violet: 'bg-violet-50 text-violet-700',
  green: 'bg-emerald-50 text-emerald-700',
  red: 'bg-red-50 text-red-600',
} as const;

/** Cuenta de 0 al valor en ~0.7 s (si el dispositivo pide reducir movimiento, muestra el valor directo). */
function Contador({ valor }: { valor: number | string }) {
  const [n, setN] = useState(typeof valor === 'number' ? 0 : valor);
  useEffect(() => {
    if (typeof valor !== 'number') { setN(valor); return; }
    if (valor === 0 || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setN(valor); return; }
    let raf = 0; const t0 = performance.now(), dur = 700;
    const paso = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      setN(Math.round(valor * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [valor]);
  return <>{n}</>;
}

export default function KpiCards({ items }: { items: KpiItem[] }) {
  return (
    <div className="anim-stagger grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {items.map((k) => (
        <div key={k.label} className="hover-lift bg-white p-3 sm:p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-lg font-extrabold shrink-0 tabular-nums ${TONOS[k.tono ?? 'blue']}`}>
            <Contador valor={k.valor} />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-normal sm:tracking-wider break-words">{k.label}</p>
            {k.nota ? <p className="text-[11px] text-gray-500 leading-tight">{k.nota}</p> : null}
          </div>
        </div>
      ))}
    </div>
  );
}
