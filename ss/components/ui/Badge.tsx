import React from 'react';
import type { EstadoRequisicion } from '@/types';
import { ESTADOS } from '@/lib/utils';

// Las clases deben escribirse completas para que Tailwind las detecte.
const TONOS = {
  gray: 'bg-slate-100 text-slate-600',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-600',
  blue: 'bg-blue-50 text-blue-700',
  violet: 'bg-violet-50 text-violet-700',
  green: 'bg-emerald-50 text-emerald-700',
} as const;

export function Badge({ tono = 'gray', children, title }: { tono?: keyof typeof TONOS; children: React.ReactNode; title?: string }) {
  return (
    <span title={title} className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap ${TONOS[tono]}`}>
      {children}
    </span>
  );
}

export function EstadoBadge({ estado }: { estado: EstadoRequisicion }) {
  const e = ESTADOS[estado];
  return <Badge tono={e.tono}>{e.label}</Badge>;
}

export default Badge;
