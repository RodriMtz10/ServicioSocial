import React from 'react';
import { INSTRUCTIVO } from '@/lib/instructivo';

/** Ayuda contextual con el texto del instructivo de llenado del formato original. */
export function Ayuda({ num }: { num: number }) {
  const t = INSTRUCTIVO[num];
  if (!t) return null;
  return (
    <span className="relative group inline-flex align-middle ml-1.5 text-gray-300 hover:text-[#0F3470] cursor-help" tabIndex={0} aria-label={`Instructivo (${num}): ${t}`}>
      <span className="w-3.5 h-3.5 rounded-full border border-current text-[9px] leading-none font-bold flex items-center justify-center">?</span>
      <span role="tooltip" className="hidden group-hover:block group-focus:block absolute z-30 left-0 top-5 w-72 bg-slate-900 text-slate-100 text-[11px] font-normal normal-case tracking-normal leading-snug p-3 rounded-lg shadow-xl">
        <b className="block text-white mb-0.5">Instructivo ({num})</b>
        {t}
      </span>
    </span>
  );
}

interface CampoProps {
  label: string;
  num?: number;
  error?: string;
  id?: string;
  children: React.ReactNode;
  className?: string;
}

export function Campo({ label, num, error, id, children, className = '' }: CampoProps) {
  return (
    <div className={className} data-field={id} data-invalid={error ? 'true' : undefined}>
      <label className="block text-xs font-bold text-gray-600 mb-1">
        {label}
        {num ? <Ayuda num={num} /> : null}
      </label>
      {children}
      {error ? <p className="text-[11px] font-semibold text-red-600 mt-1">{error}</p> : null}
    </div>
  );
}

export const inputCls = (error?: string) =>
  `w-full text-xs p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-[#0F3470] bg-white ${error ? 'border-red-400 bg-red-50/40' : 'border-gray-200'}`;
